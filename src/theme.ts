import { useMemo } from 'react';
import type { BanRisk, Confidence, RoleId, Tier } from './data/types';
import { useScheme } from './useScheme';

export interface Theme {
  dark: boolean;
  bg: string;
  bgDeep: string;
  surface: string;
  surface2: string;
  line: string;
  ink: string;
  ink2: string;
  ink3: string;
  accent: string;
  onAccent: string;
  enemy: string;
  role: Record<RoleId, string>;
  tier: Record<Tier, string>;
  tierInk: string;
  ban: Record<BanRisk, string>;
  conf: Record<Confidence, string>;
}

// Classic tier-list bands; the same in both themes, always with dark ink.
const TIER: Record<Tier, string> = {
  S: '#FF7F7F',
  A: '#FFBF7F',
  B: '#FFDF7F',
  C: '#FFFF7F',
  D: '#BFFF7F',
  F: '#C9BFFF',
};

export const darkTheme: Theme = {
  dark: true,
  bg: '#0E1218',
  bgDeep: '#090C11',
  surface: '#161C25',
  surface2: '#1F2733',
  line: '#2A3441',
  ink: '#EDF1F6',
  ink2: '#A2ADBD',
  ink3: '#6F7B8E',
  accent: '#F2B63D',
  onAccent: '#1B1303',
  enemy: '#FF5465',
  role: { vanguard: '#6AA6FF', duelist: '#FF8C4D', strategist: '#3ED39B' },
  tier: TIER,
  tierInk: '#17120A',
  ban: { high: '#FF5465', medium: '#F2A33D', low: '#6F7B8E' },
  conf: { data: '#3ED39B', kit: '#6AA6FF', consensus: '#C69CFF' },
};

export const lightTheme: Theme = {
  dark: false,
  bg: '#F2F4F7',
  bgDeep: '#E3E7ED',
  surface: '#FFFFFF',
  surface2: '#E8ECF1',
  line: '#D3DAE3',
  ink: '#0E131A',
  ink2: '#455064',
  ink3: '#6E798C',
  accent: '#A06D00',
  onAccent: '#FFFFFF',
  enemy: '#D63447',
  role: { vanguard: '#2E6BD9', duelist: '#CC5418', strategist: '#0C8F63' },
  tier: TIER,
  tierInk: '#17120A',
  ban: { high: '#D63447', medium: '#B36B00', low: '#6E798C' },
  conf: { data: '#0C8A60', kit: '#2E6BD9', consensus: '#7C4DD8' },
};

// Loaded in App.tsx with expo-font. If a font fails to load, the system font is used.
export const FONT = {
  body: 'Barlow_400Regular',
  bodySemi: 'Barlow_600SemiBold',
  bodyBold: 'Barlow_700Bold',
  display: 'BarlowCondensed_800ExtraBold',
  displayBold: 'BarlowCondensed_700Bold',
} as const;

export function useTheme(): Theme {
  return useScheme() === 'light' ? lightTheme : darkTheme;
}

/** Memoized per theme. Pass a module-level factory that returns StyleSheet.create({...}). */
export function useStyles<T>(factory: (t: Theme) => T): T {
  const t = useTheme();
  return useMemo(() => factory(t), [factory, t]);
}

/** '#RRGGBB' plus an opacity from 0 to 1 -> '#RRGGBBAA' */
export function alpha(hex: string, opacity: number): string {
  return hex + Math.round(opacity * 255).toString(16).padStart(2, '0');
}
