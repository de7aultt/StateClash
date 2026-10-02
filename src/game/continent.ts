import type { Vec2 } from '../core/types';

const DISC_SAMPLES = 20;
const RESAMPLE_SPACING = 14;
const FULL_TURN = Math.PI * 2;
const WOBBLE_WAVES: ReadonlyArray<readonly [number, number, number]> = [
  [3, 0.7, 0.032],
  [5, 2.1, 0.02],
  [9, 4.2, 0.012],
];

function cross(origin: Vec2, a: Vec2, b: Vec2): number {
  return (a.x - origin.x) * (b.y - origin.y) - (a.y - origin.y) * (b.x - origin.x);
}

function convexHull(points: readonly Vec2[]): Vec2[] {
  const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  const chain = (input: readonly Vec2[]): Vec2[] => {
    const result: Vec2[] = [];
    for (const point of input) {
      while (result.length >= 2 && cross(result[result.length - 2], result[result.length - 1], point) <= 0) result.pop();
      result.push(point);
    }
    result.pop();
    return result;
  };
  return [...chain(sorted), ...chain([...sorted].reverse())];
}

function resample(polygon: readonly Vec2[]): Vec2[] {
  const dense: Vec2[] = [];
  for (let index = 0; index < polygon.length; index++) {
    const start = polygon[index];
    const end = polygon[(index + 1) % polygon.length];
    const pieces = Math.max(1, Math.ceil(Math.hypot(end.x - start.x, end.y - start.y) / RESAMPLE_SPACING));
    for (let piece = 0; piece < pieces; piece++) {
      const ratio = piece / pieces;
      dense.push({ x: start.x + (end.x - start.x) * ratio, y: start.y + (end.y - start.y) * ratio });
    }
  }
  return dense;
}

function roughen(polygon: readonly Vec2[]): Vec2[] {
  const centerX = polygon.reduce((sum, point) => sum + point.x, 0) / polygon.length;
  const centerY = polygon.reduce((sum, point) => sum + point.y, 0) / polygon.length;
  return polygon.map((point) => {
    const angle = Math.atan2(point.y - centerY, point.x - centerX);
    const factor = WOBBLE_WAVES.reduce((total, [waves, phase, amplitude]) => total + amplitude * Math.sin(waves * angle + phase), 1);
    return { x: centerX + (point.x - centerX) * factor, y: centerY + (point.y - centerY) * factor };
  });
}

export function buildContinent(sites: readonly Vec2[], margin: number): Vec2[] {
  const rim: Vec2[] = [];
  for (const site of sites) {
    for (let sample = 0; sample < DISC_SAMPLES; sample++) {
      const angle = (sample / DISC_SAMPLES) * FULL_TURN;
      rim.push({ x: site.x + Math.cos(angle) * margin, y: site.y + Math.sin(angle) * margin });
    }
  }
  return roughen(resample(convexHull(rim)));
}
