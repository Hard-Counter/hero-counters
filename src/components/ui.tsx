import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import type { Confidence, FocusLevel, Hero, RoleId, Tier } from '../data/types';
import { CONFIDENCE_LABEL, FOCUS_LABEL, ROLE_LABEL, ROLES, SEASON_SHIFT_LABEL, SeasonShift } from '../logic';
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

/**
 * A section eyebrow with an optional "what does this mean" button and an optional control on
 * the right (a Clear link, say).
 */
export function SectionHead({
  children,
  onInfo,
  infoLabel,
  right,
  style,
}: {
  children: React.ReactNode;
  onInfo?: () => void;
  infoLabel?: string;
  right?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const st = useStyles(makeStyles);
  return (
    <View style={[st.sectionHead, style]}>
      <Text accessibilityRole="header" style={[st.eyebrow, st.eyebrowInline]}>
        {children}
      </Text>
      {onInfo ? (
        <Pressable
          onPress={onInfo}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={infoLabel ?? 'What this means'}
          style={({ pressed }) => [st.info, pressed && { opacity: 0.6 }]}
        >
          <Icon name="about" size={16} color={t.ink3} />
        </Pressable>
      ) : null}
      <View style={st.sectionSpacer} />
      {right}
    </View>
  );
}

/** A small text button, like "Clear" or "Change". */
export function LinkButton({ label, onPress, accessibilityLabel }: { label: string; onPress: () => void; accessibilityLabel?: string }) {
  const st = useStyles(makeStyles);
  return (
    <Pressable onPress={onPress} hitSlop={8} accessibilityRole="button" accessibilityLabel={accessibilityLabel}>
      {({ pressed }) => <Text style={[st.link, pressed && { opacity: 0.6 }]}>{label}</Text>}
    </Pressable>
  );
}

export function FocusTag({ level }: { level: FocusLevel }) {
  const t = useTheme();
  const c = level === 'high' ? t.ban.high : level === 'medium' ? t.ban.medium : t.ink3;
  return (
    <View style={[s.pill, { borderColor: alpha(c, 0.5) }]} accessible accessibilityLabel={`Focus priority ${FOCUS_LABEL[level]}`}>
      <Text style={[s.pillText, { color: c }]}>{`FOCUS · ${FOCUS_LABEL[level].toUpperCase()}`}</Text>
    </View>
  );
}

/** Short tips as a dotted list. */
export function TipList({ items }: { items: string[] }) {
  const st = useStyles(makeStyles);
  return (
    <View style={st.tips}>
      {items.map((item) => (
        <View key={item} style={st.tip}>
          <View style={st.tipDot} />
          <Text style={st.tipText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

export function HeroChip({
  hero,
  onPress,
  selected,
  disabled,
  wide,
  selectedColor,
  shift,
}: {
  hero: Hero;
  onPress: () => void;
  selected?: boolean;
  disabled?: boolean;
  wide?: boolean;
  /** Border and tint when selected. Enemy red by default. */
  selectedColor?: string;
  /** Marks a hero buffed or nerfed this season. */
  shift?: SeasonShift;
}) {
  const t = useTheme();
  const st = useStyles(makeStyles);
  const label = [
    hero.name,
    hero.variant ? ROLE_LABEL[hero.role] : null,
    shift ? SEASON_SHIFT_LABEL[shift].toLowerCase() : null,
    hero.banRisk === 'high' ? 'often banned' : null,
  ]
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
        selected && { borderColor: selectedColor ?? t.enemy, backgroundColor: alpha(selectedColor ?? t.enemy, 0.12) },
        disabled && { opacity: 0.4 },
        pressed && { opacity: 0.7 },
      ]}
    >
      <Avatar hero={hero} size={26} />
      <Text style={[st.chipName, wide && st.chipNameWide]} numberOfLines={2}>
        {hero.name}
      </Text>
      {hero.variant ? <Icon name={hero.role} size={11} color={t.role[hero.role]} /> : null}
      {shift ? <Icon name={shift} size={10} color={t.change[shift === 'buffed' ? 'b' : shift === 'nerfed' ? 'n' : 'm']} /> : null}
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
    eyebrowInline: { marginTop: 0, marginBottom: 0, flexShrink: 1 },
    sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 22, marginBottom: 8, minHeight: 20 },
    sectionSpacer: { flex: 1 },
    info: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
    link: { color: t.accent, fontFamily: FONT.bodySemi, fontSize: 14 },
    tips: { gap: 7 },
    tip: { flexDirection: 'row', gap: 9 },
    tipDot: { width: 5, height: 5, marginTop: 8, borderRadius: 3, backgroundColor: t.ink3 },
    tipText: { flex: 1, color: t.ink, fontFamily: FONT.body, fontSize: 14.5, lineHeight: 20 },
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
