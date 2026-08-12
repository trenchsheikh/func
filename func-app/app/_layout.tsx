import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ColdOpen } from '../src/ui/components/ColdOpen';
import { WriteErrorBanner } from '../src/ui/components/WriteErrorBanner';
import { endColdOpen, shouldPlayColdOpen } from '../src/ui/coldOpen';
import { AppProvider } from '../src/ui/state/AppProvider';
import { BLANK_CANVAS, colour } from '../src/ui/theme';

export default function RootLayout(): React.JSX.Element {
  /*
   * The film mounts *above* the navigator, not as a route.
   *
   * As a route it would have to be navigated away from, which means the map
   * would mount only after it finished — and the whole point of the last beat
   * is that the real map is already flying in underneath while the film clears.
   * Rendered as a sibling overlay, the app boots at full speed behind it.
   *
   * `shouldPlayColdOpen()` is called in a lazy initialiser so it runs exactly
   * once, not on every re-render of the root.
   *
   * Blank canvas: the cinematic intro is the single most "cinematic, not
   * functional" thing in the app — a 4.6s unskippable overlay with no
   * usability purpose — so it's suppressed entirely rather than just
   * recoloured. `shouldPlayColdOpen()` still runs, to preserve its
   * once-per-process bookkeeping, but `endColdOpen()` fires in the same
   * synchronous initialiser so `FuncMap` (which reads `isColdOpenPlaying()`
   * on its own first render) never sees it as playing and opens straight at
   * city zoom instead of waiting at orbit for a film that will never signal
   * arrival. Flip `BLANK_CANVAS` in `src/ui/colour.ts` back to `false` to
   * restore the film.
   */
  const [playing, setPlaying] = useState(() => {
    const shouldPlay = shouldPlayColdOpen();
    if (BLANK_CANVAS && shouldPlay) {
      endColdOpen();
      return false;
    }
    return shouldPlay;
  });

  const done = useCallback(() => {
    endColdOpen();
    setPlaying(false);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colour.ink }}>
      <SafeAreaProvider>
        <AppProvider>
          <StatusBar style="light" />
          <WriteErrorBanner />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colour.ink },
              headerTintColor: colour.fg,
              headerTitleStyle: { fontWeight: '700' },
              contentStyle: { backgroundColor: colour.ink },
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="auth" options={{ headerShown: false }} />
            <Stack.Screen name="venue/[id]" options={{ title: '' }} />
            <Stack.Screen name="after/[id]" options={{ title: 'After-party' }} />
            <Stack.Screen name="thread/[id]" options={{ title: '' }} />
            <Stack.Screen name="settings" options={{ title: 'Presence' }} />
            <Stack.Screen name="business" options={{ title: 'Business' }} />
            <Stack.Screen name="coldopen" options={{ headerShown: false }} />
          </Stack>
          {playing && <ColdOpen onDone={done} />}
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
