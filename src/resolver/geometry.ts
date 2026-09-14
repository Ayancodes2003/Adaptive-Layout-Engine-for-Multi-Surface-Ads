import type { SurfaceProfile, ResolvedElement } from '../core/types';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function getSafeBounds(surface: SurfaceProfile): Rect {
  return {
    x: surface.safeArea.left,
    y: surface.safeArea.top,
    width: Math.max(0, surface.width - surface.safeArea.left - surface.safeArea.right),
    height: Math.max(0, surface.height - surface.safeArea.top - surface.safeArea.bottom),
  };
}

export function contains(outer: Rect, inner: Rect): boolean {
  return (
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    inner.x + inner.width <= outer.x + outer.width &&
    inner.y + inner.height <= outer.y + outer.height
  );
}

export function overlaps(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export function hasAnyOverlap(elements: ResolvedElement[]): boolean {
  for (let i = 0; i < elements.length; i++) {
    for (let j = i + 1; j < elements.length; j++) {
      if (overlaps(elements[i], elements[j])) {
        return true;
      }
    }
  }
  return false;
}
