import type { Vec2 } from '../core/types';

export interface VoronoiSite {
  id: number;
  x: number;
  y: number;
}

function clipHalfPlane(polygon: readonly Vec2[], normalX: number, normalY: number, offset: number): Vec2[] {
  const clipped: Vec2[] = [];
  for (let index = 0; index < polygon.length; index++) {
    const current = polygon[index];
    const previous = polygon[(index + polygon.length - 1) % polygon.length];
    const currentSide = normalX * current.x + normalY * current.y - offset;
    const previousSide = normalX * previous.x + normalY * previous.y - offset;
    if (currentSide <= 0 !== previousSide <= 0) {
      const ratio = previousSide / (previousSide - currentSide);
      clipped.push({
        x: previous.x + (current.x - previous.x) * ratio,
        y: previous.y + (current.y - previous.y) * ratio,
      });
    }
    if (currentSide <= 0) clipped.push(current);
  }
  return clipped;
}

export function computeVoronoi(sites: readonly VoronoiSite[], boundary: readonly Vec2[]): Map<number, Vec2[]> {
  const cells = new Map<number, Vec2[]>();
  for (const site of sites) {
    let cell: Vec2[] = [...boundary];
    for (const other of sites) {
      if (other.id === site.id) continue;
      const normalX = other.x - site.x;
      const normalY = other.y - site.y;
      const offset = normalX * ((site.x + other.x) / 2) + normalY * ((site.y + other.y) / 2);
      cell = clipHalfPlane(cell, normalX, normalY, offset);
      if (cell.length < 3) break;
    }
    if (cell.length >= 3) cells.set(site.id, cell);
  }
  return cells;
}
