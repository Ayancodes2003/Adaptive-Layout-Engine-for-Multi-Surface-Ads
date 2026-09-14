import type { CandidateLayout, AdSpec, SurfaceProfile, ResolvedElement, TextMeasurer } from '../core/types';
import { evaluateHardConstraints } from './constraints';
import type { CandidateGenerator } from './candidates';

export class DegradationEngine {
  private generator: CandidateGenerator;
  private measurer?: TextMeasurer;

  public constructor(generator: CandidateGenerator, measurer?: TextMeasurer) {
    this.generator = generator;
    this.measurer = measurer;
  }

  public applyDegradationLoop(
    initialCandidate: CandidateLayout, 
    ad: AdSpec,
    surface: SurfaceProfile
  ): CandidateLayout {
    let currentCandidate = initialCandidate;
    let evalResult = evaluateHardConstraints(currentCandidate, surface, ad);

    if (evalResult.isValid) {
      currentCandidate.isValid = true;
      currentCandidate.diagnostics.push(...evalResult.diagnostics);
      return currentCandidate;
    }

    // Sort elements by priority ascending (lowest priority degrades first)
    const elementsToDegrade = [...ad.elements].sort((a, b) => b.priority - a.priority);

    const elementStateOverride = new Map<string, ResolvedElement>();
    for (const el of initialCandidate.elements) {
      elementStateOverride.set(el.originalId, { ...el });
    }

    const tryDegrade = (
      adEl: AdSpec['elements'][0], 
      action: 'WRAP' | 'TRUNCATE' | 'SHRINK' | 'HIDE',
      mutator: (state: ResolvedElement) => boolean
    ) => {
      if (adEl.allowedDegradations.includes(action)) {
        const state = elementStateOverride.get(adEl.id);
        if (state && !state.hidden) {
          const changed = mutator(state);
          if (!changed) return false;

          state.degradationsApplied.push(action);
          
          const newCandidate = this.generator.regenerate(ad, surface, elementStateOverride);
          const newEval = evaluateHardConstraints(newCandidate, surface, ad);
          
          if (newEval.isValid) {
            newCandidate.isValid = true;
            newCandidate.diagnostics.push({
              type: 'DEGRADATION_APPLIED',
              elementId: adEl.id,
              action: action,
              reason: `Applied ${action} to fit bounds.`,
              priority: adEl.priority
            });
            currentCandidate = newCandidate;
            return true;
          }
          currentCandidate = newCandidate;
        }
      }
      return false;
    };

    // Progression: WRAP -> TRUNCATE -> SHRINK -> HIDE
    for (const action of ['WRAP', 'TRUNCATE', 'SHRINK', 'HIDE'] as const) {
      for (const adEl of elementsToDegrade) {
        let satisfied = false;
        
        switch (action) {
          case 'WRAP':
            satisfied = tryDegrade(adEl, 'WRAP', (state) => {
              if (!this.measurer || !state.fontSize || state.lines === undefined) return false;
              // To wrap, we reduce width artificially to force more lines (handled by generator)
              // But actually in this model, WRAP means we allow the element width to shrink, 
              // and let the generator's measureElement increase the height.
              // We'll simulate width reduction.
              if (state.width > (adEl.constraints.minWidth || 20)) {
                state.width = Math.max(adEl.constraints.minWidth || 20, state.width * 0.9);
                return true; // Width changed, generator will recalculate height
              }
              return false;
            });
            break;
            
          case 'TRUNCATE':
            satisfied = tryDegrade(adEl, 'TRUNCATE', (state) => {
               if (state.lines === undefined || state.lines <= 1) return false;
               const maxLines = adEl.constraints.maxLines || 1;
               if (state.lines > maxLines) {
                  // We simulate truncation by just forcing the height to the maxLines height
                  if (this.measurer && state.fontSize) {
                    // It's a bit of a hack without full layout engine, but sufficient for Phase 3
                    state.height = (state.fontSize * 1.2) * maxLines;
                    state.lines = maxLines;
                    return true;
                  }
               }
               return false;
            });
            break;
            
          case 'SHRINK':
            satisfied = tryDegrade(adEl, 'SHRINK', (state) => {
              const oldW = state.width;
              const oldH = state.height;
              state.width = Math.max(adEl.constraints.minWidth || 20, state.width * 0.8);
              state.height = Math.max(adEl.constraints.minHeight || 20, state.height * 0.8);
              if (state.fontSize) {
                state.fontSize = Math.max(adEl.constraints.minFontSize || 10, state.fontSize * 0.8);
              }
              return oldW !== state.width || oldH !== state.height;
            });
            break;
            
          case 'HIDE':
            satisfied = tryDegrade(adEl, 'HIDE', (state) => {
              state.hidden = true;
              return true;
            });
            break;
        }

        if (satisfied) {
          return currentCandidate;
        }
      }
    }

    return currentCandidate; // Still invalid, returns best-effort
  }
}
