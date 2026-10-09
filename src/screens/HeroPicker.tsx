import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import type { Dataset } from '../data/types';
import { ROLES } from '../logic';
import { FONT, Theme, useStyles, useTheme } from '../theme';
import { HeroChip, RoleFilter, RoleFilterValue } from '../components/ui';
import { Icon } from '../components/icons';
import { Sheet } from '../components/Sheet';

/**
 * Searchable hero list for bans, teams and "the hero you want to play".
 * Heroes in `unavailable` (banned, or already on a team) show greyed out.
 */
export default function HeroPicker({
  visible,
  data,
  title,
  selected,
  max,
  single,
  unavailable,
  initialRole = 'all',
  tone = 'enemy',
  showCount = true,
  blockedNote = 'Greyed-out heroes are banned or already picked.',
  onToggle,
  onClose,
}: {
  visible: boolean;
  data: Dataset;
  title: string;
  selected: readonly string[];
  max: number;
  /** Pick one hero; choosing another replaces it. */
  single?: boolean;
  unavailable?: readonly string[];
  initialRole?: RoleFilterValue;
  /** Enemy picks and bans show red; your team shows in the accent color. */
  tone?: 'enemy' | 'ally';
  /** Show "3/12" next to the title. Off for lists without a real limit. */
  showCount?: boolean;
  /** Says why some heroes are greyed out. */
  blockedNote?: string;
  onToggle: (heroId: string) => void;
  onClose: () => void;
}) {
  const t = useTheme();
  const st = useStyles(makeStyles);
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState('');
  const [role, setRole] = useState<RoleFilterValue>(initialRole);

  // Start from a clear search each time the picker opens. Done while rendering rather
  // than in an effect, so the sheet never shows a frame with the old search.
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setQuery('');
      setRole(initialRole);
    }
  }

  const heroes = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.heroes
      .filter((h) => (role === 'all' || h.role === role) && (!q || h.name.toLowerCase().includes(q)))
      .sort((a, b) => a.name.localeCompare(b.name) || ROLES.indexOf(a.role) - ROLES.indexOf(b.role));
  }, [data, query, role]);

  const full = !single && selected.length >= max;
  const itemWidth = (Math.min(width, 600) - 32 - 6) / 2;
  const blocked = unavailable ?? [];

  return (
    <Sheet visible={visible} onClose={onClose}>
      <View style={st.head}>
        <View style={st.search}>
          <Icon name="search" size={16} color={t.ink3} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search heroes"
            placeholderTextColor={t.ink3}
            style={st.input}
            autoCorrect={false}
            autoCapitalize="none"
            clearButtonMode="while-editing"
            returnKeyType="done"
            accessibilityLabel="Search heroes"
          />
        </View>
        <Pressable onPress={onClose} accessibilityRole="button" style={st.done}>
          <Text style={st.doneText}>Done</Text>
        </Pressable>
      </View>
      <View style={st.controls}>
        <Text style={st.title} accessibilityRole="header">
          {title}
          {single || !showCount ? '' : ` · ${selected.length}/${max}`}
        </Text>
        <RoleFilter value={role} onChange={setRole} />
        {blocked.length ? <Text style={st.count}>{blockedNote}</Text> : null}
      </View>
      <ScrollView contentContainerStyle={st.list} keyboardShouldPersistTaps="handled">
        {heroes.length === 0 ? <Text style={st.empty}>No hero matches “{query}”.</Text> : null}
        {heroes.map((h) => {
          const on = selected.includes(h.id);
          const off = blocked.includes(h.id);
          return (
            <View key={h.id} style={{ width: itemWidth }}>
              <HeroChip
                hero={h}
                wide
                selected={on}
                selectedColor={tone === 'ally' ? t.accent : t.enemy}
                disabled={!on && (off || full)}
                onPress={() => onToggle(h.id)}
              />
            </View>
          );
        })}
      </ScrollView>
    </Sheet>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    head: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.line,
    },
    search: {
      flex: 1,
      height: 40,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: t.line,
      backgroundColor: t.surface,
    },
    input: { flex: 1, height: '100%', color: t.ink, fontFamily: FONT.body, fontSize: 15 },
    done: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 9, backgroundColor: t.accent },
    doneText: { color: t.onAccent, fontFamily: FONT.bodyBold, fontSize: 14 },
    controls: { paddingHorizontal: 16, paddingTop: 12 },
    title: { color: t.ink, fontFamily: FONT.displayBold, fontSize: 15, letterSpacing: 1, textTransform: 'uppercase' },
    count: { marginBottom: 8, color: t.ink3, fontFamily: FONT.body, fontSize: 12.5 },
    list: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 16, paddingBottom: 28 },
    empty: { color: t.ink3, fontFamily: FONT.body, fontSize: 13.5 },
  });
