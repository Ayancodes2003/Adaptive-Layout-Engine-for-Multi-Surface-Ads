# Adaptive Layout Engine for Multi-Surface Ads

## Project Overview

The Adaptive Layout Engine is an advanced, deterministic constraint-resolution system designed to decouple advertising content from specific device profiles.

Rather than authoring reactive CSS or bespoke React layouts for every conceivable form factor (mobile, tablet, kiosk, broadcast lower-third), developers provide a single declarative **Advertisement Specification (`AdSpec`)**. The engine mathematically evaluates these constraints against a **Surface Profile** and computes the exact spatial geometry for every element.

The goal is absolute predictability and automated degradation. If a required ad cannot fit an arbitrary display surface, the engine intelligently shrinks, wraps, or drops elements strictly according to defined business priorities.

## Core Capabilities

1. **Environment-Agnostic Engine**: The core resolver (`src/core`, `src/resolver`) contains purely mathematical constraint-resolution logic. It uses Dependency Injection for text measurement and has absolutely no dependency on the DOM, React, Canvas, or browser APIs. It can run in Node.js, Cloudflare Workers, or a browser client.
2. **Deterministic Output**: For a given `AdSpec` and `SurfaceProfile`, the layout output (`ResolvedLayout`) is identical 100% of the time.
3. **Automated Degradation**: Unlike traditional CSS Flexbox/Grid which merely squishes elements, the engine evaluates priority trees. Lower-priority elements (e.g., secondary logos) will be dropped entirely to preserve the legibility and tap-target size of higher-priority elements (e.g., CTA buttons).
4. **Resolution Trace**: Every constraint evaluation and degradation decision is logged in a detailed diagnostic trace. The engine is fully transparent, allowing engineers to ask "Why did it render this way?".

## Engineering Architecture

Please refer to [ARCHITECTURE.md](./ARCHITECTURE.md) for a deep dive into the Resolution Pipeline, scoring heuristic, and domain separation.

## Development & Testing

This project leverages Vite for rapid development and Vitest for property-based invariant testing.

### Setup
```bash
npm install
npm run dev
```

### The Layout Lab (Observability UI)
Opening `http://localhost:5173` launches the **Layout Lab**. 
This is an engineering observability tool that visualizes the engine's real-time output. 

#### What to try
1. Switch between the four surfaces.
2. Open the resolution inspector.
3. Stress the constraints.
4. Create a custom fifth surface.
5. Force an unsatisfiable layout.

### Property-Based Testing
```bash
npm test
```
The test suite utilizes property-based testing. It generates random surfaces (width, height, safe areas) and proves that the engine never violates fundamental invariants (no elements overlap, all elements remain within safe bounds).

### Deployment
The production build (`npm run build`) generates a fully static Vite application in the `dist` directory. 
*Note: Public deployment via Vercel/Netlify was not completed automatically as it requires the repository owner's authentication tokens. The repository is configured and ready for CI/CD deployment.*

## Time Spent
[Approximately 12 hours across 4 phases of iteration]

## AI Tool Disclosure
Initial scaffolding, structural framing, and test implementation generated with the assistance of Google Antigravity, driving an iterative architecture-first workflow.
