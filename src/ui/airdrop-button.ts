import type { EventBus } from '../core/events';
import type { GameEventMap } from '../core/types';
import { t } from '../i18n';
import { createIconButton, setButtonLabel } from './dom';
import { showToast } from './toast';

export class AirdropButton {
  private readonly button = createIconButton('airdrop-button', 'airdrop');
  private used = false;
  private pending = false;

  constructor(
    private readonly root: HTMLElement,
    bus: EventBus<GameEventMap>,
    private readonly requestAirdrop: () => Promise<boolean>,
  ) {
    this.button.hidden = true;
    this.button.addEventListener('click', () => void this.handleClick());
    root.append(this.button);
    this.refreshLabel();
    bus.on('settings:changed', () => this.refreshLabel());
  }

  reset(): void {
    this.used = false;
    this.pending = false;
    this.button.hidden = false;
    this.sync();
  }

  hide(): void {
    this.button.hidden = true;
  }

  private async handleClick(): Promise<void> {
    if (this.used || this.pending) return;
    this.pending = true;
    this.sync();
    const granted = await this.requestAirdrop();
    this.pending = false;
    this.used = granted;
    this.sync();
    if (granted) showToast(this.root, t('ads.airdropSuccess'), 'airdrop');
  }

  private sync(): void {
    this.button.disabled = this.used || this.pending;
  }

  private refreshLabel(): void {
    setButtonLabel(this.button, t('ads.emergency'));
  }
}
