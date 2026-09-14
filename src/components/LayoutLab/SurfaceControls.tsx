import React from 'react';
import type { SurfaceProfile } from '../../core/types';
import './SurfaceControls.css';

interface SurfaceControlsProps {
  profile: SurfaceProfile;
  onChange: (profile: SurfaceProfile) => void;
  preset: string;
  onPresetChange: (preset: string) => void;
}

export const PRESETS: Record<string, SurfaceProfile> = {
  'Mobile Portrait': {
    id: 'mobile-portrait',
    width: 375,
    height: 812,
    safeArea: { top: 44, right: 16, bottom: 34, left: 16 },
    minTapTarget: 44,
    minTextSize: 14,
    viewingDistance: 'near',
    interactionModel: 'touch'
  },
  'Mobile Landscape': {
    id: 'mobile-landscape',
    width: 812,
    height: 375,
    safeArea: { top: 16, right: 44, bottom: 21, left: 44 },
    minTapTarget: 44,
    minTextSize: 14,
    viewingDistance: 'near',
    interactionModel: 'touch'
  },
  'Broadcast Lower Third': {
    id: 'broadcast-lower-third',
    width: 1920,
    height: 250,
    safeArea: { top: 20, right: 100, bottom: 40, left: 100 },
    minTapTarget: 0,
    minTextSize: 24,
    viewingDistance: 'far',
    interactionModel: 'none'
  },
  'Square Kiosk': {
    id: 'square-kiosk',
    width: 1080,
    height: 1080,
    safeArea: { top: 60, right: 60, bottom: 120, left: 60 },
    minTapTarget: 60,
    minTextSize: 18,
    viewingDistance: 'near',
    interactionModel: 'touch'
  }
};

export const SurfaceControls: React.FC<SurfaceControlsProps> = ({
  profile,
  onChange,
  preset,
  onPresetChange
}) => {
  const isCustom = preset === 'Custom';

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>, field: string, isSafeArea = false) => {
    if (!isCustom) onPresetChange('Custom');
    const val = parseInt(e.target.value, 10);
    
    if (isSafeArea) {
      onChange({
        ...profile,
        safeArea: {
          ...profile.safeArea,
          [field]: val
        }
      });
    } else {
      onChange({
        ...profile,
        [field]: val
      });
    }
  };

  return (
    <div className="surface-controls" role="region" aria-label="Surface Profile Controls">
      <h3 id="surface-presets-label">Surface Presets</h3>
      <div className="preset-buttons" role="group" aria-labelledby="surface-presets-label">
        {Object.keys(PRESETS).map(key => (
          <button 
            key={key} 
            className={`preset-btn ${preset === key ? 'active' : ''}`}
            onClick={() => {
              onPresetChange(key);
              onChange(PRESETS[key]);
            }}
            aria-pressed={preset === key}
          >
            {key}
          </button>
        ))}
        <button 
          className={`preset-btn custom-btn ${isCustom ? 'active' : ''}`}
          onClick={() => onPresetChange('Custom')}
          aria-pressed={isCustom}
        >
          Custom / Stress Test
        </button>
      </div>

      <div className={`custom-controls ${isCustom ? 'expanded' : ''}`} aria-hidden={!isCustom}>
        <h4>Constraint Stress Test</h4>
        <p className="custom-surface-disclaimer">
          <strong>New surface. Same resolver. No surface-specific code.</strong>
          <br />
          Adjust the sliders to constrain the available geometry. Watch the engine automatically re-measure text, wrap, truncate, and hide content.
        </p>
        
        <div className="control-group">
          <label htmlFor="width-slider">Width: {profile.width}px</label>
          <input id="width-slider" type="range" min="200" max="2500" value={profile.width} onChange={e => handleSliderChange(e, 'width')} aria-valuemin={200} aria-valuemax={2500} aria-valuenow={profile.width} />
        </div>
        
        <div className="control-group">
          <label htmlFor="height-slider">Height: {profile.height}px</label>
          <input id="height-slider" type="range" min="150" max="2000" value={profile.height} onChange={e => handleSliderChange(e, 'height')} aria-valuemin={150} aria-valuemax={2000} aria-valuenow={profile.height} />
        </div>

        <div className="control-group">
          <label htmlFor="sa-top">Safe Area Top: {profile.safeArea.top}px</label>
          <input id="sa-top" type="range" min="0" max="200" value={profile.safeArea.top} onChange={e => handleSliderChange(e, 'top', true)} />
        </div>
        
        <div className="control-group">
          <label htmlFor="sa-bottom">Safe Area Bottom: {profile.safeArea.bottom}px</label>
          <input id="sa-bottom" type="range" min="0" max="200" value={profile.safeArea.bottom} onChange={e => handleSliderChange(e, 'bottom', true)} />
        </div>

        <div className="control-group">
          <label htmlFor="sa-left">Safe Area Left: {profile.safeArea.left}px</label>
          <input id="sa-left" type="range" min="0" max="200" value={profile.safeArea.left} onChange={e => handleSliderChange(e, 'left', true)} />
        </div>

        <div className="control-group">
          <label htmlFor="sa-right">Safe Area Right: {profile.safeArea.right}px</label>
          <input id="sa-right" type="range" min="0" max="200" value={profile.safeArea.right} onChange={e => handleSliderChange(e, 'right', true)} />
        </div>
        
        <div className="control-group">
          <label htmlFor="min-tap">Min Tap Target: {profile.minTapTarget}px</label>
          <input id="min-tap" type="range" min="0" max="100" value={profile.minTapTarget} onChange={e => handleSliderChange(e, 'minTapTarget')} />
        </div>
        
        <div className="control-group">
          <label htmlFor="min-text">Min Text Size: {profile.minTextSize}px</label>
          <input id="min-text" type="range" min="8" max="32" value={profile.minTextSize} onChange={e => handleSliderChange(e, 'minTextSize')} />
        </div>
      </div>
    </div>
  );
};
