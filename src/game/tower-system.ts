import type { EventBus } from '../core/events';
import type { GameEventMap, NodeEntity, TroopUnit } from '../core/types';
import type { NodeSystem } from './node-system';
import type { TroopSystem } from './troop-system';
import type { PlayerModifiers } from './upgrade-system';

export const FIRE_COOLDOWN_SECONDS = 0.4;
const MISS_OFFSET_PIXELS = 16;

export class TowerSystem {
  private readonly cooldowns = new Map<number, number>();

  constructor(
    private readonly bus: EventBus<GameEventMap>,
    private readonly nodes: NodeSystem,
    private readonly troops: TroopSystem,
    private readonly modifiers: PlayerModifiers,
  ) {}

  reset(): void {
    this.cooldowns.clear();
  }

  update(stepSeconds: number): void {
    for (const tower of this.nodes.nodes) {
      if (tower.type !== 'tower' || tower.faction === 'neutral') continue;
      const remaining = (this.cooldowns.get(tower.id) ?? 0) - stepSeconds;
      this.cooldowns.set(tower.id, remaining);
      if (remaining > 0) continue;
      const victim = this.findNearestHostile(tower);
      if (!victim) continue;
      this.fire(tower, victim);
      this.cooldowns.set(tower.id, FIRE_COOLDOWN_SECONDS / this.powerOf(tower));
    }
  }

  private powerOf(tower: NodeEntity): number {
    return tower.faction === 'player' ? this.modifiers.towerMultiplier : 1;
  }

  private findNearestHostile(tower: NodeEntity): TroopUnit | undefined {
    let nearest: TroopUnit | undefined;
    let nearestDistance = tower.towerRange * this.powerOf(tower);
    for (const unit of this.troops.troops) {
      if (unit.faction === tower.faction) continue;
      const distance = Math.hypot(unit.x - tower.x, unit.y - tower.y);
      if (distance > nearestDistance) continue;
      nearest = unit;
      nearestDistance = distance;
    }
    return nearest;
  }

  private fire(tower: NodeEntity, victim: TroopUnit): void {
    const missed = Math.random() < victim.towerEvasion;
    if (!missed) this.troops.remove(victim.id);
    const aimOffset = missed ? MISS_OFFSET_PIXELS * (Math.random() < 0.5 ? -1 : 1) : 0;
    this.bus.emit('tower:fired', {
      from: { x: tower.x, y: tower.y },
      to: { x: victim.x + aimOffset, y: victim.y + aimOffset },
      faction: tower.faction,
    });
  }
}
