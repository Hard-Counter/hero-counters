import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
// Per-weight imports, so only these five font files ship with the app.
import { Barlow_400Regular } from '@expo-google-fonts/barlow/400Regular';
import { Barlow_600SemiBold } from '@expo-google-fonts/barlow/600SemiBold';
import { Barlow_700Bold } from '@expo-google-fonts/barlow/700Bold';
import { BarlowCondensed_700Bold } from '@expo-google-fonts/barlow-condensed/700Bold';
import { BarlowCondensed_800ExtraBold } from '@expo-google-fonts/barlow-condensed/800ExtraBold';

import type { BracketId, PadStyle, Platform } from './src/data/types';
import { useDataset } from './src/data/useDataset';
import { DRAFT_ROLES, DraftRole, HeroTab, MAX_MY_HEROES, PAD_STYLES, formatDate, indexHeroes } from './src/logic';
import { FONT, Theme, useStyles, useTheme } from './src/theme';
import { usePersisted, usePersistedList } from './src/usePersisted';
import { Segmented, SlantChip } from './src/components/ui';
import { Icon } from './src/components/icons';
import AdBanner from './src/components/AdBanner';
import TierListScreen from './src/screens/TierListScreen';
import DraftScreen, { EMPTY_MATCH, MatchState } from './src/screens/DraftScreen';
import CompsScreen from './src/screens/CompsScreen';
import AboutScreen from './src/screens/AboutScreen';
import HeroDetail from './src/screens/HeroDetail';

type Tab = 'tiers' | 'draft' | 'comps' | 'about';

/** One hero page in the stack, with the tab it shows. */
type DetailEntry = { id: string; tab: HeroTab };

const TABS: { id: Tab; label: string }[] = [
  { id: 'tiers', label: 'Tiers' },
  { id: 'draft', label: 'Draft' },
  { id: 'comps', label: 'Comps' },
  { id: 'about', label: 'About' },
];
const TAB_IDS = TABS.map((t) => t.id);
const PLATFORMS: readonly Platform[] = ['pc', 'console'];
const BRACKETS: readonly BracketId[] = ['bronze_gold', 'plat_diamond', 'gm_celestial', 'eternity_oaa'];

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Barlow_400Regular,
    Barlow_600SemiBold,
    Barlow_700Bold,
    BarlowCondensed_700Bold,
    BarlowCondensed_800ExtraBold,
  });
  return <SafeAreaProvider>{fontsLoaded || fontError ? <Root /> : <Loading />}</SafeAreaProvider>;
}

function Loading() {
  const t = useTheme();
  return <View style={{ flex: 1, backgroundColor: t.bg }} />;
}

