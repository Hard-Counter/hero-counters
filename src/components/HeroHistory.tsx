import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  CHANGE_LABEL,
  HistoryEntry,
  HistoryView,
  formatLongDate,
  formatMonth,
  seasonLabel,
} from '../logic';
import { FONT, Theme, alpha, useStyles, useTheme } from '../theme';
import { SectionHead } from './ui';

/** A hero's patch history: buffs and nerfs by season, then every change, newest first. */
export function HeroHistory({ view, onInfo }: { view: HistoryView; onInfo: () => void }) {
  const st = useStyles(makeStyles);
  const [showFixes, setShowFixes] = useState(false);

  const groups = useMemo(() => {
    const list = showFixes ? view.entries : view.entries.filter((e) => e.kind !== 'f');
    const out: { season: string; entries: HistoryEntry[] }[] = [];
    for (const e of list) {
      const last = out[out.length - 1];
      if (last && last.season === e.season) last.entries.push(e);
      else out.push({ season: e.season, entries: [e] });
    }
    return out;
  }, [view, showFixes]);

  const starts = useMemo(() => new Map(view.seasons.map((s) => [s.season, s.start])), [view]);
  const { b, n, m, f } = view.totals;
  const since = view.added ? `since joining in ${formatMonth(view.added)}` : 'since launch';
  const summary = [
    `${b} ${b === 1 ? 'buff' : 'buffs'}`,
    `${n} ${n === 1 ? 'nerf' : 'nerfs'}`,
    m ? `${m} mixed` : null,
    `${f} bug ${f === 1 ? 'fix' : 'fixes'}`,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <>
      <SectionHead onInfo={onInfo} infoLabel="What the history shows">
        Changes by season
      </SectionHead>
      <Text style={st.summary}>
        {summary} {since}.
      </Text>
      <SeasonBars view={view} />

      <SectionHead
        right={
          f ? (
            <Pressable
              onPress={() => setShowFixes((v) => !v)}
              accessibilityRole="switch"
              accessibilityState={{ checked: showFixes }}
              accessibilityLabel="Show bug fixes"
              hitSlop={8}
              style={({ pressed }) => [st.toggle, showFixes && st.toggleOn, pressed && { opacity: 0.7 }]}
            >
              <Text style={[st.toggleText, showFixes && st.toggleTextOn]}>{showFixes ? 'Hide fixes' : `Show fixes (${f})`}</Text>
            </Pressable>
          ) : null
        }
      >
        Every change
      </SectionHead>
      {groups.length ? (
        groups.map((g) => (
          <View key={g.season} style={st.group}>
            <Text style={st.groupHead} accessibilityRole="header">
              {seasonLabel(g.season)}
              {starts.get(g.season) ? <Text style={st.groupWhen}> · {formatMonth(starts.get(g.season)!)}</Text> : null}
            </Text>
            <View style={st.rows}>
              {g.entries.map((e, i) => (
                <ChangeRow key={`${e.date}-${e.ability}-${i}`} entry={e} />
              ))}
            </View>
          </View>
        ))
      ) : (
        <Text style={st.empty}>No balance changes yet.</Text>
      )}
      <Text style={st.foot}>From the official balance posts and patch notes, in our own words.</Text>
    </>
  );
}

function ChangeRow({ entry }: { entry: HistoryEntry }) {
  const t = useTheme();
  const st = useStyles(makeStyles);
  const c = t.change[entry.kind];
  return (
    <View style={st.row} accessible accessibilityLabel={`${CHANGE_LABEL[entry.kind]}, ${entry.ability}: ${entry.text}. ${formatLongDate(entry.date)}`}>
      <View style={st.rowTop}>
        <View style={[st.tag, { backgroundColor: alpha(c, 0.14) }]}>
          <Text style={[st.tagText, { color: c }]}>{CHANGE_LABEL[entry.kind].toUpperCase()}</Text>
        </View>
        <Text style={st.ability} numberOfLines={2}>
          {entry.ability}
        </Text>
        <Text style={st.date}>{formatLongDate(entry.date)}</Text>
      </View>
      <Text style={st.text}>{entry.text}</Text>
    </View>
  );
}

const BAR_HALF = 42;

