import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import type { Dataset } from '../data/types';
import { ROLES } from '../logic';
import { FONT, Theme, useStyles, useTheme } from '../theme';
import { HeroChip, RoleFilter, RoleFilterValue } from '../components/ui';
import { Icon } from '../components/icons';
import { Sheet } from '../components/Sheet';

export const MAX_ENEMIES = 6;

/** Searchable hero list for building the enemy team. */
export default function HeroPicker({
  visible,
  data,
  selected,
  onToggle,
  onClose,
}: {
  visible: boolean;
  data: Dataset;
  selected: string[];
  onToggle: (heroId: string) => void;
  onClose: () => void;
}) {
  const t = useTheme();
  const st = useStyles(makeStyles);
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState('');
  const [role, setRole] = useState<RoleFilterValue>('all');

  // Start from a clear search each time the picker opens. Done while rendering rather
  // than in an effect, so the sheet never shows a frame with the old search.
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setQuery('');
      setRole('all');
    }
  }

  const heroes = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.heroes
      .filter((h) => (role === 'all' || h.role === role) && (!q || h.name.toLowerCase().includes(q)))
      .sort((a, b) => a.name.localeCompare(b.name) || ROLES.indexOf(a.role) - ROLES.indexOf(b.role));
  }, [data, query, role]);

  const full = selected.length >= MAX_ENEMIES;
  const itemWidth = (Math.min(width, 600) - 32 - 6) / 2;

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
        <RoleFilter value={role} onChange={setRole} />
        <Text style={st.count}>
          {selected.length} of {MAX_ENEMIES} enemies added
        </Text>
      </View>
      <ScrollView contentContainerStyle={st.list} keyboardShouldPersistTaps="handled">
        {heroes.length === 0 ? <Text style={st.empty}>No hero matches “{query}”.</Text> : null}
        {heroes.map((h) => {
          const on = selected.includes(h.id);
          return (
            <View key={h.id} style={{ width: itemWidth }}>
              <HeroChip hero={h} wide selected={on} disabled={!on && full} onPress={() => onToggle(h.id)} />
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
    controls: { paddingHorizontal: 16, paddingTop: 4 },
    count: { marginBottom: 8, color: t.ink3, fontFamily: FONT.body, fontSize: 12.5 },
    list: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 16, paddingBottom: 28 },
    empty: { color: t.ink3, fontFamily: FONT.body, fontSize: 13.5 },
  });
