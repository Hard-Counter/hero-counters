import React, { useEffect, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, Platform as RNPlatform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { BracketId, CounterPick, Dataset, Hero, Platform, RoleId } from '../data/types';
import {
  BAN_LABEL,
  DraftRole,
  GlossaryGroupId,
  HERO_STYLE_INFO,
  HERO_STYLE_LABEL,
  HERO_TABS,
  HERO_TAB_LABEL,
  HeroIndex,
  HeroTab,
  HeroTeamUp,
  MAX_MY_HEROES,
  ROLES,
  focusFor,
  formatDate,
  goodAgainst,
  heroTeamUps,
  historyFor,
  kitFor,
  sortHeroes,
  tierFor,
  tipsFor,
  usableTeamUps,
} from '../logic';
import { FONT, Theme, useStyles, useTheme } from '../theme';
import { Avatar, ConfTag, FocusTag, HeroChip, RoleTag, SectionHead, TierBadge, TipList } from '../components/ui';
import { Icon } from '../components/icons';
import { Sheet } from '../components/Sheet';
import { Overlay } from '../components/Overlay';
import { InfoCard } from '../components/Glossary';
import { HeroHistory } from '../components/HeroHistory';

/** Why a hero shown in the peek card is on this page. */
type Peek =
  | { kind: 'counter'; heroId: string; pick: CounterPick }
  | { kind: 'strong'; heroId: string }
  | { kind: 'teamup'; heroId: string; label: string; text?: string };

export default function HeroDetail({
  heroId,
  tab,
  backTo,
  data,
  idx,
  platform,
  bracket,
  myRole,
  starred,
  starFull,
  onStar,
  onTab,
  onOpen,
  onBack,
  onClose,
}: {
  heroId: string | null;
  /** The tab this page shows. Each page in the stack remembers its own. */
  tab: HeroTab;
  /** Name of the hero you came from, when there is one to go back to. */
  backTo: string | null;
  data: Dataset;
  idx: HeroIndex;
  platform: Platform;
  bracket: BracketId;
  myRole: DraftRole;
  /** The hero is one of yours (starred). */
  starred: boolean;
  /** You've starred as many heroes as you can. */
  starFull: boolean;
  onStar: (heroId: string) => void;
  onTab: (tab: HeroTab) => void;
  onOpen: (heroId: string, tab: HeroTab) => void;
  onBack: () => void;
  onClose: () => void;
}) {
  const t = useTheme();
  const st = useStyles(makeStyles);
  const hero = heroId ? idx[heroId] : undefined;
  const scrollRef = useRef<ScrollView>(null);
  const scrollY = useRef(0);
  const viewH = useRef(0);
  const contentH = useRef(0);
  const tabBarY = useRef(0);
  // True once the tab bar has scrolled up to the top edge, which shows the pinned copy.
  const [pinned, setPinned] = useState(false);
  const [peek, setPeek] = useState<Peek | null>(null);
  const [info, setInfo] = useState<GlossaryGroupId | null>(null);
  // Shown when you try to star a hero with every slot taken.
  const [starNote, setStarNote] = useState(false);

  // A new hero starts with nothing open on top. Done while rendering so the old card never flashes.
  const [shownFor, setShownFor] = useState(heroId);
  if (heroId !== shownFor) {
    setShownFor(heroId);
    setPeek(null);
    setInfo(null);
    setPinned(false);
    setStarNote(false);
  }

  useEffect(() => {
    scrollY.current = 0;
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [heroId]);

  const strongAgainst = useMemo(
    () => (hero ? sortHeroes(goodAgainst(data, hero.id), bracket, platform) : []),
    [data, hero, bracket, platform],
  );
  const teamUps = useMemo(
    () => (hero ? heroTeamUps(hero.id, usableTeamUps(data, idx), idx) : { own: [], boosts: [] }),
    [data, idx, hero],
  );
  const history = useMemo(() => (hero ? historyFor(data, hero.id) : null), [data, hero]);
  const tips = hero ? tipsFor(hero) : null;
  const kit = hero ? kitFor(hero) : null;
  const focus = hero ? focusFor(hero) : null;
  // Flex has no role of its own, so the roles keep their usual order.
  const roleOrder: RoleId[] = myRole === 'flex' ? ROLES : [myRole, ...ROLES.filter((r) => r !== myRole)];

  const toggleStar = () => {
    if (!hero) return;
    if (!starred && starFull) {
      setStarNote(true);
      return;
    }
    setStarNote(false);
    onStar(hero.id);
  };

  const hasAbilities = !!kit || !!tips?.quirks.length || teamUps.own.length > 0;
  const tabs = HERO_TABS.filter((k) => (k !== 'abilities' || hasAbilities) && (k !== 'history' || !!history));
  const active: HeroTab = tabs.includes(tab) ? tab : 'against';

  // The tab bar pins by drawing a copy over the top of the list rather than as a sticky header,
  // because a pinned sticky header stops taking taps on Android (react-native issue 51763).
  const updatePinned = () => {
    // A shorter tab can leave the list unable to scroll as far as it was.
    const y = Math.min(scrollY.current, Math.max(0, contentH.current - viewH.current));
    const next = tabBarY.current > 0 && y >= tabBarY.current;
    if (next !== pinned) setPinned(next);
  };

  const selectTab = (next: HeroTab) => {
    if (next === active) return;
    onTab(next);
    // Keep the tab bar where it is and start the new tab from its top.
    if (scrollY.current > tabBarY.current) {
      scrollY.current = tabBarY.current;
      scrollRef.current?.scrollTo({ y: tabBarY.current, animated: false });
    }
  };

  const peekTeamUp = (u: HeroTeamUp, other: Hero) =>
    setPeek({
      kind: 'teamup',
      heroId: other.id,
      label: u.user.id === hero?.id ? u.name : `${u.user.name}’s ${u.name}`,
      text: u.bonus ? `With ${u.partner.name} on the team: ${lowerFirst(u.bonus)}` : u.effect,
    });

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
                {starred ? <Text style={st.newText}>MY HERO</Text> : null}
              </View>
              {starNote ? (
                <Text style={st.starNote}>
                  You’ve starred {MAX_MY_HEROES} heroes. Unstar one to add another.
                </Text>
              ) : null}
            </View>
            <View style={st.headBtns}>
              <Pressable
                onPress={toggleStar}
                accessibilityRole="button"
                accessibilityLabel={starred ? `Remove ${hero.name} from My heroes` : `Add ${hero.name} to My heroes`}
                accessibilityState={{ selected: starred }}
                hitSlop={6}
                style={st.round}
              >
                <Icon name={starred ? 'starred' : 'star'} size={19} color={starred ? t.accent : t.ink} />
              </Pressable>
              <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" hitSlop={10} style={st.round}>
                <Icon name="close" size={18} color={t.ink} />
              </Pressable>
            </View>
          </View>

          <View style={st.fill}>
            <ScrollView
              ref={scrollRef}
              contentContainerStyle={st.body}
              scrollEventThrottle={16}
              onLayout={(e) => {
                viewH.current = e.nativeEvent.layout.height;
                updatePinned();
              }}
              onContentSizeChange={(_, h) => {
                contentH.current = h;
                updatePinned();
              }}
              onScroll={(e) => {
                scrollY.current = e.nativeEvent.contentOffset.y;
                updatePinned();
              }}
            >
              <View style={st.pad}>
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
              </View>

              <TabBar
                tabs={tabs}
                active={active}
                onSelect={selectTab}
                hidden={pinned}
                onLayout={(e) => {
                  tabBarY.current = e.nativeEvent.layout.y;
                  updatePinned();
                }}
              />

              <View style={st.pad}>
                {active === 'against' ? (
                  <>
                    {focus && !focus.general ? (
                      <>
                        <SectionHead onInfo={() => setInfo('match')} infoLabel="What focus priority means">
                          Focus priority
                        </SectionHead>
                        <View style={st.focus}>
                          <FocusTag level={focus.level} />
                          <Text style={st.focusWhy}>{focus.why}</Text>
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
                        <SectionHead>How to play against {hero.name}</SectionHead>
                        <TipList items={tips.against} />
                      </>
                    ) : null}
                  </>
                ) : null}

                {active === 'as' ? (
                  <>
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

                    {tips && tips.as.length ? (
                      <>
                        <SectionHead>How to play {hero.name}</SectionHead>
                        <TipList items={tips.as} />
                      </>
                    ) : null}

                    {teamUps.own.length || teamUps.boosts.length ? (
                      <>
                        <SectionHead onInfo={() => setInfo('match')} infoLabel="What team-ups are">
                          Team-up partners
                        </SectionHead>
                        <View style={st.list}>
                          {teamUps.own.map((u) => (
                            <TeamUpRow
                              key={`own-${u.name}-${u.partner.id}`}
                              other={u.partner}
                              title={u.partner.name}
                              detail={`Makes your ${u.name} stronger`}
                              onPress={() => peekTeamUp(u, u.partner)}
                            />
                          ))}
                          {teamUps.boosts.map((u) => (
                            <TeamUpRow
                              key={`boost-${u.name}-${u.user.id}`}
                              other={u.user}
                              title={u.user.name}
                              detail={`You make their ${u.name} stronger`}
                              onPress={() => peekTeamUp(u, u.user)}
                            />
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

                    {!hero.styles?.length && !tips?.as.length && !teamUps.own.length && !teamUps.boosts.length && !strongAgainst.length ? (
                      <Text style={st.empty}>No play notes for {hero.name} yet.</Text>
                    ) : null}
                  </>
                ) : null}

                {active === 'history' && history ? <HeroHistory view={history} onInfo={() => setInfo('history')} /> : null}

                {active === 'abilities' ? (
                  <>
                    {kit
                      ? kit.groups.map((g, i) => (
                          <View key={g.kind}>
                            <SectionHead
                              onInfo={i === 0 ? () => setInfo('abilities') : undefined}
                              infoLabel={i === 0 ? 'What the ability terms mean' : undefined}
                            >
                              {g.label}
                            </SectionHead>
                            <View style={st.abilities}>
                              {g.abilities.map((a) => (
                                <View key={a.name} style={st.ability}>
                                  <Text style={st.abilityName}>{a.name}</Text>
                                  <Text style={st.abilityText}>{a.text}</Text>
                                </View>
                              ))}
                            </View>
                          </View>
                        ))
                      : null}

                    {teamUps.own.length ? (
                      <>
                        <SectionHead onInfo={() => setInfo('match')} infoLabel="What team-ups are">
                          Team-up abilities
                        </SectionHead>
                        <Text style={st.lead}>Pick one before the match. Each works alone and gets stronger with its partner on your team.</Text>
                        <View style={st.abilities}>
                          {teamUps.own.map((u) => (
                            <View key={`${u.name}-${u.partner.id}`} style={st.ability}>
                              <Text style={st.abilityName}>
                                {u.name} <Text style={st.abilityWith}>· with {u.partner.name}</Text>
                              </Text>
                              {u.effect ? <Text style={st.abilityText}>{u.effect}</Text> : null}
                              {u.bonus ? (
                                <Text style={st.abilityText}>
                                  <Text style={st.abilityBonus}>With {u.partner.name}: </Text>
                                  {u.bonus}
                                </Text>
                              ) : null}
                            </View>
                          ))}
                        </View>
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

                    {kit?.checked ? (
                      <Text style={st.checked}>
                        Checked against every patch since launch, last on {formatDate(kit.checked)}. Written in our own words, so in-game
                        names and numbers may differ slightly.
                      </Text>
                    ) : null}
                  </>
                ) : null}
              </View>
            </ScrollView>
            {pinned ? <TabBar tabs={tabs} active={active} onSelect={selectTab} pinned /> : null}
          </View>

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
                  // A counter or team-up partner is someone you'd play; a hero this one beats is an enemy.
                  const next: HeroTab = peek.kind === 'strong' ? 'against' : 'as';
                  setPeek(null);
                  onOpen(id, next);
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

function TabBar({
  tabs,
  active,
  onSelect,
  pinned,
  hidden,
  onLayout,
}: {
  tabs: HeroTab[];
  active: HeroTab;
  onSelect: (tab: HeroTab) => void;
  /** The copy drawn over the top of the list once the real bar scrolls up to it. */
  pinned?: boolean;
  /** Hides the real bar from screen readers while the pinned copy shows. */
  hidden?: boolean;
  onLayout?: (e: LayoutChangeEvent) => void;
}) {
  const st = useStyles(makeStyles);
  return (
    <View
      style={[st.tabBar, pinned && st.tabBarPinned]}
      accessibilityRole="tablist"
      aria-hidden={hidden}
      onLayout={onLayout}
    >
      {tabs.map((k) => {
        const on = k === active;
        return (
          <Pressable
            key={k}
            onPress={() => onSelect(k)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            style={({ pressed }) => [st.tabItem, pressed && { opacity: 0.7 }]}
          >
            <Text style={[st.tabText, on && st.tabTextOn]} numberOfLines={1}>
              {HERO_TAB_LABEL[k].toUpperCase()}
            </Text>
            <View style={[st.tabLine, on && st.tabLineOn]} />
          </Pressable>
        );
      })}
    </View>
  );
}

function lowerFirst(s: string): string {
  return s ? s[0].toLowerCase() + s.slice(1) : s;
}

function TeamUpRow({ other, title, detail, onPress }: { other: Hero; title: string; detail: string; onPress: () => void }) {
  const t = useTheme();
  const st = useStyles(makeStyles);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityHint="Shows a quick look at this hero"
      style={({ pressed }) => [st.teamRow, pressed && { opacity: 0.8 }]}
    >
      <Avatar hero={other} size={32} />
      <View style={st.teamText}>
        <Text style={st.teamName} numberOfLines={1}>
          {title}
        </Text>
        <Text style={st.small}>{detail}</Text>
      </View>
      <Icon name="chevron" size={16} color={t.ink3} />
    </Pressable>
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
  let text: string | undefined;
  if (peek.kind === 'counter') {
    label = `Counters ${hero.name}`;
    pick = peek.pick;
  } else if (peek.kind === 'teamup') {
    label = peek.label;
    text = peek.text;
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

      {peek.kind === 'teamup' ? (
        <View style={st.peekWhy}>
          <Text style={st.peekLabel}>{`TEAM-UP · ${label.toUpperCase()}`}</Text>
          {text ? <Text style={st.why}>{text}</Text> : null}
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
    headBtns: { flexDirection: 'row', gap: 8 },
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
    starNote: { marginTop: 6, color: t.ink2, fontFamily: FONT.body, fontSize: 12.5, lineHeight: 17 },
    round: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: t.surface2 },
    body: { paddingTop: 4, paddingBottom: 28 },
    pad: { paddingHorizontal: 16 },
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
    notes: { marginTop: 12, marginBottom: 14, gap: 6 },
    note: { flexDirection: 'row', gap: 8 },
    noteDot: { width: 6, height: 6, marginTop: 7, borderRadius: 3 },
    noteText: { flex: 1, color: t.ink2, fontFamily: FONT.body, fontSize: 13.5, lineHeight: 19 },
    tabBar: {
      flexDirection: 'row',
      paddingHorizontal: 8,
      backgroundColor: t.bg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.line,
    },
    tabBarPinned: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2 },
    tabItem: { flex: 1, alignItems: 'center', paddingTop: 12 },
    tabText: { color: t.ink3, fontFamily: FONT.displayBold, fontSize: 13.5, letterSpacing: 0.9 },
    tabTextOn: { color: t.ink },
    tabLine: { alignSelf: 'stretch', height: 3, marginTop: 10, marginHorizontal: 10, borderRadius: 2, backgroundColor: 'transparent' },
    tabLineOn: { backgroundColor: t.accent },
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
    focus: { gap: 6 },
    focusWhy: { color: t.ink2, fontFamily: FONT.body, fontSize: 13.5, lineHeight: 19 },
    list: { gap: 6 },
    teamRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 9,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: t.line,
      backgroundColor: t.surface,
    },
    teamText: { flex: 1, minWidth: 0, gap: 1 },
    teamName: { color: t.ink, fontFamily: FONT.bodyBold, fontSize: 15 },
    abilities: { gap: 12 },
    ability: { gap: 3 },
    abilityName: { color: t.ink, fontFamily: FONT.bodyBold, fontSize: 15 },
    abilityWith: { color: t.ink3, fontFamily: FONT.body, fontSize: 13.5 },
    abilityText: { color: t.ink2, fontFamily: FONT.body, fontSize: 14, lineHeight: 19.5 },
    abilityBonus: { color: t.ink, fontFamily: FONT.bodySemi },
    lead: { marginBottom: 10, color: t.ink3, fontFamily: FONT.body, fontSize: 13, lineHeight: 18 },
    checked: { marginTop: 20, color: t.ink3, fontFamily: FONT.body, fontSize: 12.5, lineHeight: 17 },
    empty: { marginTop: 18, color: t.ink3, fontFamily: FONT.body, fontSize: 13.5 },
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
