import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

type AdsModule = typeof import('react-native-google-mobile-ads');

let adsModule: AdsModule | null | undefined;

/** The Google Mobile Ads SDK, or null in Expo Go, which doesn't include it. */
export function loadAds(): AdsModule | null {
  if (adsModule !== undefined) return adsModule;
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    adsModule = null;
    return adsModule;
  }
  try {
    // Loaded lazily so the app still opens in Expo Go without the native module.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    adsModule = require('react-native-google-mobile-ads') as AdsModule;
  } catch {
    adsModule = null;
  }
  return adsModule;
}

export interface AdsState {
  canRequestAds: boolean;
}

let ready: Promise<AdsState> | null = null;

/**
 * Runs once per launch: Google's consent form where the law requires it (EEA, UK,
 * Switzerland and similar), then Apple's tracking prompt on iPhone, then starts the
 * ads SDK. Declining either still shows ads, just not personalized ones.
 */
export function prepareAds(): Promise<AdsState> {
  if (!ready) {
    ready = (async (): Promise<AdsState> => {
      const ads = loadAds();
      if (!ads) return { canRequestAds: false };

      try {
        await ads.AdsConsent.requestInfoUpdate();
        await ads.AdsConsent.loadAndShowConsentFormIfRequired();
      } catch {
        // Consent service unreachable: fall back to what the SDK already knows.
      }

      if (Platform.OS === 'ios') {
        try {
          // Lazy for the same reason as the ads SDK above.
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const tracking = require('expo-tracking-transparency') as typeof import('expo-tracking-transparency');
          await tracking.requestTrackingPermissionsAsync();
        } catch {
          // Prompt unavailable; ads stay non-personalized.
        }
      }

      try {
        const info = await ads.AdsConsent.getConsentInfo();
        if (!info.canRequestAds) return { canRequestAds: false };
        await ads.default().initialize();
        return { canRequestAds: true };
      } catch {
        return { canRequestAds: false };
      }
    })();
  }
  return ready;
}

export function useAdsReady(): AdsState {
  const [state, setState] = useState<AdsState>({ canRequestAds: false });
  useEffect(() => {
    let alive = true;
    prepareAds()
      .then((s) => {
        if (alive) setState(s);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);
  return state;
}

/** True where the law requires an in-app way to change ad consent. */
export async function privacyOptionsRequired(): Promise<boolean> {
  const ads = loadAds();
  if (!ads) return false;
  try {
    await prepareAds();
    const info = await ads.AdsConsent.getConsentInfo();
    return String(info.privacyOptionsRequirementStatus) === 'REQUIRED';
  } catch {
    return false;
  }
}

export async function showPrivacyOptions(): Promise<void> {
  const ads = loadAds();
  if (!ads) return;
  await ads.AdsConsent.showPrivacyOptionsForm();
}
