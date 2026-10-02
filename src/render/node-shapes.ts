import type { NodeEntity } from '../core/types';
import type { FactionPalette } from './palette';
import { traceCircle, traceGear, tracePolygon } from './shape-paths';

const GLOW_BLUR = 16;
const DARK_FILL = '#0d141f';
const SMOKE_COLOR = '#9aa8bd';
const GEAR_TEETH = 10;
const SQUARE_CORNERS: ReadonlyArray<readonly [number, number]> = [
  [-1, -1],
  [1, -1],
  [1, 1],
  [-1, 1],
];

function applyBodyStyle(context: CanvasRenderingContext2D, palette: FactionPalette, lineWidth: number): void {
  context.shadowColor = palette.glow;
  context.shadowBlur = GLOW_BLUR;
  context.fillStyle = palette.fill;
  context.strokeStyle = palette.stroke;
  context.lineWidth = lineWidth;
}

function drawBattlements(context: CanvasRenderingContext2D, node: NodeEntity, half: number, palette: FactionPalette): void {
  const merlonWidth = node.radius * 0.17;
  const merlonHeight = node.radius * 0.15;
  context.fillStyle = palette.stroke;
  for (let side = 0; side < 4; side++) {
    context.save();
    context.translate(node.x, node.y);
    context.rotate((side * Math.PI) / 2);
    for (const slot of [-1, 0, 1]) {
      context.fillRect(slot * half * 0.55 - merlonWidth / 2, -half - merlonHeight, merlonWidth, merlonHeight);
    }
    context.restore();
  }
}

function drawCoreGlow(context: CanvasRenderingContext2D, node: NodeEntity, palette: FactionPalette, reach: number): void {
  const core = context.createRadialGradient(node.x, node.y, 0, node.x, node.y, reach);
  core.addColorStop(0, `rgba(${palette.rgb}, 0.75)`);
  core.addColorStop(1, `rgba(${palette.rgb}, 0)`);
  context.fillStyle = core;
  traceCircle(context, node.x, node.y, reach);
  context.fill();
}

export function drawCity(context: CanvasRenderingContext2D, node: NodeEntity, palette: FactionPalette): void {
  const half = node.radius * 0.72;
  context.save();
  applyBodyStyle(context, palette, 3);
  context.beginPath();
  context.rect(node.x - half, node.y - half, half * 2, half * 2);
  context.fill();
  context.stroke();
  context.restore();

  drawBattlements(context, node, half, palette);
  context.strokeStyle = palette.glow;
  context.lineWidth = 2;
  context.strokeRect(node.x - half * 0.7, node.y - half * 0.7, half * 1.4, half * 1.4);
  drawCoreGlow(context, node, palette, node.radius * 0.7);

  for (const [signX, signY] of SQUARE_CORNERS) {
    traceCircle(context, node.x + signX * half, node.y + signY * half, node.radius * 0.2);
    context.fillStyle = palette.fill;
    context.fill();
    context.strokeStyle = palette.stroke;
    context.lineWidth = 2.5;
    context.stroke();
  }
}

function drawSmokestack(
  context: CanvasRenderingContext2D,
  node: NodeEntity,
  palette: FactionPalette,
  direction: number,
  time: number,
): void {
  const width = node.radius * 0.24;
  const height = node.radius * 0.55;
  const stackX = node.x + direction * node.radius * 0.5;
  const topY = node.y - node.radius * 0.7 - height;
  context.fillStyle = palette.fill;
  context.strokeStyle = palette.stroke;
  context.lineWidth = 2;
  context.fillRect(stackX - width / 2, topY, width, height);
  context.strokeRect(stackX - width / 2, topY, width, height);
  for (let puff = 0; puff < 2; puff++) {
    const phase = (time * 0.6 + puff * 0.5 + (direction > 0 ? 0.25 : 0)) % 1;
    context.globalAlpha = (1 - phase) * 0.35;
    context.fillStyle = SMOKE_COLOR;
    traceCircle(context, stackX + Math.sin(phase * 6 + direction) * 3, topY - phase * node.radius * 0.9, 2 + phase * 4);
    context.fill();
  }
  context.globalAlpha = 1;
}

export function drawForge(context: CanvasRenderingContext2D, node: NodeEntity, palette: FactionPalette, time: number): void {
  context.save();
  applyBodyStyle(context, palette, 2.5);
  traceGear(context, node.x, node.y, node.radius, node.radius * 0.8, GEAR_TEETH, time * 0.35);
  context.fill();
  context.stroke();
  context.restore();

  context.fillStyle = DARK_FILL;
  context.strokeStyle = palette.glow;
  context.lineWidth = 2;
  traceCircle(context, node.x, node.y, node.radius * 0.68);
  context.fill();
  context.stroke();

  drawSmokestack(context, node, palette, -1, time);
  drawSmokestack(context, node, palette, 1, time);
  drawCoreGlow(context, node, palette, node.radius * (0.62 + 0.08 * Math.sin(time * 3.2)));
}

export function drawTower(context: CanvasRenderingContext2D, node: NodeEntity, palette: FactionPalette, aimAngle: number): void {
  context.save();
  applyBodyStyle(context, palette, 3);
  tracePolygon(context, node.x, node.y, node.radius, 8, Math.PI / 8);
  context.fill();
  context.stroke();
  context.restore();

  context.fillStyle = DARK_FILL;
  context.strokeStyle = palette.glow;
  context.lineWidth = 2;
  tracePolygon(context, node.x, node.y, node.radius * 0.72, 8, Math.PI / 8);
  context.fill();
  context.stroke();

  context.save();
  context.translate(node.x, node.y);
  context.rotate(aimAngle);
  context.fillStyle = palette.stroke;
  for (const side of [-1, 1]) {
    context.fillRect(node.radius * 0.1, side * node.radius * 0.15 - node.radius * 0.06, node.radius, node.radius * 0.12);
  }
  traceCircle(context, 0, 0, node.radius * 0.34);
  context.fillStyle = palette.fill;
  context.fill();
  context.strokeStyle = palette.stroke;
  context.lineWidth = 2.5;
  context.stroke();
  context.restore();
}
