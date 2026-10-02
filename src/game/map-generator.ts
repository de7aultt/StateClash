import type { FactionId, NodeEntity, NodeType, Vec2 } from '../core/types';
import { COMPACT_NODE_RADIUS } from './node-config';
import { createNodeEntity, type NodeSpawn } from './node-factory';

export interface GeneratedMap {
  nodes: NodeEntity[];
}

interface Bounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

const SCREEN_PADDING = 105;
const MIN_NODE_DISTANCE = 130;
const DISTANCE_FLOOR = 72;
const PLACEMENT_ATTEMPTS = 40;
const DISTANCE_RELAXATION = 0.9;
const BASE_TROOPS = 30;
const TROOPS_PER_LEVEL = 3;
const MAX_BONUS_TROOPS = 20;
const FORGE_SHARE = 0.25;
const TOWER_SHARE = 0.15;
const AMBER_FIRST_LEVEL = 2;
const VIOLET_FIRST_LEVEL = 26;
const COMPACT_FIRST_LEVEL = 26;
const MAX_NODE_COUNT = 32;

function nodeCountForLevel(level: number): number {
  if (level <= 5) return 5 + level;
  if (level <= 15) return Math.round(12 + ((level - 6) * 6) / 9);
  if (level <= 25) return Math.round(18 + ((level - 16) * 6) / 9);
  return Math.min(MAX_NODE_COUNT, 25 + (level - 26));
}

function baseFactionsForLevel(level: number): FactionId[] {
  const factions: FactionId[] = ['player', 'crimson'];
  if (level >= AMBER_FIRST_LEVEL) factions.push('amber');
  if (level >= VIOLET_FIRST_LEVEL) factions.push('violet');
  return factions;
}

function shuffle<Item>(items: Item[]): Item[] {
  for (let index = items.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
  }
  return items;
}

function randomPoint(bounds: Bounds): Vec2 {
  return {
    x: bounds.left + Math.random() * (bounds.right - bounds.left),
    y: bounds.top + Math.random() * (bounds.bottom - bounds.top),
  };
}

function tryPlace(points: readonly Vec2[], bounds: Bounds, minDistance: number): Vec2 | null {
  for (let attempt = 0; attempt < PLACEMENT_ATTEMPTS; attempt++) {
    const candidate = randomPoint(bounds);
    if (points.every((point) => Math.hypot(point.x - candidate.x, point.y - candidate.y) >= minDistance)) return candidate;
  }
  return null;
}

function placePoints(count: number, fixed: readonly Vec2[], bounds: Bounds): Vec2[] {
  const points = [...fixed];
  let minDistance = MIN_NODE_DISTANCE;
  while (points.length < count) {
    const candidate = tryPlace(points, bounds, minDistance);
    if (candidate) points.push(candidate);
    else if (minDistance <= DISTANCE_FLOOR) points.push(randomPoint(bounds));
    else minDistance = Math.max(DISTANCE_FLOOR, minDistance * DISTANCE_RELAXATION);
  }
  return points;
}

function pickNeutralTypes(count: number): NodeType[] {
  const towers = Math.round(count * TOWER_SHARE);
  const forges = Math.round(count * FORGE_SHARE);
  const types: NodeType[] = [
    ...Array<NodeType>(towers).fill('tower'),
    ...Array<NodeType>(forges).fill('forge'),
    ...Array<NodeType>(count - towers - forges).fill('city'),
  ];
  return shuffle(types);
}

export function generateMap(level: number, width: number, height: number, playerTroopBonus = 0): GeneratedMap {
  const bounds: Bounds = {
    left: SCREEN_PADDING,
    top: SCREEN_PADDING,
    right: Math.max(SCREEN_PADDING + 1, width - SCREEN_PADDING),
    bottom: Math.max(SCREEN_PADDING + 1, height - SCREEN_PADDING),
  };
  const corners: Vec2[] = [
    { x: bounds.left, y: bounds.bottom },
    { x: bounds.right, y: bounds.top },
    { x: bounds.left, y: bounds.top },
    { x: bounds.right, y: bounds.bottom },
  ];
  const baseFactions = baseFactionsForLevel(level);
  const points = placePoints(nodeCountForLevel(level), corners.slice(0, baseFactions.length), bounds);
  const neutralTypes = pickNeutralTypes(points.length - baseFactions.length);
  const botTroops = BASE_TROOPS + Math.min(MAX_BONUS_TROOPS, (level - 1) * TROOPS_PER_LEVEL);
  const compact = level >= COMPACT_FIRST_LEVEL;

  const nodes = points.map((point, index) => {
    const faction = baseFactions[index];
    const type: NodeType = faction ? 'city' : neutralTypes[index - baseFactions.length];
    const spawn: NodeSpawn = {
      ...point,
      type,
      faction: faction ?? 'neutral',
      troops: faction
        ? faction === 'player'
          ? BASE_TROOPS + playerTroopBonus
          : botTroops
        : 6 + level * 2 + Math.floor(Math.random() * 5),
      radius: compact ? COMPACT_NODE_RADIUS[type] : undefined,
    };
    return createNodeEntity(index + 1, spawn);
  });

  return { nodes };
}
