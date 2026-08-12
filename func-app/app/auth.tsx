/**
 * Sign up, verify, and get in.
 *
 * Which step to show is computed by the domain's `nextStep`, not by local
 * state — so "verification comes before profile" and "an under-age rejection
 * is terminal" are enforced by one tested function rather than by the order of
 * the screens.
 *
 * The verification service is simulated. The state machine around it is not:
 * an under-18 document is rejected, the rejection sticks, and the account is
 * blocked.
 */

import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';

import {
  createAccount,
  markOnboardingComplete,
  markProfileComplete,
  nextStep,
  resolveVerification,
  submitVerification,
  type Account,
} from '../src/domain';
import { asPersonId } from '../src/domain/ids';
import {
  Body,
  Button,
  Card,
  H1,
  H2,
  Label,
  Notice,
  Screen,
  Small,
  Spacer,
} from '../src/ui/components/kit';
import { FuncMark } from '../src/ui/components/FuncMark';
import { useApp } from '../src/ui/state/AppProvider';
import { logout } from '../src/ui/state/actions';
import { colour, radius, space } from '../src/ui/theme';

export default function AuthScreen(): React.JSX.Element {
  const app = useApp();
  const router = useRouter();

  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [bio, setBio] = useState('');
  const [error, setError] = useState<string | null>(null);

  const me = app.meId;
  const account = me ? app.state.accounts[me as string] : undefined;
  const step = account ? nextStep(account) : 'signup';

  // ---- signup -------------------------------------------------------------
  if (!account || step === 'signup') {
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.pad}>
          <Spacer h={space.xxl} />
          {/* The mark, not the word set in emerald. Emerald means people; the
              identity is chrome. This is the first screen a new user sees, so
              it is the first place that rule has to hold. */}
          <FuncMark width={190} />
          <Spacer h={space.sm} />
          <Body>A bridge between you and the opportunities of the night.</Body>

          <Spacer h={space.xxl} />
          <Label>Your name</Label>
          <Spacer h={space.xs} />
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="What people call you"
            placeholderTextColor={colour.fg4}
            testID="signup-name"
          />

          <Spacer h={space.md} />
          <Label>Date of birth</Label>
          <Spacer h={space.xs} />
          <TextInput
            style={styles.input}
            value={dob}
            onChangeText={setDob}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colour.fg4}
            autoCapitalize="none"
            testID="signup-dob"
          />
          <Spacer h={space.xs} />
          <Small>func is 18+. Checked against government ID, once.</Small>

          {error ? (
            <>
              <Spacer h={space.md} />
              <Notice text={error} tone="danger" />
            </>
          ) : null}

          <Spacer h={space.xl} />
          <Button
            label="Create account"
            testID="signup-submit"
            onPress={() => {
              if (!name.trim()) return setError('Put a name in.');
              if (!/^\d{4}-\d{2}-\d{2}$/.test(dob.trim())) {
                return setError('Date of birth needs to look like 1999-03-04.');
              }
              setError(null);
              const id = asPersonId(`u_${Date.now().toString(36)}`);
              const created = createAccount(
                { id, role: 'consumer', dateOfBirth: dob.trim() },
                app.clock,
              );
              app.update((state) => {
                state.accounts[id as string] = created;
                state.profiles[id as string] = {
                  personId: id,
                  name: name.trim(),
                  bio: '',
                  instagram: null,
                  photoUris: [],
                  tokens: 0,
                  spotsDropped: 0,
                  nightsOut: 0,
                };
                state.presence[id as string] = {
                  presence: { kind: 'off' },
                  shareWithMutuals: false,
                };
                state.session.personId = id;
              });
            }}
          />

          <Spacer h={space.lg} />
          <Button
            label="Use the demo account"
            variant="ghost"
            testID="use-demo"
            onPress={() => {
              app.update((state) => {
                state.session.personId = asPersonId('you');
              });
              router.replace('/(tabs)/map');
            }}
          />
        </ScrollView>
      </Screen>
    );
  }

  // ---- verification --------------------------------------------------------
  if (step === 'verify' || step === 'awaiting_verification') {
    const pending = step === 'awaiting_verification';
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.pad}>
          <Spacer h={space.xxl} />
          <Label>Verification</Label>
          <Spacer h={space.sm} />
          <H1>func is 18+</H1>
          <Spacer h={space.sm} />
          <Body>
            Government ID, checked once. This is what makes every profile on func a real person.
          </Body>

          {account.verification.rejectionReason && (
            <>
              <Spacer h={space.md} />
              <Notice
                tone="danger"
                text={
                  account.verification.rejectionReason === 'unreadable_document'
                    ? 'That scan could not be read. Try again.'
                    : 'Your date of birth could not be established. Try again.'
                }
              />
            </>
          )}

          <Spacer h={space.xl} />
          <Card>
            <Small>Simulated check — this prototype has no ID provider wired up.</Small>
            <Spacer h={space.md} />
            <Button
              label={pending ? 'Checking…' : 'Scan ID'}
              disabled={pending}
              testID="verify-submit"
              onPress={() => {
                app.update((state) => {
                  const current = state.accounts[me as string];
                  if (current) state.accounts[me as string] = submitVerification(current, 'id_upload', app.clock);
                });
                // The real service is asynchronous; mirror that rather than
                // resolving in the same tick and hiding the pending state.
                setTimeout(() => {
                  app.update((state) => {
                    const current = state.accounts[me as string];
                    if (!current) return;
                    state.accounts[me as string] = resolveVerification(
                      current,
                      { documentReadable: true, documentDateOfBirth: current.dateOfBirth },
                      app.clock,
                    );
                  });
                }, 1400);
              }}
            />
          </Card>
        </ScrollView>
      </Screen>
    );
  }

  // ---- blocked --------------------------------------------------------------
  if (step === 'blocked') {
    return (
      <Screen>
        <View style={[styles.pad, styles.centre]}>
          <H1 tone="danger">func is 18+</H1>
          <Spacer h={space.md} />
          <Body style={{ textAlign: 'center' }}>
            Your ID did not clear the age check, so this account cannot use func.
          </Body>
          <Spacer h={space.xl} />
          <Button
            label="Sign out"
            variant="ghost"
            testID="blocked-signout"
            onPress={() => logout(app)}
          />
        </View>
      </Screen>
    );
  }

  // ---- profile ---------------------------------------------------------------
  if (step === 'profile') {
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.pad}>
          <Spacer h={space.xxl} />
          <Label>Profile</Label>
          <Spacer h={space.sm} />
          <H1>Nearly there</H1>
          <Spacer h={space.sm} />
          <Body>A line about you. People see this before they decide anything.</Body>

          <Spacer h={space.lg} />
          <TextInput
            style={[styles.input, styles.multiline]}
            value={bio}
            onChangeText={setBio}
            placeholder="Where you are from, what you are up for."
            placeholderTextColor={colour.fg4}
            multiline
            testID="profile-bio"
          />

          <Spacer h={space.xl} />
          <Button
            label="Continue"
            testID="profile-submit"
            onPress={() => {
              app.update((state) => {
                const current = state.accounts[me as string];
                if (current) state.accounts[me as string] = markProfileComplete(current);
                const profile = state.profiles[me as string];
                if (profile) state.profiles[me as string] = { ...profile, bio: bio.trim() };
              });
            }}
          />
        </ScrollView>
      </Screen>
    );
  }

  // ---- onboarding: the one thing worth explaining before they are in ---------
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.pad}>
        <Spacer h={space.xxl} />
        <Label>How func works</Label>
        <Spacer h={space.sm} />
        <H1>You do not have to keep this open</H1>

        <Spacer h={space.lg} />
        <Card>
          <H2>Turn DTF on when you go out</H2>
          <Spacer h={space.xs} />
          <Small>
            Your friends can see where you are for the rest of the night. You do not have to check
            in, post, or tell func anything else.
          </Small>
        </Card>

        <Spacer h={space.md} />
        <Card>
          <H2>It ends by itself</H2>
          <Spacer h={space.xs} />
          <Small>
            DTF stops at midday. You can end it sooner whenever you want. Nobody sees you when it
            is off.
          </Small>
        </Card>

        <Spacer h={space.md} />
        <Card>
          <H2>Friends of friends see less</H2>
          <Spacer h={space.xs} />
          <Small>
            If you both turn it on, mutuals can see that someone they know is at a place — never
            who, never exactly where.
          </Small>
        </Card>

        <Spacer h={space.xl} />
        <Button
          label="Enter func"
          testID="onboarding-submit"
          onPress={() => {
            app.update((state) => {
              const current = state.accounts[me as string];
              if (current) state.accounts[me as string] = markOnboardingComplete(current);
            });
            router.replace('/(tabs)/map');
          }}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pad: { padding: space.lg, paddingBottom: space.xxl },
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  input: {
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colour.surface,
    borderWidth: 1,
    borderColor: colour.hairline,
    paddingHorizontal: space.md,
    color: colour.fg,
    fontSize: 15,
  },
  multiline: { height: 100, paddingTop: space.md, textAlignVertical: 'top' },
});

export type { Account };
