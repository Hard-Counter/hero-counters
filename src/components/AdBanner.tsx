import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Constants from 'expo-constants';
import { loadAds, useAdsReady } from '../ads/consent';
import { useTheme } from '../theme';

type AdmobExtra = { admob?: { iosBanner?: string; androidBanner?: string } };

/**
 * Anchored banner above the tab bar. Development builds show Google's test ads.
 * Release builds show nothing until your own banner unit IDs are set in app.config.ts.
 * Hidden in Expo Go, which doesn't include the ads SDK.
 */
export default function AdBanner() {
  const t = useTheme();
  const { canRequestAds } = useAdsReady();
  const ads = loadAds();
  if (!ads || !canRequestAds) return null;

  const extra = Constants.expoConfig?.extra as AdmobExtra | undefined;
  const liveId = Platform.OS === 'ios' ? extra?.admob?.iosBanner : extra?.admob?.androidBanner;
  const unitId = __DEV__ ? ads.TestIds.BANNER : liveId;
  if (!unitId) return null;

  const { BannerAd, BannerAdSize } = ads;
  return (
    <View style={[styles.wrap, { backgroundColor: t.surface, borderTopColor: t.line }]}>
      <BannerAd unitId={unitId} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth },
});
