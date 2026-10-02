import type { ArenaId, SkinId, UpgradeId } from '../core/types';
import { ARENA_IDS, ARENA_PRICES, SKIN_IDS, SKIN_PERKS, SKIN_PRICES } from '../game/cosmetics-config';
import { MAX_UPGRADE_TIER, UPGRADE_IDS, UPGRADE_STEP } from '../game/upgrade-config';
import type { UpgradeSystem } from '../game/upgrade-system';
import { t, type TranslationKey } from '../i18n';
import { BIOMES } from '../render/biomes';
import { drawSkinShape } from '../render/troop-skins';
import { createElement, createIcon, createTextButton } from './dom';

interface CosmeticSpec {
  name: string;
  price: number;
  owned: boolean;
  equipped: boolean;
  affordable: boolean;
  preview: HTMLElement;
  badge?: string;
  onBuy: () => void;
  onEquip: () => void;
}

const UPGRADE_LABELS: Record<UpgradeId, { name: TranslationKey; description: TranslationKey }> = {
  production: { name: 'armory.production', description: 'armory.productionDesc' },
  startingTroops: { name: 'armory.starting', description: 'armory.startingDesc' },
  marchSpeed: { name: 'armory.speed', description: 'armory.speedDesc' },
  towerPower: { name: 'armory.tower', description: 'armory.towerDesc' },
};

const SKIN_LABELS: Record<SkinId, TranslationKey> = {
  vanguard: 'skin.vanguard',
  drones: 'skin.drones',
  tanks: 'skin.tanks',
  phantoms: 'skin.phantoms',
};

const ARENA_LABELS: Record<ArenaId, TranslationKey> = {
  cyber: 'arena.cyber',
  volcanic: 'arena.volcanic',
  emerald: 'arena.emerald',
  arctic: 'arena.arctic',
};

const PREVIEW_SIZE = { width: 96, height: 56 };
const PREVIEW_COLOR = '#3fc8ff';

function formatBonus(id: UpgradeId, tier: number): string {
  const total = tier * UPGRADE_STEP[id];
  return id === 'startingTroops' ? `+${total}` : `+${Math.round(total * 100)}%`;
}

function createSkinPreview(skin: SkinId): HTMLCanvasElement {
  const canvas = createElement('canvas', 'shop-card__preview');
  canvas.width = PREVIEW_SIZE.width;
  canvas.height = PREVIEW_SIZE.height;
  const context = canvas.getContext('2d');
  if (context) {
    drawSkinShape(context, skin, {
      x: PREVIEW_SIZE.width / 2,
      y: PREVIEW_SIZE.height / 2,
      directionX: 1,
      directionY: 0,
      radius: 9,
      color: PREVIEW_COLOR,
      time: 0,
    });
  }
  return canvas;
}

function createArenaPreview(arena: ArenaId): HTMLElement {
  const biome = BIOMES[arena];
  const preview = createElement('div', 'shop-card__preview');
  preview.style.background = `linear-gradient(135deg, ${biome.backgroundCenter}, rgba(${biome.shelfRgb}, 0.55))`;
  preview.style.borderColor = biome.coastColor;
  return preview;
}

function createPriceTag(price: number): HTMLElement {
  const tag = createElement('span', 'shop-card__price');
  tag.append(createIcon('coin'), createElement('span', 'icon-label', String(price)));
  return tag;
}

function createCosmeticCard(spec: CosmeticSpec): HTMLElement {
  const card = createElement('div', 'shop-card');
  const button = createTextButton('shop-card__action', '');
  if (spec.equipped) {
    button.textContent = t('shop.equipped');
    button.disabled = true;
  } else if (spec.owned) {
    button.textContent = t('shop.equip');
    button.addEventListener('click', spec.onEquip);
  } else {
    button.textContent = t('shop.buy');
    button.disabled = !spec.affordable;
    button.addEventListener('click', spec.onBuy);
  }
  card.append(spec.preview);
  if (spec.badge) card.append(createElement('div', 'shop-card__perk', spec.badge));
  card.append(createElement('h3', 'shop-card__name', spec.name));
  if (!spec.owned) card.append(createPriceTag(spec.price));
  card.append(button);
  return card;
}

export function createUpgradeCards(economy: UpgradeSystem): HTMLElement[] {
  return UPGRADE_IDS.map((id) => {
    const tier = economy.tierOf(id);
    const cost = economy.costOf(id);
    const card = createElement('div', 'shop-card');
    const pips = createElement('div', 'shop-card__pips');
    for (let pip = 0; pip < MAX_UPGRADE_TIER; pip++) {
      pips.append(createElement('span', pip < tier ? 'shop-card__pip shop-card__pip--filled' : 'shop-card__pip'));
    }
    const button = createTextButton('shop-card__action', cost === null ? t('armory.max') : t('armory.upgrade', { cost }));
    button.disabled = cost === null || cost > economy.coins;
    button.addEventListener('click', () => economy.purchaseUpgrade(id));
    card.append(
      createElement('h3', 'shop-card__name', t(UPGRADE_LABELS[id].name)),
      createElement('p', 'shop-card__text', t(UPGRADE_LABELS[id].description)),
      pips,
      createElement('p', 'shop-card__text', t('armory.tier', { tier, max: MAX_UPGRADE_TIER })),
      createElement('p', 'shop-card__text', t('armory.current', { bonus: formatBonus(id, tier) })),
      button,
    );
    return card;
  });
}

export function createSkinCards(economy: UpgradeSystem): HTMLElement[] {
  return SKIN_IDS.map((id) =>
    createCosmeticCard({
      name: t(SKIN_LABELS[id]),
      price: SKIN_PRICES[id],
      owned: economy.ownsSkin(id),
      equipped: economy.equippedSkin === id,
      affordable: economy.coins >= SKIN_PRICES[id],
      preview: createSkinPreview(id),
      badge: t(SKIN_PERKS[id].perkKey),
      onBuy: () => economy.purchaseSkin(id),
      onEquip: () => economy.equipSkin(id),
    }),
  );
}

export function createArenaCards(economy: UpgradeSystem): HTMLElement[] {
  return ARENA_IDS.map((id) =>
    createCosmeticCard({
      name: t(ARENA_LABELS[id]),
      price: ARENA_PRICES[id],
      owned: economy.ownsArena(id),
      equipped: economy.equippedArena === id,
      affordable: economy.coins >= ARENA_PRICES[id],
      preview: createArenaPreview(id),
      onBuy: () => economy.purchaseArena(id),
      onEquip: () => economy.equipArena(id),
    }),
  );
}
