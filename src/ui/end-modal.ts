import type { EventBus } from '../core/events';
import type { GameEventMap, MatchResult } from '../core/types';
import type { UpgradeSystem } from '../game/upgrade-system';
import { t } from '../i18n';
import type { PortalAdManager } from '../platform/portal-ad-manager';
import { createElement, createIcon, createIconButton, createTextButton, setButtonLabel } from './dom';

type Outcome = 'victory' | 'defeat';

export class EndModal {
  constructor(
    private readonly root: HTMLElement,
    private readonly bus: EventBus<GameEventMap>,
    private readonly ads: PortalAdManager,
    private readonly upgrades: UpgradeSystem,
  ) {
    bus.on('battle:victory', (result) => this.show('victory', result));
    bus.on('battle:defeat', (result) => this.show('defeat', result));
  }

  private show(outcome: Outcome, result: MatchResult): void {
    const modal = createElement('div', `end-modal end-modal--${outcome}`);
    const title = createElement('h2', 'end-modal__title', t(outcome === 'victory' ? 'battle.victory' : 'battle.defeat'));
    const stats = createElement('p', 'end-modal__stats', t('battle.stats', { level: result.level, seconds: result.seconds }));
    const rewardText = createElement('span', 'icon-label', t('battle.rewardCoins', { coins: result.coins }));
    const reward = createElement('p', 'end-modal__reward');
    reward.append(createIcon('coin'), rewardText);
    const actions = createElement('div', 'end-modal__actions');
    const primary = createTextButton('end-modal__action', t(outcome === 'victory' ? 'battle.nextLevel' : 'battle.retry'));
    const secondary = outcome === 'victory' ? this.createShopButton() : this.createMenuButton(modal);
    const nextLevel = outcome === 'victory' ? result.level + 1 : result.level;

    primary.addEventListener(
      'click',
      () => {
        modal.remove();
        this.bus.emit('level:requested', { level: nextLevel });
      },
      { once: true },
    );
    actions.append(primary);
    if (result.coins > 0 && this.ads.isAvailable()) actions.append(this.createDoubleButton(result, rewardText));
    actions.append(secondary);
    modal.append(title, stats, reward, actions);
    this.root.append(modal);
    primary.focus();
  }

  private createShopButton(): HTMLButtonElement {
    const button = createIconButton('end-modal__action end-modal__action--secondary', 'shop', t('menu.shop'));
    button.addEventListener('click', () => this.bus.emit('shop:open', undefined));
    return button;
  }

  private createMenuButton(modal: HTMLElement): HTMLButtonElement {
    const button = createTextButton('end-modal__action end-modal__action--secondary', t('battle.returnToMain'));
    button.addEventListener('click', () => {
      modal.remove();
      this.bus.emit('menu:requested', undefined);
    });
    return button;
  }

  private createDoubleButton(result: MatchResult, rewardText: HTMLElement): HTMLButtonElement {
    const button = createIconButton('end-modal__action end-modal__action--bonus', 'double', t('ads.doubleCoins'));
    button.addEventListener('click', () => void this.doubleReward(result, rewardText, button));
    return button;
  }

  private async doubleReward(result: MatchResult, rewardText: HTMLElement, button: HTMLButtonElement): Promise<void> {
    button.disabled = true;
    const granted = await this.ads.showRewardedAd();
    if (!granted) {
      button.disabled = false;
      return;
    }
    this.upgrades.addCoins(result.coins);
    rewardText.textContent = t('battle.rewardCoins', { coins: result.coins * 2 });
    setButtonLabel(button, t('ads.doubled'));
  }
}
