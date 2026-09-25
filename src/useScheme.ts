import { useColorScheme } from 'react-native';

/** Follows the phone's light/dark setting. Dark when the system gives no answer. */
export function useScheme(): 'light' | 'dark' {
  return useColorScheme() === 'light' ? 'light' : 'dark';
}
