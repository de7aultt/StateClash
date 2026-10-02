import type { SkinId } from '../core/types';
import { FULL_TURN, traceCircle } from './shape-paths';

type Outline = ReadonlyArray<readonly [number, number]>;

const CORE_COLOR = '#ffffff';

interface SkinPose {
  x: number;
  y: number;
  directionX: number;
  directionY: number;
  radius: number;
  color: string;
  time: number;
}

function traceOriented(context: CanvasRenderingContext2D, pose: SkinPose, outline: Outline, scale: number, shift = 0): void {
  context.beginPath();
  outline.forEach(([forward, side], index) => {
    const along = forward * scale + shift;
    const across = side * scale;
    const pointX = pose.x + pose.directionX * along - pose.directionY * across;
    const pointY = pose.y + pose.directionY * along + pose.directionX * across;
    if (index === 0) context.moveTo(pointX, pointY);
    else context.lineTo(pointX, pointY);
  });
  context.closePath();
}

function drawVanguard(context: CanvasRenderingContext2D, pose: SkinPose): void {
  for (let puff = 1; puff <= 3; puff++) {
    context.globalAlpha = 0.5 / puff;
    traceCircle(
      context,
      pose.x - pose.directionX * pose.radius * (1.2 + puff * 1.4),
      pose.y - pose.directionY * pose.radius * (1.2 + puff * 1.4),
      pose.radius * (0.8 - puff * 0.17),
    );
    context.fill();
  }
  context.globalAlpha = 1;
  traceOriented(context, pose, [[2.4, 0], [-1.68, 1.5], [-0.6, 0], [-1.68, -1.5]], pose.radius);
  context.fill();
  context.fillStyle = CORE_COLOR;
  traceCircle(context, pose.x, pose.y, pose.radius * 0.35);
  context.fill();
}

function drawDrone(context: CanvasRenderingContext2D, pose: SkinPose): void {
  const heading = Math.atan2(pose.directionY, pose.directionX) + Math.PI / 4;
  context.strokeStyle = pose.color;
  context.lineWidth = pose.radius * 0.35;
  for (let arm = 0; arm < 4; arm++) {
    const angle = heading + (arm * FULL_TURN) / 4;
    const tipX = pose.x + Math.cos(angle) * pose.radius * 1.7;
    const tipY = pose.y + Math.sin(angle) * pose.radius * 1.7;
    context.beginPath();
    context.moveTo(pose.x, pose.y);
    context.lineTo(tipX, tipY);
    context.stroke();
    const spin = pose.time * 22 + arm;
    context.globalAlpha = 0.55;
    context.beginPath();
    context.moveTo(tipX - Math.cos(spin) * pose.radius * 0.8, tipY - Math.sin(spin) * pose.radius * 0.8);
    context.lineTo(tipX + Math.cos(spin) * pose.radius * 0.8, tipY + Math.sin(spin) * pose.radius * 0.8);
    context.stroke();
    context.globalAlpha = 1;
  }
  traceCircle(context, pose.x, pose.y, pose.radius * 0.7);
  context.fill();
  context.fillStyle = CORE_COLOR;
  traceCircle(context, pose.x + pose.directionX * pose.radius * 0.25, pose.y + pose.directionY * pose.radius * 0.25, pose.radius * 0.28);
  context.fill();
}

function drawTank(context: CanvasRenderingContext2D, pose: SkinPose): void {
  context.globalAlpha = 0.55;
  traceOriented(context, pose, [[1.3, 0.95], [1.3, 1.3], [-1.3, 1.3], [-1.3, 0.95]], pose.radius);
  context.fill();
  traceOriented(context, pose, [[1.3, -0.95], [1.3, -1.3], [-1.3, -1.3], [-1.3, -0.95]], pose.radius);
  context.fill();
  context.globalAlpha = 1;
  traceOriented(context, pose, [[1.3, 0.9], [1.3, -0.9], [-1.3, -0.9], [-1.3, 0.9]], pose.radius);
  context.fill();
  context.strokeStyle = CORE_COLOR;
  context.lineWidth = pose.radius * 0.45;
  context.beginPath();
  context.moveTo(pose.x, pose.y);
  context.lineTo(pose.x + pose.directionX * pose.radius * 2.2, pose.y + pose.directionY * pose.radius * 2.2);
  context.stroke();
  context.fillStyle = CORE_COLOR;
  traceCircle(context, pose.x, pose.y, pose.radius * 0.55);
  context.fill();
}

function drawPhantom(context: CanvasRenderingContext2D, pose: SkinPose): void {
  const outline: Outline = [[2.6, 0], [0, 0.9], [-1.6, 0], [0, -0.9]];
  for (let echo = 2; echo >= 1; echo--) {
    context.globalAlpha = 0.3 / echo;
    traceOriented(context, pose, outline, pose.radius, -echo * pose.radius * 2.2);
    context.fill();
  }
  context.globalAlpha = 0.85;
  traceOriented(context, pose, outline, pose.radius);
  context.fill();
  context.globalAlpha = 1;
  context.fillStyle = CORE_COLOR;
  traceCircle(context, pose.x + pose.directionX * pose.radius * 0.4, pose.y + pose.directionY * pose.radius * 0.4, pose.radius * 0.3);
  context.fill();
}

export function drawSkinShape(context: CanvasRenderingContext2D, skin: SkinId, pose: SkinPose): void {
  context.fillStyle = pose.color;
  if (skin === 'drones') drawDrone(context, pose);
  else if (skin === 'tanks') drawTank(context, pose);
  else if (skin === 'phantoms') drawPhantom(context, pose);
  else drawVanguard(context, pose);
}

export type { SkinPose };
