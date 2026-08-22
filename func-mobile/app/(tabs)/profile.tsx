import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useRepository, useSnapshot } from '@/data/DataContext';
import { currentUser, myGroup } from '@/data/selectors';
import { canUseLiveStatus } from '@/domain/liveStatus';
import type { AccountType, LiveStatus } from '@/domain/types';
import { Avatar } from '@/ui/components/Avatar';
import { InviteCard } from '@/ui/components/InviteBits';
import { Logo } from '@/ui/components/Logo';
import { Body, Button, Card, Eyebrow, Pill, Row, Screen, Segmented, Small } from '@/ui/components/Primitives';
import { ScreenHeader } from '@/ui/components/ScreenHeader';
import { colors, space, statusColor } from '@/ui/theme';
import { timeAgo } from '@/ui/time';

export default function ProfileScreen() {
  const repo = useRepository();
  const snap = useSnapshot();
  const router = useRouter();
  const me = currentUser(snap);
  const gid = myGroup(snap).id;
  const p = me.personalProfile;
  const hosted = snap.invites.filter((i) => i.hostGroupId === gid);
  const myStories = snap.stories.filter((s) => s.authorUserId === me.id);
  const business = me.activeProfile === 'business';

  return (
    <Screen>
      <ScreenHeader title="Profile" />
      <ScrollView contentContainerStyle={styles.body}>
        <Row gap={space.lg}>
          <Avatar user={me} size={64} ring={business ? colors.club : statusColor(p.liveStatus)} />
          <View style={{ flex: 1, gap: 4 }}>
            <Body style={{ fontSize: 20, fontWeight: '700' }}>{business ? me.businessProfile?.venueName : p.displayName}</Body>
            <Small>@{me.handle}</Small>
            <Row gap={6}>
              <Pill label={business ? 'Business' : 'Personal'} color={business ? colors.club : colors.chrome} />
              {!business && p.premium ? <Pill label="Premium" color={colors.chrome} filled /> : null}
            </Row>
          </View>
        </Row>

        {me.businessProfile ? (
          <Card style={{ gap: space.sm }}>
            <Eyebrow>Account</Eyebrow>
            <Segmented<AccountType>
              options={[
                { value: 'personal', label: p.displayName },
                { value: 'business', label: me.businessProfile.venueName },
              ]}
              value={me.activeProfile}
              onChange={(to) => {
                const r = repo.switchProfile(to);
                if (!r.ok) Alert.alert('Switch', r.reason);
              }}
            />
            <Small>
              {business
                ? 'You are acting as the venue. Live status is not available to business accounts.'
                : 'Switch into your business profile to post as the venue.'}
            </Small>
          </Card>
        ) : null}

        {canUseLiveStatus(me) ? (
          <Card style={{ gap: space.sm }}>
            <Eyebrow>Live status</Eyebrow>
            <Segmented<LiveStatus>
              options={[
                { value: 'dtf', label: 'DTF' },
                { value: 'casual', label: 'Casual' },
                { value: 'off', label: 'Off' },
              ]}
              value={p.liveStatus}
              onChange={(s) => {
                const r = repo.setLiveStatus(s);
                if (!r.ok) Alert.alert('Status', r.reason);
              }}
              colorFor={statusColor}
            />
            <Small>
              {p.liveStatus === 'dtf'
                ? 'Green on the map — you are out and open to plans.'
                : p.liveStatus === 'casual'
                  ? 'Amber on the map — around, not hunting.'
                  : p.lastKnownLocation
                    ? `Frozen pin from ${timeAgo(p.lastKnownLocation.timestamp, new Date())} ago; it disappears after 48h.`
                    : 'Not on the map.'}
            </Small>
            {p.premium ? <Small>Premium is a look (disco ball pin), not a status — it never turns DTF on for you.</Small> : null}
          </Card>
        ) : (
          <Card>
            <Eyebrow>Live status</Eyebrow>
            <Small style={{ marginTop: 4 }}>Business accounts have no live status. Your venue shows as a silver disco ball at its location.</Small>
          </Card>
        )}

        <Eyebrow style={{ marginTop: space.sm }}>Hosting</Eyebrow>
        {hosted.length ? hosted.map((inv) => <InviteCard key={inv.id} invite={inv} />) : <Small>Nothing yet — Create → Event.</Small>}

        <Eyebrow style={{ marginTop: space.sm }}>Stories</Eyebrow>
        {myStories.length ? (
          myStories.map((s) => (
            <Card key={s.id}>
              <Body>{s.text}</Body>
              <Small style={{ marginTop: 4 }}>{timeAgo(s.createdAt, new Date())} ago</Small>
            </Card>
          ))
        ) : (
          <Small>No stories yet.</Small>
        )}

        <View style={styles.footer}>
          <Logo size={140} />
          <Small>func · prototype · mocked data</Small>
          <Button small variant="ghost" label="Reset demo data" onPress={() => { repo.reset(); router.replace('/'); }} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: space.lg, gap: space.md, paddingBottom: 48 },
  footer: { alignItems: 'center', gap: space.sm, marginTop: space.xl },
});
