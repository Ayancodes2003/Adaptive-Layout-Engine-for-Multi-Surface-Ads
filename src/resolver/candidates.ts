import type { AdSpec, SurfaceProfile, CandidateLayout, ResolvedElement, TextMeasurer } from '../core/types';

// Configuration Constants
const HERO_CONTENT_OFFSET_RATIO = 0.6; // Hero layout places body content at 60% of available height

export interface CandidateGenerator {
  generate(ad: AdSpec, surface: SurfaceProfile): CandidateLayout[];
  regenerate(ad: AdSpec, surface: SurfaceProfile, overrides: Map<string, ResolvedElement>): CandidateLayout;
}

export abstract class BaseCandidateGenerator implements CandidateGenerator {
  protected measurer?: TextMeasurer;
  abstract type: 'vertical-stack' | 'horizontal-split' | 'hero-overlay' | 'compact-strip';
  
  constructor(measurer?: TextMeasurer) {
    this.measurer = measurer;
  }

  generate(ad: AdSpec, surface: SurfaceProfile): CandidateLayout[] {
    return [this.regenerate(ad, surface, new Map())];
  }

  abstract regenerate(ad: AdSpec, surface: SurfaceProfile, overrides: Map<string, ResolvedElement>): CandidateLayout;

  protected getSafeWidth(surface: SurfaceProfile): number {
    return Math.max(0, surface.width - surface.safeArea.left - surface.safeArea.right);
  }
  
  protected getSafeHeight(surface: SurfaceProfile): number {
    return Math.max(0, surface.height - surface.safeArea.top - surface.safeArea.bottom);
  }
  
  protected measureElement(el: AdSpec['elements'][0], proposedWidth: number): { height: number; lines?: number } {
    if (this.measurer && (el.role === 'headline' || el.role === 'body' || el.role === 'cta' || el.role === 'price' || el.role === 'legal')) {
      const fontSize = el.fontSize || 16;
      const fontWeight = el.fontWeight || 'normal';
      const m = this.measurer.measureText(el.content, fontSize, fontWeight, proposedWidth);
      return { height: m.height, lines: m.lines };
    }
    return { height: el.constraints.minHeight || 44 };
  }
}

export class VerticalStackCandidate extends BaseCandidateGenerator {
  type = 'vertical-stack' as const;

  regenerate(ad: AdSpec, surface: SurfaceProfile, overrides: Map<string, ResolvedElement>): CandidateLayout {
    const safeW = this.getSafeWidth(surface);
    let currentY = surface.safeArea.top;
    const elements: ResolvedElement[] = [];

    for (const el of ad.elements) {
      const state = overrides.get(el.id);
      const isHidden = state?.hidden || false;
      
      const width = state?.width || safeW;
      const m = this.measureElement(el, width);
      const height = state?.height || m.height;
      
      const resolved: ResolvedElement = {
        originalId: el.id,
        role: el.role,
        x: surface.safeArea.left,
        y: currentY,
        width: isHidden ? 0 : width,
        height: isHidden ? 0 : height,
        lines: m.lines,
        fontSize: el.fontSize,
        degradationsApplied: state?.degradationsApplied || [],
        hidden: isHidden,
        priority: el.priority
      };
      
      elements.push(resolved);
      
      if (!isHidden) {
        currentY += height + (ad.globalConstraints?.minSpacing || 8);
      }
    }
    
    return {
      id: `${this.type}-${Date.now()}-${Math.random()}`,
      type: this.type,
      score: 0,
      elements,
      isValid: false,
      violations: [],
      diagnostics: [{ type: 'CONSTRAINT_SATISFIED', reason: `Generated ${this.type}`, action: 'GENERATE' }]
    };
  }
}

export class HorizontalSplitCandidate extends BaseCandidateGenerator {
  type = 'horizontal-split' as const;

