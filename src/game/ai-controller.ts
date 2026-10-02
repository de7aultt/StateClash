import type { FactionId, NodeEntity } from '../core/types';
import { UPGRADE_COST } from './node-config';
import type { NodeSystem } from './node-system';
import type { TroopSystem } from './troop-system';
import { distanceBetween, findBestStrike, sendableTroops } from './ai-evaluator';
import type { AiProfile } from './ai-profiles';

const UPGRADE_RESERVE = 8;
const INITIAL_DELAY_SECONDS = 1.5;
const WEAK_GARRISON_RATIO = 0.3;
const DONOR_GARRISON_RATIO = 0.6;
const MIN_REINFORCEMENT = 5;

export class AIController {
  private readonly timers = new Map<FactionId, number>();

  constructor(
    private readonly nodes: NodeSystem,
    private readonly troops: TroopSystem,
    private readonly profiles: readonly AiProfile[],
  ) {
    this.reset();
  }

  reset(): void {
    for (const profile of this.profiles) this.timers.set(profile.faction, INITIAL_DELAY_SECONDS + this.nextInterval(profile));
  }

  update(stepSeconds: number): void {
    for (const profile of this.profiles) {
      const remaining = (this.timers.get(profile.faction) ?? 0) - stepSeconds;
      if (remaining > 0) {
        this.timers.set(profile.faction, remaining);
        continue;
      }
      this.timers.set(profile.faction, this.nextInterval(profile));
      this.think(profile);
    }
  }

  private nextInterval(profile: AiProfile): number {
    return profile.minIntervalSeconds + Math.random() * (profile.maxIntervalSeconds - profile.minIntervalSeconds);
  }

  private think(profile: AiProfile): void {
    const owned = this.nodes.nodes.filter((node) => node.faction === profile.faction);
    if (owned.length === 0) return;
    if (this.tryUpgrade(profile, owned)) return;
    const strike = findBestStrike(profile, owned, this.nodes.nodes);
    if (strike) {
      this.troops.dispatchWave(strike.sources, strike.target);
      return;
    }
    if (profile.reinforcesWeakNodes) this.reinforceWeakest(owned);
  }

  private tryUpgrade(profile: AiProfile, owned: readonly NodeEntity[]): boolean {
    if (Math.random() > profile.upgradeChance) return false;
    const candidates = owned
      .filter((node) => node.tier < 3 && node.troops >= UPGRADE_COST + UPGRADE_RESERVE)
      .sort((a, b) => this.upgradePriority(profile, a) - this.upgradePriority(profile, b) || b.troops - a.troops);
    return candidates.length > 0 && this.nodes.tryUpgrade(candidates[0].id, profile.faction);
  }

  private upgradePriority(profile: AiProfile, node: NodeEntity): number {
    const isTower = node.type === 'tower';
    return profile.prefersTowerUpgrades === isTower ? 0 : 1;
  }

  private reinforceWeakest(owned: readonly NodeEntity[]): void {
    const weakest = owned
      .filter((node) => node.troops < node.capacity * WEAK_GARRISON_RATIO)
      .sort((a, b) => a.troops / a.capacity - b.troops / b.capacity)[0];
    if (!weakest) return;
    const donor = owned
      .filter(
        (node) =>
          node.id !== weakest.id &&
          node.type !== 'tower' &&
          node.troops >= node.capacity * DONOR_GARRISON_RATIO &&
          sendableTroops(node) >= MIN_REINFORCEMENT,
      )
      .sort((a, b) => distanceBetween(a, weakest) - distanceBetween(b, weakest))[0];
    if (donor) this.troops.dispatchWave([donor], weakest);
  }
}
