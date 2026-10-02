import type { EventBus } from '../core/events';
import type { GameEventMap } from '../core/types';
import type { UpgradeSystem } from '../game/upgrade-system';
import { t, type TranslationKey } from '../i18n';
import { createElement, createIcon, createTextButton } from './dom';
import { createArenaCards, createSkinCards, createUpgradeCards } from './shop-cards';

type ShopTab = 'upgrades' | 'skins' | 'arenas';

const TABS: ReadonlyArray<{ id: ShopTab; label: TranslationKey }> = [
  { id: 'upgrades', label: 'shop.tabUpgrades' },
  { id: 'skins', label: 'shop.tabSkins' },
  { id: 'arenas', label: 'shop.tabArenas' },
];

export class ShopModal {
  private readonly overlay = createElement('div', 'shop-modal');
  private readonly titleLabel = createElement('h2', 'shop-modal__title');
  private readonly coinsLabel = createElement('span', 'icon-label');
  private readonly tabBar = createElement('div', 'shop-modal__tabs');
  private readonly content = createElement('div', 'shop-modal__content');
  private readonly closeButton = createTextButton('shop-modal__close', '');
  private readonly tabButtons = new Map<ShopTab, HTMLButtonElement>();
  private activeTab: ShopTab = 'upgrades';
  private isOpen = false;

  constructor(
    root: HTMLElement,
    private readonly bus: EventBus<GameEventMap>,
    private readonly economy: UpgradeSystem,
  ) {
    const panel = createElement('div', 'shop-modal__panel');
    const coinsRow = createElement('div', 'shop-modal__coins');
    coinsRow.append(createIcon('coin'), this.coinsLabel);
    for (const tab of TABS) {
      const button = createTextButton('shop-tab', '');
      button.addEventListener('click', () => {
        this.activeTab = tab.id;
        this.refresh();
      });
      this.tabButtons.set(tab.id, button);
      this.tabBar.append(button);
    }
    this.closeButton.addEventListener('click', () => this.close());
    panel.append(this.titleLabel, coinsRow, this.tabBar, this.content, this.closeButton);
    this.overlay.hidden = true;
    this.overlay.append(panel);
    root.append(this.overlay);

    bus.on('shop:open', () => this.open());
    bus.on('economy:updated', () => this.refresh());
    bus.on('settings:changed', () => this.refresh());
    window.addEventListener('keydown', this.handleKeyDown, true);
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (!this.isOpen || event.key !== 'Escape') return;
    event.stopImmediatePropagation();
    this.close();
  };

  private open(): void {
    this.isOpen = true;
    this.overlay.hidden = false;
    this.refresh();
  }

  private close(): void {
    this.isOpen = false;
    this.overlay.hidden = true;
    this.bus.emit('shop:closed', undefined);
  }

  private refresh(): void {
    if (!this.isOpen) return;
    this.titleLabel.textContent = t('shop.title');
    this.closeButton.textContent = t('shop.close');
    this.coinsLabel.textContent = t('shop.coins', { coins: this.economy.coins });
    for (const tab of TABS) {
      const button = this.tabButtons.get(tab.id);
      if (!button) continue;
      button.textContent = t(tab.label);
      button.classList.toggle('shop-tab--active', tab.id === this.activeTab);
    }
    this.content.replaceChildren(...this.buildCards());
  }

  private buildCards(): HTMLElement[] {
    if (this.activeTab === 'skins') return createSkinCards(this.economy);
    if (this.activeTab === 'arenas') return createArenaCards(this.economy);
    return createUpgradeCards(this.economy);
  }
}
