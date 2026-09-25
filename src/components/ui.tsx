import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, TextStyle, View } from 'react-native';
import type { Confidence, Hero, RoleId, Tier } from '../data/types';
import { CONFIDENCE_LABEL, ROLE_LABEL, ROLES } from '../logic';
import { FONT, Theme, alpha, useStyles, useTheme } from '../theme';
import { Icon } from './icons';

/** Initials in the hero's role color. Stands in for official portraits. */
export function Avatar({ hero, size = 28 }: { hero: Hero; size?: number }) {
  const t = useTheme();
  const c = t.role[hero.role];
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.26,
        backgroundColor: alpha(c, 0.17),
        borderBottomWidth: 2,
        borderBottomColor: c,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text allowFontScaling={false} style={{ color: c, fontFamily: FONT.display, fontSize: size * 0.44, letterSpacing: 0.5 }}>
        {hero.abbr}
      </Text>
    </View>
  );
}

export function TierBadge({ tier, size = 32 }: { tier: Tier; size?: number }) {
  const t = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={`${tier} tier`}
      style={{ width: size, height: size, borderRadius: 6, backgroundColor: t.tier[tier], alignItems: 'center', justifyContent: 'center' }}
    >
      <Text allowFontScaling={false} style={{ color: t.tierInk, fontFamily: FONT.display, fontSize: size * 0.62, lineHeight: size * 0.8 }}>
        {tier}
      </Text>
    </View>
  );
}

export function ConfTag({ confidence }: { confidence: Confidence }) {
  const t = useTheme();
  const c = t.conf[confidence];
  return (
    <View style={[s.pill, { borderColor: alpha(c, 0.45) }]}>
      <View style={[s.dot, { backgroundColor: c }]} />
      <Text style={[s.pillText, { color: c }]}>{CONFIDENCE_LABEL[confidence].toUpperCase()}</Text>
    </View>
  );
}

/** Slanted role label, like a broadcast lower-third. */
export function RoleTag({ role }: { role: RoleId }) {
  const t = useTheme();
  const c = t.role[role];
  return (
    <View style={[s.slant, { backgroundColor: alpha(c, 0.14) }]}>
      <View style={[s.unslant, s.row]}>
        <Icon name={role} size={11} color={c} />
        <Text style={[s.roleTagText, { color: c }]}>{ROLE_LABEL[role].toUpperCase()}</Text>
      </View>
    </View>
  );
}

export function Eyebrow({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  const st = useStyles(makeStyles);
  return (
    <Text accessibilityRole="header" style={[st.eyebrow, style]}>
      {children}
    </Text>
  );
}

export function HeroChip({
  hero,
  onPress,
  selected,
  disabled,
  wide,
}: {
  hero: Hero;
  onPress: () => void;
  selected?: boolean;
  disabled?: boolean;
  wide?: boolean;
}) {
  const t = useTheme();
  const st = useStyles(makeStyles);
  const label = [hero.name, hero.variant ? ROLE_LABEL[hero.role] : null, hero.banRisk === 'high' ? 'often banned' : null]
    .filter(Boolean)
    .join(', ');
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!selected, disabled: !!disabled }}
      style={({ pressed }) => [
        st.chip,
        wide && st.chipWide,
        selected && { borderColor: t.enemy, backgroundColor: alpha(t.enemy, 0.12) },
        disabled && { opacity: 0.4 },
        pressed && { opacity: 0.7 },
      ]}
    >
      <Avatar hero={hero} size={26} />
      <Text style={[st.chipName, wide && st.chipNameWide]} numberOfLines={2}>
        {hero.name}
      </Text>
      {hero.variant ? <Icon name={hero.role} size={11} color={t.role[hero.role]} /> : null}
      {hero.isNew ? (
        <View style={st.newTag}>
          <Text style={st.newText}>NEW</Text>
        </View>
      ) : null}
      {hero.banRisk === 'high' ? <View style={[s.banDot, { backgroundColor: t.ban.high }]} /> : null}
    </Pressable>
  );
}

