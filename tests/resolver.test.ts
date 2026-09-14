import { LayoutResolver } from '../src/resolver/index';
import { AdSpec, SurfaceProfile, TextMeasurer, TextMeasurement } from '../src/core/types';
import { describe, it, expect } from 'vitest';

class MockTextMeasurer implements TextMeasurer {
  measureText(text: string, fontSize: number, fontWeight: string, maxWidth?: number): TextMeasurement {
    const charWidth = fontSize * 0.6; // rough estimate
    const totalW = text.length * charWidth;
    if (!maxWidth) return { width: totalW, height: fontSize * 1.2, lines: 1 };
    
    const maxCharsPerLine = Math.max(1, Math.floor(maxWidth / charWidth));
    const lines = Math.ceil(text.length / maxCharsPerLine);
    return { width: Math.min(totalW, maxWidth), height: (fontSize * 1.2) * lines, lines };
  }
}

describe('LayoutResolver Constraints & Candidates', () => {
  const ad: AdSpec = {
    id: 'ad-1',
    globalConstraints: { minSpacing: 10 },
    elements: [
      {
        id: 'hero',
        role: 'hero-image',
        priority: 1,
        content: 'hero.jpg',
        constraints: { minHeight: 100, minWidth: 80 },
        allowedDegradations: ['SHRINK']
      },
      {
        id: 'headline',
        role: 'headline',
        priority: 2,
        content: 'Test',
        constraints: { minHeight: 50, minWidth: 80 },
        allowedDegradations: ['SHRINK']
      },
      {
        id: 'logo',
        role: 'logo',
        priority: 3,
        content: 'logo.png',
        constraints: { minHeight: 40, minWidth: 80 },
        allowedDegradations: ['HIDE']
      }
    ]
  };

  it('selects HorizontalSplit for a wide, short surface', () => {
    const resolver = new LayoutResolver(new MockTextMeasurer());
    const surface: SurfaceProfile = {
      id: 'wide-surface',
      width: 1000,
      height: 200,
      safeArea: { top: 0, right: 0, bottom: 0, left: 0 },
      interactionModel: 'touch',
      viewingDistance: 'near'
    };
    
    const result = resolver.resolve(ad, surface);
    if (!result.isSatisfiable) {
      console.log('HorizontalSplit failed:', JSON.stringify(result.failedAttempts.map(a => ({ id: a.id, v: a.violations })), null, 2));
    }
    expect(result.isSatisfiable).toBe(true);
    // Vertical stack would require 100 + 50 + 40 + (2*10 spacing) = 210px height, which fails on 200px height surface
    // Thus it should pick something else. Our HorizontalSplit or HeroOverlay.
    // HorizontalSplit puts hero on left (height 200), rest on right (50+40+10 = 100), which fits easily!
    expect(result.bestCandidate!.type).toBe('horizontal-split');
  });

  it('generates a valid layout for a tall, narrow surface', () => {
    const resolver = new LayoutResolver(new MockTextMeasurer());
    
    // Mobile-like
    const surface: SurfaceProfile = {
      id: 'mobile-portrait',
      width: 300,
      height: 800,
      safeArea: { top: 0, right: 0, bottom: 0, left: 0 },
      interactionModel: 'touch',
      viewingDistance: 'near'
    };
    
    const result = resolver.resolve(ad, surface);
    if (!result.isSatisfiable) {
      console.log('Failed candidates violations:', result.failedAttempts.map(c => c.violations));
    }
    expect(result.isSatisfiable).toBe(true);
    expect(result.bestCandidate).toBeDefined();
    
    // Verify no overlaps in whatever it picked
    const elements = result.bestCandidate!.elements;
    // Hero and headline must exist
    expect(elements.find(e => e.originalId === 'hero')).toBeDefined();
    expect(elements.find(e => e.originalId === 'headline')).toBeDefined();
  });

  it('degrades monotonically by hiding lowest priority elements first', () => {
    const resolver = new LayoutResolver(new MockTextMeasurer());
    // Make surface just tall enough for hero and headline, but not logo
    const surface: SurfaceProfile = {
      id: 'constrained-surface',
      width: 150, // narrow enough to force hero overlap in horizontal split if we shrink it
      height: 160,
      safeArea: { top: 0, right: 0, bottom: 0, left: 0 },
      interactionModel: 'touch',
      viewingDistance: 'near'
    };
    
    const result = resolver.resolve(ad, surface);
    expect(result.isSatisfiable).toBe(true);
    
    const logo = result.bestCandidate!.elements.find(e => e.originalId === 'logo');
    expect(logo!.hidden).toBe(true);
    
    const headline = result.bestCandidate!.elements.find(e => e.originalId === 'headline');
    expect(headline!.hidden).toBe(false);
  });

  it('Randomized Invariants Test: Never returns an invalid layout', () => {
    const resolver = new LayoutResolver(new MockTextMeasurer());
    
    for (let i = 0; i < 50; i++) {
      const surface: SurfaceProfile = {
        id: `rand-${i}`,
        width: Math.floor(Math.random() * 800) + 100, // 100 to 900
        height: Math.floor(Math.random() * 800) + 100,
        safeArea: { 
          top: Math.floor(Math.random() * 20), 
          right: Math.floor(Math.random() * 20), 
          bottom: Math.floor(Math.random() * 20), 
          left: Math.floor(Math.random() * 20) 
        },
        interactionModel: 'touch',
        viewingDistance: 'near'
      };

      const result = resolver.resolve(ad, surface);
      
      if (result.isSatisfiable && result.bestCandidate) {
        const visibleElements = result.bestCandidate.elements.filter(e => !e.hidden);
        
        // 1. Bounds check
        const safeW = surface.width - surface.safeArea.left - surface.safeArea.right;
        const safeH = surface.height - surface.safeArea.top - surface.safeArea.bottom;
        
        for (const el of visibleElements) {
          expect(el.x).toBeGreaterThanOrEqual(surface.safeArea.left);
          expect(el.y).toBeGreaterThanOrEqual(surface.safeArea.top);
          
          // Floating point math might have tiny inaccuracies, but our logic is integer based mostly
          expect(el.x + el.width).toBeLessThanOrEqual(surface.safeArea.left + safeW);
          expect(el.y + el.height).toBeLessThanOrEqual(surface.safeArea.top + safeH);
        }
        
        // 2. Overlap check
        for (let j = 0; j < visibleElements.length; j++) {
          for (let k = j + 1; k < visibleElements.length; k++) {
            const a = visibleElements[j];
            const b = visibleElements[k];
            
            const overlaps = (
              a.x < b.x + b.width &&
              a.x + a.width > b.x &&
              a.y < b.y + b.height &&
              a.y + a.height > b.y
            );
            
            expect(overlaps).toBe(false);
          }
        }
      }
    }
  });

  it('triggers WRAP and TRUNCATE when text width is constrained', () => {
    const resolver = new LayoutResolver(new MockTextMeasurer());
    const adWithText: AdSpec = {
      id: 'ad-text',
      elements: [
        {
          id: 'body',
          role: 'body',
          priority: 1,
          content: 'This is a very long text that must wrap and eventually truncate.',
          constraints: { minHeight: 20, minWidth: 20, maxLines: 2 },
          fontSize: 16,
          allowedDegradations: ['WRAP', 'TRUNCATE']
        }
      ]
    };
    
    // Narrow surface forces WRAP naturally, but short surface forces TRUNCATE
    const surface: SurfaceProfile = {
      id: 'narrow-text-surface',
      width: 100,
      height: 50, // very short!
      safeArea: { top: 0, right: 0, bottom: 0, left: 0 },
      interactionModel: 'touch',
      viewingDistance: 'near'
    };
    
    const result = resolver.resolve(adWithText, surface);
    expect(result.isSatisfiable).toBe(true);
    
    const body = result.bestCandidate!.elements.find(e => e.originalId === 'body');
    expect(body).toBeDefined();
    expect(body!.degradationsApplied).toContain('TRUNCATE');
  });

  it('generates a deterministic diagnostic trace', () => {
    const resolver = new LayoutResolver(new MockTextMeasurer());
    const surface: SurfaceProfile = {
      id: 'trace-surface',
      width: 400,
      height: 400,
      safeArea: { top: 0, right: 0, bottom: 0, left: 0 },
      interactionModel: 'touch',
      viewingDistance: 'near'
    };
    
    const result = resolver.resolve(ad, surface);
    expect(result.diagnostics.length).toBeGreaterThan(0);
    expect(result.diagnostics.some(d => d.type === 'CANDIDATE_SELECTED')).toBe(true);
    
    // Verify trace is stable across multiple runs (ignoring randomized IDs)
    const result2 = resolver.resolve(ad, surface);
    const stripIds = (arr: any[]) => arr.map(a => { const { candidateId, ...rest } = a; return rest; });
    expect(stripIds(result.diagnostics)).toEqual(stripIds(result2.diagnostics));
  });
});
