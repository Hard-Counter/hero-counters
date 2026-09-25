import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import bundledJson from './heroes.json';
import type { Dataset } from './types';
import { isValidDataset } from '../logic';

const bundled = bundledJson as unknown as Dataset;
const CACHE_KEY = 'dataset.v1';

export type DataSource = 'bundled' | 'cached' | 'live';

function dataUrl(): string | undefined {
  const extra = Constants.expoConfig?.extra as { dataUrl?: string } | undefined;
  const url = extra?.dataUrl;
  return url && url.startsWith('https://') ? url : undefined;
}

/**
 * Starts with the data built into the app, then uses a newer copy from the device
 * cache or from `extra.dataUrl` (set in app.config.ts). A copy only replaces the
 * current data when it passes validation and has a higher revision number, so a
 * broken or old file on the server can never break the app.
 */
export function useDataset(): { data: Dataset; source: DataSource } {
  const [state, setState] = useState<{ data: Dataset; source: DataSource }>({ data: bundled, source: 'bundled' });

  useEffect(() => {
    let alive = true;
    let best: Dataset = bundled;

    (async () => {
      try {
        const raw = await AsyncStorage.getItem(CACHE_KEY);
        if (raw) {
          const cached: unknown = JSON.parse(raw);
          if (isValidDataset(cached) && cached.revision > best.revision) {
            best = cached;
            if (alive) setState({ data: cached, source: 'cached' });
          }
        }
      } catch {
        // A broken cache is ignored.
      }

      const url = dataUrl();
      if (!url) return;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      try {
        const res = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
        if (!res.ok) return;
        const remote: unknown = await res.json();
        if (isValidDataset(remote) && remote.revision > best.revision) {
          if (alive) setState({ data: remote, source: 'live' });
          await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(remote));
        }
      } catch {
        // Offline or a bad file: keep what we have.
      } finally {
        clearTimeout(timer);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  return state;
}
