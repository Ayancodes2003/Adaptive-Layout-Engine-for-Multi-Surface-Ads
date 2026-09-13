import { LayoutResolver } from '../src/resolver/index';
import { AdSpec, SurfaceProfile } from '../src/core/types';
import { describe, it, expect } from 'vitest';

describe('LayoutResolver', () => {
  it('should return a valid layout for a simple ad and standard surface', () => {
    const resolver = new LayoutResolver();
    const ad: AdSpec = {
      id: 'ad-1',
      elements: [
        {
          id: 'headline',
          role: 'headline',
          priority: 1,
          content: 'Test',
          constraints: { minHeight: 50 },
          allowedDegradations: []
        }
      ]
    };
    
    const surface: SurfaceProfile = {
      id: 'surface-1',
      width: 300,
      height: 600,
      safeArea: { top: 0, right: 0, bottom: 0, left: 0 },
      interactionModel: 'touch',
      viewingDistance: 'near'
    };
    
    const result = resolver.resolve(ad, surface);
    expect(result.isSatisfiable).toBe(true);
    expect(result.bestCandidate).toBeDefined();
    
    // Bounds check property
    const el = result.bestCandidate!.elements[0];
    expect(el.x + el.width).toBeLessThanOrEqual(surface.width);
    expect(el.y + el.height).toBeLessThanOrEqual(surface.height);
  });
  
  it('should explicitly fail when hard constraints cannot be met and no degradation allows recovery', () => {
    const resolver = new LayoutResolver();
    const ad: AdSpec = {
      id: 'ad-1',
      elements: [
        {
          id: 'headline',
          role: 'headline',
          priority: 1,
          content: 'Test',
          constraints: { minHeight: 800 }, // taller than surface
          allowedDegradations: [] // not allowed to shrink or hide
        }
      ]
    };
    
    const surface: SurfaceProfile = {
      id: 'surface-1',
      width: 300,
      height: 600,
      safeArea: { top: 0, right: 0, bottom: 0, left: 0 },
      interactionModel: 'touch',
      viewingDistance: 'near'
    };
    
    const result = resolver.resolve(ad, surface);
    expect(result.isSatisfiable).toBe(false);
    expect(result.bestCandidate).toBeUndefined();
  });
});
