import { CandidateLayout, SurfaceProfile } from '../core/types';

export function scoreCandidate(candidate: CandidateLayout, surface: SurfaceProfile): number {
  if (!candidate.isValid) return 0;
  
  let score = 1000;
  
  // Penalty for missing high priority elements
  const missing = candidate.elements.filter(e => e.hidden);
  for (const m of missing) {
    score -= (100 / m.priority);
  }

  // Penalty for degradations applied
  for (const el of candidate.elements) {
    for (const op of el.degradationsApplied) {
      if (op === 'SHRINK') score -= 10;
      if (op === 'TRUNCATE') score -= 20;
    }
  }
  
  candidate.score = score;
  return score;
}
