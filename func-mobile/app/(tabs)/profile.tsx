import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useCommands, useView } from '@/data/DataContext';
import type { AccountType, LiveStatus } from '@/domain/types';
import { Avatar, avatarUserOf, type AvatarUser } from '@/ui/components/Avatar';
import { InviteCard } from '@/ui/components/InviteBits';
import { Logo } from '@/ui/components/Logo';
import { Body, Button, Eyebrow, GlassCard, Pill, Row, Screen, Segmented, Small } from '@/ui/components/Primitives';
import { ScreenHeader } from '@/ui/components/ScreenHeader';
import { colors, space, statusColor, statusLabel } from '@/ui/theme';
import { timeAgo } from '@/ui/time';

export default function ProfileScreen() {
  const commands = useCommands();
  const view = useView();
  const router = useRouter();
  const self = view.self;
  const hosted = view.invites.filter((i) => i.viewer.relation === 'host');
  const myStories = self.stories;
  const business = self.activeProfile === 'business';
  const me: AvatarUser = avatarUserOf({
    id: self.id,
    displayName: self.displayName,
    handle: self.handle,
    photo: self.photo,
    ...(self.business ? { verifiedBusiness: { venueName: self.business.venueName } } : {}),
  });

  return (
    <Screen>
      <ScreenHeader title="Profile" />
      <ScrollView contentContainerStyle={styles.body}>
        <Row gap={space.lg}>
          {/* Ring is premium-only, independent of status — same rule as the map's marker treatment (markerTreatment.ts).
              Status gets its own pill below instead, matching the north star's "pill beside the name" for status. */}
          <Avatar user={me} size={64} ring={!business && self.premium ? colors.chromeBright : undefined} />
          <View style={{ flex: 1, gap: 4 }}>
            <Body style={{ fontSize: 20, fontWeight: '700' }}>{business ? self.business?.venueName : self.displayName}</Body>
            <Small>@{self.handle}</Small>
            <Row gap={6} style={{ flexWrap: 'wrap' }}>
              <Pill label={business ? 'Business' : 'Personal'} color={business ? colors.club : colors.chrome} />
              {!business && self.premium ? <Pill label="Premium" color={colors.chrome} filled /> : null}
              {self.canUseLiveStatus ? (
                <Pill label={statusLabel(self.liveStatus)} color={statusColor(self.liveStatus)} filled={self.liveStatus !== 'off'} />
              ) : null}
            </Row>
          </View>
        </Row>

        {self.business ? (
          <GlassCard style={{ gap: space.sm }}>
            <Eyebrow>Account</Eyebrow>
            <Segmented<AccountType>
              options={[
                { value: 'personal', label: self.displayName },
                { value: 'business', label: self.business.venueName },
              ]}
              value={self.activeProfile}
              onChange={(to) => {
                const r = commands.switchProfile(to);
                if (!r.ok) Alert.alert('Switch', r.reason);
              }}
            />
            <Small>
              {business
                ? 'You are acting as the venue. Live status is not available to business accounts.'
                : 'Switch into your business profile to post as the venue.'}
            </Small>
          </GlassCard>
        ) : null}

        {self.canUseLiveStatus ? (
          <GlassCard style={{ gap: space.sm }}>
            <Eyebrow>Live status</Eyebrow>
            <Segmented<LiveStatus>
              options={[
                { value: 'dtf', label: 'DTF' },
                { value: 'casual', label: 'Casual' },
                { value: 'off', label: 'Off' },
              ]}
              value={self.liveStatus}
              onChange={(s) => {
                const r = commands.setLiveStatus(s);
                if (!r.ok) Alert.alert('Status', r.reason);
              }}
              colorFor={statusColor}
            />
            <Small>
              {self.liveStatus === 'dtf'
                ? 'Green on the map — you are out and open to plans.'
                : self.liveStatus === 'casual'
                  ? 'Amber on the map — around, not hunting.'
                  : 'Not on the map.'}
            </Small>
            {self.premium ? <Small>Premium is a look (disco ball pin), not a status — it never turns DTF on for you.</Small> : null}
          </GlassCard>
        ) : (
          <GlassCard>
            <Eyebrow>Live status</Eyebrow>
            <Small style={{ marginTop: 4 }}>Business accounts have no live status. Your venue shows as a silver disco ball at its location.</Small>
          </GlassCard>
        )}

        <Eyebrow style={{ marginTop: space.sm }}>Hosting</Eyebrow>
        {hosted.length ? hosted.map((inv) => <InviteCard key={inv.id} invite={inv} />) : <Small>Nothing yet — Create → Event.</Small>}

        <Eyebrow style={{ marginTop: space.sm }}>Stories</Eyebrow>
        {myStories.length ? (
          myStories.map((s) => (
            <GlassCard key={s.id}>
              <Body>{s.text}</Body>
              <Small style={{ marginTop: 4 }}>{timeAgo(s.createdAt, new Date())} ago</Small>
            </GlassCard>
          ))
        ) : (
          <Small>No stories yet.</Small>
        )}

        <View style={styles.footer}>
          <Logo size={140} />
          <Small>func · prototype · mocked data</Small>
          <Button small variant="ghost" label="Reset demo data" onPress={() => { commands.reset(); router.replace('/'); }} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: space.lg, gap: space.md, paddingBottom: 48 },
  footer: { alignItems: 'center', gap: space.sm, marginTop: space.xl },
});
