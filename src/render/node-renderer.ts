import type { NodeEntity, TroopUnit } from '../core/types';
import { drawCity, drawForge, drawTower } from './node-shapes';
import { FACTION_PALETTES, type FactionPalette } from './palette';
import { FULL_TURN, TOP_ANGLE, traceCircle, traceStar } from './shape-paths';
import { TowerAim } from './tower-aim';

const towerAim = new TowerAim();

const PROGRESS_RING_GAP = 7;
const SELECTION_RING_GAP = 14;
const STAR_OUTER = 6;
const STAR_INNER = 2.6;
const STAR_SPACING = 15;
const STAR_OFFSET = 21;
const TIER_COUNT = 3;
const EMPTY_STAR_COLOR = '#243247';
const BADGE_FILL = '#05080e';
const TEXT_COLOR = '#ffffff';
const SELECTION_COLOR = '#ffffff';

function badgeCenter(node: NodeEntity): { x: number; y: number; radius: number } {
  if (node.type === 'tower') return { x: node.x + node.radius * 0.78, y: node.y + node.radius * 0.78, radius: 11 };
  return { x: node.x, y: node.y, radius: node.radius * 0.4 };
}

function drawBadge(context: CanvasRenderingContext2D, node: NodeEntity, palette: FactionPalette): void {
  const badge = badgeCenter(node);
  traceCircle(context, badge.x, badge.y, badge.radius);
  context.fillStyle = BADGE_FILL;
  context.fill();
  context.strokeStyle = palette.stroke;
  context.lineWidth = 2;
  context.stroke();
  context.fillStyle = TEXT_COLOR;
  context.font = `800 ${Math.round(badge.radius * 1.05)}px 'Segoe UI', system-ui, sans-serif`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(String(Math.floor(node.troops)), badge.x, badge.y + 1);
}

function drawProgressRing(context: CanvasRenderingContext2D, node: NodeEntity, palette: FactionPalette): void {
  if (node.faction === 'neutral') return;
  const ratio = Math.min(1, node.troops / node.capacity);
  context.save();
  context.strokeStyle = palette.stroke;
  context.globalAlpha = 0.85;
  context.lineWidth = 2.5;
  context.beginPath();
  context.arc(node.x, node.y, node.radius + PROGRESS_RING_GAP, TOP_ANGLE, TOP_ANGLE + ratio * FULL_TURN);
  context.stroke();
  context.restore();
}

function drawTierStars(context: CanvasRenderingContext2D, node: NodeEntity, palette: FactionPalette): void {
  const baseY = node.y + node.radius + STAR_OFFSET;
  const startX = node.x - ((TIER_COUNT - 1) * STAR_SPACING) / 2;
  for (let star = 0; star < TIER_COUNT; star++) {
    const earned = star < node.tier;
    context.save();
    if (earned) {
      context.shadowColor = palette.stroke;
      context.shadowBlur = 8;
    }
    traceStar(context, startX + star * STAR_SPACING, baseY, STAR_OUTER, STAR_INNER);
    context.fillStyle = earned ? palette.stroke : EMPTY_STAR_COLOR;
    context.fill();
    context.restore();
  }
}

function drawSelection(context: CanvasRenderingContext2D, node: NodeEntity): void {
  context.save();
  context.strokeStyle = SELECTION_COLOR;
  context.lineWidth = 1.5;
  context.setLineDash([6, 5]);
  traceCircle(context, node.x, node.y, node.radius + SELECTION_RING_GAP);
  context.stroke();
  if (node.type === 'tower') {
    context.globalAlpha = 0.35;
    context.setLineDash([3, 6]);
    traceCircle(context, node.x, node.y, node.towerRange);
    context.stroke();
  }
  context.restore();
}

function drawBody(
  context: CanvasRenderingContext2D,
  node: NodeEntity,
  palette: FactionPalette,
  time: number,
  nodes: readonly NodeEntity[],
  troops: readonly TroopUnit[],
): void {
  if (node.type === 'city') drawCity(context, node, palette);
  else if (node.type === 'forge') drawForge(context, node, palette, time);
  else drawTower(context, node, palette, towerAim.angleFor(node, nodes, troops));
}

export function renderNodes(
  context: CanvasRenderingContext2D,
  nodes: readonly NodeEntity[],
  selectedNodeId: number | null,
  troops: readonly TroopUnit[],
): void {
  const time = performance.now() / 1000;
  for (const node of nodes) {
    const palette = FACTION_PALETTES[node.faction];
    drawBody(context, node, palette, time, nodes, troops);
    drawProgressRing(context, node, palette);
    drawBadge(context, node, palette);
    drawTierStars(context, node, palette);
    if (node.id === selectedNodeId) drawSelection(context, node);
  }
}