  regenerate(ad: AdSpec, surface: SurfaceProfile, overrides: Map<string, ResolvedElement>): CandidateLayout {
    const safeW = this.getSafeWidth(surface);
    const safeH = this.getSafeHeight(surface);
    
    // Split 50/50 vertically
    const splitW = safeW / 2;
    
    const elements: ResolvedElement[] = [];
    
    // Simplistic split: Hero image on left, others on right
    let rightY = surface.safeArea.top;
    
    for (const el of ad.elements) {
      const state = overrides.get(el.id);
      const isHidden = state?.hidden || false;
      const isHero = el.role === 'hero-image';
      
      const width = state?.width || splitW;
      const m = this.measureElement(el, width);
      const height = state?.height || (isHero ? safeH : m.height);
      
      const x = isHero ? surface.safeArea.left : surface.safeArea.left + splitW + (ad.globalConstraints?.minSpacing || 8);
      const y = isHero ? surface.safeArea.top : rightY;
      
      const resolved: ResolvedElement = {
        originalId: el.id,
        role: el.role,
        x,
        y,
        width: isHidden ? 0 : (isHero ? width : Math.max(0, width - (ad.globalConstraints?.minSpacing || 8))),
        height: isHidden ? 0 : height,
        lines: m.lines,
        fontSize: el.fontSize,
        degradationsApplied: state?.degradationsApplied || [],
        hidden: isHidden,
        priority: el.priority
      };
      
      elements.push(resolved);
      
      if (!isHidden && !isHero) {
        rightY += height + (ad.globalConstraints?.minSpacing || 8);
      }
    }
    
    // Disallow horizontal split on portrait surfaces
    const isPortrait = safeW < safeH;
    const violations = isPortrait ? ['HorizontalSplit is disallowed on portrait surfaces'] : [];
    
    return {
      id: `${this.type}-${Date.now()}-${Math.random()}`,
      type: this.type,
      score: 0,
      elements,
      isValid: false,
      violations,
      diagnostics: [{ type: 'CONSTRAINT_SATISFIED', reason: `Generated ${this.type}`, action: 'GENERATE' }]
    };
  }
}

export class HeroOverlayCandidate extends BaseCandidateGenerator {
  type = 'hero-overlay' as const;

  regenerate(ad: AdSpec, surface: SurfaceProfile, overrides: Map<string, ResolvedElement>): CandidateLayout {
    const safeW = this.getSafeWidth(surface);
    const safeH = this.getSafeHeight(surface);
    
    const elements: ResolvedElement[] = [];
    let contentY = surface.safeArea.top + (safeH * HERO_CONTENT_OFFSET_RATIO);
    
    for (const el of ad.elements) {
      const state = overrides.get(el.id);
      const isHidden = state?.hidden || false;
      const isHero = el.role === 'hero-image';
      
      // Hero takes full safe area
      const width = state?.width || safeW;
      const m = this.measureElement(el, width);
      const height = state?.height || (isHero ? safeH : m.height);
      
      const x = surface.safeArea.left;
      const y = isHero ? surface.safeArea.top : contentY;
      
      const resolved: ResolvedElement = {
        originalId: el.id,
        role: el.role,
        x,
        y,
        width: isHidden ? 0 : width,
        height: isHidden ? 0 : height,
        lines: m.lines,
        fontSize: el.fontSize,
        degradationsApplied: state?.degradationsApplied || [],
        hidden: isHidden,
        priority: el.priority
      };
      
      elements.push(resolved);
      
      if (!isHidden && !isHero) {
        contentY += height + (ad.globalConstraints?.minSpacing || 8);
      }
    }
    
    return {
      id: `${this.type}-${Date.now()}-${Math.random()}`,
      type: this.type,
      score: 0,
      elements,
      isValid: false,
      violations: [],
      diagnostics: [{ type: 'CONSTRAINT_SATISFIED', reason: `Generated ${this.type}`, action: 'GENERATE' }]
    };
  }
}
