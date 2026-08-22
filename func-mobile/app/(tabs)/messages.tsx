import React from 'react';
import { FlatList } from 'react-native';
import { useSnapshot } from '@/data/DataContext';
import { myThreads } from '@/data/selectors';
import { Empty, Screen } from '@/ui/components/Primitives';
import { ScreenHeader } from '@/ui/components/ScreenHeader';
import { ThreadRow } from '@/ui/components/ThreadRow';
import { space } from '@/ui/theme';

/** Open-ended messaging: every chat you are in — Pool group chats and DMs. */
export default function MessagesScreen() {
  const snap = useSnapshot();
  const threads = myThreads(snap);
  return (
    <Screen>
      <ScreenHeader title="Messages" />
      <FlatList
        data={threads}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ padding: space.lg, gap: space.sm, paddingBottom: 40 }}
        renderItem={({ item }) => <ThreadRow thread={item} />}
        ListEmptyComponent={<Empty title="No chats yet" hint="Join an invite on the map and its group chat shows up here." />}
      />
    </Screen>
  );
}
