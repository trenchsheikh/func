import { Tabs } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useView } from '@/data/DataContext';
import { mapEntrance } from '../map/entrance';
import { colors } from '../theme';
import { ChatIcon, InboxIcon, PersonIcon, PlusIcon } from './Icons';
import { Logo } from './Logo';

const ORDER = ['create', 'messages', 'index', 'inbox', 'profile'] as const;
const LABELS: Record<(typeof ORDER)[number], string> = {
  create: 'Create',
  messages: 'Messages',
  index: '',
  inbox: 'Inbox',
  profile: 'Profile',
};

/**
 * Locked shell: five tabs, Eye in the centre, larger. Tap-only — no swipe
 * between tabs.
 */
type TabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];

export function FuncTabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const view = useView();
  const inboxCount =
    view.inbox.joinBatches.reduce((n, b) => n + b.pendingCount, 0) + view.inbox.messageRequests.length;

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {ORDER.map((name) => {
        const route = state.routes.find((r: { name: string }) => r.name === name);
        if (!route) return null;
        const focused = state.routes[state.index]?.name === name;
        const color = focused ? colors.text : colors.muted;
        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (name === 'index') mapEntrance.trigger();
          if (!event.defaultPrevented) navigation.navigate(route.name);
        };
        if (name === 'index') {
          return (
            <Pressable key={name} onPress={onPress} accessibilityRole="button" accessibilityLabel="Map" style={styles.eyeWrap}>
              <View style={[styles.eye, focused && styles.eyeFocused]}>
                <Logo size={52} color={focused ? colors.text : colors.chrome} />
              </View>
            </Pressable>
          );
        }
        return (
          <Pressable key={name} onPress={onPress} accessibilityRole="button" accessibilityLabel={LABELS[name]} style={styles.item}>
            <View>
              {name === 'create' && <PlusIcon color={color} />}
              {name === 'messages' && <ChatIcon color={color} />}
              {name === 'inbox' && <InboxIcon color={color} />}
              {name === 'profile' && <PersonIcon color={color} />}
              {name === 'inbox' && inboxCount > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{inboxCount}</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.label, { color }]}>{LABELS[name]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    paddingHorizontal: 6,
  },
  item: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 4 },
  label: { fontSize: 10, letterSpacing: 0.2 },
  eyeWrap: { flex: 1.3, alignItems: 'center' },
  eye: {
    width: 68,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: -18,
  },
  eyeFocused: { borderColor: colors.chrome, backgroundColor: colors.surfaceRaised },
  badge: {
    position: 'absolute',
    top: -5,
    right: -9,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: colors.highlight, fontSize: 10, fontWeight: '700' },
});
