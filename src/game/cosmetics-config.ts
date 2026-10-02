import type { ArenaId, SkinId } from '../core/types';
import type { TranslationKey } from '../i18n/types';

export const SKIN_IDS: readonly SkinId[] = ['vanguard', 'drones', 'tanks', 'phantoms'];
export const ARENA_IDS: readonly ArenaId[] = ['cyber', 'volcanic', 'emerald', 'arctic'];

export const DEFAULT_SKIN: SkinId = 'vanguard';
export const DEFAULT_ARENA: ArenaId = 'cyber';

export interface SkinPerk {
  speedMultiplier: number;
  siegeDamage: number;
  towerEvasion: number;
  perkKey: TranslationKey;
}

export const SKIN_PERKS: Record<SkinId, SkinPerk> = {
  vanguard: { speedMultiplier: 1.0, siegeDamage: 1.0, towerEvasion: 0, perkKey: 'perk.vanguard' },
  drones: { speedMultiplier: 1.25, siegeDamage: 1.0, towerEvasion: 0, perkKey: 'perk.drones' },
  tanks: { speedMultiplier: 0.9, siegeDamage: 1.25, towerEvasion: 0, perkKey: 'perk.tanks' },
  phantoms: { speedMultiplier: 1.0, siegeDamage: 1.0, towerEvasion: 0.5, perkKey: 'perk.phantoms' },
};

export const SKIN_PRICES: Record<SkinId, number> = {
  vanguard: 0,
  drones: 200,
  tanks: 350,
  phantoms: 500,
};

export const ARENA_PRICES: Record<ArenaId, number> = {
  cyber: 0,
  volcanic: 250,
  emerald: 400,
  arctic: 600,
};
