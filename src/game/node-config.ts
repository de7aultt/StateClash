import type { NodeTier, NodeType } from '../core/types';

export interface TierStats {
  capacity: number;
  productionRate: number;
  towerRange: number;
}

export const UPGRADE_COST = 15;
export const MAX_TIER: NodeTier = 3;

export const NODE_RADIUS: Record<NodeType, number> = {
  city: 34,
  forge: 30,
  tower: 28,
};

export const COMPACT_NODE_RADIUS: Record<NodeType, number> = {
  city: 26,
  forge: 24,
  tower: 22,
};

export const NODE_STATS: Record<NodeType, Record<NodeTier, TierStats>> = {
  city: {
    1: { capacity: 40, productionRate: 1.0, towerRange: 0 },
    2: { capacity: 60, productionRate: 1.5, towerRange: 0 },
    3: { capacity: 80, productionRate: 2.0, towerRange: 0 },
  },
  forge: {
    1: { capacity: 25, productionRate: 2.5, towerRange: 0 },
    2: { capacity: 35, productionRate: 3.5, towerRange: 0 },
    3: { capacity: 50, productionRate: 4.5, towerRange: 0 },
  },
  tower: {
    1: { capacity: 20, productionRate: 0, towerRange: 120 },
    2: { capacity: 30, productionRate: 0, towerRange: 160 },
    3: { capacity: 40, productionRate: 0, towerRange: 200 },
  },
};
