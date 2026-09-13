import { AdSpec, SurfaceProfile, CandidateLayout, ResolvedElement } from '../core/types';

export interface CandidateGenerator {
  generate(ad: AdSpec, surface: SurfaceProfile): CandidateLayout[];
  regenerate(ad: AdSpec, surface: SurfaceProfile, overrides: Map<string, ResolvedElement>): CandidateLayout;
}

export abstract class BaseCandidateGenerator implements CandidateGenerator {
  abstract type: 'vertical-stack' | 'horizontal-split' | 'hero-overlay' | 'compact-strip';
  
  generate(ad: AdSpec, surface: SurfaceProfile): CandidateLayout[] {
    return [this.regenerate(ad, surface, new Map())];
  }

  abstract regenerate(ad: AdSpec, surface: SurfaceProfile, overrides: Map<string, ResolvedElement>): CandidateLayout;

  protected getElementState(adEl: any, overrides: Map<string, ResolvedElement>, defaultState: ResolvedElement): ResolvedElement {
    return overrides.has(adEl.id) ? overrides.get(adEl.id)! : defaultState;
  }
}

export class VerticalStackCandidate extends BaseCandidateGenerator {
  type = 'vertical-stack' as const;

  regenerate(ad: AdSpec, surface: SurfaceProfile, overrides: Map<string, ResolvedElement>): CandidateLayout {
    const safeW = surface.width - surface.safeArea.left - surface.safeArea.right;
    
    let currentY = surface.safeArea.top;
    const elements: ResolvedElement[] = [];

    // Sort by DOM flow priority - usually headline first, etc. Let's just follow ad elements array order for layout flow.
    for (const el of ad.elements) {
      const isHidden = overrides.get(el.id)?.hidden || false;
      
      const width = overrides.get(el.id)?.width || safeW;
      const height = overrides.get(el.id)?.height || el.constraints.minHeight || 44;
      
      const resolved: ResolvedElement = {
        originalId: el.id,
        role: el.role,
        x: surface.safeArea.left,
        y: currentY,
        width: isHidden ? 0 : width,
        height: isHidden ? 0 : height,
        degradationsApplied: overrides.get(el.id)?.degradationsApplied || [],
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
      diagnostics: [{ type: 'CONSTRAINT_SATISFIED', reason: `Generated ${this.type}` }]
    };
  }
}

// Additional candidates (HorizontalSplit, HeroOverlay, CompactStrip) would follow similar patterns.
