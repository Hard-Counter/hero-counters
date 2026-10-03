import React, { useMemo, useState } from 'react';
import { Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import type { BracketId, Dataset, Hero, MapSide, Platform } from '../data/types';
import {
  DRAFT_ROLES,
  DRAFT_ROLE_LABEL,
  DraftRole,
  DuoSwap,
  GlossaryGroupId,
  HeroIndex,
  HeroTab,
  MAP_MODE_LABEL,
  MAP_SIDES,
  MAP_SIDE_LABEL,
  MAP_TRAIT_LABEL,
  MAX_MY_HEROES,
  Matchup,
  ROLES,
  ROLE_LABEL,
  Suggestion,
  banSuggestions,
  draft,
  duoSwap,
  focusOrder,
  hasSides,
  mapNote,
  teamNote,
  teamUpLabel,
  usableMaps,
  usableTeamUps,
} from '../logic';
import { FONT, Theme, alpha, useStyles, useTheme } from '../theme';
import { Avatar, ConfTag, FocusTag, LinkButton, SectionHead, Segmented, TierBadge } from '../components/ui';
import { Icon } from '../components/icons';
import { Overlay } from '../components/Overlay';
import { InfoCard } from '../components/Glossary';
import HeroPicker from './HeroPicker';
import MapPicker from './MapPicker';

export interface MatchState {
  mapId: string | null;
  side: MapSide;
  /** Bans by each team. A banned hero can't be picked by anyone. */
  bans: { ours: string[]; theirs: string[] };
  /** Your teammates' heroes (not yours). */
  allies: string[];
  /** A teammate who'll switch heroes with you, like a friend you queue with. */
  duoId: string | null;
  enemies: string[];
  /** The hero you want to play, for ban suggestions. */
  protectId: string | null;
  /** Filled in by "Try an example match". */
  example: boolean;
}

export const EMPTY_MATCH: MatchState = {
  mapId: null,
  side: 'either',
  bans: { ours: [], theirs: [] },
  allies: [],
  duoId: null,
  enemies: [],
  protectId: null,
  example: false,
};

const MAX_BANS = 3;
const MAX_ALLIES = 5;
const MAX_ENEMIES = 6;

const EXAMPLE: Pick<MatchState, 'bans' | 'allies' | 'duoId' | 'enemies'> = {
  bans: { ours: ['elsa-bloodstone', 'gambit', 'magik'], theirs: ['black-panther', 'wolverine', 'hela'] },
  allies: ['magneto', 'the-hood', 'rocket-raccoon', 'jubilee'],
  duoId: 'magneto',
  enemies: ['peni-parker', 'devil-dinosaur', 'gorr', 'spider-man', 'mantis', 'ultron'],
};

type PickerTarget = 'ours' | 'theirs' | 'allies' | 'enemies' | 'protect' | 'mine';

const names = (list: { name: string }[]) => list.map((h) => h.name).join(', ');

/** "A, B and C" */
const andList = (list: { name: string }[]) =>
  list.length > 1 ? `${names(list.slice(0, -1))} and ${list[list.length - 1].name}` : (list[0]?.name ?? '');

function pickReason(p: Suggestion): string {
  if (p.beats.length) return `Counters ${names(p.beats)}`;
  if (p.edges.length) return `Slight edge against ${names(p.edges)}`;
  return 'Strong pick at this rank';
}

const toggleIn = (list: string[], id: string, max: number) =>
  list.includes(id) ? list.filter((x) => x !== id) : list.length < max ? [...list, id] : list;

export default function DraftScreen({
  data,
  idx,
  platform,
  bracket,
  myRole,
  setMyRole,
  match,
  setMatch,
  mine,
  setMine,
  onOpen,
}: {
  data: Dataset;
  idx: HeroIndex;
  platform: Platform;
  bracket: BracketId;
  myRole: DraftRole;
  setMyRole: (r: DraftRole) => void;
  match: MatchState;
  setMatch: React.Dispatch<React.SetStateAction<MatchState>>;
  /** Heroes you starred as ones you play well. */
  mine: string[];
  setMine: (ids: string[]) => void;
  /** Opens a hero page on the tab that fits: Play as for your picks, Against for enemies. */
  onOpen: (heroId: string, tab?: HeroTab) => void;
}) {
  const t = useTheme();
  const st = useStyles(makeStyles);
  // Four role buttons share the row, so the smallest phones get slightly smaller labels.
  const narrow = useWindowDimensions().width < 350;
  const [picker, setPicker] = useState<PickerTarget | null>(null);
  const [pickingMap, setPickingMap] = useState(false);
  const [info, setInfo] = useState<GlossaryGroupId | null>(null);
  const [query, setQuery] = useState('');

  const maps = useMemo(() => usableMaps(data), [data]);
  const teamUps = useMemo(() => usableTeamUps(data, idx), [data, idx]);
  const map = maps.find((m) => m.id === match.mapId) ?? null;
  const mapCtx = useMemo(() => (map ? { map, side: match.side } : null), [map, match.side]);
  const banned = useMemo(() => [...match.bans.ours, ...match.bans.theirs], [match.bans]);
  const flex = myRole === 'flex';
  // The duo only counts while they're still on your team.
  const duoId = match.duoId && match.allies.includes(match.duoId) ? match.duoId : null;

  const opts = useMemo(
    () => ({ map: mapCtx, banned, allies: match.allies, teamUps, mine }),
    [mapCtx, banned, match.allies, teamUps, mine],
  );
  const result = useMemo(
    () => draft(data, idx, myRole, match.enemies, bracket, platform, opts),
    [data, idx, myRole, match.enemies, bracket, platform, opts],
  );
  const swap = useMemo(
    () => duoSwap(data, idx, myRole, duoId, match.enemies, bracket, platform, opts),
    [data, idx, myRole, duoId, match.enemies, bracket, platform, opts],
  );
  const mineHeroes = useMemo(
    () =>
      mine
        .map((id) => idx[id])
        .filter(Boolean)
        .sort((a, b) => ROLES.indexOf(a.role) - ROLES.indexOf(b.role) || a.name.localeCompare(b.name)),
    [mine, idx],
  );

  const protectHero = match.protectId ? idx[match.protectId] : undefined;
  const banIdeas = useMemo(
    () =>
      protectHero
        ? banSuggestions(idx, protectHero.id, bracket, platform, [...banned, ...match.allies, ...match.enemies])
        : [],
    [idx, protectHero, bracket, platform, banned, match.allies, match.enemies],
  );

  const allyHeroes = match.allies.map((id) => idx[id]).filter(Boolean);
  const enemyHeroes = match.enemies.map((id) => idx[id]).filter(Boolean);
  const duoHero = duoId ? idx[duoId] : undefined;
  const note = teamNote(allyHeroes, flex ? null : myRole);
  const started = !!(map || banned.length || match.allies.length || match.enemies.length || match.protectId);
  const showPicks = !!(map || banned.length || match.allies.length || match.enemies.length);
  const oursFull = match.bans.ours.length >= MAX_BANS;

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return data.heroes
      .filter((h) => h.name.toLowerCase().includes(q))
      .sort(
        (a, b) =>
          Number(!a.name.toLowerCase().startsWith(q)) - Number(!b.name.toLowerCase().startsWith(q)) ||
          a.name.localeCompare(b.name) ||
          ROLES.indexOf(a.role) - ROLES.indexOf(b.role),
      )
      .slice(0, 6);
  }, [data, query]);

  const lookUp = (id: string) => {
    setQuery('');
    Keyboard.dismiss();
    onOpen(id, 'against');
  };

  const addEnemy = (id: string) => {
    setQuery('');
    Keyboard.dismiss();
    setMatch((m) => (m.enemies.includes(id) ? m : { ...m, example: false, enemies: toggleIn(m.enemies, id, MAX_ENEMIES) }));
  };

  const edit = (patch: (m: MatchState) => Partial<MatchState>) => setMatch((m) => ({ ...m, example: false, ...patch(m) }));

  const onPickerToggle = (id: string) => {
    switch (picker) {
      case 'ours':
        edit((m) => ({ bans: { ...m.bans, ours: toggleIn(m.bans.ours, id, MAX_BANS) } }));
        break;
      case 'theirs':
        edit((m) => ({ bans: { ...m.bans, theirs: toggleIn(m.bans.theirs, id, MAX_BANS) } }));
        break;
      case 'allies':
        edit((m) => ({ allies: toggleIn(m.allies, id, MAX_ALLIES) }));
        break;
      case 'enemies':
        edit((m) => ({ enemies: toggleIn(m.enemies, id, MAX_ENEMIES) }));
        break;
      case 'protect':
        setMatch((m) => ({ ...m, protectId: m.protectId === id ? null : id }));
        setPicker(null);
        break;
      case 'mine':
        setMine(toggleIn(mine, id, MAX_MY_HEROES));
        break;
    }
  };

  const pickerProps = (() => {
    switch (picker) {
      case 'ours':
        return { title: 'Your team’s bans', selected: match.bans.ours, max: MAX_BANS, unavailable: [...match.bans.theirs, ...match.allies, ...match.enemies] };
      case 'theirs':
        return { title: 'Enemy bans', selected: match.bans.theirs, max: MAX_BANS, unavailable: [...match.bans.ours, ...match.allies, ...match.enemies] };
      case 'allies':
        return { title: 'Your team', selected: match.allies, max: MAX_ALLIES, unavailable: banned, tone: 'ally' as const };
      case 'enemies':
        return { title: 'Enemy team', selected: match.enemies, max: MAX_ENEMIES, unavailable: banned };
      case 'protect':
        return {
          title: 'The hero you want to play',
          selected: match.protectId ? [match.protectId] : [],
          max: 1,
          single: true,
          unavailable: [...banned, ...match.allies],
          initialRole: flex ? undefined : myRole,
          tone: 'ally' as const,
        };
      case 'mine':
        return { title: 'My heroes', selected: mine, max: MAX_MY_HEROES, tone: 'ally' as const };
      default:
        return { title: '', selected: [], max: 0 };
    }
  })();

  return (
    <View style={st.fill}>
      <ScrollView contentContainerStyle={st.content} keyboardShouldPersistTaps="handled">
        {/* Quick lookup: the most common use is one hero causing trouble. */}
        <SectionHead style={{ marginTop: 10 }}>Who’s giving you trouble?</SectionHead>
        <View style={st.search}>
          <Icon name="search" size={16} color={t.ink3} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search a hero to see how to beat them"
            placeholderTextColor={t.ink3}
            style={st.input}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            onSubmitEditing={() => (results[0] ? lookUp(results[0].id) : undefined)}
            accessibilityLabel="Search a hero to see how to beat them"
          />
          {query ? (
            <Pressable onPress={() => setQuery('')} accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={8}>
              <Icon name="close" size={14} color={t.ink3} />
            </Pressable>
          ) : null}
        </View>
        {query.trim() ? (
          <View style={st.results}>
            {results.length === 0 ? <Text style={st.hint}>No hero matches “{query.trim()}”.</Text> : null}
            {results.map((h) => {
              const isEnemy = match.enemies.includes(h.id);
              const canAdd = !isEnemy && match.enemies.length < MAX_ENEMIES && !banned.includes(h.id);
              return (
                <View key={h.id} style={st.resultRow}>
                  <Pressable
                    onPress={() => lookUp(h.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`How to beat ${h.name}`}
                    style={({ pressed }) => [st.resultMain, pressed && { opacity: 0.7 }]}
                  >
                    <Avatar hero={h} size={28} />
                    <View style={st.flex}>
                      <Text style={st.resultName}>{h.name}</Text>
                      <Text style={st.resultSub}>{h.variant ? `${ROLE_LABEL[h.role]} · ` : ''}See counters and tips</Text>
                    </View>
                  </Pressable>
                  {canAdd ? (
                    <Pressable
                      onPress={() => addEnemy(h.id)}
                      accessibilityRole="button"
                      accessibilityLabel={`Add ${h.name} to the enemy team`}
                      style={({ pressed }) => [st.addEnemy, pressed && { opacity: 0.7 }]}
                    >
                      <Icon name="plus" size={13} color={t.enemy} />
                      <Text style={st.addEnemyText}>Enemy</Text>
                    </Pressable>
                  ) : isEnemy ? (
                    <Text style={st.resultTag}>On enemy team</Text>
                  ) : null}
                </View>
              );
            })}
          </View>
        ) : null}

        <SectionHead right={started ? <LinkButton label="New match" onPress={() => setMatch(EMPTY_MATCH)} /> : null}>
          Your role
        </SectionHead>
        <View style={st.roleRow} accessibilityRole="radiogroup">
          {DRAFT_ROLES.map((r) => {
            const on = r === myRole;
            return (
              <Pressable
                key={r}
                onPress={() => setMyRole(r)}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                style={[st.roleBtn, on && st.roleBtnOn]}
              >
                <Icon name={r} size={16} color={r === 'flex' ? t.accent : t.role[r]} />
                <Text style={[st.roleText, narrow && st.roleTextNarrow, on && { color: t.ink }]} numberOfLines={1}>
                  {DRAFT_ROLE_LABEL[r]}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {flex ? <Text style={st.roleNote}>Picks from every role, for when you’ll play anything.</Text> : null}

        <SectionHead onInfo={() => setInfo('match')} infoLabel="What My heroes means">
          My heroes
        </SectionHead>
        <Pressable
          onPress={() => setPicker('mine')}
          accessibilityRole="button"
          accessibilityLabel={
            mineHeroes.length ? `My heroes: ${names(mineHeroes)}. Edit your heroes` : 'Add the heroes you play well'
          }
          style={({ pressed }) => [st.mapBtn, pressed && { opacity: 0.8 }]}
        >
          <Icon name={mineHeroes.length ? 'starred' : 'star'} size={18} color={mineHeroes.length ? t.accent : t.ink3} />
          <View style={st.flex}>
            {mineHeroes.length ? (
              <Text style={st.mineNames} numberOfLines={2}>
                {names(mineHeroes)}
              </Text>
            ) : (
              <>
                <Text style={st.mapName}>None yet</Text>
                <Text style={st.mapMeta}>Optional. Star heroes you play well and they rank higher in your picks.</Text>
              </>
            )}
          </View>
          <Text style={st.link}>{mineHeroes.length ? 'Edit' : 'Add'}</Text>
        </Pressable>

        {maps.length > 0 ? (
          <>
            <SectionHead onInfo={() => setInfo('maps')} infoLabel="What map modes and tags mean">
              Map
            </SectionHead>
            <Pressable
              onPress={() => setPickingMap(true)}
              accessibilityRole="button"
              accessibilityLabel={map ? `Map: ${map.name}. Change the map` : 'Pick a map'}
              style={({ pressed }) => [st.mapBtn, map && { borderColor: t.accent }, pressed && { opacity: 0.8 }]}
            >
              <View style={st.flex}>
                <Text style={st.mapName}>{map ? map.name : 'Any map'}</Text>
                <Text style={st.mapMeta} numberOfLines={2}>
                  {map
                    ? [MAP_MODE_LABEL[map.mode], ...map.traits.map((tr) => MAP_TRAIT_LABEL[tr])].join(' · ')
                    : 'Optional. Pick one to suit your picks to the layout.'}
                </Text>
              </View>
              <Text style={st.link}>{map ? 'Change' : 'Pick'}</Text>
            </Pressable>
            {map && hasSides(map.mode) ? (
              <View style={st.sideRow}>
                <Segmented
                  value={match.side}
                  onChange={(side) => setMatch((m) => ({ ...m, side }))}
                  options={MAP_SIDES.map((s) => ({ value: s, label: MAP_SIDE_LABEL[s] }))}
                />
              </View>
            ) : null}
          </>
        ) : null}

        <SectionHead
          onInfo={() => setInfo('bans')}
          infoLabel="How bans work"
          right={banned.length ? <LinkButton label="Clear" onPress={() => edit(() => ({ bans: { ours: [], theirs: [] } }))} /> : null}
        >
          Bans · {banned.length}/{MAX_BANS * 2}
        </SectionHead>
        <BanRow
          label="Your team"
          ids={match.bans.ours}
          idx={idx}
          onAdd={() => setPicker('ours')}
          onRemove={(id) => edit((m) => ({ bans: { ...m.bans, ours: m.bans.ours.filter((x) => x !== id) } }))}
        />
        <BanRow
          label="Enemy team"
          ids={match.bans.theirs}
          idx={idx}
          onAdd={() => setPicker('theirs')}
          onRemove={(id) => edit((m) => ({ bans: { ...m.bans, theirs: m.bans.theirs.filter((x) => x !== id) } }))}
        />

        {protectHero ? (
          <View style={st.protect}>
            <View style={st.protectHead}>
              <Text style={st.protectLabel}>PROTECT YOUR PICK</Text>
              <View style={st.flex} />
              <LinkButton label="Change" onPress={() => setPicker('protect')} />
              <Pressable
                onPress={() => setMatch((m) => ({ ...m, protectId: null }))}
                accessibilityRole="button"
                accessibilityLabel="Stop protecting this pick"
                hitSlop={8}
              >
                <Icon name="close" size={14} color={t.ink3} />
              </Pressable>
            </View>
            <View style={st.protectHero}>
              <Avatar hero={protectHero} size={30} />
              <Text style={st.protectName}>
                Ban these to protect <Text style={st.protectStrong}>{protectHero.name}</Text>:
              </Text>
            </View>
            {banIdeas.length === 0 ? <Text style={st.hint}>Its listed counters are already banned or picked.</Text> : null}
            {banIdeas.map((b) => (
              <View key={b.hero.id} style={st.banIdea}>
                <Avatar hero={b.hero} size={28} />
                <View style={st.flex}>
                  <Text style={st.banIdeaName}>{b.hero.name}</Text>
                  <Text style={st.banIdeaWhy}>{b.pick.reason}</Text>
                </View>
                <Pressable
                  onPress={() => edit((m) => ({ bans: { ...m.bans, ours: toggleIn(m.bans.ours, b.hero.id, MAX_BANS) } }))}
                  disabled={oursFull}
                  accessibilityRole="button"
                  accessibilityLabel={`Ban ${b.hero.name}`}
                  accessibilityState={{ disabled: oursFull }}
                  style={({ pressed }) => [st.banBtn, oursFull && { opacity: 0.4 }, pressed && { opacity: 0.7 }]}
                >
                  <Text style={st.banBtnText}>Ban</Text>
                </Pressable>
              </View>
            ))}
            {oursFull && banIdeas.length ? <Text style={st.hint}>Your team’s three bans are used.</Text> : null}
          </View>
        ) : (
          <Pressable
            onPress={() => setPicker('protect')}
            accessibilityRole="button"
            style={({ pressed }) => [st.protectBtn, pressed && { opacity: 0.8 }]}
          >
            <View style={st.flex}>
              <Text style={st.protectBtnTitle}>Protect your pick</Text>
              <Text style={st.mapMeta}>Choose the hero you want to play to see which counters to ban.</Text>
            </View>
            <Text style={st.link}>Choose</Text>
          </Pressable>
        )}

        <SectionHead
          onInfo={() => setInfo('match')}
          infoLabel="What team-ups are"
          right={match.allies.length ? <LinkButton label="Clear" onPress={() => edit(() => ({ allies: [] }))} /> : null}
        >
          Your team · {match.allies.length}/{MAX_ALLIES}
        </SectionHead>
        {match.allies.length === 0 ? <Text style={st.hint}>Your teammates, as they lock in. Leave yourself out.</Text> : null}
        <Slots
          ids={match.allies}
          max={MAX_ALLIES}
          idx={idx}
          tone="ally"
          duoId={duoId}
          onAdd={() => setPicker('allies')}
          onRemove={(id) => edit((m) => ({ allies: m.allies.filter((x) => x !== id) }))}
        />
        {note ? <Text style={st.teamNote}>{note}</Text> : null}
        {allyHeroes.length ? (
          <View style={st.duoBox}>
            <Text style={st.duoLabel}>
              {duoHero ? 'Your duo will swap heroes too' : 'Playing with a friend who’ll swap heroes too? Tap them.'}
            </Text>
            <View style={st.duoRow}>
              {allyHeroes.map((h) => {
                const on = h.id === duoId;
                return (
                  <Pressable
                    key={h.id}
                    onPress={() => edit(() => ({ duoId: on ? null : h.id }))}
                    accessibilityRole="button"
                    accessibilityLabel={on ? `${h.name} is your duo. Tap to clear` : `Make ${h.name} your duo`}
                    accessibilityState={{ selected: on }}
                    style={({ pressed }) => [st.duoChip, on && st.duoChipOn, pressed && { opacity: 0.7 }]}
                  >
                    <Avatar hero={h} size={20} />
                    <Text style={[st.duoName, on && { color: t.ink }]} numberOfLines={1}>
                      {h.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        <SectionHead right={match.enemies.length ? <LinkButton label="Clear" onPress={() => edit(() => ({ enemies: [] }))} /> : null}>
          Enemy team · {match.enemies.length}/{MAX_ENEMIES}
        </SectionHead>
        {match.enemies.length === 0 ? <Text style={st.hint}>Add enemies as you spot them on the scoreboard.</Text> : null}
        <Slots
          ids={match.enemies}
          max={MAX_ENEMIES}
          idx={idx}
          tone="enemy"
          onAdd={() => setPicker('enemies')}
          onRemove={(id) => edit((m) => ({ enemies: m.enemies.filter((x) => x !== id) }))}
        />

        {!started ? (
          <View style={st.empty}>
            <Text style={st.emptyText}>
              Fill this in as the match goes: bans and your team during hero select, the enemy team once you see the scoreboard.
              Suggestions update as you go.
            </Text>
            <Pressable
              onPress={() => setMatch({ ...EMPTY_MATCH, ...EXAMPLE, bans: { ...EXAMPLE.bans }, example: true })}
              accessibilityRole="button"
              style={st.btn}
            >
              <Text style={st.btnText}>Try an example match</Text>
            </Pressable>
          </View>
        ) : null}
        {match.example ? <Text style={st.exampleNote}>Example match. Tap a hero to remove it, or New match to start your own.</Text> : null}

        {showPicks ? (
          <>
            <SectionHead>
              {flex ? 'Best picks in any role' : `Best ${ROLE_LABEL[myRole]} picks`}
              {map && match.enemies.length === 0 ? ` on ${map.name}` : ''}
            </SectionHead>
            {result.picks.length === 0 ? (
              <Text style={st.hint}>{flex ? 'Every hero is banned or taken.' : `Every ${ROLE_LABEL[myRole]} is banned or taken.`}</Text>
            ) : null}
            <View style={st.list}>
              {result.picks.map((p, i) => {
                const fit = mapNote(p.map);
                return (
                  <Pressable
                    key={p.hero.id}
                    onPress={() => onOpen(p.hero.id, 'as')}
                    accessibilityRole="button"
                    style={({ pressed }) => [st.pick, i === 0 && { borderColor: t.accent }, pressed && { opacity: 0.8 }]}
                  >
                    <Text style={[st.pickN, i === 0 && { color: t.accent }]}>{i + 1}</Text>
                    <Avatar hero={p.hero} size={36} />
                    <View style={st.pickBody}>
                      <View style={st.pickHead}>
                        <Text style={st.pickName}>{p.hero.name}</Text>
                        {flex ? (
                          <Text style={[st.pickRole, { color: t.role[p.hero.role] }]}>{ROLE_LABEL[p.hero.role].toUpperCase()}</Text>
                        ) : null}
                      </View>
                      <Text style={st.pickWhy}>{pickReason(p)}</Text>
                      {p.comfort ? (
                        <View style={st.noteRow}>
                          <Icon name="starred" size={11} color={t.accent} />
                          <Text style={[st.pickNote, { color: t.accent }]}>One of your heroes</Text>
                        </View>
                      ) : null}
                      {p.fillsRole ? (
                        <Text style={[st.pickNote, { color: t.conf.data }]}>Your team has no {ROLE_LABEL[p.fillsRole]} yet</Text>
                      ) : null}
                      {p.teamUps.map((m) => (
                        <Text key={m.name + m.partners.map((h) => h.id).join()} style={[st.pickNote, { color: t.accent }]}>
                          {teamUpLabel(m)}
                        </Text>
                      ))}
                      {fit ? <Text style={[st.pickNote, { color: p.map.score > 0 ? t.conf.data : t.ban.medium }]}>{fit}</Text> : null}
                    </View>
                    <TierBadge tier={p.tier} size={30} />
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : null}

        {duoHero && enemyHeroes.length ? (
          <>
            <SectionHead onInfo={() => setInfo('match')} infoLabel="How duo swaps work">
              Swap with your duo
            </SectionHead>
            {swap ? (
              <DuoCard swap={swap} onOpen={onOpen} />
            ) : (
              <Text style={st.hint}>No swap with {duoHero.name} beats your best pick right now.</Text>
            )}
          </>
        ) : null}

        {enemyHeroes.length >= 2 ? (
          <>
            <SectionHead onInfo={() => setInfo('match')} infoLabel="What focus priority means">
              Focus first
            </SectionHead>
            <View style={st.list}>
              {focusOrder(enemyHeroes, bracket, platform).map((f, i) => (
                <Pressable
                  key={f.hero.id}
                  onPress={() => onOpen(f.hero.id, 'against')}
                  accessibilityRole="button"
                  style={({ pressed }) => [st.focusRow, pressed && { opacity: 0.8 }]}
                >
                  <Text style={st.focusN}>{i + 1}</Text>
                  <Avatar hero={f.hero} size={28} />
                  <View style={st.flex}>
                    <View style={st.focusHead}>
                      <Text style={st.focusName}>{f.hero.name}</Text>
                      <FocusTag level={f.level} />
                    </View>
                    <Text style={st.focusWhy}>{f.why}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </>
        ) : null}

        {result.matchups.length > 0 ? (
          <>
            <SectionHead>Your counter to each enemy</SectionHead>
            <View style={st.list}>
              {result.matchups.map((m) => (
                <MatchupCard key={m.enemy.id} m={m} role={myRole} onOpen={onOpen} />
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>

      <HeroPicker visible={picker !== null} data={data} onToggle={onPickerToggle} onClose={() => setPicker(null)} {...pickerProps} />
      <MapPicker
        visible={pickingMap}
        maps={maps}
        selected={map ? map.id : null}
        onSelect={(mapId) => setMatch((m) => ({ ...m, mapId }))}
        onClose={() => setPickingMap(false)}
      />
      <Overlay visible={!!info} onClose={() => setInfo(null)}>
        {info ? <InfoCard groupId={info} onClose={() => setInfo(null)} /> : null}
      </Overlay>
    </View>
  );
}

function BanRow({
  label,
  ids,
  idx,
  onAdd,
  onRemove,
}: {
  label: string;
  ids: string[];
  idx: HeroIndex;
  onAdd: () => void;
  onRemove: (id: string) => void;
}) {
  const t = useTheme();
  const st = useStyles(makeStyles);
  return (
    <View style={st.banGroup}>
      <Text style={st.banLabel}>{label}</Text>
      <View style={st.banRow}>
        {Array.from({ length: MAX_BANS }, (_, i) => {
          const hero = idx[ids[i]];
          return hero ? (
            <Pressable
              key={hero.id}
              onPress={() => onRemove(hero.id)}
              accessibilityRole="button"
              accessibilityLabel={`Remove ban on ${hero.name}`}
              style={[st.banSlot, st.banFilled]}
            >
              <Avatar hero={hero} size={22} />
              <Text style={st.banName} numberOfLines={2}>
                {hero.name}
              </Text>
            </Pressable>
          ) : (
            <Pressable
              key={`empty-${i}`}
              onPress={onAdd}
              accessibilityRole="button"
              accessibilityLabel={`Add a ban for ${label === 'Enemy team' ? 'the enemy team' : 'your team'}`}
              style={[st.banSlot, st.banEmpty]}
            >
              <Icon name="plus" size={13} color={t.ink3} />
              <Text style={st.banAdd}>Ban</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function Slots({
  ids,
  max,
  idx,
  tone,
  duoId,
  onAdd,
  onRemove,
}: {
  ids: string[];
  max: number;
  idx: HeroIndex;
  tone: 'ally' | 'enemy';
  /** Your duo partner, marked on their slot. */
  duoId?: string | null;
  onAdd: () => void;
  onRemove: (id: string) => void;
}) {
  const t = useTheme();
  const st = useStyles(makeStyles);
  const color = tone === 'enemy' ? t.enemy : t.accent;
  const who = tone === 'enemy' ? 'the enemy team' : 'your team';
  return (
    <View style={st.slots}>
      {Array.from({ length: max }, (_, i) => {
        const hero: Hero | undefined = idx[ids[i]];
        return hero ? (
          <Pressable
            key={hero.id}
            onPress={() => onRemove(hero.id)}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${hero.name} from ${who}`}
            style={[st.slot, { borderWidth: 1, borderColor: alpha(color, 0.45), backgroundColor: alpha(color, 0.09) }]}
          >
            <View style={st.slotX}>
              <Icon name="close" size={11} color={t.ink3} />
            </View>
            {hero.id === duoId ? <Text style={st.slotDuo}>DUO</Text> : null}
            <Avatar hero={hero} size={30} />
            <Text style={st.slotName} numberOfLines={2}>
              {hero.name}
            </Text>
          </Pressable>
        ) : (
          <Pressable
            key={`empty-${i}`}
            onPress={onAdd}
            accessibilityRole="button"
            accessibilityLabel={`Add a hero to ${who}`}
            style={[st.slot, st.slotEmpty]}
          >
            <Icon name="plus" size={18} color={t.ink3} />
            <Text style={st.slotAdd}>Add</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function DuoCard({ swap, onOpen }: { swap: DuoSwap; onOpen: (heroId: string, tab?: HeroTab) => void }) {
  const t = useTheme();
  const st = useStyles(makeStyles);
  const rows: { key: string; label: string; s: Suggestion }[] = [
    { key: 'you', label: 'You pick', s: swap.you },
    { key: 'duo', label: `${swap.from.name} switches to`, s: swap.duo },
  ];
  return (
    <View style={st.duoCard}>
      {rows.map(({ key, label, s }) => (
        <Pressable
          key={key}
          onPress={() => onOpen(s.hero.id, 'as')}
          accessibilityRole="button"
          accessibilityLabel={`${label} ${s.hero.name}, ${ROLE_LABEL[s.hero.role]}`}
          style={({ pressed }) => [st.duoPick, pressed && { opacity: 0.8 }]}
        >
          <Avatar hero={s.hero} size={32} />
          <View style={st.flex}>
            <Text style={st.duoPickLabel} numberOfLines={1}>
              {label.toUpperCase()}
            </Text>
            <View style={st.pickHead}>
              <Text style={st.pickName}>{s.hero.name}</Text>
              <Text style={[st.pickRole, { color: t.role[s.hero.role] }]}>{ROLE_LABEL[s.hero.role].toUpperCase()}</Text>
            </View>
            {key === 'you' && s.comfort ? (
              <View style={st.noteRow}>
                <Icon name="starred" size={11} color={t.accent} />
                <Text style={[st.pickNote, { color: t.accent }]}>One of your heroes</Text>
              </View>
            ) : null}
          </View>
          <TierBadge tier={s.tier} size={28} />
        </Pressable>
      ))}
      {swap.covers.length ? <Text style={st.duoWhy}>Together you counter {andList(swap.covers)}.</Text> : null}
    </View>
  );
}

function MatchupCard({ m, role, onOpen }: { m: Matchup; role: DraftRole; onOpen: (heroId: string, tab?: HeroTab) => void }) {
  const t = useTheme();
  const st = useStyles(makeStyles);
  const note =
    m.status === 'ally'
      ? `${m.counter.name} is already on your team.`
      : m.status === 'banned'
        ? `${m.counter.name} is banned, and no ${role === 'flex' ? 'alternative' : `other ${ROLE_LABEL[role]}`} is listed. Lean on your team.`
        : m.instead
          ? `${m.instead.name} is banned, so ${m.counter.name} stands in.`
          : null;
  return (
    <Pressable
      onPress={() => (m.status === 'banned' ? onOpen(m.enemy.id, 'against') : onOpen(m.counter.id, 'as'))}
      accessibilityRole="button"
      style={({ pressed }) => [st.mu, pressed && { opacity: 0.8 }]}
    >
      <View style={st.muHead}>
        <View style={st.muHero}>
          <Avatar hero={m.enemy} size={24} />
          <Text style={st.muEnemy}>{m.enemy.name}</Text>
        </View>
        <Icon name="arrow" size={15} color={t.ink3} />
        <View style={[st.muHero, m.status === 'banned' && { opacity: 0.5 }]}>
          <Avatar hero={m.counter} size={24} />
          <Text style={[st.muCounter, m.status === 'banned' && st.struck]}>{m.counter.name}</Text>
        </View>
        {m.status === 'ally' ? <Text style={[st.muTag, { color: t.accent }]}>ON YOUR TEAM</Text> : null}
        {m.status === 'banned' ? <Text style={[st.muTag, { color: t.ban.high }]}>BANNED</Text> : null}
      </View>
      <Text style={st.muWhy}>{m.pick.reason}</Text>
      <View style={st.muFoot}>
        <ConfTag confidence={m.pick.confidence} />
        {m.pick.note ? <Text style={[st.muNote, m.pick.weak && { color: t.ban.medium }]}>{m.pick.note}</Text> : null}
      </View>
      {note ? <Text style={[st.muNote, m.status === 'banned' && { color: t.ban.medium }]}>{note}</Text> : null}
    </Pressable>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    fill: { flex: 1 },
    flex: { flex: 1, minWidth: 0 },
    content: { paddingHorizontal: 16, paddingBottom: 28 },
    hint: { marginBottom: 8, color: t.ink3, fontFamily: FONT.body, fontSize: 13, lineHeight: 18 },
    search: {
      height: 44,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: t.line,
      backgroundColor: t.surface,
    },
    input: { flex: 1, height: '100%', color: t.ink, fontFamily: FONT.body, fontSize: 15 },
    results: { marginTop: 6, gap: 4 },
    resultRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingRight: 8,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: t.line,
      backgroundColor: t.surface,
    },
    resultMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingLeft: 10 },
    resultName: { color: t.ink, fontFamily: FONT.bodyBold, fontSize: 15 },
    resultSub: { color: t.ink3, fontFamily: FONT.body, fontSize: 12.5 },
    resultTag: { color: t.enemy, fontFamily: FONT.displayBold, fontSize: 11, letterSpacing: 0.8 },
    addEnemy: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: alpha(t.enemy, 0.45),
    },
    addEnemyText: { color: t.enemy, fontFamily: FONT.bodySemi, fontSize: 13 },
    roleRow: { flexDirection: 'row', gap: 6 },
    roleBtn: {
      flex: 1,
      minWidth: 0,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      paddingTop: 9,
      paddingBottom: 8,
      paddingHorizontal: 2,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: t.line,
      backgroundColor: t.surface,
    },
    roleBtnOn: { borderColor: t.accent, backgroundColor: t.surface2, borderBottomWidth: 3, paddingBottom: 6 },
    roleText: { color: t.ink2, fontFamily: FONT.bodySemi, fontSize: 13 },
    roleTextNarrow: { fontSize: 12, letterSpacing: -0.1 },
    roleNote: { marginTop: 8, color: t.ink3, fontFamily: FONT.body, fontSize: 12.5, lineHeight: 17 },
    mineNames: { color: t.ink, fontFamily: FONT.bodySemi, fontSize: 14, lineHeight: 19 },
    link: { color: t.accent, fontFamily: FONT.bodySemi, fontSize: 14 },
    mapBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: t.line,
      backgroundColor: t.surface,
    },
    mapName: { color: t.ink, fontFamily: FONT.bodyBold, fontSize: 15 },
    mapMeta: { color: t.ink3, fontFamily: FONT.body, fontSize: 12.5, lineHeight: 17 },
    sideRow: { flexDirection: 'row', marginTop: 8 },
    banGroup: { gap: 5, marginBottom: 10 },
    banRow: { flexDirection: 'row', gap: 6 },
    banLabel: { color: t.ink2, fontFamily: FONT.bodySemi, fontSize: 13 },
    banSlot: {
      flex: 1,
      minWidth: 0,
      minHeight: 44,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingHorizontal: 6,
      borderRadius: 9,
    },
    banFilled: { justifyContent: 'flex-start', borderWidth: 1, borderColor: alpha(t.ban.high, 0.45), backgroundColor: alpha(t.ban.high, 0.08) },
    banEmpty: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: t.line },
    banName: { flexShrink: 1, color: t.ink, fontFamily: FONT.bodySemi, fontSize: 12.5, lineHeight: 15 },
    banAdd: { color: t.ink3, fontFamily: FONT.bodySemi, fontSize: 12.5 },
    protect: { marginTop: 6, gap: 8, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: t.line, backgroundColor: t.surface },
    protectHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    protectLabel: { color: t.ink3, fontFamily: FONT.displayBold, fontSize: 11.5, letterSpacing: 1.1 },
    protectHero: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    protectName: { flex: 1, color: t.ink2, fontFamily: FONT.body, fontSize: 14, lineHeight: 19 },
    protectStrong: { color: t.ink, fontFamily: FONT.bodyBold },
    banIdea: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.line },
    banIdeaName: { color: t.ink, fontFamily: FONT.bodyBold, fontSize: 14 },
    banIdeaWhy: { color: t.ink2, fontFamily: FONT.body, fontSize: 12.5, lineHeight: 17 },
    banBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: alpha(t.ban.high, 0.5) },
    banBtnText: { color: t.ban.high, fontFamily: FONT.bodyBold, fontSize: 13 },
    protectBtn: {
      marginTop: 6,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: t.line,
      backgroundColor: t.surface,
    },
    protectBtnTitle: { color: t.ink, fontFamily: FONT.bodyBold, fontSize: 15 },
    slots: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    slot: {
      width: '31.9%',
      minHeight: 84,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      paddingVertical: 8,
      paddingHorizontal: 6,
      borderRadius: 10,
    },
    slotEmpty: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: t.line },
    slotX: { position: 'absolute', top: 7, right: 7 },
    slotName: { color: t.ink, fontFamily: FONT.bodySemi, fontSize: 12.5, lineHeight: 15, textAlign: 'center' },
    slotAdd: { color: t.ink3, fontFamily: FONT.bodySemi, fontSize: 12.5 },
    teamNote: { marginTop: 8, color: t.ink2, fontFamily: FONT.body, fontSize: 13, lineHeight: 18 },
    slotDuo: { position: 'absolute', top: 6, left: 8, color: t.accent, fontFamily: FONT.displayBold, fontSize: 10.5, letterSpacing: 0.8 },
    duoBox: { marginTop: 10, gap: 7 },
    duoLabel: { color: t.ink2, fontFamily: FONT.body, fontSize: 13, lineHeight: 18 },
    duoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    duoChip: {
      maxWidth: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 5,
      paddingLeft: 5,
      paddingRight: 11,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: t.line,
      backgroundColor: t.surface,
    },
    duoChipOn: { borderColor: t.accent, backgroundColor: alpha(t.accent, 0.12) },
    duoName: { flexShrink: 1, color: t.ink2, fontFamily: FONT.bodySemi, fontSize: 13 },
    duoCard: { gap: 10, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: t.accent, backgroundColor: t.surface },
    duoPick: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    duoPickLabel: { marginBottom: 1, color: t.ink3, fontFamily: FONT.displayBold, fontSize: 11, letterSpacing: 1 },
    duoWhy: { color: t.ink2, fontFamily: FONT.body, fontSize: 13, lineHeight: 18 },
    empty: { marginTop: 18, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: t.line, backgroundColor: t.surface },
    emptyText: { marginBottom: 12, color: t.ink2, fontFamily: FONT.body, fontSize: 15, lineHeight: 21 },
    btn: { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 9, backgroundColor: t.accent },
    btnText: { color: t.onAccent, fontFamily: FONT.bodyBold, fontSize: 14 },
    exampleNote: { marginTop: 10, color: t.ink3, fontFamily: FONT.body, fontSize: 12.5 },
    list: { gap: 6 },
    pick: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 10,
      paddingLeft: 10,
      paddingRight: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: t.line,
      backgroundColor: t.surface,
    },
    pickN: { width: 16, color: t.ink3, fontFamily: FONT.display, fontSize: 20, textAlign: 'center' },
    pickBody: { flex: 1, gap: 2 },
    pickHead: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', columnGap: 8 },
    pickName: { color: t.ink, fontFamily: FONT.bodyBold, fontSize: 15.5 },
    pickRole: { fontFamily: FONT.displayBold, fontSize: 11, letterSpacing: 0.9 },
    noteRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    pickWhy: { color: t.ink2, fontFamily: FONT.body, fontSize: 13 },
    pickNote: { fontFamily: FONT.bodySemi, fontSize: 12.5 },
    focusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 9,
      paddingLeft: 10,
      paddingRight: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: t.line,
      backgroundColor: t.surface,
    },
    focusN: { width: 16, color: t.ink3, fontFamily: FONT.display, fontSize: 18, textAlign: 'center' },
    focusHead: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
    focusName: { color: t.ink, fontFamily: FONT.bodyBold, fontSize: 14.5 },
    focusWhy: { marginTop: 2, color: t.ink2, fontFamily: FONT.body, fontSize: 12.5, lineHeight: 17 },
    mu: { gap: 6, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: t.line, backgroundColor: t.surface },
    muHead: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
    muHero: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    muEnemy: { color: t.ink2, fontFamily: FONT.bodySemi, fontSize: 14 },
    muCounter: { color: t.ink, fontFamily: FONT.bodyBold, fontSize: 14 },
    struck: { textDecorationLine: 'line-through' },
    muTag: { fontFamily: FONT.displayBold, fontSize: 11, letterSpacing: 0.8 },
    muWhy: { color: t.ink2, fontFamily: FONT.body, fontSize: 13.5, lineHeight: 18 },
    muFoot: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
    muNote: { flexShrink: 1, color: t.ink3, fontFamily: FONT.body, fontSize: 12.5 },
  });
