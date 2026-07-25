import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { DemoProvider } from '../lib/store';
import { colors } from '../lib/theme';

export default function RootLayout() {
  return (
    <DemoProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '800' },
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="person/[id]" options={{ presentation: 'modal', title: 'Profile' }} />
        <Stack.Screen name="group/[id]" options={{ presentation: 'modal', title: 'Group' }} />
        <Stack.Screen name="event/[id]" options={{ presentation: 'modal', title: 'Event' }} />
        <Stack.Screen name="chat/[id]" options={{ presentation: 'modal', title: 'Chat' }} />
      </Stack>
    </DemoProvider>
  );
}
