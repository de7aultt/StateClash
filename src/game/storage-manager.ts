import type { PlayerSaveData, UpgradeId } from '../core/types';
import { ARENA_IDS, DEFAULT_ARENA, DEFAULT_SKIN, SKIN_IDS } from './cosmetics-config';
import { MAX_UPGRADE_TIER, UPGRADE_IDS } from './upgrade-config';

const SAVE_KEY = 'state_clash_save_v1';

export function createDefaultSave(): PlayerSaveData {
  return {
    coins: 0,
    currentLevel: 1,
    maxUnlockedLevel: 1,
    purchasedUpgrades: { production: 0, startingTroops: 0, marchSpeed: 0, towerPower: 0 },
    equippedSkin: DEFAULT_SKIN,
    equippedArena: DEFAULT_ARENA,
    ownedSkins: [DEFAULT_SKIN],
    ownedArenas: [DEFAULT_ARENA],
  };
}

function toWholeNumber(value: unknown, fallback: number, minimum: number, maximum: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(maximum, Math.max(minimum, Math.floor(value)));
}

function sanitizeOwned<Id extends string>(raw: unknown, valid: readonly Id[], fallback: Id): Id[] {
  const owned = Array.isArray(raw) ? valid.filter((id) => raw.includes(id)) : [];
  return owned.includes(fallback) ? owned : [fallback, ...owned];
}

function sanitizeEquipped<Id extends string>(raw: unknown, owned: readonly Id[], fallback: Id): Id {
  return owned.find((id) => id === raw) ?? fallback;
}

function sanitize(raw: unknown): PlayerSaveData {
  const save = createDefaultSave();
  if (typeof raw !== 'object' || raw === null) return save;
  const candidate = raw as Partial<Record<keyof PlayerSaveData, unknown>>;
  const stored = (typeof candidate.purchasedUpgrades === 'object' && candidate.purchasedUpgrades !== null
    ? candidate.purchasedUpgrades
    : {}) as Partial<Record<UpgradeId, unknown>>;
  for (const id of UPGRADE_IDS) {
    save.purchasedUpgrades[id] = toWholeNumber(stored[id], 0, 0, MAX_UPGRADE_TIER);
  }
  save.coins = toWholeNumber(candidate.coins, 0, 0, Number.MAX_SAFE_INTEGER);
  const storedLevel = toWholeNumber(candidate.currentLevel, 1, 1, Number.MAX_SAFE_INTEGER);
  save.maxUnlockedLevel = Math.max(storedLevel, toWholeNumber(candidate.maxUnlockedLevel, 1, 1, Number.MAX_SAFE_INTEGER));
  save.currentLevel = Math.min(storedLevel, save.maxUnlockedLevel);
  save.ownedSkins = sanitizeOwned(candidate.ownedSkins, SKIN_IDS, DEFAULT_SKIN);
  save.ownedArenas = sanitizeOwned(candidate.ownedArenas, ARENA_IDS, DEFAULT_ARENA);
  save.equippedSkin = sanitizeEquipped(candidate.equippedSkin, save.ownedSkins, DEFAULT_SKIN);
  save.equippedArena = sanitizeEquipped(candidate.equippedArena, save.ownedArenas, DEFAULT_ARENA);
  return save;
}

export class StorageManager {
  load(): PlayerSaveData {
    try {
      const serialized = window.localStorage.getItem(SAVE_KEY);
      return serialized ? sanitize(JSON.parse(serialized)) : createDefaultSave();
    } catch {
      return createDefaultSave();
    }
  }

  save(data: PlayerSaveData): void {
    try {
      window.localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch {
      return;
    }
  }
}
