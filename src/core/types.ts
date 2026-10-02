export interface Vec2 {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export type FactionId = 'neutral' | 'player' | 'crimson' | 'amber' | 'violet';

export type NodeType = 'city' | 'forge' | 'tower';

export type NodeTier = 1 | 2 | 3;

export type UpgradeId = 'production' | 'startingTroops' | 'marchSpeed' | 'towerPower';

export type SkinId = 'vanguard' | 'drones' | 'tanks' | 'phantoms';

export type ArenaId = 'cyber' | 'volcanic' | 'emerald' | 'arctic';

export interface NodeEntity {
  id: number;
  x: number;
  y: number;
  radius: number;
  type: NodeType;
  faction: FactionId;
  troops: number;
  tier: NodeTier;
  capacity: number;
  productionRate: number;
  towerRange: number;
}

export interface TroopUnit {
  id: number;
  faction: FactionId;
  x: number;
  y: number;
  sourceNodeId: number;
  targetNodeId: number;
  targetX: number;
  targetY: number;
  speed: number;
  radius: number;
  siegeDamage: number;
  towerEvasion: number;
}

export interface DragState {
  chainIds: readonly number[];
  pointerX: number;
  pointerY: number;
  targetId: number | null;
}

export interface MatchResult {
  level: number;
  seconds: number;
  coins: number;
}

export interface PlayerSaveData {
  coins: number;
  currentLevel: number;
  maxUnlockedLevel: number;
  purchasedUpgrades: Record<UpgradeId, number>;
  equippedSkin: SkinId;
  equippedArena: ArenaId;
  ownedSkins: SkinId[];
  ownedArenas: ArenaId[];
}

export interface GameEventMap {
  'battle:start': undefined;
  'battle:victory': MatchResult;
  'battle:defeat': MatchResult;
  'level:requested': { level: number };
  'economy:updated': PlayerSaveData;
  'shop:open': undefined;
  'settings:open': undefined;
  'levels:open': undefined;
  'shop:closed': undefined;
  'pause:requested': undefined;
  'pause:changed': { paused: boolean };
  'menu:requested': undefined;
  'settings:changed': undefined;
  'visibility:changed': { hidden: boolean };
  'viewport:resized': Size & { pixelRatio: number };
  'node:upgraded': { nodeId: number; tier: NodeTier };
  'node:selected': { nodeId: number | null };
  'node:captured': { nodeId: number; previousFaction: FactionId; newFaction: FactionId };
  'troop:clash': Vec2;
  'tower:fired': { from: Vec2; to: Vec2; faction: FactionId };
}

export type GameEventName = keyof GameEventMap;
