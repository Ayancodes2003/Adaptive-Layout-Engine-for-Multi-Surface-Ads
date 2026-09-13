# Adaptive Layout Engine for Multi-Surface Ads

## What the project does
This is a constraint-driven layout engine designed to take a single declarative advertising specification and dynamically compute the most appropriate visual composition for any arbitrary surface profile. It is not merely a responsive webpage but a deterministic compiler that evaluates layout candidates against semantic priorities, explicit constraints, and degradation rules.

## Architecture
The core engine is framework-agnostic (written in pure TypeScript) and strictly decoupled from the rendering layer. 
It follows a clear pipeline: Normalization -> Candidate Generation -> Resolution & Validation -> Priority/Degradation -> Scoring -> Result.
For details, see [ARCHITECTURE.md](./ARCHITECTURE.md).

## Resolution Algorithm
The resolver evaluates a set of generic composition strategies (vertical, horizontal, split, etc.). For each candidate, it attempts to resolve the constraints. If hard constraints (like visible bounds and non-overlapping elements) are violated, it follows defined element-specific degradation policies based on semantic priority (e.g., shrink, truncate, hide). Candidates are scored based on metrics like priority preservation, whitespace balance, and degradation severity. 

## Priority and Degradation Strategy
Elements are ranked by priority (1 is highest). When space constraints dictate, lower priority elements undergo permitted degradations before higher priority elements are affected. A CTA must never shrink below a minimum tap target merely to preserve a secondary graphic.

## Type System
The system leverages a strict TypeScript domain model to prevent invalid state, representing `AdSpec`, `SurfaceProfile`, and `ResolvedLayout` with clearly delineated fields.

## How to run
1. Install dependencies: `npm install`
2. Start the Layout Lab: `npm run dev`
3. Open `http://localhost:5173`

## How to test
- Run Vitest test suite: `npm test`
- Tests emphasize invariant property testing (e.g., confirming no elements ever overlap in output).

## Known Limitations
- Initial implementation focuses on DOM rendering.
- Text measurement abstraction uses browser heuristics currently.

## Time Spent
[To be documented upon completion]

## AI Tool Disclosure
Initial bootstrapping and structural framing authored with the assistance of Google Antigravity.
