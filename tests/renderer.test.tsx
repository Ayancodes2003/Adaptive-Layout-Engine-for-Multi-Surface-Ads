// @vitest-environment happy-dom
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { DOMRenderer } from '../src/renderer/DOMRenderer';
import type { ResolvedLayout, CandidateLayout } from '../src/core/types';

describe('DOMRenderer Integration', () => {
  it('renders a resolved layout correctly', () => {
    const mockCandidate: CandidateLayout = {
      id: 'c1',
      type: 'vertical-stack',
      score: 100,
      isValid: true,
      violations: [],
      diagnostics: [],
      elements: [
        {
          originalId: 'hero',
          role: 'hero-image',
          x: 0,
          y: 0,
          width: 300,
          height: 200,
          priority: 1,
          hidden: false,
          degradationsApplied: []
        }
      ]
    };

    const mockLayout: ResolvedLayout = {
      surfaceId: 'test',
      adId: 'test-ad',
      isSatisfiable: true,
      bestCandidate: mockCandidate,
      failedAttempts: [],
      alternativesEvaluated: 1,
      computationTimeMs: 10,
      diagnostics: []
    };

    const { container } = render(<DOMRenderer layout={mockLayout} debugMode={false} />);
    
    const elements = container.querySelectorAll('.rendered-element');
    expect(elements).toHaveLength(1);
    
    const heroEl = elements[0] as HTMLElement;
    expect(heroEl.style.left).toBe('0px');
    expect(heroEl.style.top).toBe('0px');
    expect(heroEl.style.width).toBe('300px');
    expect(heroEl.style.height).toBe('200px');
  });

  it('renders an error state when unsatisfiable', () => {
    const mockLayout: ResolvedLayout = {
      surfaceId: 'test',
      adId: 'test-ad',
      isSatisfiable: false,
      failedAttempts: [
        {
          id: 'c1',
          type: 'vertical-stack',
          score: 0,
          isValid: false,
          violations: ['Out of bounds'],
          diagnostics: [],
          elements: []
        }
      ],
      alternativesEvaluated: 1,
      computationTimeMs: 10,
      diagnostics: []
    };

    const { getByText } = render(<DOMRenderer layout={mockLayout} />);
    expect(getByText('CONSTRAINTS UNSATISFIABLE')).toBeDefined();
    expect(getByText('⚠️ Out of bounds')).toBeDefined();
  });
});
