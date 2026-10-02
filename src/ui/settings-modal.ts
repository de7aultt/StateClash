import type { EventBus } from '../core/events';
import type { GameEventMap } from '../core/types';
import { getLanguage, type Language, SUPPORTED_LANGUAGES, setLanguage, t } from '../i18n';
import { createElement, createIconButton, createTextButton, setButtonIcon, setButtonLabel } from './dom';
import { closeOnEscape } from './overlay';

export interface AudioControls {
  isMuted: () => boolean;
  toggleMute: () => boolean;
}

export class SettingsModal {
  private readonly overlay = createElement('div', 'settings-modal');
  private readonly titleLabel = createElement('h2', 'settings-modal__title');
  private readonly languageLabel = createElement('p', 'settings-modal__caption');
  private readonly soundButton = createIconButton('menu-button', 'sound-on');
  private readonly closeButton = createTextButton('menu-button menu-button--primary', '');
  private readonly languageButtons = new Map<Language, HTMLButtonElement>();
  private isOpen = false;

  constructor(
    root: HTMLElement,
    private readonly bus: EventBus<GameEventMap>,
    private readonly audio: AudioControls,
  ) {
    const panel = createElement('div', 'settings-modal__panel');
    const languageRow = createElement('div', 'settings-modal__languages');
    for (const language of SUPPORTED_LANGUAGES) {
      const button = createTextButton('language-button', language.toUpperCase());
      button.addEventListener('click', () => {
        setLanguage(language);
        this.bus.emit('settings:changed', undefined);
      });
      this.languageButtons.set(language, button);
      languageRow.append(button);
    }
    this.soundButton.addEventListener('click', () => {
      this.audio.toggleMute();
      this.bus.emit('settings:changed', undefined);
    });
    this.closeButton.addEventListener('click', () => this.close());
    panel.append(this.titleLabel, this.soundButton, this.languageLabel, languageRow, this.closeButton);
    this.overlay.hidden = true;
    this.overlay.append(panel);
    root.append(this.overlay);

    bus.on('settings:open', () => this.open());
    bus.on('settings:changed', () => this.refresh());
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
    this.titleLabel.textContent = t('settings.title');
    this.languageLabel.textContent = t('settings.language');
    this.closeButton.textContent = t('settings.close');
    setButtonIcon(this.soundButton, this.audio.isMuted() ? 'sound-off' : 'sound-on');
    setButtonLabel(this.soundButton, t('settings.sound'));
    for (const [language, button] of this.languageButtons) {
      button.classList.toggle('language-button--active', language === getLanguage());
    }
  }
}
