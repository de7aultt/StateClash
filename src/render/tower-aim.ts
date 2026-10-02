import type { NodeEntity, TroopUnit } from '../core/types';

const IDLE_ANGLE = -Math.PI / 2;
const TURN_RATE = 0.2;

function angleTo(from: NodeEntity, x: number, y: number): number {
  return Math.atan2(y - from.y, x - from.x);
}

export class TowerAim {
  private readonly angles = new Map<number, number>();

  angleFor(tower: NodeEntity, nodes: readonly NodeEntity[], troops: readonly TroopUnit[]): number {
    const current = this.angles.get(tower.id) ?? IDLE_ANGLE;
    const desired = this.findDesiredAngle(tower, nodes, troops) ?? current;
    const difference = Math.atan2(Math.sin(desired - current), Math.cos(desired - current));
    const next = current + difference * TURN_RATE;
    this.angles.set(tower.id, next);
    return next;
  }

  private findDesiredAngle(tower: NodeEntity, nodes: readonly NodeEntity[], troops: readonly TroopUnit[]): number | null {
    if (tower.faction === 'neutral') return null;
    let nearestTroop: TroopUnit | null = null;
    let nearestDistance = tower.towerRange;
    for (const troop of troops) {
      const distance = Math.hypot(troop.x - tower.x, troop.y - tower.y);
      if (troop.faction === tower.faction || distance > nearestDistance) continue;
      nearestTroop = troop;
      nearestDistance = distance;
    }
    if (nearestTroop) return angleTo(tower, nearestTroop.x, nearestTroop.y);

    let nearestBase: NodeEntity | null = null;
    let baseDistance = Infinity;
    for (const node of nodes) {
      const distance = Math.hypot(node.x - tower.x, node.y - tower.y);
      if (node.faction === tower.faction || node.faction === 'neutral' || distance >= baseDistance) continue;
      nearestBase = node;
      baseDistance = distance;
    }
    return nearestBase ? angleTo(tower, nearestBase.x, nearestBase.y) : null;
  }
}
