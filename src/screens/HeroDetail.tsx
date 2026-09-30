import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform as RNPlatform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { BracketId, CounterPick, Dataset, Hero, Platform, RoleId } from '../data/types';
import {
  BAN_LABEL,
  GlossaryGroupId,
  HERO_STYLE_INFO,
  HERO_STYLE_LABEL,
  HeroIndex,
  ROLES,
  focusFor,
  formatDate,
  goodAgainst,
  sortHeroes,
  tierFor,
  tipsFor,
} from '../logic';
import { FONT, Theme, useStyles, useTheme } from '../theme';
import { Avatar, ConfTag, FocusTag, HeroChip, RoleTag, SectionHead, TierBadge, TipList } from '../components/ui';
import { Icon } from '../components/icons';
import { Sheet } from '../components/Sheet';
import { Overlay } from '../components/Overlay';
import { InfoCard } from '../components/Glossary';

/** Why a hero shown in the peek card is on this page. */
type Peek =
  | { kind: 'counter'; heroId: string; pick: CounterPick }
  | { kind: 'strong'; heroId: string };

export default function HeroDetail({
  heroId,
  backTo,
  data,
  idx,
  platform,
  bracket,
  myRole,
  onOpen,
  onBack,
  onClose,
}: {
  heroId: string | null;
  /** Name of the hero you came from, when there is one to go back to. */
  backTo: string | null;
  data: Dataset;
  idx: HeroIndex;
  platform: Platform;
  bracket: BracketId;
  myRole: RoleId;
  onOpen: (heroId: string) => void;
  onBack: () => void;
  onClose: () => void;
}) {
  const t = useTheme();
  const st = useStyles(makeStyles);
  const hero = heroId ? idx[heroId] : undefined;
  const scrollRef = useRef<ScrollView>(null);
  const [peek, setPeek] = useState<Peek | null>(null);
  const [info, setInfo] = useState<GlossaryGroupId | null>(null);

  // A new hero starts with nothing open on top. Done while rendering so the old card never flashes.
  const [shownFor, setShownFor] = useState(heroId);
  if (heroId !== shownFor) {
    setShownFor(heroId);
    setPeek(null);
    setInfo(null);
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [heroId]);

  const strongAgainst = useMemo(
    () => (hero ? sortHeroes(goodAgainst(data, hero.id), bracket, platform) : []),
    [data, hero, bracket, platform],
  );
  const tips = hero ? tipsFor(hero) : null;
  const focus = hero ? focusFor(hero) : null;
  const roleOrder: RoleId[] = [myRole, ...ROLES.filter((r) => r !== myRole)];

  // Android's back button: close whatever is on top, then step back a hero, then close the page.
  const onRequestClose = () => {
    if (peek) setPeek(null);
    else if (info) setInfo(null);
    else if (backTo && RNPlatform.OS === 'android') onBack();
    else onClose();
  };

  return (
    <Sheet visible={!!hero} onClose={onRequestClose}>
      {hero ? (
        <View style={st.fill}>
          <View style={st.head}>
            {backTo ? (
              <Pressable
                onPress={onBack}
                accessibilityRole="button"
                accessibilityLabel={`Back to ${backTo}`}
                hitSlop={10}
                style={st.round}
              >
                <Icon name="back" size={18} color={t.ink} />
              </Pressable>
            ) : null}
            <Avatar hero={hero} size={48} />
            <View style={st.headText}>
              <Text style={st.name}>{hero.name}</Text>
              <View style={st.roleRow}>
                <RoleTag role={hero.role} />
                {hero.isNew ? <Text style={st.newText}>NEW THIS SEASON</Text> : null}
              </View>
            </View>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" hitSlop={10} style={st.round}>
              <Icon name="close" size={18} color={t.ink} />
            </Pressable>
          </View>

          <ScrollView ref={scrollRef} contentContainerStyle={st.body}>
            <SectionHead onInfo={() => setInfo('tiers')} infoLabel="What tiers mean">
              Tier by rank · {platform === 'pc' ? 'PC' : 'Console'}
            </SectionHead>
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

            {hero.styles && hero.styles.length ? (
              <>
                <SectionHead onInfo={() => setInfo('styles')} infoLabel="What play styles mean">
                  Play style
                </SectionHead>
                <View style={st.styles}>
                  {hero.styles.map((s) =>
                    HERO_STYLE_LABEL[s] ? (
                      <Text key={s} style={st.styleText}>
                        <Text style={st.styleName}>{HERO_STYLE_LABEL[s]}. </Text>
                        {HERO_STYLE_INFO[s]}
                      </Text>
                    ) : null,
                  )}
                </View>
              </>
            ) : null}

            <SectionHead onInfo={() => setInfo('counters')} infoLabel="What the counter tags mean">
              Best counter overall
            </SectionHead>
            <CounterCard
              pick={hero.counters.overall}
              idx={idx}
              onPress={() => setPeek({ kind: 'counter', heroId: hero.counters.overall.hero, pick: hero.counters.overall })}
            />

            <SectionHead>Best counter in each role</SectionHead>
            <View style={st.cards}>
              {roleOrder.map((r) => (
                <CounterCard
                  key={r}
                  role={r}
                  mine={r === myRole}
                  pick={hero.counters[r]}
                  idx={idx}
                  onPress={() => setPeek({ kind: 'counter', heroId: hero.counters[r].hero, pick: hero.counters[r] })}
                />
              ))}
            </View>

            {tips && tips.against.length ? (
              <>
                <SectionHead onInfo={() => setInfo('match')} infoLabel="What focus priority means">
                  Playing against {hero.name}
                </SectionHead>
                {focus && !focus.general ? (
                  <View style={st.focus}>
                    <FocusTag level={focus.level} />
                    <Text style={st.focusWhy}>{focus.why}</Text>
                  </View>
                ) : null}
                <TipList items={tips.against} />
              </>
            ) : null}

            {tips && tips.as.length ? (
              <>
                <SectionHead>Playing as {hero.name}</SectionHead>
                <TipList items={tips.as} />
              </>
            ) : null}

            {tips && tips.quirks.length ? (
              <>
                <SectionHead onInfo={() => setInfo('match')} infoLabel="What quirks are">
                  Quirks
                </SectionHead>
                <View style={st.quirks}>
                  {tips.quirks.map((q) => (
                    <View key={q.text} style={st.quirk}>
                      <Text style={st.quirkText}>{q.text}</Text>
                      <Text style={st.quirkDate}>Checked {formatDate(q.asOf)}</Text>
                    </View>
                  ))}
                </View>
              </>
            ) : null}

            {strongAgainst.length > 0 ? (
              <>
                <SectionHead>Strong against</SectionHead>
                <View style={st.wrap}>
                  {strongAgainst.map((h) => (
                    <HeroChip key={h.id} hero={h} onPress={() => setPeek({ kind: 'strong', heroId: h.id })} />
                  ))}
                </View>
              </>
            ) : null}
          </ScrollView>

          <Overlay visible={!!peek} onClose={() => setPeek(null)}>
            {peek && idx[peek.heroId] ? (
              <PeekCard
                peek={peek}
                hero={hero}
                other={idx[peek.heroId]}
                bracket={bracket}
                platform={platform}
                onOpen={() => {
                  const id = peek.heroId;
                  setPeek(null);
                  onOpen(id);
                }}
                onClose={() => setPeek(null)}
              />
            ) : null}
          </Overlay>
          <Overlay visible={!!info} onClose={() => setInfo(null)}>
            {info ? <InfoCard groupId={info} onClose={() => setInfo(null)} /> : null}
          </Overlay>
        </View>
      ) : null}
    </Sheet>
  );
}

