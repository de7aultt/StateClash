import type { FactionId, NodeEntity, NodeType } from '../core/types';
import { NODE_RADIUS, NODE_STATS } from './node-config';

export interface NodeSpawn {
  x: number;
  y: number;
  type: NodeType;
  faction: FactionId;
  troops: number;
  radius?: number;
}

export function createNodeEntity(id: number, spawn: NodeSpawn): NodeEntity {
  const stats = NODE_STATS[spawn.type][1];
  return {
    id,
    x: spawn.x,
    y: spawn.y,
    radius: spawn.radius ?? NODE_RADIUS[spawn.type],
    type: spawn.type,
    faction: spawn.faction,
    troops: Math.min(spawn.troops, stats.capacity),
    tier: 1,
    capacity: stats.capacity,
    productionRate: stats.productionRate,
    towerRange: stats.towerRange,
  };
}
