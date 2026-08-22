import { Tabs } from 'expo-router';
import React from 'react';
import { FuncTabBar } from '@/ui/components/TabBar';
import { colors } from '@/ui/theme';

export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="index"
      tabBar={(props) => <FuncTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.bg },
        lazy: true,
      }}
    >
      <Tabs.Screen name="create" />
      <Tabs.Screen name="messages" />
      <Tabs.Screen name="index" />
      <Tabs.Screen name="inbox" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
