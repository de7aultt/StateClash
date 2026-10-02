import type { EventBus } from '../core/events';
import type { GameEventMap } from '../core/types';
import { t } from '../i18n';
import { createElement, createIconButton, createTextButton, setButtonLabel } from './dom';
import { LabelSet } from './labels';

export interface PauseActions {
  getLevel: () => number;
  canPause: () => boolean;
}

export class PauseModal {
  private readonly overlay = createElement('div', 'pause-modal');
  private readonly labels = new LabelSet();
  private isOpen = false;

  constructor(
    root: HTMLElement,
    private readonly bus: EventBus<GameEventMap>,
    private readonly actions: PauseActions,
  ) {
    const panel = createElement('div', 'pause-modal__panel');
    const title = createElement('h2', 'pause-modal__title');
    const resume = createTextButton('menu-button menu-button--primary', '');
    const restart = createTextButton('menu-button', '');
    const settings = createIconButton('menu-button', 'settings');
    const mainMenu = createTextButton('menu-button', '');

    this.labels.text(title, () => t('pause.title'));
    this.labels.text(resume, () => t('pause.resume'));
    this.labels.text(restart, () => t('pause.restart'));
    this.labels.add(() => setButtonLabel(settings, t('menu.settings')));
    this.labels.text(mainMenu, () => t('pause.mainMenu'));

    resume.addEventListener('click', () => this.close());
    restart.addEventListener('click', () => {
      this.close();
      this.bus.emit('level:requested', { level: this.actions.getLevel() });
    });
    settings.addEventListener('click', () => this.bus.emit('settings:open', undefined));
    mainMenu.addEventListener('click', () => {
      this.close();
      this.bus.emit('menu:requested', undefined);
    });

    panel.append(title, resume, restart, settings, mainMenu);
    this.overlay.hidden = true;
    this.overlay.append(panel);
    root.append(this.overlay);

    bus.on('pause:requested', () => this.open());
    bus.on('settings:changed', () => this.labels.refresh());
    window.addEventListener('keydown', this.handleKeyDown);
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape') return;
    if (this.isOpen) this.close();
    else this.open();
  };

  private open(): void {
    if (this.isOpen || !this.actions.canPause()) return;
    this.isOpen = true;
    this.overlay.hidden = false;
    this.bus.emit('pause:changed', { paused: true });
  }

  private close(): void {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.overlay.hidden = true;
    this.bus.emit('pause:changed', { paused: false });
  }
}
