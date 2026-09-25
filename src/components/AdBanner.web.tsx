import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FONT, useTheme } from '../theme';

// Web build: marks where the banner sits in the phone app.
export default function AdBanner() {
  const t = useTheme();
  return (
    <View style={[styles.wrap, { backgroundColor: t.surface, borderTopColor: t.line }]}>
      <Text style={[styles.text, { color: t.ink3 }]}>AD BANNER · SHOWS IN THE PHONE APP</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { height: 50, alignItems: 'center', justifyContent: 'center', borderTopWidth: StyleSheet.hairlineWidth },
  text: { fontFamily: FONT.displayBold, fontSize: 11, letterSpacing: 1.5 },
});
