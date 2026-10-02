import type { DragState, NodeEntity, Vec2 } from '../core/types';
import type { NodeSystem } from '../game/node-system';
import { marchOffset } from './march';
import { FACTION_PALETTES } from './palette';

const CHAIN_COLOR = FACTION_PALETTES.player.stroke;
const CHAIN_GLOW = FACTION_PALETTES.player.glow;
const RETICLE_COLOR = '#ffd24a';
const RETICLE_GAP = 12;
const RETICLE_TICK = 9;
const ARROW_LENGTH = 14;
const ARROW_SPREAD = 0.45;
const AIM_MIN_DISTANCE = 16;
const FULL_TURN = Math.PI * 2;
const MARCH_DASH = [10, 8];
const MARCH_SPEED = 60;

function isDefined(node: NodeEntity | undefined): node is NodeEntity {
  return node !== undefined;
}

function drawChainLinks(context: CanvasRenderingContext2D, chain: readonly NodeEntity[]): void {
  if (chain.length < 2) return;
  context.beginPath();
  chain.forEach((node, index) => {
    if (index === 0) context.moveTo(node.x, node.y);
    else context.lineTo(node.x, node.y);
  });
  context.lineWidth = 3;
  context.setLineDash(MARCH_DASH);
  context.lineDashOffset = marchOffset(MARCH_SPEED);
  context.stroke();
  context.setLineDash([]);
}

function drawArrowHead(context: CanvasRenderingContext2D, tip: Vec2, angle: number): void {
  context.beginPath();
  context.moveTo(tip.x - Math.cos(angle - ARROW_SPREAD) * ARROW_LENGTH, tip.y - Math.sin(angle - ARROW_SPREAD) * ARROW_LENGTH);
  context.lineTo(tip.x, tip.y);
  context.lineTo(tip.x - Math.cos(angle + ARROW_SPREAD) * ARROW_LENGTH, tip.y - Math.sin(angle + ARROW_SPREAD) * ARROW_LENGTH);
  context.stroke();
}

function drawAimLine(context: CanvasRenderingContext2D, source: NodeEntity, aim: Vec2, aimRadius: number): void {
  const distance = Math.hypot(aim.x - source.x, aim.y - source.y);
  if (distance < source.radius + aimRadius + AIM_MIN_DISTANCE) return;
  const angle = Math.atan2(aim.y - source.y, aim.x - source.x);
  const start = { x: source.x + Math.cos(angle) * source.radius, y: source.y + Math.sin(angle) * source.radius };
  const tip = { x: aim.x - Math.cos(angle) * aimRadius, y: aim.y - Math.sin(angle) * aimRadius };
  context.beginPath();
  context.moveTo(start.x, start.y);
  context.lineTo(tip.x, tip.y);
  context.lineWidth = 2.5;
  context.setLineDash(MARCH_DASH);
  context.lineDashOffset = marchOffset(MARCH_SPEED);
  context.stroke();
  context.setLineDash([]);
  drawArrowHead(context, tip, angle);
}

function drawReticle(context: CanvasRenderingContext2D, target: NodeEntity): void {
  const ringRadius = target.radius + RETICLE_GAP;
  context.save();
  context.strokeStyle = RETICLE_COLOR;
  context.shadowColor = RETICLE_COLOR;
  context.lineWidth = 2;
  context.beginPath();
  context.arc(target.x, target.y, ringRadius, 0, FULL_TURN);
  context.stroke();
  for (let tick = 0; tick < 4; tick++) {
    const angle = (tick * FULL_TURN) / 4;
    context.beginPath();
    context.moveTo(target.x + Math.cos(angle) * (ringRadius - RETICLE_TICK / 2), target.y + Math.sin(angle) * (ringRadius - RETICLE_TICK / 2));
    context.lineTo(target.x + Math.cos(angle) * (ringRadius + RETICLE_TICK / 2), target.y + Math.sin(angle) * (ringRadius + RETICLE_TICK / 2));
    context.stroke();
  }
  context.restore();
}

export function renderTrajectory(context: CanvasRenderingContext2D, nodes: NodeSystem, drag: DragState | null): void {
  if (!drag) return;
  const chain = drag.chainIds.map((nodeId) => nodes.getById(nodeId)).filter(isDefined);
  const target = drag.targetId === null ? undefined : nodes.getById(drag.targetId);
  const aim: Vec2 = target ?? { x: drag.pointerX, y: drag.pointerY };
  const aimRadius = target ? target.radius + RETICLE_GAP : 0;

  context.save();
  context.strokeStyle = CHAIN_COLOR;
  context.shadowColor = CHAIN_GLOW;
  context.shadowBlur = 14;
  context.lineJoin = 'round';
  context.lineCap = 'round';
  drawChainLinks(context, chain);
  for (const source of chain) drawAimLine(context, source, aim, aimRadius);
  context.restore();

  if (target) drawReticle(context, target);
}
