import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DataProvider } from '@/data/DataContext';
import { colors } from '@/ui/theme';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <DataProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="invite/[id]" options={{ presentation: 'modal' }} />
          <Stack.Screen name="venue/[id]" options={{ presentation: 'modal' }} />
          <Stack.Screen name="review/[id]" />
          <Stack.Screen name="thread/[id]" />
        </Stack>
      </DataProvider>
    </GestureHandlerRootView>
  );
}