export type RoleFilterValue = 'all' | RoleId;

export function RoleFilter({ value, onChange }: { value: RoleFilterValue; onChange: (v: RoleFilterValue) => void }) {
  const t = useTheme();
  const st = useStyles(makeStyles);
  const options: RoleFilterValue[] = ['all', ...ROLES];
  return (
    <View style={st.filters} accessibilityRole="radiogroup">
      {options.map((o) => {
        const on = o === value;
        return (
          <Pressable
            key={o}
            onPress={() => onChange(o)}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            style={[st.filter, on && st.filterOn]}
          >
            {o !== 'all' ? <Icon name={o} size={12} color={t.role[o]} /> : null}
            <Text style={[st.filterText, on && { color: t.ink }]}>{o === 'all' ? 'All' : ROLE_LABEL[o]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  const st = useStyles(makeStyles);
  return (
    <View style={st.seg} accessibilityRole="radiogroup">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            style={[st.segItem, on && st.segItemOn]}
          >
            <Text style={[st.segText, on && st.segTextOn]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Slanted selectable chip used for the rank bracket strip. */
export function SlantChip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  const t = useTheme();
  const st = useStyles(makeStyles);
  return (
    <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ checked: on }} hitSlop={4}>
      {({ pressed }) => (
        <View style={[s.slant, st.slantChip, { backgroundColor: on ? t.accent : t.surface, opacity: pressed ? 0.75 : 1 }]}>
          <Text style={[s.unslant, st.slantText, { color: on ? t.onAccent : t.ink2 }]}>{label.toUpperCase()}</Text>
        </View>
      )}
    </Pressable>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  pillText: { fontFamily: FONT.displayBold, fontSize: 10.5, letterSpacing: 0.8 },
  slant: { transform: [{ skewX: '-12deg' }], alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 3 },
  unslant: { transform: [{ skewX: '12deg' }] },
  roleTagText: { fontFamily: FONT.displayBold, fontSize: 11.5, letterSpacing: 1.1 },
  banDot: { width: 7, height: 7, borderRadius: 4 },
});

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    eyebrow: {
      marginTop: 22,
      marginBottom: 8,
      fontFamily: FONT.displayBold,
      fontSize: 12.5,
      letterSpacing: 1.5,
      textTransform: 'uppercase',
      color: t.ink3,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      minHeight: 36,
      maxWidth: '100%',
      paddingVertical: 4,
      paddingLeft: 4,
      paddingRight: 11,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: t.line,
      backgroundColor: t.surface,
    },
    chipWide: { width: '100%' },
    chipName: { flexShrink: 1, color: t.ink, fontFamily: FONT.bodySemi, fontSize: 13.5, lineHeight: 16 },
    chipNameWide: { flex: 1 },
    newTag: { paddingHorizontal: 5, paddingVertical: 3, borderRadius: 3, backgroundColor: t.accent },
    newText: { color: t.onAccent, fontFamily: FONT.displayBold, fontSize: 10.5, letterSpacing: 0.8 },
    filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingTop: 6, paddingBottom: 12 },
    filter: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 11,
      paddingVertical: 6,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: t.line,
    },
    filterOn: { backgroundColor: t.surface2, borderColor: t.ink3 },
    filterText: { color: t.ink2, fontFamily: FONT.bodySemi, fontSize: 13 },
    seg: { flexDirection: 'row', padding: 2, borderRadius: 9, borderWidth: 1, borderColor: t.line, backgroundColor: t.surface },
    segItem: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 7 },
    segItemOn: { backgroundColor: t.accent },
    segText: { color: t.ink2, fontFamily: FONT.bodySemi, fontSize: 13 },
    segTextOn: { color: t.onAccent },
    slantChip: { paddingHorizontal: 13, paddingVertical: 8 },
    slantText: { fontFamily: FONT.displayBold, fontSize: 12.5, letterSpacing: 0.6 },
  });
