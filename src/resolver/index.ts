import type { AdSpec, SurfaceProfile, ResolvedLayout, CandidateLayout, DiagnosticEvent, TextMeasurer } from '../core/types';
import { VerticalStackCandidate, HorizontalSplitCandidate, HeroOverlayCandidate } from './candidates';
import { DegradationEngine } from './degradation';
import { scoreCandidate } from './scoring';

export class LayoutResolver {
  private measurer?: TextMeasurer;

  constructor(measurer?: TextMeasurer) {
    this.measurer = measurer;
  }

  public resolve(ad: AdSpec, surface: SurfaceProfile): ResolvedLayout {
    const startTime = Date.now();
    
    // 1. Generators
    const generators = [
      new VerticalStackCandidate(this.measurer),
      new HorizontalSplitCandidate(this.measurer),
      new HeroOverlayCandidate(this.measurer)
    ];
    
    let bestCandidate: CandidateLayout | undefined;
    const failedAttempts: CandidateLayout[] = [];
    const allDiagnostics: DiagnosticEvent[] = [];
    let alternativesEvaluated = 0;

    for (const gen of generators) {
      // 2. Initial Generation
      const initialCandidates = gen.generate(ad, surface);
      
      for (const initial of initialCandidates) {
        alternativesEvaluated++;
        
        // 3. Degradation Loop
        const engine = new DegradationEngine(gen, this.measurer);
        const resolved = engine.applyDegradationLoop(initial, ad, surface);
        
        if (resolved.isValid) {
          // 4. Scoring
          scoreCandidate(resolved);
          
          if (!bestCandidate || resolved.score > bestCandidate.score) {
            bestCandidate = resolved;
          }
        } else {
          failedAttempts.push(resolved);
        }
      }
    }

    if (bestCandidate) {
      allDiagnostics.push({
        type: 'CANDIDATE_SELECTED',
        candidateId: bestCandidate.id,
        reason: 'Highest score valid candidate.'
      });
    } else {
       allDiagnostics.push({
        type: 'CANDIDATE_REJECTED',
        reason: 'No candidate could satisfy the hard constraints, even after degradation.'
      });
    }

    return {
      surfaceId: surface.id,
      adId: ad.id,
      bestCandidate,
      isSatisfiable: !!bestCandidate,
      failedAttempts,
      alternativesEvaluated,
      computationTimeMs: Date.now() - startTime,
      diagnostics: allDiagnostics
    };
  }
}
