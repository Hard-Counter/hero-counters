import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { GLOSSARY, GlossaryGroup, GlossaryGroupId, glossaryGroup } from '../logic';
import { FONT, Theme, useStyles, useTheme } from '../theme';
import { ConfTag, Eyebrow } from './ui';
import { Icon } from './icons';
import { Sheet } from './Sheet';

/** The terms in one glossary group. */
export function GlossaryTerms({ group }: { group: GlossaryGroup }) {
  const st = useStyles(makeStyles);
  return (
    <View style={st.terms}>
      {group.intro ? <Text style={st.intro}>{group.intro}</Text> : null}
      {group.terms.map((term) => (
        <View key={term.term} style={st.term}>
          {term.confidence ? (
            <View style={st.tag}>
              <ConfTag confidence={term.confidence} />
            </View>
          ) : (
            <Text style={st.termName}>{term.term}</Text>
          )}
          <Text style={st.termText}>{term.text}</Text>
        </View>
      ))}
    </View>
  );
}

/** One glossary group as a card, for an Overlay. */
export function InfoCard({ groupId, onClose }: { groupId: GlossaryGroupId; onClose: () => void }) {
  const t = useTheme();
  const st = useStyles(makeStyles);
  const group = glossaryGroup(groupId);
  return (
    <>
      <View style={st.cardHead}>
        <Text style={st.cardTitle} accessibilityRole="header">
          {group.title}
        </Text>
        <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" hitSlop={10} style={st.close}>
          <Icon name="close" size={16} color={t.ink} />
        </Pressable>
      </View>
      <ScrollView style={st.cardScroll} contentContainerStyle={st.cardBody}>
        <GlossaryTerms group={group} />
      </ScrollView>
    </>
  );
}

/** Every term in the app, as a full page. */
export function GlossarySheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const t = useTheme();
  const st = useStyles(makeStyles);
  return (
    <Sheet visible={visible} onClose={onClose}>
      <View style={st.head}>
        <Text style={st.title} accessibilityRole="header">
          Glossary
        </Text>
        <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" hitSlop={10} style={st.close}>
          <Icon name="close" size={18} color={t.ink} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={st.body}>
        <Text style={st.intro}>What the labels, tags and terms in the app mean.</Text>
        {GLOSSARY.map((g) => (
          <View key={g.id}>
            <Eyebrow>{g.title}</Eyebrow>
            <GlossaryTerms group={g} />
          </View>
        ))}
      </ScrollView>
    </Sheet>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    terms: { gap: 12 },
    intro: { color: t.ink2, fontFamily: FONT.body, fontSize: 13.5, lineHeight: 19 },
    term: { gap: 3 },
    tag: { alignSelf: 'flex-start', marginBottom: 2 },
    termName: { color: t.ink, fontFamily: FONT.bodyBold, fontSize: 14.5 },
    termText: { color: t.ink2, fontFamily: FONT.body, fontSize: 14, lineHeight: 19 },
    cardHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
    cardTitle: { flex: 1, color: t.ink, fontFamily: FONT.display, fontSize: 21, letterSpacing: 0.4, textTransform: 'uppercase' },
    cardScroll: { flexGrow: 0 },
    cardBody: { paddingBottom: 6 },
    close: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: t.surface2 },
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
    title: { flex: 1, color: t.ink, fontFamily: FONT.display, fontSize: 24, letterSpacing: 0.5, textTransform: 'uppercase' },
    body: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 28 },
  });
