import type { EventBus } from '../core/events';
import type { GameEventMap } from '../core/types';
import { t } from '../i18n';
import { createElement, createIconButton, createTextButton, setButtonLabel } from './dom';
import { LabelSet } from './labels';

const LEAVE_TRANSITION_MS = 350;

export class TitleScreen {
  private readonly screen = createElement('div', 'title-screen');
  private readonly playButton = createTextButton('menu-button menu-button--primary', '');
  private readonly labels = new LabelSet();

  constructor(
    private readonly root: HTMLElement,
    private readonly bus: EventBus<GameEventMap>,
  ) {
    const heading = createElement('div', 'title-screen__heading');
    const name = createElement('h1', 'title-screen__name');
    const tagline = createElement('p', 'title-screen__tagline');
    const panel = createElement('div', 'title-screen__panel');
    const levels = createTextButton('menu-button', '');
    const shop = createIconButton('menu-button', 'shop');
    const settings = createIconButton('menu-button', 'settings');

    this.labels.text(name, () => t('title.name'));
    this.labels.text(tagline, () => t('title.tagline'));
    this.labels.text(this.playButton, () => t('menu.play'));
    this.labels.text(levels, () => t('menu.selectLevel'));
    this.labels.add(() => setButtonLabel(shop, t('menu.shop')));
    this.labels.add(() => setButtonLabel(settings, t('menu.settings')));

    this.playButton.addEventListener('click', () => this.bus.emit('battle:start', undefined));
    levels.addEventListener('click', () => this.bus.emit('levels:open', undefined));
    shop.addEventListener('click', () => this.bus.emit('shop:open', undefined));
    settings.addEventListener('click', () => this.bus.emit('settings:open', undefined));

    heading.append(name, tagline);
    panel.append(this.playButton, levels, shop, settings);
    this.screen.append(heading, panel);
    bus.on('settings:changed', () => this.labels.refresh());
    bus.on('battle:start', () => this.hide());
    bus.on('level:requested', () => this.hide());
  }

  show(): void {
    this.screen.classList.remove('is-leaving');
    this.root.append(this.screen);
    this.playButton.focus();
  }

  private hide(): void {
    if (!this.screen.isConnected) return;
    this.screen.classList.add('is-leaving');
    window.setTimeout(() => {
      if (this.screen.classList.contains('is-leaving')) this.screen.remove();
    }, LEAVE_TRANSITION_MS);
  }
}
