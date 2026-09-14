import React from 'react';
import type { ResolvedLayout, ResolvedElement } from '../core/types';
import './DOMRenderer.css';

interface DOMRendererProps {
  layout: ResolvedLayout | null;
  debugMode?: boolean;
  onElementClick?: (el: ResolvedElement) => void;
}

export const DOMRenderer: React.FC<DOMRendererProps> = ({ 
  layout, 
  debugMode = false,
  onElementClick
}) => {
  if (!layout) {
    return <div className="renderer-empty">No layout resolved.</div>;
  }

  if (!layout.isSatisfiable || !layout.bestCandidate) {
    return (
      <div className="renderer-error">
        <h2>CONSTRAINTS UNSATISFIABLE</h2>
        <div className="renderer-violations">
          {layout.failedAttempts.map((candidate, i) => (
            <div key={i} className="failed-candidate">
              <strong>{candidate.type} failed:</strong>
              {candidate.violations.map((v, j) => (
                <p key={j}>⚠️ {v}</p>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 1. Determine bounding box for the entire resolved ad surface
  // By finding the max extents of the elements, or relying on the parent container.
  // In our engine, the elements are placed on the `SurfaceProfile` bounds.
  // The renderer container should ideally match the surface bounds.

  return (
    <div className={`dom-renderer-container ${debugMode ? 'debug-mode' : ''}`}>
      {layout.bestCandidate.elements.map(el => {
        // Core rule: the React UI does NOT decide layout. 
        // We purely consume explicit geometry.
        const style: React.CSSProperties = {
          position: 'absolute',
          left: `${el.x}px`,
          top: `${el.y}px`,
          width: `${el.width}px`,
          height: `${el.height}px`,
          fontSize: el.fontSize ? `${el.fontSize}px` : undefined,
          opacity: el.hidden ? 0 : 1,
          pointerEvents: el.hidden ? 'none' : 'auto',
          transition: 'all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
        };

        const contentStyle: React.CSSProperties = {};
        if (el.lines) {
           contentStyle.display = '-webkit-box';
           contentStyle.WebkitLineClamp = el.lines;
           contentStyle.WebkitBoxOrient = 'vertical';
           contentStyle.overflow = 'hidden';
        }

        return (
          <div 
            key={el.originalId}
            className={`rendered-element role-${el.role}`}
            style={style}
            onClick={() => onElementClick?.(el)}
            data-id={el.originalId}
            data-priority={el.priority}
            data-role={el.role}
            title={debugMode ? `${el.originalId} (${el.x},${el.y}) ${el.width}x${el.height}` : undefined}
          >
            {/* Visual mapping based on role */}
            {el.role === 'hero-image' && <div className="content-hero"></div>}
            {el.role === 'headline' && <div className="content-headline" style={contentStyle}>Adaptive Layout</div>}
            {el.role === 'cta' && <button className="content-cta">Learn More</button>}
            {el.role === 'logo' && <div className="content-logo">LOGO</div>}
            {el.role === 'body' && <div className="content-body" style={contentStyle}>Constraint-driven resolution engine.</div>}
            
            {debugMode && (
              <div className="debug-overlay">
                <span className="debug-id">{el.originalId}</span>
                <span className="debug-geom">{Math.round(el.width)}×{Math.round(el.height)} @ {Math.round(el.x)},{Math.round(el.y)}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
