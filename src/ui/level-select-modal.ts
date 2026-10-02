import type { EventBus } from '../core/events';
import type { GameEventMap } from '../core/types';
import { LEVEL_COUNT } from '../game/progress-config';
import type { UpgradeSystem } from '../game/upgrade-system';
import { t } from '../i18n';
import { createElement, createIcon, createTextButton } from './dom';
import { closeOnEscape } from './overlay';

export class LevelSelectModal {
  private readonly overlay = createElement('div', 'level-modal');
  private readonly titleLabel = createElement('h2', 'level-modal__title');
  private readonly grid = createElement('div', 'level-modal__grid');
  private readonly backButton = createTextButton('menu-button', '');
  private isOpen = false;

  constructor(
    root: HTMLElement,
    private readonly bus: EventBus<GameEventMap>,
    private readonly progress: UpgradeSystem,
  ) {
    const panel = createElement('div', 'level-modal__panel');
    this.backButton.addEventListener('click', () => this.close());
    panel.append(this.titleLabel, this.grid, this.backButton);
    this.overlay.hidden = true;
    this.overlay.append(panel);
    root.append(this.overlay);

    bus.on('levels:open', () => this.open());
    bus.on('settings:changed', () => this.refresh());
    bus.on('economy:updated', () => this.refresh());
    closeOnEscape(() => this.isOpen, () => this.close());
  }

  private open(): void {
    this.isOpen = true;
    this.overlay.hidden = false;
    this.refresh();
  }

  private close(): void {
    this.isOpen = false;
    this.overlay.hidden = true;
  }

  private refresh(): void {
    if (!this.isOpen) return;
    this.titleLabel.textContent = t('levels.title');
    this.backButton.textContent = t('menu.back');
    const tiles: HTMLButtonElement[] = [];
    for (let level = 1; level <= LEVEL_COUNT; level++) tiles.push(this.createTile(level));
    this.grid.replaceChildren(...tiles);
  }

  private createTile(level: number): HTMLButtonElement {
    const unlocked = level <= this.progress.maxUnlockedLevel;
    const tile = createTextButton('level-tile', unlocked ? String(level) : '');
    if (!unlocked) {
      tile.disabled = true;
      tile.append(createIcon('lock'));
      return tile;
    }
    if (level === this.progress.savedLevel) tile.classList.add('level-tile--current');
    tile.addEventListener('click', () => {
      this.close();
      this.bus.emit('level:requested', { level });
    });
    return tile;
  }
}
