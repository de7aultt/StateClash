interface CrazyGamesAdCallbacks {
  adStarted?: () => void;
  adFinished?: () => void;
  adError?: (error: unknown) => void;
}

interface CrazyGamesSdk {
  ad: {
    requestAd: (type: 'rewarded', callbacks: CrazyGamesAdCallbacks) => void;
  };
}

interface PokiSdk {
  rewardedBreak: () => Promise<boolean>;
}

declare global {
  interface Window {
    CrazyGames?: { SDK?: CrazyGamesSdk };
    PokiSDK?: PokiSdk;
  }
}

const DEBUG_ADS_PARAMETER = 'debugAds';
const SIMULATED_AD_DELAY_MS = 600;

export class PortalAdManager {
  isAvailable(): boolean {
    if (window.CrazyGames?.SDK || window.PokiSDK) return true;
    return new URLSearchParams(window.location.search).get(DEBUG_ADS_PARAMETER) === '1';
  }

  showRewardedAd(): Promise<boolean> {
    const crazyGames = window.CrazyGames?.SDK;
    if (crazyGames) return this.showCrazyGamesAd(crazyGames);
    const poki = window.PokiSDK;
    if (poki) return poki.rewardedBreak().catch(() => false);
    if (!this.isAvailable()) return Promise.resolve(false);
    return new Promise((resolve) => window.setTimeout(() => resolve(true), SIMULATED_AD_DELAY_MS));
  }

  private showCrazyGamesAd(sdk: CrazyGamesSdk): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        sdk.ad.requestAd('rewarded', {
          adFinished: () => resolve(true),
          adError: () => resolve(false),
        });
      } catch {
        resolve(false);
      }
    });
  }
}
