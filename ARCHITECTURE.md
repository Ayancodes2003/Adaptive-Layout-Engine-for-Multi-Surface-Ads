# Architecture

The Adaptive Layout Engine is built as a pure, deterministic compiler, separate from its rendering layer. 
The system avoids device-specific code (no "mobile" or "desktop" branches).

## 1. Domain Separation
The engine explicitly separates concerns into:
- **Core Models (`src/core`)**: Pure data structures for `AdSpec`, `SurfaceProfile`, and `ResolvedLayout`.
- **Resolver (`src/resolver`)**: The rule engine and constraint solver. It does not import React or DOM APIs.
- **Renderer (`src/renderer`)**: React components (currently) that consume a `ResolvedLayout` and project it onto the screen. It performs no layout logic itself.
- **Demo / Lab (`src/demo`)**: The interactive harness showcasing the resolver in action.

## 2. The Resolution Algorithm
Rather than an exhaustive mathematical constraint solver (which can be unpredictable or slow), we use a deterministic "generate-and-test" heuristic approach:

1. **Candidate Generation**: The system spawns multiple conceptual strategies (`VerticalStack`, `HorizontalSplit`, `HeroOverlay`, etc.).
2. **Measurement & Constraint Binding**: Elements are given initial dimensions based on the surface constraints and their individual configurations.
3. **Evaluation**: We evaluate each candidate against hard invariants (e.g., bounds violation, overlap).
4. **Degradation Loop**: If hard constraints fail, we apply soft degradations (shrink, truncate, hide) strictly in order of semantic priority.
5. **Scoring**: Valid candidates are scored on aesthetic and practical metrics (priority retention, whitespace utilization).
6. **Selection**: The best candidate is finalized and its resolution trace is attached for UI explainability.

## 3. Explainability
Every decision made by the resolver is tracked in a `decisionTrace` array on the `CandidateLayout`. This trace provides human-readable explanations of why elements were removed or resized, allowing the demo UI to justify its output to an interviewer or engineer.

## 4. Testing & Invariants
We emphasize property-based testing and invariants. For example, rather than comparing pixel outputs to snapshots, the test suite (`tests/`) validates that `element.x + element.width <= surface.width` is unconditionally true for all visible elements across thousands of generated surfaces.

## 5. Future Extensibility
Because the `ResolvedLayout` is just a JSON-serializable object describing exact pixels and roles, a `CanvasRenderer` or `WebGLRenderer` can be trivially added alongside the React DOM renderer without any changes to `src/resolver`.
