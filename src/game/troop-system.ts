import type { EventBus } from '../core/events';
import type { FactionId, GameEventMap, NodeEntity, TroopUnit } from '../core/types';
import type { NodeSystem } from './node-system';
import type { PlayerModifiers } from './upgrade-system';

export const TROOP_SPEED = 130;
const TROOP_RADIUS = 4;
const LAUNCH_INTERVAL_SECONDS = 0.07;
const LANE_OFFSETS: readonly number[] = [-12, -4, 4, 12];

interface LaunchStream {
  sourceId: number;
  targetId: number;
  faction: FactionId;
  remaining: number;
  cooldown: number;
}

export class TroopSystem {
  private units: TroopUnit[] = [];
  private streams: LaunchStream[] = [];
  private nextId = 1;

  constructor(
    private readonly bus: EventBus<GameEventMap>,
    private readonly nodes: NodeSystem,
    private readonly modifiers: PlayerModifiers,
  ) {}

  get troops(): readonly TroopUnit[] {
    return this.units;
  }

  clear(): void {
    this.units = [];
    this.streams = [];
  }

  remove(troopId: number): void {
    const index = this.units.findIndex((unit) => unit.id === troopId);
    if (index >= 0) this.units.splice(index, 1);
  }

  hasForces(faction: FactionId): boolean {
    return this.units.some((unit) => unit.faction === faction) || this.streams.some((stream) => stream.faction === faction);
  }

  dispatchWave(sources: readonly NodeEntity[], target: NodeEntity): void {
    for (const source of sources) {
      if (source.id === target.id) continue;
      const count = Math.floor(source.troops);
      if (count <= 0) continue;
      source.troops -= count;
      this.streams.push({
        sourceId: source.id,
        targetId: target.id,
        faction: source.faction,
        remaining: count,
        cooldown: 0,
      });
    }
  }

  update(stepSeconds: number): void {
    this.advanceStreams(stepSeconds);
    this.advanceUnits(stepSeconds);
    this.resolveClashes();
  }

  private advanceStreams(stepSeconds: number): void {
    for (const stream of this.streams) {
      stream.cooldown -= stepSeconds;
      const source = this.nodes.getById(stream.sourceId);
      const target = this.nodes.getById(stream.targetId);
      if (!source || !target) {
        stream.remaining = 0;
        continue;
      }
      while (stream.cooldown <= 0 && stream.remaining > 0) {
        const rowSize = Math.min(LANE_OFFSETS.length, stream.remaining);
        const firstLane = Math.floor((LANE_OFFSETS.length - rowSize) / 2);
        for (const lateral of LANE_OFFSETS.slice(firstLane, firstLane + rowSize)) {
          this.units.push(this.createUnit(stream, source, target, lateral));
        }
        stream.remaining -= rowSize;
        stream.cooldown += LAUNCH_INTERVAL_SECONDS;
      }
    }
    this.streams = this.streams.filter((stream) => stream.remaining > 0);
  }

  private createUnit(stream: LaunchStream, source: NodeEntity, target: NodeEntity, lateral: number): TroopUnit {
    const distance = Math.hypot(target.x - source.x, target.y - source.y) || 1;
    const directionX = (target.x - source.x) / distance;
    const directionY = (target.y - source.y) / distance;
    const shiftX = -directionY * lateral;
    const shiftY = directionX * lateral;
    const isPlayer = stream.faction === 'player';
    const perk = this.modifiers.skinPerk;
    return {
      id: this.nextId++,
      faction: stream.faction,
      x: source.x + directionX * source.radius + shiftX,
      y: source.y + directionY * source.radius + shiftY,
      sourceNodeId: source.id,
      targetNodeId: target.id,
      targetX: target.x + shiftX,
      targetY: target.y + shiftY,
      speed: isPlayer ? TROOP_SPEED * this.modifiers.speedMultiplier * perk.speedMultiplier : TROOP_SPEED,
      radius: TROOP_RADIUS,
      siegeDamage: isPlayer ? perk.siegeDamage : 1,
      towerEvasion: isPlayer ? perk.towerEvasion : 0,
    };
  }

  private advanceUnits(stepSeconds: number): void {
    const survivors: TroopUnit[] = [];
    for (const unit of this.units) {
      const target = this.nodes.getById(unit.targetNodeId);
      if (!target) continue;
      if (Math.hypot(target.x - unit.x, target.y - unit.y) <= target.radius) {
        this.arrive(unit, target);
        continue;
      }
      const offsetX = unit.targetX - unit.x;
      const offsetY = unit.targetY - unit.y;
      const distance = Math.hypot(offsetX, offsetY) || 1;
      const step = unit.speed * stepSeconds;
      unit.x += (offsetX / distance) * step;
      unit.y += (offsetY / distance) * step;
      survivors.push(unit);
    }
    this.units = survivors;
  }

  private arrive(unit: TroopUnit, target: NodeEntity): void {
    if (target.faction === unit.faction) {
      target.troops += 1;
      return;
    }
    target.troops -= unit.siegeDamage;
    if (target.troops > 0) return;
    const previousFaction = target.faction;
    target.faction = unit.faction;
    target.troops = 1;
    this.bus.emit('node:captured', { nodeId: target.id, previousFaction, newFaction: unit.faction });
  }

  private resolveClashes(): void {
    const destroyed = new Set<number>();
    for (let first = 0; first < this.units.length; first++) {
      const a = this.units[first];
      if (destroyed.has(a.id)) continue;
      for (let second = first + 1; second < this.units.length; second++) {
        const b = this.units[second];
        if (destroyed.has(b.id) || a.faction === b.faction) continue;
        const reach = a.radius + b.radius;
        if ((a.x - b.x) ** 2 + (a.y - b.y) ** 2 > reach * reach) continue;
        destroyed.add(a.id);
        destroyed.add(b.id);
        this.bus.emit('troop:clash', { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
        break;
      }
    }
    if (destroyed.size > 0) this.units = this.units.filter((unit) => !destroyed.has(unit.id));
  }
}
