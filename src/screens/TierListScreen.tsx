import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { BracketId, Dataset, Platform } from '../data/types';
import { TIERS, seasonShifts, sortHeroes, tierFor } from '../logic';
import { FONT, Theme, useStyles } from '../theme';
import { HeroChip, LinkButton, RoleFilter, RoleFilterValue, TierBadge } from '../components/ui';
import { Overlay } from '../components/Overlay';
import { InfoCard } from '../components/Glossary';

export default function TierListScreen({
  data,
  platform,
  bracket,
  onOpen,
}: {
  data: Dataset;
  platform: Platform;
  bracket: BracketId;
  onOpen: (heroId: string) => void;
}) {
  const st = useStyles(makeStyles);
  const [role, setRole] = useState<RoleFilterValue>('all');
  const [info, setInfo] = useState(false);

  const groups = useMemo(
    () =>
      TIERS.map((tier) => ({
        tier,
        heroes: sortHeroes(
          data.heroes.filter((h) => (role === 'all' || h.role === role) && tierFor(h, bracket, platform) === tier),
          bracket,
          platform,
        ),
      })).filter((g) => g.heroes.length > 0),
    [data, role, bracket, platform],
  );
  const bracketLabel = data.brackets.find((b) => b.id === bracket)?.label ?? '';
  const shifts = useMemo(() => seasonShifts(data), [data]);

  return (
    <View style={st.fill}>
      <ScrollView contentContainerStyle={st.content}>
        <RoleFilter value={role} onChange={setRole} />
        {groups.map((g, i) => (
          <View key={g.tier} style={[st.row, i > 0 && st.rowDivider]}>
            <TierBadge tier={g.tier} size={44} />
            <View style={st.heroes}>
              {g.heroes.map((h) => (
                <HeroChip key={h.id} hero={h} shift={shifts.get(h.id)} onPress={() => onOpen(h.id)} />
              ))}
            </View>
          </View>
        ))}
        <Text style={st.foot}>
          {bracketLabel} on {platform === 'pc' ? 'PC' : 'console'}. A red dot means often banned at Gold III and above.
          {shifts.size ? ' Arrows mark heroes buffed or nerfed this season.' : ''} Tap any hero for counters, and for when
          even a low-tier hero shines.
        </Text>
        <View style={st.more}>
          <LinkButton label="What tiers and tags mean" onPress={() => setInfo(true)} />
        </View>
      </ScrollView>
      <Overlay visible={info} onClose={() => setInfo(false)}>
        {info ? <InfoCard groupId="tiers" onClose={() => setInfo(false)} /> : null}
      </Overlay>
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    fill: { flex: 1 },
    content: { paddingHorizontal: 16, paddingTop: 2, paddingBottom: 28 },
    row: { flexDirection: 'row', gap: 10, paddingVertical: 10 },
    rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.line },
    heroes: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    foot: { marginTop: 16, color: t.ink3, fontFamily: FONT.body, fontSize: 12.5, lineHeight: 17 },
    more: { marginTop: 10, alignItems: 'flex-start' },
  });