function Root() {
  const t = useTheme();
  const st = useStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const { data, source } = useDataset();
  const idx = useMemo(() => indexHeroes(data), [data]);

  const [tab, setTab] = usePersisted<Tab>('tab', 'tiers', TAB_IDS);
  const [platform, setPlatform] = usePersisted<Platform>('platform', 'pc', PLATFORMS);
  const [bracket, setBracket] = usePersisted<BracketId>('bracket', 'plat_diamond', BRACKETS);
  const [myRole, setMyRole] = usePersisted<DraftRole>('role', 'duelist', DRAFT_ROLES);
  const [pad, setPad] = usePersisted<PadStyle>('pad', 'xbox', PAD_STYLES);
  // Heroes you starred as ones you're good at. The draft helper ranks them higher.
  const [starred, setStarred] = usePersistedList('myHeroes');
  const mine = useMemo(() => starred.filter((id) => !!idx[id]), [starred, idx]);
  const toggleMine = useCallback(
    (id: string) => {
      if (starred.includes(id)) setStarred(starred.filter((x) => x !== id));
      else if (mine.length < MAX_MY_HEROES) setStarred([...mine, id]);
    },
    [starred, mine, setStarred],
  );
  // Bans, teams and the map change every match, so they aren't remembered between launches.
  const [match, setMatch] = useState<MatchState>(EMPTY_MATCH);
  // Hero pages opened from a hero page stack up, so Back returns to the one before, on the tab it showed.
  const [detailStack, setDetailStack] = useState<DetailEntry[]>([]);
  const openDetail = useCallback((id: string, tab: HeroTab = 'against') => setDetailStack([{ id, tab }]), []);
  const pushDetail = useCallback(
    (id: string, tab: HeroTab) =>
      setDetailStack((s) => (s[s.length - 1]?.id === id ? s : [...s, { id, tab }].slice(-20))),
    [],
  );
  const popDetail = useCallback(() => setDetailStack((s) => s.slice(0, -1)), []);
  const closeDetail = useCallback(() => setDetailStack([]), []);
  const setDetailTab = useCallback(
    (tab: HeroTab) => setDetailStack((s) => (s.length ? [...s.slice(0, -1), { ...s[s.length - 1], tab }] : s)),
    [],
  );
  const detail = detailStack.length ? detailStack[detailStack.length - 1] : null;
  const backTo = detailStack.length > 1 ? (idx[detailStack[detailStack.length - 2].id]?.name ?? null) : null;
  // Tier list and enemy lookups open on Against; comps are about your own team, so Play as.
  const openAgainst = useCallback((id: string) => openDetail(id, 'against'), [openDetail]);
  const openPlayAs = useCallback((id: string) => openDetail(id, 'as'), [openDetail]);

  const showControls = tab === 'tiers' || tab === 'draft';

  return (
    <View style={[st.root, { paddingTop: insets.top }]}>
      <StatusBar style={t.dark ? 'light' : 'dark'} />

      <View style={st.header}>
        <View style={st.brandRow}>
          <View style={st.mark} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <View style={[st.markBar, { backgroundColor: t.role.vanguard }]} />
            <View style={[st.markBar, { backgroundColor: t.role.duelist }]} />
            <View style={[st.markBar, { backgroundColor: t.role.strategist }]} />
          </View>
          <View style={st.brand}>
            <Text style={st.title} numberOfLines={1}>
              HARD COUNTER
            </Text>
            <Text style={st.meta}>
              {data.seasonShort} · updated {formatDate(data.updated)}
            </Text>
          </View>
          {showControls ? (
            <Segmented
              value={platform}
              onChange={setPlatform}
              options={[
                { value: 'pc', label: 'PC' },
                { value: 'console', label: 'Console' },
              ]}
            />
          ) : null}
        </View>
        {showControls ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.brackets}>
            {data.brackets.map((b) => (
              <SlantChip key={b.id} label={b.short} on={b.id === bracket} onPress={() => setBracket(b.id)} />
            ))}
          </ScrollView>
        ) : null}
      </View>

      <View style={st.body}>
        {tab === 'tiers' ? <TierListScreen data={data} platform={platform} bracket={bracket} onOpen={openAgainst} /> : null}
        {tab === 'draft' ? (
          <DraftScreen
            data={data}
            idx={idx}
            platform={platform}
            bracket={bracket}
            myRole={myRole}
            setMyRole={setMyRole}
            match={match}
            setMatch={setMatch}
            mine={mine}
            setMine={setStarred}
            onOpen={openDetail}
          />
        ) : null}
        {tab === 'comps' ? <CompsScreen data={data} idx={idx} onOpen={openPlayAs} /> : null}
        {tab === 'about' ? <AboutScreen data={data} source={source} /> : null}
      </View>

      <AdBanner />

      <View style={[st.tabs, { paddingBottom: Math.max(insets.bottom, 6) }]} accessibilityRole="tablist">
        {TABS.map((item) => {
          const on = item.id === tab;
          const color = on ? t.accent : t.ink3;
          return (
            <Pressable
              key={item.id}
              onPress={() => setTab(item.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              accessibilityLabel={item.label}
              style={st.tab}
            >
              {on ? <View style={st.tabMark} /> : null}
              <Icon name={item.id} size={21} color={color} />
              <Text style={[st.tabText, { color }]}>{item.label.toUpperCase()}</Text>
            </Pressable>
          );
        })}
      </View>

      <HeroDetail
        heroId={detail?.id ?? null}
        tab={detail?.tab ?? 'against'}
        onTab={setDetailTab}
        backTo={backTo}
        data={data}
        idx={idx}
        platform={platform}
        bracket={bracket}
        myRole={myRole}
        pad={pad}
        onPad={setPad}
        starred={!!detail && mine.includes(detail.id)}
        starFull={mine.length >= MAX_MY_HEROES}
        onStar={toggleMine}
        onOpen={pushDetail}
        onBack={popDetail}
        onClose={closeDetail}
      />
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: t.bg },
    header: { paddingTop: 12 },
    brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 10 },
    mark: { flexDirection: 'row', gap: 3, height: 26, paddingLeft: 3 },
    markBar: { width: 6, height: 26, borderRadius: 1, transform: [{ skewX: '-14deg' }] },
    brand: { flex: 1, minWidth: 0 },
    title: { color: t.ink, fontFamily: FONT.display, fontSize: 22, letterSpacing: 0.7 },
    meta: { marginTop: 3, color: t.ink3, fontFamily: FONT.body, fontSize: 12 },
    brackets: { gap: 6, paddingHorizontal: 16, paddingTop: 2, paddingBottom: 10 },
    body: { flex: 1 },
    tabs: {
      flexDirection: 'row',
      paddingTop: 4,
      paddingHorizontal: 8,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: t.line,
      backgroundColor: t.bg,
    },
    tab: { flex: 1, alignItems: 'center', gap: 3, paddingTop: 8, paddingBottom: 4 },
    tabMark: {
      position: 'absolute',
      top: -4,
      left: '50%',
      marginLeft: -14,
      width: 28,
      height: 3,
      backgroundColor: t.accent,
      transform: [{ skewX: '-20deg' }],
    },
    tabText: { fontFamily: FONT.displayBold, fontSize: 12, letterSpacing: 1 },
  });
