import type { EventBus } from '../core/events';
import type { GameEventMap } from '../core/types';
import { t } from '../i18n';
import { createElement, createIconButton } from './dom';
import { LabelSet } from './labels';

export class Hud {
  private readonly container = createElement('div', 'hud');
  private readonly levelLabel = createElement('span', 'hud__level');
  private readonly pauseButton = createIconButton('hud__pause', 'pause');
  private readonly labels = new LabelSet();
  private level = 1;

  constructor(root: HTMLElement, bus: EventBus<GameEventMap>) {
    this.pauseButton.addEventListener('click', () => bus.emit('pause:requested', undefined));
    this.labels.text(this.levelLabel, () => t('hud.level', { level: this.level }));
    this.labels.add(() => this.pauseButton.setAttribute('aria-label', t('hud.pause')));
    this.container.hidden = true;
    this.container.append(this.levelLabel, this.pauseButton);
    root.append(this.container);
    bus.on('settings:changed', () => this.labels.refresh());
  }

  setLevel(level: number): void {
    this.level = level;
    this.labels.refresh();
    this.container.hidden = false;
  }

  hide(): void {
    this.container.hidden = true;
  }
}
