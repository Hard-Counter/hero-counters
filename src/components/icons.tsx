import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import type { RoleId } from '../data/types';

export type IconName =
  | RoleId
  | 'tiers'
  | 'draft'
  | 'comps'
  | 'about'
  | 'close'
  | 'plus'
  | 'search'
  | 'arrow'
  | 'back'
  | 'chevron'
  | 'buffed'
  | 'nerfed'
  | 'mixed'
  | 'flex'
  | 'star'
  | 'starred'
  | 'notmine'
  | 'notmineOn';

// A thumbs-down: the hand with its thumb pointing down, and a separate cuff on the right.
const THUMB_DOWN =
  'M16 14.5l-3.6 6.6c-.3.6-1 .9-1.6.7-1-.3-1.6-1.3-1.4-2.3l.6-3.5H5.2c-1.3 0-2.3-1.2-2-2.5l1.4-7.2C4.8 4.4 5.7 3.6 6.8 3.6H16z';
const THUMB_CUFF = 'M18 3.6h3v10.9h-3z';

/** Original role and interface icons (no game artwork). */
export function Icon({ name, size = 16, color }: { name: IconName; size?: number; color: string }) {
  const stroke = { stroke: color, strokeWidth: 2, strokeLinecap: 'round' as const, fill: 'none' };
  switch (name) {
    case 'vanguard':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path fill={color} d="M12 2l8 3v6c0 5.2-3.4 9.4-8 11-4.6-1.6-8-5.8-8-11V5l8-3z" />
        </Svg>
      );
    case 'duelist':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path fill={color} d="M12 1.5l5.5 10.5L12 22.5 6.5 12z" />
        </Svg>
      );
    case 'strategist':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path fill={color} d="M9.25 3h5.5v6.25H21v5.5h-6.25V21h-5.5v-6.25H3v-5.5h6.25z" />
        </Svg>
      );
    case 'tiers':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Rect x={3} y={4} width={18} height={3.4} rx={1.2} fill={color} />
          <Rect x={3} y={10.3} width={13} height={3.4} rx={1.2} fill={color} />
          <Rect x={3} y={16.6} width={8} height={3.4} rx={1.2} fill={color} />
        </Svg>
      );
    case 'draft':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Circle cx={12} cy={12} r={7.5} {...stroke} />
          <Path d="M12 1.8v4M12 18.2v4M1.8 12h4M18.2 12h4" {...stroke} />
          <Circle cx={12} cy={12} r={1.6} fill={color} />
        </Svg>
      );
    case 'comps':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Circle cx={5.5} cy={8.5} r={2.6} fill={color} />
          <Circle cx={12} cy={6.5} r={2.8} fill={color} />
          <Circle cx={18.5} cy={8.5} r={2.6} fill={color} />
          <Path
            fill={color}
            d="M1.5 18.5c.4-2.9 1.9-4.6 4-4.6s3.6 1.7 4 4.6zM7.8 17c.5-3.2 2.1-5 4.2-5s3.7 1.8 4.2 5zM14.5 18.5c.4-2.9 1.9-4.6 4-4.6s3.6 1.7 4 4.6z"
          />
        </Svg>
      );
    case 'about':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Circle cx={12} cy={12} r={9} {...stroke} />
          <Path d="M12 11v6" {...stroke} />
          <Circle cx={12} cy={7.6} r={1.2} fill={color} />
        </Svg>
      );
    case 'close':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M6 6l12 12M18 6L6 18" {...stroke} strokeWidth={2.2} />
        </Svg>
      );
    case 'plus':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M12 5v14M5 12h14" {...stroke} strokeWidth={2.2} />
        </Svg>
      );
    case 'search':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Circle cx={11} cy={11} r={6.5} {...stroke} />
          <Path d="M16 16l4.5 4.5" {...stroke} />
        </Svg>
      );
    case 'arrow':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M5 12h13M13 6l6 6-6 6" {...stroke} strokeLinejoin="round" />
        </Svg>
      );
    case 'back':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M15 5l-7 7 7 7" {...stroke} strokeWidth={2.4} strokeLinejoin="round" />
        </Svg>
      );
    case 'chevron':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M9 5l7 7-7 7" {...stroke} strokeLinejoin="round" />
        </Svg>
      );
    case 'buffed':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path fill={color} d="M12 4l9 15H3z" />
        </Svg>
      );
    case 'nerfed':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path fill={color} d="M12 20L3 5h18z" />
        </Svg>
      );
    case 'mixed':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path fill={color} d="M12 1.5l7 9.5H5zM12 22.5L5 13h14z" />
        </Svg>
      );
    case 'flex':
      // Two arrows trading places: any role, or swapping with a teammate.
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M4 8h15M15 4l4 4-4 4M20 16H5M9 12l-4 4 4 4" {...stroke} strokeLinejoin="round" />
        </Svg>
      );
    case 'star':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M12 2.6l2.47 6.6 7.04.31-5.52 4.39 1.89 6.79L12 16.8l-5.88 3.89 1.89-6.79-5.52-4.39 7.04-.31z" {...stroke} strokeWidth={1.8} strokeLinejoin="round" />
        </Svg>
      );
    case 'starred':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path fill={color} stroke={color} strokeWidth={1.8} strokeLinejoin="round" d="M12 2.6l2.47 6.6 7.04.31-5.52 4.39 1.89 6.79L12 16.8l-5.88 3.89 1.89-6.79-5.52-4.39 7.04-.31z" />
        </Svg>
      );
    case 'notmine':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d={THUMB_DOWN} {...stroke} strokeWidth={1.8} strokeLinejoin="round" />
          <Path d={THUMB_CUFF} {...stroke} strokeWidth={1.8} strokeLinejoin="round" />
        </Svg>
      );
    case 'notmineOn':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d={THUMB_DOWN} fill={color} stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
          <Path d={THUMB_CUFF} fill={color} stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
        </Svg>
      );
  }
}
