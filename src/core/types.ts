/**
 * Core Domain Model for Adaptive Layout Engine
 */

export type SemanticRole =
  | 'headline'
  | 'body'
  | 'cta'
  | 'hero-image'
  | 'logo'
  | 'price'
  | 'legal'
  | 'decorative';

export type DegradationOperation =
  | 'SHRINK'
  | 'REPOSITION'
  | 'REFLOW'
  | 'TRUNCATE'
  | 'HIDE'
  | 'WRAP';

export interface TextMeasurement {
  width: number;
  height: number;
  lines: number;
}

export interface TextMeasurer {
  measureText(text: string, fontSize: number, fontWeight: string, maxWidth?: number): TextMeasurement;
}

export interface ElementConstraint {
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  aspectRatio?: number;
  minTapTarget?: number; // E.g., 44px for accessibility
  minFontSize?: number;
  maxLines?: number; // Added for text truncation policy
}

export interface AdElement {
  id: string;
  role: SemanticRole;
  priority: number; // 1 is highest priority
  content: string; // URL for image, text for text elements
  constraints: ElementConstraint;
  allowedDegradations: DegradationOperation[];
  fontSize?: number; // Initial ideal font size
  fontWeight?: string;
}

export interface AdSpec {
  id: string;
  elements: AdElement[];
  globalConstraints?: {
    minSpacing?: number;
    safeAreaPadding?: number;
  };
}

export interface SafeArea {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface SurfaceProfile {
  id: string;
  width: number;
  height: number;
  safeArea: SafeArea;
  interactionModel: 'touch' | 'mouse' | 'view-only' | 'none';
  viewingDistance: 'near' | 'far'; // Could influence text sizes
  minTapTarget?: number;
  minTextSize?: number;
}

export interface ResolvedElement {
  originalId: string;
  role: SemanticRole;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize?: number;
  lines?: number;
  degradationsApplied: DegradationOperation[];
  hidden: boolean;
  priority: number;
}

export type DiagnosticEventType =
  | 'CONSTRAINT_SATISFIED'
  | 'CONSTRAINT_VIOLATED'
  | 'DEGRADATION_APPLIED'
  | 'CANDIDATE_REJECTED'
  | 'CANDIDATE_SELECTED';

export interface DiagnosticEvent {
  type: DiagnosticEventType;
  elementId?: string;
  candidateId?: string;
  constraint?: string;
  action?: string;
  priority?: number;
  before?: string;
  after?: string;
  reason: string;
}

export interface CandidateScore {
  total: number;
  priorityPreservation: number;
  spaceUtilization: number;
  degradationCost: number;
}

export interface CandidateLayout {
  id: string;
  type: 'vertical-stack' | 'horizontal-split' | 'hero-overlay' | 'compact-strip';
  score: number;
  detailedScore?: CandidateScore;
  elements: ResolvedElement[];
  isValid: boolean;
  violations: string[]; // Hard constraints failed
  diagnostics: DiagnosticEvent[];
}

export interface ResolvedLayout {
  surfaceId: string;
  adId: string;
  bestCandidate?: CandidateLayout;
  isSatisfiable: boolean;
  failedAttempts: CandidateLayout[]; // Information on why it failed if isSatisfiable = false
  alternativesEvaluated: number;
  computationTimeMs: number;
  diagnostics: DiagnosticEvent[];
}

