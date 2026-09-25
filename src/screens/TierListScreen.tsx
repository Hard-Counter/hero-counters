import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { BracketId, Dataset, Platform } from '../data/types';
import { TIERS, sortHeroes, tierFor } from '../logic';
import { FONT, Theme, useStyles } from '../theme';
import { HeroChip, RoleFilter, RoleFilterValue, TierBadge } from '../components/ui';

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

  return (
    <ScrollView contentContainerStyle={st.content}>
      <RoleFilter value={role} onChange={setRole} />
      {groups.map((g, i) => (
        <View key={g.tier} style={[st.row, i > 0 && st.rowDivider]}>
          <TierBadge tier={g.tier} size={44} />
          <View style={st.heroes}>
            {g.heroes.map((h) => (
              <HeroChip key={h.id} hero={h} onPress={() => onOpen(h.id)} />
            ))}
          </View>
        </View>
      ))}
      <Text style={st.foot}>
        {bracketLabel} on {platform === 'pc' ? 'PC' : 'console'}. A red dot means often banned at Gold III and above. Tap any
        hero for counters.
      </Text>
    </ScrollView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    content: { paddingHorizontal: 16, paddingTop: 2, paddingBottom: 28 },
    row: { flexDirection: 'row', gap: 10, paddingVertical: 10 },
    rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.line },
    heroes: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    foot: { marginTop: 16, color: t.ink3, fontFamily: FONT.body, fontSize: 12.5, lineHeight: 17 },
  });
