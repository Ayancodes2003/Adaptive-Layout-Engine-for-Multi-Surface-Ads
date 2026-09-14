# Architecture: Adaptive Layout Engine

The Adaptive Layout Engine is a deterministic constraint-resolution system that transforms a single, declarative Advertisement Specification (`AdSpec`) into an exact pixel layout for any arbitrary display surface.

It is designed as a pure, environment-agnostic compiler, deliberately decoupling layout logic from rendering implementation.

## 1. Domain Separation & Dependency Flow

The system enforces a strict unidirectional dependency graph:

```
src/core (Types & Interfaces)
   ↓
src/resolver (Constraint Engine)
   ↓
src/renderer (DOM Projection)
   ↓
src/components/LayoutLab (Interactive Harness)
```

- **Core (`src/core`)**: Pure Data structures (`AdSpec`, `SurfaceProfile`, `ResolvedLayout`). No logic.
- **Resolver (`src/resolver`)**: The rule engine. It executes synchronous CPU math and outputs a `ResolvedLayout`. It is purely functional and contains ZERO dependencies on DOM, React, Canvas, or the Browser environment.
- **Renderer (`src/renderer`)**: Receives the `ResolvedLayout` and projects the explicit `x, y, width, height` coordinates onto the screen. It performs no dimensional calculation.
- **Lab UI (`src/components/LayoutLab`)**: The harness that controls inputs, invokes the resolver, and provides deep observability into the resolution trace.

## 2. The Resolution Pipeline

Unlike iterative physics-based or general-purpose LP solvers (like Cassowary), which can be computationally expensive or opaque, this engine utilizes a deterministic "Generate, Degrade, and Evaluate" heuristic pipeline.

### Pipeline Stages:

1. **Measurement & DI**: A `TextMeasurer` implementation is injected into the Resolver. Text dimensions are pre-calculated based on layout constraints without touching the DOM during resolution.
2. **Candidate Generation**: The system spawns multiple strategic layouts (`VerticalStack`, `HorizontalSplit`, `HeroOverlay`). Each generator proposes an initial layout bounded by the surface's `safeArea`.
3. **Hard Constraint Evaluation**: Candidates are checked for invariant violations (e.g., overlapping elements, out-of-bounds geometry). Invalid candidates are immediately flagged.
4. **Degradation Loop**: If a candidate fails hard constraints, the `DegradationEngine` applies mutation strategies (`SHRINK`, `WRAP`, `TRUNCATE`, `HIDE`) strictly in reverse order of semantic priority until the layout is valid or deemed unsatisfiable.
5. **Scoring**: Valid candidates are scored against a multi-dimensional heuristic:
   - **Priority Preservation**: Penalty for degrading high-priority elements.
   - **Degradation Cost**: Minor penalties for wrapping/shrinking, major penalties for hiding.
   - **Space Utilization**: Rewards layouts that effectively utilize available screen real estate.
6. **Selection**: The candidate with the highest score is finalized as the `bestCandidate`.

## 3. Explainability and the Resolution Trace

A primary design goal of this engine is **Engineering Observability**. Every decision (why an element was shrunk, why a layout was rejected, why a candidate won) is logged into a deterministic `diagnostics` array on the candidate. 

This trace provides human-readable audit logs, allowing the `LayoutLab` UI to justify the engine's output without requiring the user to inspect the source code.

## 4. Property-Based Invariant Testing

To ensure the engine behaves predictably across an infinite number of arbitrary screen sizes, the test suite (`tests/resolver.test.ts`) employs property-based testing. 

Rather than relying purely on brittle visual snapshots, the tests generate thousands of random surfaces and assert that fundamental geometric invariants unconditionally hold true:
- `element.x + element.width <= surface.safeArea.right`
- No two visible elements overlap in 2D space.
- Degradations correctly target lower-priority elements before higher-priority elements.