/** Buffs rise above the line and nerfs hang below it, one column per season. */
function SeasonBars({ view }: { view: HistoryView }) {
  const t = useTheme();
  const st = useStyles(makeStyles);
  const max = Math.max(1, ...view.seasons.map((s) => Math.max(s.counts.b, s.counts.n)));
  const scale = (v: number) => (v ? Math.max(3, Math.round((v / max) * BAR_HALF)) : 0);
  const label = `Buffs and nerfs by season: ${view.seasons
    .filter((s) => s.counts.b || s.counts.n)
    .map((s) => `${seasonLabel(s.season)}, ${s.counts.b} buffs and ${s.counts.n} nerfs`)
    .join('; ')}.`;
  return (
    <View accessible accessibilityLabel={label} style={st.chart}>
      <View style={st.bars}>
        {view.seasons.map((s) => {
          const current = s.season === view.current;
          return (
            <View key={s.season} style={st.col}>
              <View style={st.half}>
                <View style={[st.bar, { height: scale(s.counts.b), backgroundColor: t.change.b }]} />
              </View>
              <View style={[st.axis, current && { backgroundColor: t.accent }]} />
              <View style={[st.half, st.halfDown]}>
                <View style={[st.bar, { height: scale(s.counts.n), backgroundColor: t.change.n }]} />
              </View>
              <Text style={[st.tick, current && { color: t.accent }]} allowFontScaling={false}>
                {s.season.endsWith('.5') ? '·' : s.season}
              </Text>
            </View>
          );
        })}
      </View>
      <View style={st.legend}>
        <View style={[st.key, { backgroundColor: t.change.b }]} />
        <Text style={st.legendText}>Buffs</Text>
        <View style={[st.key, { backgroundColor: t.change.n }]} />
        <Text style={st.legendText}>Nerfs</Text>
        <Text style={[st.legendText, st.legendRight]}>Seasons, half seasons as dots</Text>
      </View>
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    summary: { marginBottom: 10, color: t.ink2, fontFamily: FONT.body, fontSize: 13.5, lineHeight: 19 },
    chart: { paddingTop: 6, paddingBottom: 4 },
    bars: { flexDirection: 'row', alignItems: 'flex-start' },
    col: { flex: 1, alignItems: 'center' },
    half: { height: BAR_HALF, width: '100%', alignItems: 'center', justifyContent: 'flex-end' },
    halfDown: { justifyContent: 'flex-start' },
    bar: { width: '62%', maxWidth: 12, borderRadius: 2 },
    axis: { alignSelf: 'stretch', height: 1.5, backgroundColor: t.line },
    tick: { marginTop: 4, color: t.ink3, fontFamily: FONT.body, fontSize: 10.5, lineHeight: 12 },
    legend: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
    key: { width: 9, height: 9, borderRadius: 2 },
    legendText: { marginRight: 6, color: t.ink3, fontFamily: FONT.body, fontSize: 12 },
    legendRight: { marginLeft: 'auto', marginRight: 0 },
    toggle: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: t.line,
      backgroundColor: t.surface,
    },
    toggleOn: { borderColor: t.ink3, backgroundColor: t.surface2 },
    toggleText: { color: t.ink2, fontFamily: FONT.bodySemi, fontSize: 12.5 },
    toggleTextOn: { color: t.ink },
    group: { marginBottom: 14 },
    groupHead: { marginBottom: 8, color: t.ink, fontFamily: FONT.displayBold, fontSize: 15, letterSpacing: 0.6 },
    groupWhen: { color: t.ink3, fontFamily: FONT.body, fontSize: 13, letterSpacing: 0 },
    rows: { gap: 10 },
    row: { gap: 4, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: t.line },
    rowTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    tag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    tagText: { fontFamily: FONT.displayBold, fontSize: 11, letterSpacing: 0.9 },
    ability: { flex: 1, color: t.ink, fontFamily: FONT.bodyBold, fontSize: 14 },
    date: { color: t.ink3, fontFamily: FONT.body, fontSize: 12 },
    text: { color: t.ink2, fontFamily: FONT.body, fontSize: 13.5, lineHeight: 19 },
    empty: { color: t.ink3, fontFamily: FONT.body, fontSize: 13.5 },
    foot: { marginTop: 6, color: t.ink3, fontFamily: FONT.body, fontSize: 12.5, lineHeight: 17 },
  });

