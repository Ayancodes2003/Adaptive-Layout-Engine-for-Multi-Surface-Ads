import { CandidateLayout, AdSpec, SurfaceProfile, ResolvedElement, DiagnosticEvent } from '../core/types';
import { evaluateHardConstraints } from './constraints';
import { CandidateGenerator } from './candidates'; // Need to define an interface or base class for regenerate

export class DegradationEngine {
  constructor(private generator: { regenerate: (ad: AdSpec, surface: SurfaceProfile, override: Map<string, ResolvedElement>) => CandidateLayout }) {}

  public applyDegradationLoop(
    initialCandidate: CandidateLayout, 
    ad: AdSpec, 
    surface: SurfaceProfile
  ): CandidateLayout {
    let currentCandidate = initialCandidate;
    let evalResult = evaluateHardConstraints(currentCandidate, surface);

    if (evalResult.isValid) {
      currentCandidate.diagnostics.push(...evalResult.diagnostics);
      return currentCandidate;
    }

    // Sort elements by priority (descending numerical value so lowest priority goes first)
    const sortedElements = [...ad.elements].sort((a, b) => b.priority - a.priority);
    const elementStateOverride = new Map<string, ResolvedElement>();
    
    // Copy current state
    currentCandidate.elements.forEach(el => elementStateOverride.set(el.originalId, { ...el }));

    for (const adEl of sortedElements) {
      const state = elementStateOverride.get(adEl.id)!;
      
      for (const op of adEl.allowedDegradations) {
        if (op === 'HIDE' && !state.hidden) {
          state.hidden = true;
          state.degradationsApplied.push('HIDE');
          
          const newCandidate = this.generator.regenerate(ad, surface, elementStateOverride);
          const newEval = evaluateHardConstraints(newCandidate, surface);
          
          if (newEval.isValid) {
            newCandidate.diagnostics.push({
              type: 'DEGRADATION_APPLIED',
              elementId: adEl.id,
              candidateId: newCandidate.id,
              action: 'HIDE',
              priority: adEl.priority,
              reason: `Hid element ${adEl.id} to satisfy constraints.`
            });
            return newCandidate;
          }
        }
        
        // Could implement SHRINK, TRUNCATE, etc. in a similar monotonic way
        if (op === 'SHRINK' && state.width > (adEl.constraints.minWidth || 0)) {
           // Basic shrink logic
           const oldWidth = state.width;
           state.width = Math.max(state.width * 0.8, adEl.constraints.minWidth || 0);
           state.degradationsApplied.push('SHRINK');
           
           const newCandidate = this.generator.regenerate(ad, surface, elementStateOverride);
           const newEval = evaluateHardConstraints(newCandidate, surface);
           
           if (newEval.isValid) {
              newCandidate.diagnostics.push({
                type: 'DEGRADATION_APPLIED',
                elementId: adEl.id,
                action: 'SHRINK',
                before: `width:${oldWidth}`,
                after: `width:${state.width}`,
                reason: `Shrunk element ${adEl.id} to satisfy constraints.`
              });
              return newCandidate;
           }
        }
      }
    }

    // If we exhaust all degradations and it still fails
    currentCandidate.isValid = false;
    currentCandidate.violations = evalResult.violations;
    currentCandidate.diagnostics.push({
      type: 'CANDIDATE_REJECTED',
      candidateId: currentCandidate.id,
      reason: 'Exhausted all degradation options, candidate remains invalid.'
    });
    return currentCandidate;
  }
}
