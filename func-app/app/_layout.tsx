import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { WriteErrorBanner } from '../src/ui/components/WriteErrorBanner';
import { AppProvider } from '../src/ui/state/AppProvider';
import { colour } from '../src/ui/theme';

export default function RootLayout(): React.JSX.Element {
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
          </Stack>
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
