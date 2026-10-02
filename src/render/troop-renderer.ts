import type { SkinId, TroopUnit } from '../core/types';
import { FACTION_PALETTES } from './palette';
import { traceCircle } from './shape-paths';
import { drawSkinShape } from './troop-skins';

const HALO_ALPHA = 0.2;
const HALO_SCALE = 2.4;

export function renderTroops(context: CanvasRenderingContext2D, troops: readonly TroopUnit[], skin: SkinId): void {
  const time = performance.now() / 1000;
  context.save();
  for (const troop of troops) {
    const angle = Math.atan2(troop.targetY - troop.y, troop.targetX - troop.x);
    const color = FACTION_PALETTES[troop.faction].stroke;
    context.fillStyle = color;
    context.globalAlpha = HALO_ALPHA;
    traceCircle(context, troop.x, troop.y, troop.radius * HALO_SCALE);
    context.fill();
    context.globalAlpha = 1;
    drawSkinShape(context, skin, {
      x: troop.x,
      y: troop.y,
      directionX: Math.cos(angle),
      directionY: Math.sin(angle),
      radius: troop.radius,
      color,
      time,
    });
  }
  context.restore();
}
