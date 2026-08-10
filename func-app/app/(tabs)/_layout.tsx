/**
 * Five tabs, map dead centre — the structure the PRD specifies.
 */

import { Tabs } from 'expo-router';
import React from 'react';

import { Icon, type IconName } from '../../src/ui/components/Icon';
import { awaitingMyDecision } from '../../src/ui/state/selectors';
import { useApp } from '../../src/ui/state/AppProvider';
import { colour } from '../../src/ui/theme';

const tabIcon =
  (name: IconName) =>
  ({ color }: { color: string | symbol | number }) => (
    <Icon name={name} size={22} color={typeof color === 'string' ? color : colour.fg} />
  );

export default function TabsLayout(): React.JSX.Element {
  const app = useApp();
  const waiting = app.ready ? awaitingMyDecision(app).length : 0;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colour.ink2,
          borderTopColor: colour.hairline,
          height: 84,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colour.fg,
        tabBarInactiveTintColor: colour.fg4,
        tabBarLabelStyle: { fontSize: 10.5, fontWeight: '700' },
      }}
    >
      <Tabs.Screen name="browse" options={{ title: 'Browse', tabBarIcon: tabIcon('cards') }} />
      <Tabs.Screen name="plans" options={{ title: 'Plans', tabBarIcon: tabIcon('plans') }} />
      <Tabs.Screen name="map" options={{ title: 'Map', tabBarIcon: tabIcon('eye') }} />
      <Tabs.Screen
        name="inbox"
        options={{
          title: 'Inbox',
          tabBarIcon: tabIcon('inbox'),
          // Spread rather than pass `undefined` — exactOptionalPropertyTypes
          // treats "explicitly undefined" and "absent" as different things.
          ...(waiting > 0 ? { tabBarBadge: waiting } : {}),
          tabBarBadgeStyle: { backgroundColor: colour.em, color: colour.ink, fontSize: 10 },
        }}
      />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: tabIcon('me') }} />
    </Tabs>
  );
}
