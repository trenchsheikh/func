/**
 * Business dashboard — claim venues, post tables.
 *
 * The claim list stays available after the first claim. A business may run
 * several venues; the prototype hid the affordance once `venueIds` was
 * non-empty, which made the second claim unreachable even though the rule
 * allowed it and seed data already relied on it.
 */

import React, { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { claimVenue, unclaimedVenues } from '../src/domain/venues';
import {
  Body,
  Button,
  Card,
  Divider,
  Empty,
  H1,
  H2,
  Label,
  Notice,
  Row,
  Screen,
  Small,
  Spacer,
} from '../src/ui/components/kit';
import { useApp } from '../src/ui/state/AppProvider';
import { explain, postTable } from '../src/ui/state/actions';
import { myBusinesses, seatsLeft } from '../src/ui/state/selectors';
import { colour, radius, space } from '../src/ui/theme';

export default function BusinessScreen(): React.JSX.Element {
  const app = useApp();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [tableName, setTableName] = useState('');
  const [seats, setSeats] = useState('4');
  const [perHead, setPerHead] = useState('40');

  const businesses = myBusinesses(app);
  const business = businesses[0];

  if (!business) {
    return (
      <Empty
        title="Not a business account"
        body="Business accounts post tables and accept requests. This account is a person."
      />
    );
  }

  const available = unclaimedVenues(app.places.allVenues(), Object.values(app.state.businesses));
  const myTables = app.state.tables.filter((t) => t.businessId === business.id);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.pad}>
        <H1>{business.name}</H1>
        <Spacer h={space.xs} />
        <Small>
          {business.verified ? 'Verified' : 'Not verified'} ·{' '}
          {business.venueIds.length} {business.venueIds.length === 1 ? 'venue' : 'venues'}
        </Small>
        <Spacer h={space.sm} />
        <Body>{business.bio}</Body>

        {feedback ? (
          <>
            <Spacer h={space.md} />
            <Notice text={feedback} />
          </>
        ) : null}

        <Divider />

        <Label>Your tables tonight</Label>
        <Spacer h={space.sm} />
        {myTables.length === 0 ? (
          <Small>Nothing posted yet.</Small>
        ) : (
          myTables.map((table) => (
            <Card key={table.id as string} style={styles.item}>
              <H2>{table.name}</H2>
              <Small>
                {app.places.venueByIdSync(table.venueId)?.name} · {seatsLeft(app, table)} of {table.seats} left ·
                ${(table.perHead.amount / 100).toFixed(2)} per head
              </Small>
            </Card>
          ))
        )}

        {business.venueIds.length > 0 && (
          <>
            <Spacer h={space.lg} />
            <Label>Post a table</Label>
            <Spacer h={space.sm} />
            <Card>
              <TextInput
                style={styles.input}
                value={tableName}
                onChangeText={setTableName}
                placeholder="Booth 5, upstairs"
                placeholderTextColor={colour.fg4}
                testID="table-name"
              />
              <Spacer h={space.sm} />
              <Row>
                <TextInput
                  style={[styles.input, styles.flex]}
                  value={seats}
                  onChangeText={setSeats}
                  placeholder="Seats"
                  placeholderTextColor={colour.fg4}
                  keyboardType="number-pad"
                  testID="table-seats"
                />
                <TextInput
                  style={[styles.input, styles.flex]}
                  value={perHead}
                  onChangeText={setPerHead}
                  placeholder="Per head ($)"
                  placeholderTextColor={colour.fg4}
                  keyboardType="decimal-pad"
                  testID="table-perhead"
                />
              </Row>
              <Spacer h={space.sm} />
              <Small>Cents are kept. $24.50 stays $24.50.</Small>
              <Spacer h={space.md} />
              {business.venueIds.map((venueId) => (
                <View key={venueId as string}>
                  <Button
                    label={`Post at ${app.places.venueByIdSync(venueId)?.name ?? 'venue'}`}
                    testID={`post-table-${venueId}`}
                    onPress={() => {
                      const result = postTable(
                        app,
                        venueId,
                        tableName,
                        Number(seats),
                        Number(perHead),
                        '',
                      );
                      setFeedback(result.ok ? 'Posted.' : result.reason);
                      if (result.ok) setTableName('');
                    }}
                  />
                  <Spacer h={space.sm} />
                </View>
              ))}
            </Card>
          </>
        )}

        <Divider />

        {/* Stays visible after the first claim — a business may run several. */}
        <Label>{business.venueIds.length ? 'Claim another venue' : 'Claim the venue you run'}</Label>
        <Spacer h={space.sm} />
        {available.length === 0 ? (
          <Small>Every venue on the map is already run by a business.</Small>
        ) : (
          available.map((venue) => (
            <Card key={venue.id as string} style={styles.item}>
              <Row>
                <View style={styles.flex}>
                  <H2>{venue.name}</H2>
                  <Small>
                    {app.places.districtById(venue.districtId as string)?.name} · {venue.kind}
                  </Small>
                </View>
                <Button
                  label="Claim"
                  variant="ghost"
                  testID={`claim-${venue.id}`}
                  onPress={() => {
                    const result = claimVenue(
                      business,
                      venue.id,
                      app.places.allVenues(),
                      Object.values(app.state.businesses),
                    );
                    if (!result.ok) {
                      setFeedback(
                        result.error === 'already_claimed' && result.claimedBy
                          ? `${venue.name} is already run by ${result.claimedBy}.`
                          : explain(result.error),
                      );
                      return;
                    }
                    app.update((state) => {
                      state.businesses[business.id as string] = result.value;
                    });
                    setFeedback(`Claimed ${venue.name}.`);
                  }}
                />
              </Row>
            </Card>
          ))
        )}

        <Spacer h={space.xxl} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pad: { padding: space.lg, paddingBottom: space.xxl },
  flex: { flex: 1 },
  item: { marginBottom: space.sm },
  input: {
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colour.surface2,
    borderWidth: 1,
    borderColor: colour.hairline,
    paddingHorizontal: space.md,
    color: colour.fg,
  },
});
