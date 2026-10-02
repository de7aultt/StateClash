import type { EventBus } from '../core/events';
import type { FactionId, GameEventMap, NodeEntity, NodeTier } from '../core/types';
import { MAX_TIER, NODE_STATS, UPGRADE_COST } from './node-config';
import { createNodeEntity, type NodeSpawn } from './node-factory';
import type { PlayerModifiers } from './upgrade-system';

const HIT_SCALE = 1.4;
const HIT_PADDING = 14;

export class NodeSystem {
  private entities: NodeEntity[] = [];
  private nextId = 1;

  constructor(
    private readonly bus: EventBus<GameEventMap>,
    private readonly modifiers: PlayerModifiers,
  ) {}

  get nodes(): readonly NodeEntity[] {
    return this.entities;
  }

  spawn(spawn: NodeSpawn): NodeEntity {
    const entity = createNodeEntity(this.nextId++, spawn);
    this.entities.push(entity);
    return entity;
  }

  load(entities: readonly NodeEntity[]): void {
    this.entities = [...entities];
    this.nextId = entities.reduce((highest, entity) => Math.max(highest, entity.id), 0) + 1;
  }

  clear(): void {
    this.entities = [];
  }

  getById(nodeId: number): NodeEntity | undefined {
    return this.entities.find((entity) => entity.id === nodeId);
  }

  findAt(x: number, y: number): NodeEntity | undefined {
    for (let index = this.entities.length - 1; index >= 0; index--) {
      const entity = this.entities[index];
      const hitRadius = Math.max(entity.radius * HIT_SCALE, entity.radius + HIT_PADDING);
      if (Math.hypot(entity.x - x, entity.y - y) <= hitRadius) return entity;
    }
    return undefined;
  }

  reinforceLargest(faction: FactionId, amount: number): boolean {
    const [largest] = this.entities
      .filter((entity) => entity.faction === faction)
      .sort((a, b) => b.capacity - a.capacity || a.troops - b.troops);
    if (!largest) return false;
    largest.troops += amount;
    return true;
  }

  update(stepSeconds: number): void {
    for (const entity of this.entities) {
      if (entity.faction === 'neutral' || entity.troops >= entity.capacity) continue;
      const multiplier = entity.faction === 'player' ? this.modifiers.productionMultiplier : 1;
      entity.troops = Math.min(entity.capacity, entity.troops + entity.productionRate * multiplier * stepSeconds);
    }
  }

  tryUpgrade(nodeId: number, owner: FactionId = 'player'): boolean {
    const entity = this.getById(nodeId);
    if (!entity || entity.faction === 'neutral' || entity.faction !== owner) return false;
    if (entity.tier >= MAX_TIER || entity.troops < UPGRADE_COST) return false;

    entity.troops -= UPGRADE_COST;
    entity.tier = (entity.tier + 1) as NodeTier;
    const stats = NODE_STATS[entity.type][entity.tier];
    entity.capacity = stats.capacity;
    entity.productionRate = stats.productionRate;
    entity.towerRange = stats.towerRange;
    this.bus.emit('node:upgraded', { nodeId: entity.id, tier: entity.tier });
    return true;
  }
}
