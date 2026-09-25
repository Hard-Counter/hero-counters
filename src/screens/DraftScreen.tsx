import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { BracketId, Dataset, Platform, RoleId } from '../data/types';
import { HeroIndex, ROLES, ROLE_LABEL, Suggestion, draft } from '../logic';
import { FONT, Theme, alpha, useStyles, useTheme } from '../theme';
import { Avatar, ConfTag, Eyebrow, TierBadge } from '../components/ui';
import { Icon } from '../components/icons';
import HeroPicker, { MAX_ENEMIES } from './HeroPicker';

const EXAMPLE_TEAM = ['peni-parker', 'devil-dinosaur', 'gorr', 'spider-man', 'mantis', 'ultron'];

const names = (list: { name: string }[]) => list.map((h) => h.name).join(', ');

function pickReason(p: Suggestion): string {
  if (p.beats.length) return `Counters ${names(p.beats)}`;
  if (p.edges.length) return `Slight edge against ${names(p.edges)}`;
  return 'Strong pick at this rank';
}

export default function DraftScreen({
  data,
  idx,
  platform,
  bracket,
  myRole,
  setMyRole,
  enemies,
  setEnemies,
  onOpen,
}: {
  data: Dataset;
  idx: HeroIndex;
  platform: Platform;
  bracket: BracketId;
  myRole: RoleId;
  setMyRole: (r: RoleId) => void;
  enemies: string[];
  setEnemies: (ids: string[]) => void;
  onOpen: (heroId: string) => void;
}) {
  const t = useTheme();
  const st = useStyles(makeStyles);
  const [picking, setPicking] = useState(false);
  const [example, setExample] = useState(false);

  const result = useMemo(
    () => draft(data, idx, myRole, enemies, bracket, platform),
    [data, idx, myRole, enemies, bracket, platform],
  );

  const toggle = (id: string) => {
    setExample(false);
    if (enemies.includes(id)) setEnemies(enemies.filter((e) => e !== id));
    else if (enemies.length < MAX_ENEMIES) setEnemies([...enemies, id]);
  };

  return (
    <>
      <ScrollView contentContainerStyle={st.content}>
        <Eyebrow style={{ marginTop: 10 }}>Your role</Eyebrow>
        <View style={st.roleRow} accessibilityRole="radiogroup">
          {ROLES.map((r) => {
            const on = r === myRole;
            return (
              <Pressable
                key={r}
                onPress={() => setMyRole(r)}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                style={[st.roleBtn, on && st.roleBtnOn]}
              >
                <Icon name={r} size={15} color={t.role[r]} />
                <Text style={[st.roleText, on && { color: t.ink }]}>{ROLE_LABEL[r]}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={st.between}>
          <Eyebrow>
            Enemy team · {enemies.length}/{MAX_ENEMIES}
          </Eyebrow>
          {enemies.length > 0 ? (
            <Pressable
              onPress={() => {
                setEnemies([]);
                setExample(false);
              }}
              accessibilityRole="button"
              hitSlop={8}
            >
              <Text style={st.link}>Clear</Text>
            </Pressable>
          ) : null}
        </View>
        <View style={st.slots}>
          {Array.from({ length: MAX_ENEMIES }, (_, i) => {
            const hero = idx[enemies[i]];
            return hero ? (
              <Pressable
                key={hero.id}
                onPress={() => toggle(hero.id)}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${hero.name}`}
                style={[st.slot, st.slotFilled]}
              >
                <View style={st.slotX}>
                  <Icon name="close" size={11} color={t.ink3} />
                </View>
                <Avatar hero={hero} size={30} />
                <Text style={st.slotName} numberOfLines={2}>
                  {hero.name}
                </Text>
              </Pressable>
            ) : (
              <Pressable
                key={`empty-${i}`}
                onPress={() => setPicking(true)}
                accessibilityRole="button"
                accessibilityLabel="Add an enemy hero"
                style={[st.slot, st.slotEmpty]}
              >
                <Icon name="plus" size={18} color={t.ink3} />
                <Text style={st.slotAdd}>Add</Text>
              </Pressable>
            );
          })}
        </View>

        {enemies.length === 0 ? (
          <View style={st.empty}>
            <Text style={st.emptyText}>
              Add the enemy heroes you see in hero select. You get the three best picks for your role and a counter for each
              enemy.
            </Text>
            <Pressable
              onPress={() => {
                setEnemies(EXAMPLE_TEAM.slice());
                setExample(true);
              }}
              accessibilityRole="button"
              style={st.btn}
            >
              <Text style={st.btnText}>Try an example team</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {example ? <Text style={st.exampleNote}>Example team. Tap a hero to remove it, or Clear to start your own.</Text> : null}

            <Eyebrow>Best {ROLE_LABEL[myRole]} picks</Eyebrow>
            <View style={st.list}>
              {result.picks.map((p, i) => (
                <Pressable
                  key={p.hero.id}
                  onPress={() => onOpen(p.hero.id)}
                  accessibilityRole="button"
                  style={({ pressed }) => [st.pick, i === 0 && { borderColor: t.accent }, pressed && { opacity: 0.8 }]}
                >
                  <Text style={[st.pickN, i === 0 && { color: t.accent }]}>{i + 1}</Text>
                  <Avatar hero={p.hero} size={36} />
                  <View style={st.pickBody}>
                    <Text style={st.pickName}>{p.hero.name}</Text>
                    <Text style={st.pickWhy}>{pickReason(p)}</Text>
                  </View>
                  <TierBadge tier={p.tier} size={30} />
                </Pressable>
              ))}
            </View>

            <Eyebrow>Your counter to each enemy</Eyebrow>
            <View style={st.list}>
              {result.matchups.map((m) => (
                <Pressable
                  key={m.enemy.id}
                  onPress={() => onOpen(m.counter.id)}
                  accessibilityRole="button"
                  style={({ pressed }) => [st.mu, pressed && { opacity: 0.8 }]}
                >
                  <View style={st.muHead}>
                    <View style={st.muHero}>
                      <Avatar hero={m.enemy} size={24} />
                      <Text style={st.muEnemy}>{m.enemy.name}</Text>
                    </View>
                    <Icon name="arrow" size={15} color={t.ink3} />
                    <View style={st.muHero}>
                      <Avatar hero={m.counter} size={24} />
                      <Text style={st.muCounter}>{m.counter.name}</Text>
                    </View>
                  </View>
                  <Text style={st.muWhy}>{m.pick.reason}</Text>
                  <View style={st.muFoot}>
                    <ConfTag confidence={m.pick.confidence} />
                    {m.pick.note ? <Text style={[st.muNote, m.pick.weak && { color: t.ban.medium }]}>{m.pick.note}</Text> : null}
                  </View>
                </Pressable>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <HeroPicker visible={picking} data={data} selected={enemies} onToggle={toggle} onClose={() => setPicking(false)} />
    </>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    content: { paddingHorizontal: 16, paddingBottom: 28 },
    roleRow: { flexDirection: 'row', gap: 6 },
    roleBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: t.line,
      backgroundColor: t.surface,
    },
    roleBtnOn: { borderColor: t.accent, backgroundColor: t.surface2, borderBottomWidth: 3 },
    roleText: { color: t.ink2, fontFamily: FONT.bodySemi, fontSize: 14 },
    between: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
    link: { color: t.accent, fontFamily: FONT.bodySemi, fontSize: 14 },
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
    slotFilled: { borderWidth: 1, borderColor: alpha(t.enemy, 0.45), backgroundColor: alpha(t.enemy, 0.09) },
    slotEmpty: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: t.line },
    slotX: { position: 'absolute', top: 7, right: 7 },
    slotName: { color: t.ink, fontFamily: FONT.bodySemi, fontSize: 12.5, lineHeight: 15, textAlign: 'center' },
    slotAdd: { color: t.ink3, fontFamily: FONT.bodySemi, fontSize: 12.5 },
    empty: { marginTop: 18, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: t.line, backgroundColor: t.surface },
    emptyText: { marginBottom: 12, color: t.ink2, fontFamily: FONT.body, fontSize: 15, lineHeight: 21 },
    btn: { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 9, backgroundColor: t.accent },
    btnText: { color: t.onAccent, fontFamily: FONT.bodyBold, fontSize: 14 },
    exampleNote: { marginTop: 8, color: t.ink3, fontFamily: FONT.body, fontSize: 12.5 },
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
    pickName: { color: t.ink, fontFamily: FONT.bodyBold, fontSize: 15.5 },
    pickWhy: { color: t.ink2, fontFamily: FONT.body, fontSize: 13 },
    mu: { gap: 6, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: t.line, backgroundColor: t.surface },
    muHead: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
    muHero: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    muEnemy: { color: t.ink2, fontFamily: FONT.bodySemi, fontSize: 14 },
    muCounter: { color: t.ink, fontFamily: FONT.bodyBold, fontSize: 14 },
    muWhy: { color: t.ink2, fontFamily: FONT.body, fontSize: 13.5, lineHeight: 18 },
    muFoot: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
    muNote: { flexShrink: 1, color: t.ink3, fontFamily: FONT.body, fontSize: 12.5 },
  });
