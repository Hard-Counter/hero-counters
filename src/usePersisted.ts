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
