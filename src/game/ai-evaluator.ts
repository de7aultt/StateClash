import type { NodeEntity } from '../core/types';
import type { AiProfile } from './ai-profiles';
import { FIRE_COOLDOWN_SECONDS } from './tower-system';
import { TROOP_SPEED } from './troop-system';

const PATH_SAMPLES = 16;
const REQUIRED_MARGIN = 2;
const MAX_STRIKE_SOURCES = 3;
const WEAKNESS_CEILING = 30;

export interface Strike {
  sources: NodeEntity[];
  target: NodeEntity;
}

export function sendableTroops(node: NodeEntity): number {
  return Math.floor(node.troops);
}

export function distanceBetween(a: NodeEntity, b: NodeEntity): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function routeLength(route: readonly NodeEntity[]): number {
  let length = 0;
  for (let index = 1; index < route.length; index++) length += distanceBetween(route[index - 1], route[index]);
  return length;
}

function findLaunchers(owned: readonly NodeEntity[], target: NodeEntity): NodeEntity[] {
  return owned
    .filter((node) => node.type !== 'tower' && sendableTroops(node) > 0)
    .sort((a, b) => distanceBetween(a, target) - distanceBetween(b, target));
}

function segmentLosses(from: NodeEntity, to: NodeEntity, tower: NodeEntity): number {
  let samplesInside = 0;
  for (let sample = 0; sample < PATH_SAMPLES; sample++) {
    const progress = (sample + 0.5) / PATH_SAMPLES;
    const x = from.x + (to.x - from.x) * progress;
    const y = from.y + (to.y - from.y) * progress;
    if (Math.hypot(x - tower.x, y - tower.y) <= tower.towerRange) samplesInside++;
  }
  const secondsInRange = (samplesInside / PATH_SAMPLES) * (distanceBetween(from, to) / TROOP_SPEED);
  return secondsInRange / FIRE_COOLDOWN_SECONDS;
}

export function estimateTowerLosses(
  route: readonly NodeEntity[],
  profile: AiProfile,
  nodes: readonly NodeEntity[],
): number {
  let losses = 0;
  for (const tower of nodes) {
    if (tower.type !== 'tower' || tower.faction === 'neutral' || tower.faction === profile.faction) continue;
    for (let index = 1; index < route.length; index++) losses += segmentLosses(route[index - 1], route[index], tower);
  }
  return losses;
}

function requiredTroops(profile: AiProfile, route: readonly NodeEntity[], target: NodeEntity, losses: number): number {
  const travelSeconds = routeLength(route) / TROOP_SPEED;
  const growth = target.faction === 'neutral' ? 0 : target.productionRate * travelSeconds;
  return Math.ceil((target.troops + growth) * profile.advantage + losses) + REQUIRED_MARGIN;
}

function targetValue(profile: AiProfile, target: NodeEntity): number {
  if (target.type === 'forge') return profile.forgeValue;
  if (target.type === 'tower') return profile.towerValue;
  return profile.cityValue;
}

function scoreTarget(profile: AiProfile, target: NodeEntity, route: readonly NodeEntity[], losses: number): number {
  const weakness = profile.weaknessWeight * Math.max(0, WEAKNESS_CEILING - target.troops);
  return targetValue(profile, target) + weakness - routeLength(route) * profile.distanceWeight - losses * profile.threatWeight;
}

function planStrike(
  profile: AiProfile,
  target: NodeEntity,
  launchers: readonly NodeEntity[],
  route: readonly NodeEntity[],
  losses: number,
): Strike | null {
  const required = requiredTroops(profile, route, target, losses);
  const sources: NodeEntity[] = [];
  let total = 0;
  for (const launcher of launchers.slice(0, MAX_STRIKE_SOURCES)) {
    sources.push(launcher);
    total += sendableTroops(launcher);
    if (total >= required) return { sources, target };
  }
  return null;
}

export function findBestStrike(
  profile: AiProfile,
  owned: readonly NodeEntity[],
  nodes: readonly NodeEntity[],
): Strike | null {
  const ranked = nodes
    .filter((target) => target.faction !== profile.faction)
    .map((target) => ({ target, launchers: findLaunchers(owned, target) }))
    .filter((entry) => entry.launchers.length > 0)
    .map((entry) => {
      const route = [entry.launchers[0], entry.target];
      const losses = estimateTowerLosses(route, profile, nodes);
      return { ...entry, route, losses, score: scoreTarget(profile, entry.target, route, losses) };
    })
    .sort((a, b) => b.score - a.score);

  for (const entry of ranked) {
    const strike = planStrike(profile, entry.target, entry.launchers, entry.route, entry.losses);
    if (strike) return strike;
  }
  return null;
}
