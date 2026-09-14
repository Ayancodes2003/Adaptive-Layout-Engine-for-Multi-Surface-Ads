import React from 'react';
import type { ResolvedLayout } from '../../core/types';
import './Inspector.css';

interface InspectorProps {
  layout: ResolvedLayout | null;
}

export const Inspector: React.FC<InspectorProps> = ({ layout }) => {
  if (!layout || !layout.bestCandidate) {
    return <div className="inspector-empty">No resolution data available.</div>;
  }

  return (
    <div className="inspector">
      <div className="inspector-section">
        <h3>"WHY THIS LAYOUT?"</h3>
        <div className="candidate-summary">
          <div className="candidate-name">Selected: {layout.bestCandidate.type}</div>
          {layout.isSatisfiable && layout.bestCandidate.detailedScore ? (
            <div className="score-breakdown">
              <div className="score-total">Score: <strong>{layout.bestCandidate.score.toFixed(1)}</strong></div>
              <ul className="score-details">
                <li>Priority Preservation: {layout.bestCandidate.detailedScore.priorityPreservation}</li>
                <li>Degradation Cost: {layout.bestCandidate.detailedScore.degradationCost}</li>
                <li>Space Utilization: {layout.bestCandidate.detailedScore.spaceUtilization}</li>
              </ul>
            </div>
          ) : (
            <div className="candidate-invalid">✕ REJECTED</div>
          )}
        </div>
      </div>

      <div className="inspector-section">
        <h3>Candidate Comparison</h3>
        <div className="candidate-comparison-list">
          {layout.failedAttempts.map(cand => (
            <div key={cand.id} className="comparison-item rejected">
              <span className="comp-name">{cand.type}</span>
              <span className="comp-status">REJECTED</span>
              <div className="comp-reason">{cand.violations[0]}</div>
            </div>
          ))}
          {layout.bestCandidate && (
             <div key={layout.bestCandidate.id} className="comparison-item selected">
               <span className="comp-name">{layout.bestCandidate.type}</span>
               <span className="comp-status">SELECTED</span>
               <div className="comp-score">Score: {layout.bestCandidate.score.toFixed(1)}</div>
             </div>
          )}
        </div>
      </div>

      <div className="inspector-section">
        <h3>Resolution Trace</h3>
        <div className="resolution-trace-pipeline">
          <div className="trace-step">
            <span className="step-label">INPUT</span>
          </div>
          <div className="trace-arrow">↓</div>
          <div className="trace-step">
            <span className="step-label">Constraints Normalized</span>
            <span className="step-detail">Surface {layout.surfaceId} processed</span>
          </div>
          <div className="trace-arrow">↓</div>
          <div className="trace-step">
            <span className="step-label">Candidates Generated</span>
            <span className="step-detail">{layout.failedAttempts.length + (layout.isSatisfiable ? 1 : 0)} strategies initialized</span>
          </div>
          <div className="trace-arrow">↓</div>
          <div className="trace-step">
            <span className="step-label">Constraints Evaluated</span>
            <span className="step-detail">Bounds, overlaps, and tap targets checked</span>
          </div>
          {layout.failedAttempts.length > 0 && (
            <>
              <div className="trace-arrow">↓</div>
              <div className="trace-step alert">
                <span className="step-label">Candidates Rejected</span>
                <span className="step-detail">{layout.failedAttempts.length} layouts failed hard constraints</span>
              </div>
            </>
          )}
          {layout.bestCandidate && layout.bestCandidate.diagnostics.filter(d => d.action !== 'GENERATE' && d.action !== 'NO_ACTION').length > 0 && (
            <>
              <div className="trace-arrow">↓</div>
              <div className="trace-step warning">
                <span className="step-label">Degradation Applied</span>
                <ul className="degradation-list">
                  {layout.bestCandidate.diagnostics
                    .filter(d => d.action !== 'GENERATE' && d.action !== 'NO_ACTION')
                    .map((diag, i) => (
                      <li key={i}>
                        {diag.elementId} &rarr; <strong>{diag.action}</strong>
                      </li>
                  ))}
                </ul>
              </div>
            </>
          )}
          <div className="trace-arrow">↓</div>
          <div className="trace-step">
            <span className="step-label">Candidates Rescored</span>
            <span className="step-detail">Priority and spatial utilization weighted</span>
          </div>
          <div className="trace-arrow">↓</div>
          <div className="trace-step success">
            <span className="step-label">FINAL LAYOUT</span>
            <span className="step-detail">
              {layout.isSatisfiable ? `Selected ${layout.bestCandidate?.type}` : 'UNSATISFIABLE'}
            </span>
          </div>
        </div>
      </div>
      
      <div className="inspector-hint">
        Click elements in the canvas to inspect their resolved state.
      </div>
    </div>
  );
};
