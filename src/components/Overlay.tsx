import React, { useEffect } from 'react';
import { BackHandler, Pressable, StyleSheet, View } from 'react-native';
import { Theme, useStyles } from '../theme';

/**
 * A card that rises over the current screen, with a dimmed backdrop that closes it.
 *
 * It's drawn inside the screen or sheet that opens it rather than as another Modal, so it also
 * works on top of a sheet. Outside a sheet, Android's back button closes it. Inside a sheet, the
 * sheet's onRequestClose receives the back press and has to close the overlay itself.
 */
export function Overlay({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const st = useStyles(makeStyles);

  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, onClose]);

  if (!visible) return null;
  return (
    <View style={st.layer} accessibilityViewIsModal>
      <Pressable style={st.backdrop} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" />
      <View style={st.card}>{children}</View>
    </View>
  );
}

const fill = { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 } as const;

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    layer: { ...fill, justifyContent: 'flex-end', zIndex: 10, elevation: 10 },
    backdrop: { ...fill, backgroundColor: t.dark ? 'rgba(0,0,0,0.6)' : 'rgba(14,19,26,0.45)' },
    card: {
      maxHeight: '82%',
      paddingTop: 16,
      paddingBottom: 18,
      paddingHorizontal: 16,
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      borderWidth: 1,
      borderBottomWidth: 0,
      borderColor: t.line,
      backgroundColor: t.bg,
    },
  });
