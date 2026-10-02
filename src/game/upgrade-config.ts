import type { UpgradeId } from '../core/types';

export const MAX_UPGRADE_TIER = 5;
export const UPGRADE_IDS: readonly UpgradeId[] = ['production', 'startingTroops', 'marchSpeed', 'towerPower'];

export const BASE_UPGRADE_COST = 50;
export const UPGRADE_COST_GROWTH = 1.6;

export const UPGRADE_STEP: Record<UpgradeId, number> = {
  production: 0.08,
  startingTroops: 5,
  marchSpeed: 0.1,
  towerPower: 0.15,
};

export const VICTORY_BASE_COINS = 60;
export const VICTORY_PAR_SECONDS = 180;
export const VICTORY_SECONDS_PER_COIN = 3;
export const DEFEAT_SECONDS_PER_COIN = 10;
export const DEFEAT_MAX_COINS = 15;
