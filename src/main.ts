import { AudioManager } from './audio/audio-manager';
import { EventBus } from './core/events';
import { GameLoop } from './core/loop';
import type { GameEventMap } from './core/types';
import { AIController } from './game/ai-controller';
import { AMBER_PROFILE, CRIMSON_PROFILE, VIOLET_PROFILE } from './game/ai-profiles';
import { generateMap } from './game/map-generator';
import { MatchReferee } from './game/match-referee';
import { NodeSystem } from './game/node-system';
import { StorageManager } from './game/storage-manager';
import { TowerSystem } from './game/tower-system';
import { TroopSystem } from './game/troop-system';
import { UpgradeSystem } from './game/upgrade-system';
import { InputManager } from './input/input-manager';
import { PortalAdManager } from './platform/portal-ad-manager';
import { drawBackground } from './render/background';
import { renderNodes } from './render/node-renderer';
import { ParticleSystem } from './render/particle-system';
import { ProvinceRenderer } from './render/province-renderer';
import { ScreenShake } from './render/screen-shake';
import { ShockwaveSystem } from './render/shockwave-system';
import { renderTrajectory } from './render/trajectory-renderer';
import { renderTroops } from './render/troop-renderer';
import { Viewport } from './render/viewport';
import { AirdropButton } from './ui/airdrop-button';
import { EndModal } from './ui/end-modal';
import { Hud } from './ui/hud';
import { PauseModal } from './ui/pause-modal';
import { LevelSelectModal } from './ui/level-select-modal';
import { type AudioControls, SettingsModal } from './ui/settings-modal';
import { ShopModal } from './ui/shop-modal';
import { TitleScreen } from './ui/title-screen';

function requireElement<ElementType extends HTMLElement>(id: string): ElementType {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing required element: ${id}`);
  return element as ElementType;
}

const CAPTURE_TRAUMA = 0.45;
const EMERGENCY_TROOPS = 20;

const bus = new EventBus<GameEventMap>();
const canvas = requireElement<HTMLCanvasElement>('game-canvas');
const uiRoot = requireElement('ui-root');
const viewport = new Viewport(canvas, bus);
const upgrades = new UpgradeSystem(bus, new StorageManager());
const nodes = new NodeSystem(bus, upgrades);
const troops = new TroopSystem(bus, nodes, upgrades);
const towers = new TowerSystem(bus, nodes, troops, upgrades);
const particles = new ParticleSystem(bus);
const input = new InputManager(canvas, nodes, troops, bus);
const aiController = new AIController(nodes, troops, [CRIMSON_PROFILE, AMBER_PROFILE, VIOLET_PROFILE]);
const referee = new MatchReferee(bus, nodes, troops, (victory, seconds) =>
  upgrades.calculateBattleReward(victory, seconds),
);
const audio = new AudioManager(bus);
const shockwaves = new ShockwaveSystem(bus, nodes);
const screenShake = new ScreenShake();
const ads = new PortalAdManager();
const provinces = new ProvinceRenderer();
const audioControls: AudioControls = {
  isMuted: () => audio.isMuted,
  toggleMute: () => audio.toggleMute(),
};

let battleActive = false;
let paused = false;
let shopOpen = false;
let selectedNodeId: number | null = null;

const hud = new Hud(uiRoot, bus);
const airdrop = new AirdropButton(uiRoot, bus, ads, async () => {
  if (!battleActive) return false;
  const granted = await ads.showRewardedAd();
  return granted && battleActive && nodes.reinforceLargest('player', EMERGENCY_TROOPS);
});
const titleScreen = new TitleScreen(uiRoot, bus);

function startLevel(level: number): void {
  const map = generateMap(level, viewport.width, viewport.height, upgrades.startingTroopsBonus);
  troops.clear();
  towers.reset();
  input.clearSelection();
  nodes.load(map.nodes);
  aiController.reset();
  referee.begin(level);
  hud.setLevel(level);
  airdrop.reset();
  paused = false;
  battleActive = true;
}

function returnToMenu(): void {
  battleActive = false;
  paused = false;
  nodes.clear();
  troops.clear();
  input.clearSelection();
  hud.hide();
  airdrop.hide();
  titleScreen.show();
}

bus.on('node:selected', ({ nodeId }) => {
  selectedNodeId = nodeId;
  if (nodeId !== null) audio.playSelect();
});
bus.on('troop:clash', () => audio.playClash());
bus.on('tower:fired', () => audio.playTowerZap());
bus.on('node:upgraded', () => audio.playUpgrade());
bus.on('node:captured', () => {
  audio.playCapture();
  screenShake.addTrauma(CAPTURE_TRAUMA);
});
bus.on('battle:start', () => startLevel(upgrades.savedLevel));
bus.on('level:requested', ({ level }) => startLevel(level));
bus.on('menu:requested', returnToMenu);
bus.on('pause:changed', ({ paused: isPaused }) => {
  paused = isPaused;
});
bus.on('shop:open', () => {
  shopOpen = true;
});
bus.on('shop:closed', () => {
  shopOpen = false;
});
bus.on('battle:victory', () => {
  battleActive = false;
  audio.playVictory();
});
bus.on('battle:defeat', () => {
  battleActive = false;
  audio.playDefeat();
});

const loop = new GameLoop(
  {
    update: (stepSeconds) => {
      shockwaves.update(stepSeconds);
      screenShake.update(stepSeconds);
      if (!battleActive || paused || shopOpen) return;
      nodes.update(stepSeconds);
      aiController.update(stepSeconds);
      troops.update(stepSeconds);
      towers.update(stepSeconds);
      particles.update(stepSeconds);
      referee.update(stepSeconds);
    },
    render: () => {
      const shakeOffset = screenShake.sampleOffset();
      viewport.beginFrame(shakeOffset.x, shakeOffset.y);
      drawBackground(viewport, upgrades.equippedArena);
      provinces.render(viewport, nodes.nodes, upgrades.equippedArena);
      renderNodes(viewport.context, nodes.nodes, selectedNodeId, troops.troops);
      renderTroops(viewport.context, troops.troops, upgrades.equippedSkin);
      particles.render(viewport.context);
      shockwaves.render(viewport.context);
      renderTrajectory(viewport.context, nodes, input.drag);
    },
  },
  bus,
);

new PauseModal(uiRoot, bus, {
  getLevel: () => referee.level,
  canPause: () => battleActive && !shopOpen,
});
new SettingsModal(uiRoot, bus, audioControls);
new LevelSelectModal(uiRoot, bus, upgrades);
new ShopModal(uiRoot, bus, upgrades);
new EndModal(uiRoot, bus, ads, upgrades);
window.addEventListener('contextmenu', (event) => event.preventDefault());
titleScreen.show();
loop.start();
