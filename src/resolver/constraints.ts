import type { CandidateLayout, SurfaceProfile, DiagnosticEvent, AdSpec } from '../core/types';
import { getSafeBounds, contains, hasAnyOverlap } from './geometry';

export interface ConstraintEvaluationResult {
  isValid: boolean;
  violations: string[];
  diagnostics: DiagnosticEvent[];
}

export function evaluateHardConstraints(candidate: CandidateLayout, surface: SurfaceProfile, ad: AdSpec): ConstraintEvaluationResult {
  const violations: string[] = [...candidate.violations];
  const diagnostics: DiagnosticEvent[] = [];
  const safeBounds = getSafeBounds(surface);

  const visibleElements = candidate.elements.filter(e => !e.hidden);

  // 1. Bounds checking
  for (const el of visibleElements) {
    if (!contains(safeBounds, el)) {
      violations.push(`Element ${el.originalId} is outside safe visible bounds.`);
    }
  }

  // 2. Overlap checking
  if (hasAnyOverlap(visibleElements)) {
    violations.push(`Candidate ${candidate.id} has overlapping elements.`);
  }

  // 3. Tap targets for CTAs
  if (surface.interactionModel === 'touch') {
    for (const el of visibleElements.filter(e => e.role === 'cta')) {
      const minTap = surface.viewingDistance === 'near' ? 44 : 60;
      if (el.width < minTap || el.height < minTap) {
        violations.push(`CTA ${el.originalId} violates minimum tap target size (${minTap}px).`);
      }
    }
  }

  // 4. Element specific constraints (minWidth, minHeight)
  for (const el of visibleElements) {
    const spec = ad.elements.find(e => e.id === el.originalId);
    if (spec) {
      if (spec.constraints.minWidth && el.width < spec.constraints.minWidth) {
        violations.push(`Element ${el.originalId} is narrower than minWidth.`);
      }
      if (spec.constraints.minHeight && el.height < spec.constraints.minHeight) {
        violations.push(`Element ${el.originalId} is shorter than minHeight.`);
      }
    }
    
    if (el.width <= 0 || el.height <= 0) {
      violations.push(`Element ${el.originalId} has non-positive dimensions.`);
    }
  }

  const isValid = violations.length === 0;
  
  if (isValid) {
    diagnostics.push({
      type: 'CONSTRAINT_SATISFIED',
      action: 'NO_ACTION',
      reason: 'All hard constraints satisfied.'
    });
  }

  return { isValid, violations, diagnostics };
}
