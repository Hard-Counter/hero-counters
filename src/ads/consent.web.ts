// Web build: no ads SDK and no consent flow.
export interface AdsState {
  canRequestAds: boolean;
}

export function loadAds(): null {
  return null;
}

export function prepareAds(): Promise<AdsState> {
  return Promise.resolve({ canRequestAds: false });
}

export function useAdsReady(): AdsState {
  return { canRequestAds: false };
}

export async function privacyOptionsRequired(): Promise<boolean> {
  return false;
}

export async function showPrivacyOptions(): Promise<void> {
  // Nothing to show on the web.
}
