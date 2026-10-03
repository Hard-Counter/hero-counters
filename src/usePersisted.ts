import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/** A small string setting remembered on the device (platform, rank bracket, your role). */
export function usePersisted<T extends string>(key: string, initial: T, allowed: readonly T[]): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(initial);

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(`pref.${key}`)
      .then((stored) => {
        if (alive && stored && (allowed as readonly string[]).includes(stored)) setValue(stored as T);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
    // `allowed` is a constant list; reading it once is enough.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const update = useCallback(
    (next: T) => {
      setValue(next);
      AsyncStorage.setItem(`pref.${key}`, next).catch(() => undefined);
    },
    [key],
  );

  return [value, update];
}

/** A short list of ids remembered on the device (your starred heroes). */
export function usePersistedList(key: string, max = 60): [string[], (next: string[]) => void] {
  const [value, setValue] = useState<string[]>([]);

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(`pref.${key}`)
      .then((stored) => {
        if (!alive || !stored) return;
        try {
          const parsed: unknown = JSON.parse(stored);
          if (Array.isArray(parsed)) setValue(parsed.filter((x): x is string => typeof x === 'string').slice(0, max));
        } catch {
          // A broken value is ignored.
        }
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [key, max]);

  const update = useCallback(
    (next: string[]) => {
      const list = next.slice(0, max);
      setValue(list);
      AsyncStorage.setItem(`pref.${key}`, JSON.stringify(list)).catch(() => undefined);
    },
    [key, max],
  );

  return [value, update];
}
