/**
 * The one place a failed save actually reaches the user.
 *
 * FuncStore tracks write failures (`writeError()`), but until this component
 * nothing in the app ever read it — a real save failure (device out of
 * storage, a native store I/O error) was caught, recorded on a field, and
 * then silently ignored end-to-end. Mounted once at the root so it is visible
 * regardless of which screen the failure happens to land on.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp } from '../state/AppProvider';
import { colour, space } from '../theme';
import { Small } from './kit';

export function WriteErrorBanner(): React.JSX.Element | null {
  const app = useApp();
  const insets = useSafeAreaInsets();

  if (!app.writeError) return null;

  return (
    <View style={[styles.banner, { top: insets.top + space.sm }]} pointerEvents="none">
      <Small tone="danger" style={styles.text}>
        Could not save your last change. func will keep trying.
      </Small>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    left: space.md,
    right: space.md,
    zIndex: 1000,
    backgroundColor: colour.surface,
    borderWidth: 1,
    borderColor: colour.danger,
    borderRadius: 10,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
  },
  text: {
    textAlign: 'center',
  },
});
