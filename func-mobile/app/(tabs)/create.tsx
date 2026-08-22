import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Alert, Dimensions, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useRepository, useSnapshot } from '@/data/DataContext';
import { currentUser } from '@/data/selectors';
import type { LatLng } from '@/domain/types';
import { Body, Button, Card, Eyebrow, Row, Screen, Segmented, Small } from '@/ui/components/Primitives';
import { ScreenHeader } from '@/ui/components/ScreenHeader';
import { FuncMap } from '@/ui/map/FuncMap';
import { DEFAULT_CENTER, hasMapboxToken } from '@/ui/map/mapConfig';
import { colors, radius, space } from '@/ui/theme';
import { whenLabel } from '@/ui/time';

const { width: W } = Dimensions.get('window');
type Mode = 'event' | 'story';

/** Create: swipeable picker between Event (a Pool invite) and Story. */
export default function CreateScreen() {
  const [mode, setMode] = useState<Mode>('event');
  const pager = useRef<ScrollView>(null);

  const go = (m: Mode) => {
    setMode(m);
    pager.current?.scrollTo({ x: m === 'event' ? 0 : W, animated: true });
  };
  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const page = Math.round(e.nativeEvent.contentOffset.x / W);
    setMode(page === 0 ? 'event' : 'story');
  };

  return (
    <Screen>
      <ScreenHeader title="Create" />
      <View style={{ paddingHorizontal: space.lg, paddingBottom: space.sm }}>
        <Segmented<Mode>
          options={[
            { value: 'event', label: 'Event' },
            { value: 'story', label: 'Story' },
          ]}
          value={mode}
          onChange={go}
        />
        <Small style={{ textAlign: 'center', marginTop: 6 }}>swipe between modes</Small>
      </View>
      <ScrollView
        ref={pager}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ width: W }}>
          <EventForm />
        </View>
        <View style={{ width: W }}>
          <StoryForm />
        </View>
      </ScrollView>
    </Screen>
  );
}

