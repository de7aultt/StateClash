import type { FactionId } from '../core/types';

export interface AiProfile {
  faction: FactionId;
  minIntervalSeconds: number;
  maxIntervalSeconds: number;
  advantage: number;
  forgeValue: number;
  cityValue: number;
  towerValue: number;
  weaknessWeight: number;
  distanceWeight: number;
  threatWeight: number;
  upgradeChance: number;
  prefersTowerUpgrades: boolean;
  reinforcesWeakNodes: boolean;
}

export const CRIMSON_PROFILE: AiProfile = {
  faction: 'crimson',
  minIntervalSeconds: 0.8,
  maxIntervalSeconds: 1.1,
  advantage: 1.0,
  forgeValue: 60,
  cityValue: 30,
  towerValue: 5,
  weaknessWeight: 2.0,
  distanceWeight: 0.05,
  threatWeight: 3,
  upgradeChance: 0.3,
  prefersTowerUpgrades: false,
  reinforcesWeakNodes: false,
};

export const BOT_FACTIONS: readonly FactionId[] = ['crimson', 'amber', 'violet'];

export const VIOLET_PROFILE: AiProfile = {
  faction: 'violet',
  minIntervalSeconds: 1.0,
  maxIntervalSeconds: 1.4,
  advantage: 1.25,
  forgeValue: 52,
  cityValue: 30,
  towerValue: 22,
  weaknessWeight: 1.5,
  distanceWeight: 0.06,
  threatWeight: 5,
  upgradeChance: 0.55,
  prefersTowerUpgrades: false,
  reinforcesWeakNodes: true,
};

export const AMBER_PROFILE: AiProfile = {
  faction: 'amber',
  minIntervalSeconds: 1.2,
  maxIntervalSeconds: 1.6,
  advantage: 1.5,
  forgeValue: 45,
  cityValue: 30,
  towerValue: 40,
  weaknessWeight: 1.0,
  distanceWeight: 0.08,
  threatWeight: 8,
  upgradeChance: 0.8,
  prefersTowerUpgrades: true,
  reinforcesWeakNodes: true,
};
