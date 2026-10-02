import type { ArenaId } from '../core/types';
import { BIOMES, type Biome } from './biomes';
import type { Viewport } from './viewport';

interface Hill {
  rx: number;
  ry: number;
  reach: number;
  rings: number;
  phaseA: number;
  phaseB: number;
}

const HILLS: readonly Hill[] = [
  { rx: 0.2, ry: 0.3, reach: 0.34, rings: 9, phaseA: 0.4, phaseB: 1.9 },
  { rx: 0.78, ry: 0.22, reach: 0.3, rings: 8, phaseA: 2.1, phaseB: 0.7 },
  { rx: 0.55, ry: 0.72, reach: 0.38, rings: 10, phaseA: 4.2, phaseB: 3.1 },
  { rx: 0.1, ry: 0.85, reach: 0.24, rings: 6, phaseA: 5.3, phaseB: 2.4 },
  { rx: 0.92, ry: 0.8, reach: 0.26, rings: 7, phaseA: 1.3, phaseB: 5.6 },
];

const CONTOUR_STEPS = 96;
const FULL_TURN = Math.PI * 2;
const VIGNETTE_STRENGTH = 0.62;

let cachedLayer: HTMLCanvasElement | null = null;
let cachedKey = '';

function traceContour(context: CanvasRenderingContext2D, hill: Hill, ring: number, width: number, height: number): void {
  const scale = Math.min(width, height);
  const radius = (scale * hill.reach * (ring + 1)) / hill.rings;
  context.beginPath();
  for (let step = 0; step <= CONTOUR_STEPS; step++) {
    const angle = (step / CONTOUR_STEPS) * FULL_TURN;
    const wobble = 1 + 0.1 * Math.sin(2 * angle + hill.phaseA + ring * 0.3) + 0.06 * Math.sin(3 * angle + hill.phaseB);
    const x = width * hill.rx + Math.cos(angle) * radius * wobble;
    const y = height * hill.ry + Math.sin(angle) * radius * wobble * 0.85;
    if (step === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  }
  context.closePath();
}

function paintContours(context: CanvasRenderingContext2D, biome: Biome, width: number, height: number): void {
  for (const hill of HILLS) {
    for (let ring = 0; ring < hill.rings; ring++) {
      const opacity = 0.04 + 0.1 * (1 - ring / hill.rings);
      context.strokeStyle = `rgba(${biome.contourRgb}, ${opacity})`;
      context.lineWidth = ring % 4 === 3 ? 1.6 : 1;
      traceContour(context, hill, ring, width, height);
      context.stroke();
    }
  }
}

function paintVignette(context: CanvasRenderingContext2D, width: number, height: number): void {
  const reach = Math.hypot(width, height) / 2;
  const vignette = context.createRadialGradient(width / 2, height / 2, Math.min(width, height) * 0.3, width / 2, height / 2, reach);
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vignette.addColorStop(1, `rgba(0, 0, 0, ${VIGNETTE_STRENGTH})`);
  context.fillStyle = vignette;
  context.fillRect(0, 0, width, height);
}

function buildLayer(biome: Biome, width: number, height: number, ratio: number): HTMLCanvasElement {
  const layer = document.createElement('canvas');
  layer.width = Math.max(1, Math.ceil(width * ratio));
  layer.height = Math.max(1, Math.ceil(height * ratio));
  const context = layer.getContext('2d');
  if (!context) return layer;
  context.scale(ratio, ratio);
  const base = context.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.hypot(width, height) / 2);
  base.addColorStop(0, biome.backgroundCenter);
  base.addColorStop(1, biome.backgroundEdge);
  context.fillStyle = base;
  context.fillRect(0, 0, width, height);
  paintContours(context, biome, width, height);
  paintVignette(context, width, height);
  return layer;
}

export function drawBackground(viewport: Viewport, arena: ArenaId): void {
  const key = `${arena}:${viewport.width}x${viewport.height}@${viewport.ratio}`;
  if (!cachedLayer || key !== cachedKey) {
    cachedLayer = buildLayer(BIOMES[arena], viewport.width, viewport.height, viewport.ratio);
    cachedKey = key;
  }
  viewport.context.drawImage(cachedLayer, 0, 0, viewport.width, viewport.height);
}