/** A quick look at a hero tapped on this page, so a stray tap doesn't leave the page. */
function PeekCard({
  peek,
  hero,
  other,
  bracket,
  platform,
  onOpen,
  onClose,
}: {
  peek: Peek;
  hero: Hero;
  other: Hero;
  bracket: BracketId;
  platform: Platform;
  onOpen: () => void;
  onClose: () => void;
}) {
  const t = useTheme();
  const st = useStyles(makeStyles);

  // For "strong against", find why this page's hero beats the other one.
  let label: string;
  let pick: CounterPick | undefined;
  if (peek.kind === 'counter') {
    label = `Counters ${hero.name}`;
    pick = peek.pick;
  } else {
    label = `${hero.name} counters ${other.name}`;
    const keys = [hero.role, 'overall', ...ROLES.filter((r) => r !== hero.role)] as const;
    for (const k of keys) {
      const p = other.counters[k];
      if (p && (p.hero === hero.id || (p.alt ?? []).includes(hero.id))) {
        pick = p;
        break;
      }
    }
  }

  return (
    <View style={st.peek} accessibilityLabel={`${other.name}, quick look`}>
      <View style={st.peekHead}>
        <Avatar hero={other} size={44} />
        <View style={st.headText}>
          <Text style={st.peekName}>{other.name}</Text>
          <View style={st.roleRow}>
            <RoleTag role={other.role} />
            {other.isNew ? <Text style={st.newText}>NEW</Text> : null}
          </View>
        </View>
        <TierBadge tier={tierFor(other, bracket, platform)} size={34} />
      </View>

      {pick ? (
        <View style={st.peekWhy}>
          <Text style={st.peekLabel}>{label.toUpperCase()}</Text>
          <Text style={st.why}>{pick.reason}</Text>
          <View style={st.peekFoot}>
            <ConfTag confidence={pick.confidence} />
            {pick.note ? <Text style={[st.small, st.flexText, pick.weak && { color: t.ban.medium }]}>{pick.note}</Text> : null}
          </View>
        </View>
      ) : null}

      {other.banRisk !== 'low' ? <Note color={t.ban[other.banRisk]}>{BAN_LABEL[other.banRisk]}.</Note> : null}

      <View style={st.peekButtons}>
        <Pressable onPress={onOpen} accessibilityRole="button" style={({ pressed }) => [st.primary, pressed && { opacity: 0.8 }]}>
          <Text style={st.primaryText}>Open {other.name}</Text>
        </Pressable>
        <Pressable onPress={onClose} accessibilityRole="button" style={({ pressed }) => [st.secondary, pressed && { opacity: 0.7 }]}>
          <Text style={st.secondaryText}>Close</Text>
        </Pressable>
      </View>
    </View>
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
  onPress,
  role,
  mine,
}: {
  pick: CounterPick;
  idx: HeroIndex;
  onPress: () => void;
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
      onPress={onPress}
      accessibilityRole="button"
      accessibilityHint="Shows a quick look at this hero"
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
    fill: { flex: 1 },
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
    round: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: t.surface2 },
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
    styles: { gap: 6 },
    styleText: { color: t.ink2, fontFamily: FONT.body, fontSize: 14, lineHeight: 19 },
    styleName: { color: t.ink, fontFamily: FONT.bodyBold },
    cards: { gap: 6 },
    card: { gap: 8, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: t.line, backgroundColor: t.surface },
    cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    mine: { color: t.accent, fontFamily: FONT.displayBold, fontSize: 11, letterSpacing: 1.1 },
    cardMain: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    cardName: { flex: 1, color: t.ink, fontFamily: FONT.bodyBold, fontSize: 16 },
    why: { color: t.ink, fontFamily: FONT.body, fontSize: 14, lineHeight: 19 },
    small: { color: t.ink3, fontFamily: FONT.body, fontSize: 12.5, lineHeight: 17 },
    flexText: { flexShrink: 1 },
    focus: { gap: 6, marginBottom: 10 },
    focusWhy: { color: t.ink2, fontFamily: FONT.body, fontSize: 13.5, lineHeight: 19 },
    quirks: { gap: 10 },
    quirk: { gap: 3, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: t.line },
    quirkText: { color: t.ink, fontFamily: FONT.body, fontSize: 14, lineHeight: 19 },
    quirkDate: { color: t.ink3, fontFamily: FONT.body, fontSize: 12 },
    wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    peek: { gap: 12 },
    peekHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    peekName: { marginBottom: 4, color: t.ink, fontFamily: FONT.display, fontSize: 22, lineHeight: 24, textTransform: 'uppercase' },
    peekWhy: { gap: 6, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: t.line, backgroundColor: t.surface },
    peekLabel: { color: t.ink3, fontFamily: FONT.displayBold, fontSize: 11.5, letterSpacing: 1.1 },
    peekFoot: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
    peekButtons: { flexDirection: 'row', gap: 8, marginTop: 2 },
    primary: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 10, backgroundColor: t.accent },
    primaryText: { color: t.onAccent, fontFamily: FONT.bodyBold, fontSize: 15 },
    secondary: {
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 18,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: t.line,
      backgroundColor: t.surface,
    },
    secondaryText: { color: t.ink, fontFamily: FONT.bodySemi, fontSize: 15 },
  });
