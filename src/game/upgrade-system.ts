import type { EventBus } from '../core/events';
import type { ArenaId, GameEventMap, MatchResult, PlayerSaveData, SkinId, UpgradeId } from '../core/types';
import { ARENA_PRICES, SKIN_PERKS, SKIN_PRICES, type SkinPerk } from './cosmetics-config';
import type { StorageManager } from './storage-manager';
import {
  BASE_UPGRADE_COST,
  DEFEAT_MAX_COINS,
  DEFEAT_SECONDS_PER_COIN,
  MAX_UPGRADE_TIER,
  UPGRADE_COST_GROWTH,
  UPGRADE_STEP,
  VICTORY_BASE_COINS,
  VICTORY_PAR_SECONDS,
  VICTORY_SECONDS_PER_COIN,
} from './upgrade-config';

export interface PlayerModifiers {
  readonly productionMultiplier: number;
  readonly speedMultiplier: number;
  readonly towerMultiplier: number;
  readonly skinPerk: SkinPerk;
}

export class UpgradeSystem implements PlayerModifiers {
  private data: PlayerSaveData;

  constructor(
    private readonly bus: EventBus<GameEventMap>,
    private readonly storage: StorageManager,
  ) {
    this.data = storage.load();
    bus.on('battle:victory', (result) => this.settleBattle(result, true));
    bus.on('battle:defeat', (result) => this.settleBattle(result, false));
    bus.on('level:requested', ({ level }) => this.selectLevel(level));
  }

  get coins(): number {
    return this.data.coins;
  }

  get savedLevel(): number {
    return Math.min(this.data.currentLevel, this.data.maxUnlockedLevel);
  }

  get maxUnlockedLevel(): number {
    return this.data.maxUnlockedLevel;
  }

  selectLevel(level: number): void {
    if (level < 1 || level > this.data.maxUnlockedLevel || level === this.data.currentLevel) return;
    this.data.currentLevel = level;
    this.commit();
  }

  get equippedSkin(): SkinId {
    return this.data.equippedSkin;
  }

  get equippedArena(): ArenaId {
    return this.data.equippedArena;
  }

  get skinPerk(): SkinPerk {
    return SKIN_PERKS[this.data.equippedSkin];
  }

  get productionMultiplier(): number {
    return 1 + this.tierOf('production') * UPGRADE_STEP.production;
  }

  get startingTroopsBonus(): number {
    return this.tierOf('startingTroops') * UPGRADE_STEP.startingTroops;
  }

  get speedMultiplier(): number {
    return 1 + this.tierOf('marchSpeed') * UPGRADE_STEP.marchSpeed;
  }

  get towerMultiplier(): number {
    return 1 + this.tierOf('towerPower') * UPGRADE_STEP.towerPower;
  }

  tierOf(id: UpgradeId): number {
    return this.data.purchasedUpgrades[id];
  }

  ownsSkin(id: SkinId): boolean {
    return this.data.ownedSkins.includes(id);
  }

  ownsArena(id: ArenaId): boolean {
    return this.data.ownedArenas.includes(id);
  }

  costOf(id: UpgradeId): number | null {
    const tier = this.tierOf(id);
    return tier >= MAX_UPGRADE_TIER ? null : Math.round(BASE_UPGRADE_COST * Math.pow(UPGRADE_COST_GROWTH, tier));
  }

  purchaseUpgrade(id: UpgradeId): boolean {
    const cost = this.costOf(id);
    if (cost === null || !this.spend(cost)) return false;
    this.data.purchasedUpgrades[id] += 1;
    this.commit();
    return true;
  }

  purchaseSkin(id: SkinId): boolean {
    if (this.ownsSkin(id) || !this.spend(SKIN_PRICES[id])) return false;
    this.data.ownedSkins.push(id);
    this.commit();
    return true;
  }

  purchaseArena(id: ArenaId): boolean {
    if (this.ownsArena(id) || !this.spend(ARENA_PRICES[id])) return false;
    this.data.ownedArenas.push(id);
    this.commit();
    return true;
  }

  equipSkin(id: SkinId): boolean {
    if (!this.ownsSkin(id)) return false;
    this.data.equippedSkin = id;
    this.commit();
    return true;
  }

  equipArena(id: ArenaId): boolean {
    if (!this.ownsArena(id)) return false;
    this.data.equippedArena = id;
    this.commit();
    return true;
  }

  addCoins(amount: number): void {
    this.data.coins += amount;
    this.commit();
  }

  calculateBattleReward(victory: boolean, elapsedSeconds: number): number {
    if (!victory) return Math.min(DEFEAT_MAX_COINS, Math.floor(elapsedSeconds / DEFEAT_SECONDS_PER_COIN));
    const speedBonus = Math.max(0, Math.round((VICTORY_PAR_SECONDS - elapsedSeconds) / VICTORY_SECONDS_PER_COIN));
    return VICTORY_BASE_COINS + speedBonus;
  }

  private spend(cost: number): boolean {
    if (cost > this.data.coins) return false;
    this.data.coins -= cost;
    return true;
  }

  private settleBattle(result: MatchResult, victory: boolean): void {
    this.data.coins += result.coins;
    if (victory) {
      this.data.maxUnlockedLevel = Math.max(this.data.maxUnlockedLevel, result.level + 1);
      this.data.currentLevel = result.level + 1;
    }
    this.commit();
  }

  private commit(): void {
    this.storage.save(this.data);
    this.bus.emit('economy:updated', {
      ...this.data,
      purchasedUpgrades: { ...this.data.purchasedUpgrades },
      ownedSkins: [...this.data.ownedSkins],
      ownedArenas: [...this.data.ownedArenas],
    });
  }
}
