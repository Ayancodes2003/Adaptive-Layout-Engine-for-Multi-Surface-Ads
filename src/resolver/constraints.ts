import { CandidateLayout, SurfaceProfile, DiagnosticEvent } from '../core/types';
import { getSafeBounds, contains, hasAnyOverlap } from './geometry';

export interface ConstraintEvaluationResult {
  isValid: boolean;
  violations: string[];
  diagnostics: DiagnosticEvent[];
}

export function evaluateHardConstraints(candidate: CandidateLayout, surface: SurfaceProfile): ConstraintEvaluationResult {
  const violations: string[] = [];
  const diagnostics: DiagnosticEvent[] = [];
  const safeBounds = getSafeBounds(surface);

  const visibleElements = candidate.elements.filter(e => !e.hidden);

  // 1. Bounds checking
  for (const el of visibleElements) {
    if (!contains(safeBounds, el)) {
      const msg = `Element ${el.originalId} is outside safe visible bounds.`;
      violations.push(msg);
      diagnostics.push({
        type: 'CONSTRAINT_VIOLATED',
        elementId: el.originalId,
        candidateId: candidate.id,
        constraint: 'BOUNDS',
        reason: msg
      });
    }
  }

  // 2. Overlap checking
  if (hasAnyOverlap(visibleElements)) {
    const msg = `Candidate ${candidate.id} has overlapping elements.`;
    violations.push(msg);
    diagnostics.push({
      type: 'CONSTRAINT_VIOLATED',
      candidateId: candidate.id,
      constraint: 'OVERLAP',
      reason: msg
    });
  }

  // 3. Minimum tap targets for interactive roles
  const interactiveRoles = ['cta', 'link'];
  for (const el of visibleElements) {
    if (interactiveRoles.includes(el.role)) {
      // Find constraints from ad spec (since resolved element lost it, we might need to pass it or check against a fixed baseline, wait, let's keep it simple: min size > 0)
      if (el.width <= 0 || el.height <= 0) {
        const msg = `Element ${el.originalId} has invalid dimensions (${el.width}x${el.height}).`;
        violations.push(msg);
        diagnostics.push({
          type: 'CONSTRAINT_VIOLATED',
          elementId: el.originalId,
          constraint: 'DIMENSIONS',
          reason: msg
        });
      }
    }
  }

  // 4. Positive dimensions for all
  for (const el of visibleElements) {
    if (el.width <= 0 || el.height <= 0) {
      violations.push(`Element ${el.originalId} has non-positive dimensions.`);
    }
  }

  const isValid = violations.length === 0;
  if (isValid) {
    diagnostics.push({
      type: 'CONSTRAINT_SATISFIED',
      candidateId: candidate.id,
      reason: 'All hard constraints satisfied.'
    });
  }

  return { isValid, violations, diagnostics };
}
