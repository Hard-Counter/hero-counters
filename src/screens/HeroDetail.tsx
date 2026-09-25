import React, { useEffect, useMemo, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { BracketId, CounterPick, Dataset, Platform, RoleId } from '../data/types';
import { BAN_LABEL, HeroIndex, ROLES, goodAgainst, sortHeroes, tierFor } from '../logic';
import { FONT, Theme, useStyles, useTheme } from '../theme';
import { Avatar, ConfTag, Eyebrow, HeroChip, RoleTag, TierBadge } from '../components/ui';
import { Icon } from '../components/icons';
import { Sheet } from '../components/Sheet';

export default function HeroDetail({
  heroId,
  data,
  idx,
  platform,
  bracket,
  myRole,
  onOpen,
  onClose,
}: {
  heroId: string | null;
  data: Dataset;
  idx: HeroIndex;
  platform: Platform;
  bracket: BracketId;
  myRole: RoleId;
  onOpen: (heroId: string) => void;
  onClose: () => void;
}) {
  const t = useTheme();
  const st = useStyles(makeStyles);
  const hero = heroId ? idx[heroId] : undefined;
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [heroId]);

  const strongAgainst = useMemo(
    () => (hero ? sortHeroes(goodAgainst(data, hero.id), bracket, platform) : []),
    [data, hero, bracket, platform],
  );
  const roleOrder: RoleId[] = [myRole, ...ROLES.filter((r) => r !== myRole)];

  return (
    <Sheet visible={!!hero} onClose={onClose}>
      {hero ? (
        <>
          <View style={st.head}>
            <Avatar hero={hero} size={48} />
            <View style={st.headText}>
              <Text style={st.name}>{hero.name}</Text>
              <View style={st.roleRow}>
                <RoleTag role={hero.role} />
                {hero.isNew ? <Text style={st.newText}>NEW THIS SEASON</Text> : null}
              </View>
            </View>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" hitSlop={10} style={st.close}>
              <Icon name="close" size={18} color={t.ink} />
            </Pressable>
          </View>

          <ScrollView ref={scrollRef} contentContainerStyle={st.body}>
            <Eyebrow>Tier by rank · {platform === 'pc' ? 'PC' : 'Console'}</Eyebrow>
            <View style={st.tierGrid}>
              {data.brackets.map((b) => {
                const current = b.id === bracket;
                return (
                  <View key={b.id} style={[st.tierCell, current && st.tierCellOn]}>
                    <TierBadge tier={tierFor(hero, b.id, platform)} size={36} />
                    <Text style={[st.tierLabel, current && { color: t.ink }]}>{b.short}</Text>
                  </View>
                );
              })}
            </View>

            <View style={st.notes}>
              <Note color={t.ban[hero.banRisk]}>{BAN_LABEL[hero.banRisk]}.</Note>
              {hero.patchNote ? <Note color={t.ink3}>{hero.patchNote}</Note> : null}
              {hero.platformNote ? <Note color={t.ink3}>Console: {hero.platformNote}</Note> : null}
            </View>

            <Eyebrow>Best counter overall</Eyebrow>
            <CounterCard pick={hero.counters.overall} idx={idx} onOpen={onOpen} />

            <Eyebrow>Best counter in each role</Eyebrow>
            <View style={st.cards}>
              {roleOrder.map((r) => (
                <CounterCard key={r} role={r} mine={r === myRole} pick={hero.counters[r]} idx={idx} onOpen={onOpen} />
              ))}
            </View>

            {strongAgainst.length > 0 ? (
              <>
                <Eyebrow>Strong against</Eyebrow>
                <View style={st.wrap}>
                  {strongAgainst.map((h) => (
                    <HeroChip key={h.id} hero={h} onPress={() => onOpen(h.id)} />
                  ))}
                </View>
              </>
            ) : null}
          </ScrollView>
        </>
      ) : null}
    </Sheet>
  );
}

function Note({ color, children }: { color: string; children: React.ReactNode }) {
  const st = useStyles(makeStyles);
  return (
    <View style={st.note}>
      <View style={[st.noteDot, { backgroundColor: color }]} />
      <Text style={st.noteText}>{children}</Text>
    </View>
  );
}

export function CounterCard({
  pick,
  idx,
  onOpen,
  role,
  mine,
}: {
  pick: CounterPick;
  idx: HeroIndex;
  onOpen: (heroId: string) => void;
  role?: RoleId;
  mine?: boolean;
}) {
  const t = useTheme();
  const st = useStyles(makeStyles);
  const counter = idx[pick.hero];
  if (!counter) return null;
  const alts = (pick.alt ?? []).map((a) => idx[a]?.name).filter(Boolean);
  return (
    <Pressable
      onPress={() => onOpen(counter.id)}
      accessibilityRole="button"
      accessibilityHint="Opens this hero"
      style={({ pressed }) => [st.card, mine && { borderColor: t.accent }, pressed && { opacity: 0.8 }]}
    >
      {role ? (
        <View style={st.cardTop}>
          <RoleTag role={role} />
          {mine ? <Text style={st.mine}>YOUR ROLE</Text> : null}
        </View>
      ) : null}
      <View style={st.cardMain}>
        <Avatar hero={counter} size={38} />
        <Text style={st.cardName} numberOfLines={2}>
          {counter.name}
        </Text>
        <ConfTag confidence={pick.confidence} />
      </View>
      <Text style={st.why}>{pick.reason}</Text>
      {pick.note ? <Text style={[st.small, pick.weak && { color: t.ban.medium }]}>{pick.note}</Text> : null}
      {alts.length ? <Text style={st.small}>Also good: {alts.join(', ')}</Text> : null}
    </Pressable>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    head: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.line,
    },
    headText: { flex: 1, minWidth: 0 },
    name: {
      marginBottom: 5,
      color: t.ink,
      fontFamily: FONT.display,
      fontSize: 26,
      lineHeight: 28,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    roleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
    newText: { color: t.accent, fontFamily: FONT.displayBold, fontSize: 11, letterSpacing: 1 },
    close: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: t.surface2 },
    body: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 28 },
    tierGrid: { flexDirection: 'row', gap: 6 },
    tierCell: {
      flex: 1,
      alignItems: 'center',
      gap: 6,
      paddingTop: 10,
      paddingBottom: 8,
      paddingHorizontal: 2,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: t.line,
      backgroundColor: t.surface,
    },
    tierCellOn: { borderColor: t.accent, borderWidth: 2 },
    tierLabel: { color: t.ink2, fontFamily: FONT.body, fontSize: 11.5, textAlign: 'center' },
    notes: { marginTop: 12, gap: 6 },
    note: { flexDirection: 'row', gap: 8 },
    noteDot: { width: 6, height: 6, marginTop: 7, borderRadius: 3 },
    noteText: { flex: 1, color: t.ink2, fontFamily: FONT.body, fontSize: 13.5, lineHeight: 19 },
    cards: { gap: 6 },
    card: { gap: 8, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: t.line, backgroundColor: t.surface },
    cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    mine: { color: t.accent, fontFamily: FONT.displayBold, fontSize: 11, letterSpacing: 1.1 },
    cardMain: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    cardName: { flex: 1, color: t.ink, fontFamily: FONT.bodyBold, fontSize: 16 },
    why: { color: t.ink, fontFamily: FONT.body, fontSize: 14, lineHeight: 19 },
    small: { color: t.ink3, fontFamily: FONT.body, fontSize: 12.5, lineHeight: 17 },
    wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  });
