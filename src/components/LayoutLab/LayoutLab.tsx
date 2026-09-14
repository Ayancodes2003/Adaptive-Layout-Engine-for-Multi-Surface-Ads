import React, { useState, useMemo, useEffect } from 'react';
import { SurfaceControls, PRESETS } from './SurfaceControls';
import { Inspector } from './Inspector';
import { ElementDetails } from './ElementDetails';
import { DOMRenderer } from '../../renderer/DOMRenderer';
import { LayoutResolver } from '../../resolver';
import type { AdSpec, SurfaceProfile, ResolvedElement } from '../../core/types';
import './LayoutLab.css';

// The stable AdSpec defining the creative content requirements
const TEST_AD_SPEC: AdSpec = {
  id: 'ad-001',
  elements: [
    {
      id: 'hero',
      role: 'hero-image',
      priority: 1,
      content: 'hero.png',
      constraints: { minHeight: 100, minWidth: 100 },
      allowedDegradations: ['SHRINK']
    },
    {
      id: 'headline',
      role: 'headline',
      priority: 2,
      content: 'Adaptive Engine',
      constraints: { minHeight: 40, minWidth: 150 },
      fontSize: 24,
      fontWeight: 'bold',
      allowedDegradations: ['SHRINK', 'WRAP']
    },
    {
      id: 'cta',
      role: 'cta',
      priority: 3,
      content: 'Learn More',
      constraints: { minHeight: 44, minWidth: 120 },
      allowedDegradations: ['SHRINK']
    },
    {
      id: 'body',
      role: 'body',
      priority: 4,
      content: 'Constraint-driven resolution engine.',
      constraints: { minHeight: 20, minWidth: 150, maxLines: 2 },
      fontSize: 14,
      allowedDegradations: ['SHRINK', 'WRAP', 'TRUNCATE', 'HIDE']
    },
    {
      id: 'logo',
      role: 'logo',
      priority: 5,
      content: 'LOGO',
      constraints: { minHeight: 32, minWidth: 80 },
      allowedDegradations: ['HIDE']
    }
  ],
  globalConstraints: {
    minSpacing: 12
  }
};

import { CanvasTextMeasurer } from '../../renderer/CanvasTextMeasurer';

const measurer = new CanvasTextMeasurer();
const resolver = new LayoutResolver(measurer);

export const LayoutLab: React.FC = () => {
  const [activePreset, setActivePreset] = useState<string>('Mobile Portrait');
  const [profile, setProfile] = useState<SurfaceProfile>(PRESETS['Mobile Portrait']);
  
  const [debugMode, setDebugMode] = useState(false);
  const [selectedElement, setSelectedElement] = useState<ResolvedElement | null>(null);

  // Synchronous resolution of the constraint engine
  // This is purely CPU math. It executes instantly on slider drag.
  const { layout, metrics } = useMemo(() => {
    const t0 = performance.now();
    const result = resolver.resolve(TEST_AD_SPEC, profile);
    const t1 = performance.now();
    
    let degradedElements = 0;
    if (result.bestCandidate) {
      degradedElements = result.bestCandidate.elements.filter(e => e.degradationsApplied.length > 0).length;
    }
    
    const validCount = result.bestCandidate ? 1 : 0;
    
    return {
      layout: result,
      metrics: {
        timeMs: (t1 - t0).toFixed(2),
        candidates: result.alternativesEvaluated,
        valid: validCount,
        degraded: degradedElements
      }
    };
  }, [profile]);

  // Clear selection if the element was removed completely (though the resolver maintains hidden elements with width 0)
  useEffect(() => {
    if (selectedElement && layout?.bestCandidate?.elements) {
      const stillExists = layout.bestCandidate.elements.find(e => e.originalId === selectedElement.originalId);
      if (!stillExists) setSelectedElement(null);
      else setSelectedElement(stillExists);
    }
  }, [layout]);

  return (
    <div className="layout-lab">
      <header className="lab-header" role="banner">
        <div className="lab-title">
          <h1>Adaptive Layout Lab</h1>
          <span className="badge" aria-label="Engineering Observability">Engineering Observability</span>
        </div>
        <p className="lab-paradigm">One declarative ad spec &rarr; many surfaces &rarr; constraint-driven resolution.</p>
        <div className="header-controls">
          <label className="toggle-label">
            <input 
              type="checkbox" 
              checked={debugMode} 
              onChange={e => setDebugMode(e.target.checked)} 
              aria-label="Toggle Debug Geometry Mode"
            />
            <span className="toggle-text">Debug Geometry</span>
          </label>
        </div>
      </header>

      <div className="lab-content">
        {/* Left Column: Input (Surface Profiles / Constraints) */}
        <aside className="panel surface-panel">
          <div className="panel-header">
            <h2>INPUT: SURFACE</h2>
          </div>
          <SurfaceControls 
            profile={profile}
            onChange={setProfile}
            preset={activePreset}
            onPresetChange={setActivePreset}
          />
        </aside>

        {/* Center Column: The Renderer (The Output Canvas) */}
        <main className="panel renderer-panel">
          <div className="panel-header">
            <h2>OUTPUT: CANVAS</h2>
            <div className="canvas-metrics">
              {profile.width} × {profile.height}
            </div>
          </div>
          <div className="canvas-container">
            {/* The actual bounding box of the device/surface */}
            <div 
              className="surface-bounds"
              style={{ width: profile.width, height: profile.height }}
            >
              {debugMode && (
                <div 
                  className="safe-area-bounds"
                  style={{
                    top: profile.safeArea.top,
                    right: profile.safeArea.right,
                    bottom: profile.safeArea.bottom,
                    left: profile.safeArea.left,
                  }}
                />
              )}
              <DOMRenderer 
                layout={layout} 
                debugMode={debugMode}
                onElementClick={setSelectedElement}
              />
            </div>
          </div>
        </main>

        {/* Right Column: Inspector (The Engine's Reasoning) */}
        <aside className="panel inspector-panel">
          <div className="panel-header">
            <h2>RESOLUTION INSPECTOR</h2>
            <div className="resolution-metrics" aria-label="Resolver Performance Metrics">
              <span>Time: <strong>{metrics.timeMs}ms</strong></span>
              <span>Candidates: <strong>{metrics.candidates}</strong></span>
              <span>Valid: <strong>{metrics.valid}</strong></span>
              <span>Degraded: <strong>{metrics.degraded}</strong></span>
            </div>
          </div>
          <Inspector layout={layout} />
          {selectedElement && (
            <ElementDetails 
              element={selectedElement} 
              onClose={() => setSelectedElement(null)} 
            />
          )}
        </aside>
      </div>
    </div>
  );
};
