import type { ConfigContext, ExpoConfig } from 'expo/config';

// ---------------------------------------------------------------------------
// Edit these before your first store build.
// ---------------------------------------------------------------------------
const APP = {
  name: 'Hard Counter', // Keep "Marvel" and "Marvel Rivals" out of the name.
  slug: 'hard-counter',
  version: '0.1.0',
  // Permanent once the app is in a store, and kept free of anyone's personal name so the
  // app can move to a company account later.
  iosBundleId: 'com.hardcounter.app',
  androidPackage: 'com.hardcounter.app',
};

// AdMob. The app IDs below are Google's public test IDs; replace them with your own
// from admob.google.com, and add your banner ad unit IDs, before release.
const ADMOB = {
  iosAppId: 'ca-app-pub-3940256099942544~1458002511',
  androidAppId: 'ca-app-pub-3940256099942544~3347511713',
  iosBanner: '', // e.g. ca-app-pub-1234567890123456/1234567890
  androidBanner: '',
};

// Where the app looks for newer hero data (the output of scripts/build-data.mjs).
// Must be an https:// URL to a public copy of src/data/heroes.json. Leave empty
// to use only the data built into the app. This is the raw file on the repo's main
// branch, so pushing a new revision there updates installed apps (GitHub caches it
// for about five minutes).
const DATA_URL = 'https://raw.githubusercontent.com/Nemesis-Counter/hero-counters/main/src/data/heroes.json';

// Public URL of your privacy policy (see PRIVACY.md). Both stores require one.
const PRIVACY_URL = '';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: APP.name,
  slug: APP.slug,
  version: APP.version,
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  icon: './assets/app-icon.png',
  backgroundColor: '#0E1218',
  ios: {
    ...config.ios,
    bundleIdentifier: APP.iosBundleId,
    supportsTablet: false,
    infoPlist: {
      ...config.ios?.infoPlist,
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    ...config.android,
    package: APP.androidPackage,
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#0E1218',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    ...config.web,
    favicon: './assets/app-icon.png',
  },
  plugins: [
    ...(config.plugins ?? []),
    'expo-status-bar',
    'expo-font',
    ['react-native-google-mobile-ads', { iosAppId: ADMOB.iosAppId, androidAppId: ADMOB.androidAppId }],
    [
      'expo-tracking-transparency',
      { userTrackingPermission: 'This lets us show ads that are more relevant to you. The app works the same if you decline.' },
    ],
  ],
  extra: {
    ...config.extra,
    dataUrl: DATA_URL,
    privacyUrl: PRIVACY_URL,
    admob: { iosBanner: ADMOB.iosBanner, androidBanner: ADMOB.androidBanner },
  },
});
