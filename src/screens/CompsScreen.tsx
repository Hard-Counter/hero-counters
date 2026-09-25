import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Dataset } from '../data/types';
import { HeroIndex, ROLES, ROLE_LABEL } from '../logic';
import { FONT, Theme, useStyles, useTheme } from '../theme';
import { HeroChip } from '../components/ui';
import { Icon } from '../components/icons';

export default function CompsScreen({ data, idx, onOpen }: { data: Dataset; idx: HeroIndex; onOpen: (heroId: string) => void }) {
  const t = useTheme();
  const st = useStyles(makeStyles);
  const bracketShort = (id: string) => data.brackets.find((b) => b.id === id)?.short ?? id;

  return (
    <ScrollView contentContainerStyle={st.content}>
      <Text style={st.lede}>The lineups shaping {data.seasonShort} ranked, and how to beat each one.</Text>
      {data.comps.map((c) => (
        <View key={c.id} style={st.card}>
          <View style={st.head}>
            <Text style={st.name}>{c.name}</Text>
            <Text style={st.split}>
              {c.style.toUpperCase()} · {c.split}
            </Text>
          </View>
          <Text style={st.body}>{c.summary}</Text>

          <View style={st.bestRow}>
            <Text style={st.label}>BEST AT</Text>
            {c.bestBrackets.map((b) => (
              <View key={b} style={st.mini}>
                <Text style={st.miniText}>{bracketShort(b)}</Text>
              </View>
            ))}
          </View>

          <View style={st.lineup}>
            {ROLES.map((r) => {
              const slots = c.slots.filter((s) => s.role === r);
              if (!slots.length) return null;
              return (
                <View key={r} style={st.lineupRow}>
                  <View style={st.roleIcon} accessible accessibilityLabel={ROLE_LABEL[r]}>
                    <Icon name={r} size={16} color={t.role[r]} />
                  </View>
                  <View style={st.slots}>
                    {slots.map((s, i) => (
                      <React.Fragment key={`${r}-${i}`}>
                        {i > 0 ? <Text style={st.join}>+</Text> : null}
                        {s.options.length ? (
                          s.options.map((id, j) =>
                            idx[id] ? (
                              <React.Fragment key={id}>
                                {j > 0 ? <Text style={st.join}>or</Text> : null}
                                <HeroChip hero={idx[id]} onPress={() => onOpen(id)} />
                              </React.Fragment>
                            ) : null,
                          )
                        ) : (
                          <View style={st.flexSlot}>
                            <Text style={st.flexText}>Any {ROLE_LABEL[r]}</Text>
                          </View>
                        )}
                      </React.Fragment>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>

          {c.teamUps.length ? (
            <View>
              <Text style={st.label}>TEAM-UPS</Text>
              {c.teamUps.map((tu) => (
                <Text key={tu.name} style={st.teamUp}>
                  <Text style={st.teamUpName}>{tu.name}</Text> · {tu.heroes.map((id) => idx[id]?.name).filter(Boolean).join(' + ')}
                  {tu.note ? <Text style={st.teamUpNote}>. {tu.note}</Text> : null}
                </Text>
              ))}
            </View>
          ) : null}

          <View style={st.beat}>
            <Text style={st.label}>HOW TO BEAT IT</Text>
            <Text style={st.beatName}>{c.counter.name}</Text>
            <View style={st.slots}>
              {c.counter.heroes.map((id) => (idx[id] ? <HeroChip key={id} hero={idx[id]} onPress={() => onOpen(id)} /> : null))}
            </View>
            <Text style={[st.body, { marginTop: 8 }]}>{c.counter.why}</Text>
          </View>

          <Text style={st.evidence}>{c.evidence}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    content: { paddingHorizontal: 16, paddingBottom: 28 },
    lede: { marginTop: 6, color: t.ink2, fontFamily: FONT.body, fontSize: 14, lineHeight: 20 },
    card: { marginTop: 14, padding: 14, gap: 12, borderRadius: 14, borderWidth: 1, borderColor: t.line, backgroundColor: t.surface },
    head: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 },
    name: { flex: 1, color: t.ink, fontFamily: FONT.display, fontSize: 22, letterSpacing: 0.4, textTransform: 'uppercase' },
    split: { color: t.ink3, fontFamily: FONT.displayBold, fontSize: 13, letterSpacing: 1.2 },
    body: { color: t.ink2, fontFamily: FONT.body, fontSize: 14, lineHeight: 19 },
    bestRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
    label: { marginBottom: 6, color: t.ink3, fontFamily: FONT.displayBold, fontSize: 11.5, letterSpacing: 1.4 },
    mini: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: t.surface2 },
    miniText: { color: t.ink2, fontFamily: FONT.bodySemi, fontSize: 12 },
    lineup: { gap: 8 },
    lineupRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    roleIcon: { width: 20, alignItems: 'center' },
    slots: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
    join: { color: t.ink3, fontFamily: FONT.bodySemi, fontSize: 12 },
    flexSlot: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderStyle: 'dashed', borderColor: t.line },
    flexText: { color: t.ink3, fontFamily: FONT.body, fontSize: 13 },
    teamUp: { marginBottom: 4, color: t.ink2, fontFamily: FONT.body, fontSize: 13.5, lineHeight: 18 },
    teamUpName: { color: t.ink, fontFamily: FONT.bodyBold },
    teamUpNote: { color: t.ink3 },
    beat: { padding: 12, borderRadius: 10, backgroundColor: t.surface2 },
    beatName: { marginBottom: 8, color: t.ink, fontFamily: FONT.bodyBold, fontSize: 15 },
    evidence: { color: t.ink3, fontFamily: FONT.body, fontSize: 12, lineHeight: 16 },
  });