function EventForm() {
  const repo = useRepository();
  const snap = useSnapshot();
  const router = useRouter();
  const me = currentUser(snap);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<LatLng | null>(null);
  const [capMode, setCapMode] = useState<'capped' | 'uncapped'>('uncapped');
  const [max, setMax] = useState('10');
  const [access, setAccess] = useState<'private' | 'public'>('public');
  const [withTime, setWithTime] = useState(false);
  const [dayOffset, setDayOffset] = useState(0);
  const [hour, setHour] = useState(23);
  const [pickingLocation, setPickingLocation] = useState(false);
  const draftCenter = useRef<LatLng>(DEFAULT_CENTER);

  const startsAt = (() => {
    if (!withTime) return undefined;
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    d.setHours(hour, 0, 0, 0);
    return d.toISOString();
  })();

  const submit = () => {
    if (!description.trim()) return Alert.alert('Add a description', 'What is the plan?');
    if (!location) return Alert.alert('Pin a location', 'Drop the pin on the map first.');
    const maxN = parseInt(max, 10);
    if (capMode === 'capped' && (!Number.isFinite(maxN) || maxN < 1)) {
      return Alert.alert('Capacity', 'Enter a max of at least 1.');
    }
    const inv = repo.createInvite({
      description,
      location,
      capacity: capMode === 'capped' ? { mode: 'capped', max: maxN } : { mode: 'uncapped' },
      access: { mode: access },
      ...(startsAt ? { startsAt } : {}),
    });
    setDescription('');
    setLocation(null);
    router.push({ pathname: '/invite/[id]', params: { id: inv.id } });
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={120}>
      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        {me.activeProfile === 'business' ? (
          <Small style={{ color: colors.club }}>Posting as {me.businessProfile?.venueName} (business)</Small>
        ) : null}

        <Eyebrow>Description</Eyebrow>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Afters at mine after the club — rooftop, bring a jacket"
          placeholderTextColor={colors.faint}
          style={[styles.input, { minHeight: 72 }]}
          multiline
        />

        <Eyebrow>Location</Eyebrow>
        {pickingLocation ? (
          <View style={styles.picker}>
            <FuncMap
              pins={[]}
              selectedId={null}
              onSelect={() => {}}
              initialCenter={location ?? DEFAULT_CENTER}
              initialZoom={13}
              onCenterChange={(c) => {
                draftCenter.current = c;
              }}
              onPlace={(c) => setLocation(c)}
              placed={location}
              compact
            />
            {hasMapboxToken ? (
              <View pointerEvents="none" style={styles.crosshair}>
                <Text style={{ fontSize: 28 }}>📍</Text>
              </View>
            ) : null}
            <View style={styles.pickerActions}>
              <Button
                small
                label={hasMapboxToken ? 'Drop pin here' : 'Use tapped spot'}
                onPress={() => {
                  if (hasMapboxToken) setLocation(draftCenter.current);
                  else if (!location) setLocation(DEFAULT_CENTER);
                  setPickingLocation(false);
                }}
              />
              <Button small variant="ghost" label="Cancel" onPress={() => setPickingLocation(false)} />
            </View>
          </View>
        ) : (
          <Row gap={space.sm}>
            <Body style={{ flex: 1, color: location ? colors.text : colors.faint }}>
              {location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'No pin yet'}
            </Body>
            <Button small variant="secondary" label={location ? 'Move pin' : 'Pin on map'} onPress={() => setPickingLocation(true)} />
          </Row>
        )}

        <Eyebrow>Capacity</Eyebrow>
        <Segmented<'capped' | 'uncapped'>
          options={[
            { value: 'uncapped', label: 'Uncapped' },
            { value: 'capped', label: 'Capped' },
          ]}
          value={capMode}
          onChange={setCapMode}
        />
        {capMode === 'capped' ? (
          <Row gap={space.sm}>
            <Small>Max people</Small>
            <TextInput value={max} onChangeText={setMax} keyboardType="number-pad" style={[styles.input, { width: 80, textAlign: 'center' }]} />
          </Row>
        ) : null}

        <Eyebrow>Access</Eyebrow>
        <Segmented<'private' | 'public'>
          options={[
            { value: 'public', label: 'Public · open walk-in' },
            { value: 'private', label: 'Private · you review' },
          ]}
          value={access}
          onChange={setAccess}
        />
        <Small>
          {access === 'public'
            ? 'Anyone can join instantly (up to the cap) and lands in the group chat.'
            : 'People request to join. You accept or deny them in Inbox, as a batch.'}
        </Small>

        <Eyebrow>Date & time (optional)</Eyebrow>
        <Segmented<'no' | 'yes'>
          options={[
            { value: 'no', label: 'Whenever' },
            { value: 'yes', label: 'Set a time' },
          ]}
          value={withTime ? 'yes' : 'no'}
          onChange={(v) => setWithTime(v === 'yes')}
        />
        {withTime ? (
          <Card style={{ gap: space.sm }}>
            <Row gap={space.sm}>
              <Small style={{ width: 44 }}>Day</Small>
              <Button small variant="ghost" label="−" onPress={() => setDayOffset((d) => Math.max(0, d - 1))} />
              <Body style={{ flex: 1, textAlign: 'center' }}>{dayOffset === 0 ? 'Tonight' : dayOffset === 1 ? 'Tomorrow' : `+${dayOffset} days`}</Body>
              <Button small variant="ghost" label="+" onPress={() => setDayOffset((d) => Math.min(14, d + 1))} />
            </Row>
            <Row gap={space.sm}>
              <Small style={{ width: 44 }}>Time</Small>
              <Button small variant="ghost" label="−" onPress={() => setHour((h) => (h + 23) % 24)} />
              <Body style={{ flex: 1, textAlign: 'center' }}>{`${hour % 12 === 0 ? 12 : hour % 12}:00 ${hour < 12 ? 'am' : 'pm'}`}</Body>
              <Button small variant="ghost" label="+" onPress={() => setHour((h) => (h + 1) % 24)} />
            </Row>
            {startsAt ? <Small>{whenLabel(startsAt, new Date())}</Small> : null}
          </Card>
        ) : null}

        <Button label="Post invite" onPress={submit} style={{ marginTop: space.md }} />
        <Small style={{ textAlign: 'center' }}>A group chat is created with it automatically.</Small>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function StoryForm() {
  const repo = useRepository();
  const snap = useSnapshot();
  const [text, setText] = useState('');
  const mine = snap.stories.filter((s) => s.authorUserId === snap.currentUserId);
  return (
    <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
      <Eyebrow>Story</Eyebrow>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="What’s happening right now?"
        placeholderTextColor={colors.faint}
        style={[styles.input, { minHeight: 120 }]}
        multiline
      />
      <Button
        label="Post story"
        onPress={() => {
          const r = repo.postStory(text);
          if (!r.ok) Alert.alert('Story', r.reason);
          else setText('');
        }}
      />
      <Small>Stories are text-only in this pass — photo capture is a later layer.</Small>
      {mine.length ? (
        <>
          <Eyebrow style={{ marginTop: space.md }}>Your stories</Eyebrow>
          {mine.map((s) => (
            <Card key={s.id}>
              <Body>{s.text}</Body>
            </Card>
          ))}
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  form: { padding: space.lg, gap: space.md, paddingBottom: 48 },
  input: {
    backgroundColor: colors.surface,
    color: colors.text,
    borderRadius: radius.md,
    padding: space.md,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  picker: { height: 300, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  crosshair: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', paddingBottom: 26 },
  pickerActions: { position: 'absolute', top: 10, right: 10, flexDirection: 'row', gap: 8 },
});
