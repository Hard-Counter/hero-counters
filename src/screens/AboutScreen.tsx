import React, { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import type { Confidence, Dataset } from '../data/types';
import type { DataSource } from '../data/useDataset';
import { formatDate } from '../logic';
import { FONT, Theme, useStyles } from '../theme';
import { ConfTag, Eyebrow } from '../components/ui';
import { privacyOptionsRequired, showPrivacyOptions } from '../ads/consent';

const SOURCE_LABEL: Record<DataSource, string> = {
  bundled: 'Built into this version of the app',
  cached: 'Updated copy saved on this device',
  live: 'Updated from the server just now',
};

const LEGEND: { c: Confidence; text: string }[] = [
  { c: 'data', text: 'Supported by public matchup data.' },
  { c: 'kit', text: 'Follows from how the two kits interact. Not yet confirmed by data.' },
  { c: 'consensus', text: 'What experienced players commonly recommend.' },
];

export default function AboutScreen({ data, source }: { data: Dataset; source: DataSource }) {
  const st = useStyles(makeStyles);
  const [needsPrivacyMenu, setNeedsPrivacyMenu] = useState(false);
  const extra = Constants.expoConfig?.extra as { privacyUrl?: string } | undefined;
  const privacyUrl = extra?.privacyUrl;

  useEffect(() => {
    let alive = true;
    privacyOptionsRequired()
      .then((required) => alive && setNeedsPrivacyMenu(required))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  return (
    <ScrollView contentContainerStyle={st.content}>
      <View style={st.card}>
        <Text style={st.season}>{data.season}</Text>
        <Text style={st.body}>{data.patch}</Text>
        <View style={st.facts}>
          <Fact value={`Rev ${data.revision}`} label="Data version" />
          <Fact value={formatDate(data.updated)} label="Updated" />
          <Fact value={formatDate(data.nextReview)} label="Next review" />
        </View>
        <Text style={st.small}>{SOURCE_LABEL[source]}.</Text>
      </View>

      <Eyebrow>This season</Eyebrow>
      <Bullets items={data.seasonNotes} />

      <Eyebrow>How the tiers work</Eyebrow>
      <Bullets items={data.methodology} />

      <Eyebrow>Counter tags</Eyebrow>
      <View style={st.legend}>
        {LEGEND.map((l) => (
          <View key={l.c} style={st.legendRow}>
            <View style={st.legendTag}>
              <ConfTag confidence={l.c} />
            </View>
            <Text style={[st.body, st.legendText]}>{l.text}</Text>
          </View>
        ))}
      </View>

      <Eyebrow>What changed</Eyebrow>
      <Bullets items={data.changelog} />

      {needsPrivacyMenu || privacyUrl ? <Eyebrow>Privacy</Eyebrow> : null}
      {needsPrivacyMenu ? (
        <Pressable onPress={() => showPrivacyOptions().catch(() => undefined)} accessibilityRole="button" style={st.row}>
          <Text style={st.rowText}>Ad privacy choices</Text>
        </Pressable>
      ) : null}
      {privacyUrl ? (
        <Pressable onPress={() => Linking.openURL(privacyUrl).catch(() => undefined)} accessibilityRole="link" style={st.row}>
          <Text style={st.rowText}>Privacy policy</Text>
        </Pressable>
      ) : null}

      <View style={st.disclaimer}>
        <Text style={st.small}>
          Hero Counters is an unofficial fan-made tool. It is not affiliated with or endorsed by NetEase Games or Marvel. Hero
          names belong to their owners.
        </Text>
        <Text style={[st.small, { marginTop: 8 }]}>Version {Constants.expoConfig?.version ?? '—'}</Text>
      </View>
    </ScrollView>
  );
}

function Fact({ value, label }: { value: string; label: string }) {
  const st = useStyles(makeStyles);
  return (
    <View style={st.fact}>
      <Text style={st.factValue}>{value}</Text>
      <Text style={st.small}>{label}</Text>
    </View>
  );
}

function Bullets({ items }: { items: string[] }) {
  const st = useStyles(makeStyles);
  return (
    <View style={st.bullets}>
      {items.map((item) => (
        <View key={item} style={st.bullet}>
          <View style={st.bulletDot} />
          <Text style={[st.body, st.bulletText]}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    content: { paddingHorizontal: 16, paddingBottom: 28 },
    card: { marginTop: 8, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: t.line, backgroundColor: t.surface },
    season: { marginBottom: 4, color: t.ink, fontFamily: FONT.display, fontSize: 22, letterSpacing: 0.4, textTransform: 'uppercase' },
    body: { color: t.ink2, fontFamily: FONT.body, fontSize: 14, lineHeight: 19 },
    small: { color: t.ink3, fontFamily: FONT.body, fontSize: 12.5, lineHeight: 17 },
    facts: { flexDirection: 'row', gap: 8, marginTop: 12, marginBottom: 10 },
    fact: { flex: 1, gap: 2 },
    factValue: { color: t.ink, fontFamily: FONT.displayBold, fontSize: 18, fontVariant: ['tabular-nums'] },
    bullets: { gap: 6 },
    bullet: { flexDirection: 'row', gap: 8 },
    bulletDot: { width: 5, height: 5, marginTop: 8, borderRadius: 3, backgroundColor: t.ink3 },
    bulletText: { flex: 1 },
    legend: { gap: 10 },
    legendRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    legendTag: { width: 118 },
    legendText: { flex: 1 },
    row: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.line },
    rowText: { color: t.accent, fontFamily: FONT.bodySemi, fontSize: 15 },
    disclaimer: { marginTop: 22, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: t.line },
  });
