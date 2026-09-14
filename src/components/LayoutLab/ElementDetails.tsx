import React from 'react';
import type { ResolvedElement } from '../../core/types';
import './ElementDetails.css';

interface ElementDetailsProps {
  element: ResolvedElement;
  onClose: () => void;
}

export const ElementDetails: React.FC<ElementDetailsProps> = ({ element, onClose }) => {
  return (
    <div className="element-details-panel">
      <div className="element-header">
        <h3>INSPECT: {element.originalId}</h3>
        <button className="close-btn" onClick={onClose} aria-label={`Close details for ${element.originalId}`}>✕</button>
      </div>
      
      <div className="element-props">
        <div className="prop-row">
          <span className="prop-label">ROLE</span>
          <span className="prop-value">{element.role}</span>
        </div>
        <div className="prop-row">
          <span className="prop-label">PRIORITY</span>
          <span className="prop-value">{element.priority}</span>
        </div>
        <div className="prop-row">
          <span className="prop-label">STATE</span>
          <span className={`prop-value ${element.hidden ? 'state-hidden' : 'state-visible'}`}>
            {element.hidden ? 'Hidden' : 'Visible'}
          </span>
        </div>
        
        <div className="prop-row">
          <span className="prop-label">X, Y</span>
          <span className="prop-value">{Math.round(element.x)}, {Math.round(element.y)}</span>
        </div>
        
        <div className="prop-row">
          <span className="prop-label">W × H</span>
          <span className="prop-value">{Math.round(element.width)} × {Math.round(element.height)}</span>
        </div>
      </div>
      
      {element.degradationsApplied.length > 0 && (
        <div className="element-degradations">
          <h4>DEGRADATIONS APPLIED</h4>
          <div className="degradation-tags">
            {element.degradationsApplied.map((deg, i) => (
              <span key={i} className={`tag tag-${deg.toLowerCase()}`}>{deg}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
