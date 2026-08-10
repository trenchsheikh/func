/**
 * The gate.
 *
 * Where a signed-in account lands is computed by the domain (`nextStep`), not
 * decided here — so the rule that verification comes before profile lives in
 * one tested function rather than in routing code.
 */

import { Redirect } from 'expo-router';
import React from 'react';

import { nextStep } from '../src/domain';
import { Loading, Notice, Screen, Spacer } from '../src/ui/components/kit';
import { useApp } from '../src/ui/state/AppProvider';
import { space } from '../src/ui/theme';

export default function Index(): React.JSX.Element {
  const app = useApp();

  if (!app.ready) return <Loading />;

  // Data this build could not read was preserved, not dropped. Say so rather
  // than silently greeting a returning user as a new one.
  if (app.loadOutcome?.kind === 'quarantined') {
    return (
      <Screen style={{ padding: space.xl, justifyContent: 'center' }}>
        <Notice text={`Saved data could not be read, so func has started fresh. Nothing was deleted — ${app.loadOutcome.reason}`} />
        <Spacer h={space.lg} />
        <Redirect href="/(tabs)/map" />
      </Screen>
    );
  }

  const me = app.meId;
  if (!me) return <Redirect href="/auth" />;

  const account = app.state.accounts[me as string];
  if (!account) return <Redirect href="/auth" />;

  const step = nextStep(account);
  if (step !== 'ready') return <Redirect href="/auth" />;

  return <Redirect href="/(tabs)/map" />;
}
