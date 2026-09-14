import type { CandidateLayout } from '../core/types';

export function scoreCandidate(candidate: CandidateLayout): void {
  const base = 1000;
  
  let priorityPreservation = 0;
  let degradationCost = 0;

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  for (const el of candidate.elements) {
    if (el.hidden) {
      priorityPreservation -= (6 - el.priority) * 100; // Assuming priorities 1-5
      degradationCost -= 100;
    } else {
      if (el.x < minX) minX = el.x;
      if (el.y < minY) minY = el.y;
      if (el.x + el.width > maxX) maxX = el.x + el.width;
      if (el.y + el.height > maxY) maxY = el.y + el.height;

      // Penalize other degradations
      for (const deg of el.degradationsApplied) {
        if (deg === 'TRUNCATE') degradationCost -= 40;
        if (deg === 'SHRINK') degradationCost -= 20;
        if (deg === 'WRAP') degradationCost -= 10;
      }
    }
  }

  const spaceUtilization = (maxX > minX && maxY > minY) ? (maxX - minX) * (maxY - minY) : 0;
  // Normalize space utilization to a 0-100 bonus roughly, assuming typical 300x250 ad is 75000 area
  const utilizationBonus = Math.min(100, Math.floor(spaceUtilization / 1000));

  const total = base + priorityPreservation + degradationCost + utilizationBonus;

  candidate.detailedScore = {
    total,
    priorityPreservation,
    spaceUtilization: utilizationBonus,
    degradationCost
  };
  candidate.score = total;
}
