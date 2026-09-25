import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { GameMap } from '../data/types';
import { MAP_MODES, MAP_MODE_LABEL, MAP_TRAIT_LABEL } from '../logic';
import { FONT, Theme, useStyles, useTheme } from '../theme';
import { Eyebrow } from '../components/ui';
import { Sheet } from '../components/Sheet';

/** Lists the ranked maps by mode. Choosing "Any map" turns map matching off. */
export default function MapPicker({
  visible,
  maps,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  maps: GameMap[];
  selected: string | null;
  onSelect: (mapId: string | null) => void;
  onClose: () => void;
}) {
  const t = useTheme();
  const st = useStyles(makeStyles);

  const choose = (id: string | null) => {
    onSelect(id);
    onClose();
  };

  return (
    <Sheet visible={visible} onClose={onClose}>
      <View style={st.head}>
        <Text style={st.title}>Pick the map</Text>
        <Pressable onPress={onClose} accessibilityRole="button" style={st.done}>
          <Text style={st.doneText}>Done</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={st.list}>
        <Text style={st.intro}>
          The map nudges close calls toward heroes whose play style suits its layout. Counters still count most.
        </Text>
        <MapRow label="Any map" detail="Don’t factor in the map" on={selected === null} onPress={() => choose(null)} />
        {MAP_MODES.map((mode) => {
          const inMode = maps.filter((m) => m.mode === mode).sort((a, b) => a.name.localeCompare(b.name));
          if (!inMode.length) return null;
          return (
            <View key={mode}>
              <Eyebrow>{MAP_MODE_LABEL[mode]}</Eyebrow>
              <View style={st.group}>
                {inMode.map((m) => (
                  <MapRow
                    key={m.id}
                    label={m.name}
                    detail={m.note}
                    world={m.world}
                    traits={m.traits.map((tr) => MAP_TRAIT_LABEL[tr])}
                    on={selected === m.id}
                    onPress={() => choose(m.id)}
                  />
                ))}
              </View>
            </View>
          );
        })}
        <Text style={[st.intro, { marginTop: 18, color: t.ink3 }]}>Ranked maps only. The list is updated as the map pool rotates.</Text>
      </ScrollView>
    </Sheet>
  );
}

function MapRow({
  label,
  detail,
  world,
  traits,
  on,
  onPress,
}: {
  label: string;
  detail: string;
  world?: string;
  traits?: string[];
  on: boolean;
  onPress: () => void;
}) {
  const t = useTheme();
  const st = useStyles(makeStyles);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: on }}
      style={({ pressed }) => [st.row, on && { borderColor: t.accent, backgroundColor: t.surface2 }, pressed && { opacity: 0.8 }]}
    >
      <View style={st.rowHead}>
        <Text style={st.rowName}>{label}</Text>
        {world ? <Text style={st.rowWorld}>{world}</Text> : null}
      </View>
      <Text style={st.rowDetail}>{detail}</Text>
      {traits && traits.length ? (
        <View style={st.traits}>
          {traits.map((tr) => (
            <View key={tr} style={st.trait}>
              <Text style={st.traitText}>{tr}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </Pressable>
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
    title: { flex: 1, color: t.ink, fontFamily: FONT.display, fontSize: 20, letterSpacing: 0.4 },
    done: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 9, backgroundColor: t.accent },
    doneText: { color: t.onAccent, fontFamily: FONT.bodyBold, fontSize: 14 },
    list: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 28 },
    intro: { marginBottom: 12, color: t.ink2, fontFamily: FONT.body, fontSize: 13.5, lineHeight: 19 },
    group: { gap: 6 },
    row: { gap: 4, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: t.line, backgroundColor: t.surface },
    rowHead: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', columnGap: 8 },
    rowName: { color: t.ink, fontFamily: FONT.bodyBold, fontSize: 15 },
    rowWorld: { color: t.ink3, fontFamily: FONT.body, fontSize: 12.5 },
    rowDetail: { color: t.ink2, fontFamily: FONT.body, fontSize: 13, lineHeight: 18 },
    traits: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 2 },
    trait: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999, borderWidth: 1, borderColor: t.line },
    traitText: { color: t.ink2, fontFamily: FONT.bodySemi, fontSize: 11.5 },
  });
