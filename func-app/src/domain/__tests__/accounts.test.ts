import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  ageInYears,
  canEnter,
  createAccount,
  markOnboardingComplete,
  markProfileComplete,
  mayRetryVerification,
  meetsMinimumAge,
  nextStep,
  resolveVerification,
  submitVerification,
  type Account,
} from '../accounts';
import { fixedClock } from '../clock';
import { asBusinessId, asPersonId } from '../ids';

const NOW = Date.parse('2026-08-09T12:00:00Z');
const clock = fixedClock(NOW);

const consumer = (dob: string | null): Account =>
  createAccount({ id: asPersonId('u1'), role: 'consumer', dateOfBirth: dob }, clock);

const business = (): Account =>
  createAccount({ id: asBusinessId('biz1'), role: 'business' }, clock);

const readable = (dob: string | null) => ({
  documentReadable: true,
  documentDateOfBirth: dob,
});

describe('age arithmetic uses the real calendar', () => {
  it('counts whole years', () => {
    assert.equal(ageInYears('2000-08-09', NOW), 26);
    assert.equal(ageInYears('2000-08-10', NOW), 25); // birthday not reached
  });

  it('does not turn eighteen a day early', () => {
    // The 365.25-day divisor bug flipped this to 18 one day before the
    // birthday. On an 18+ gate that is a compliance failure.
    assert.equal(meetsMinimumAge('2008-08-10', NOW), false);
    assert.equal(meetsMinimumAge('2008-08-09', NOW), true);
  });

  it('is undeterminable rather than zero for bad input', () => {
    assert.equal(ageInYears(null, NOW), null);
    assert.equal(ageInYears('', NOW), null);
    assert.equal(ageInYears('not a date', NOW), null);
    assert.equal(ageInYears('2030-01-01', NOW), null); // born in the future
  });
});

describe('the 18+ gate fails closed', () => {
  it('refuses every uncertain input', () => {
    for (const bad of [null, '', 'not a date', '2030-01-01']) {
      assert.equal(meetsMinimumAge(bad, NOW), false, `should refuse ${JSON.stringify(bad)}`);
    }
  });

  it('rejects a consumer whose document has no readable date of birth', () => {
    const account = resolveVerification(
      submitVerification(consumer('2000-01-01'), 'id_upload', clock),
      readable(null),
      clock,
    );
    assert.equal(account.verification.status, 'rejected');
    assert.equal(account.verification.rejectionReason, 'age_indeterminate');
    assert.equal(canEnter(account), false);
  });

  it('rejects an unreadable document', () => {
    const account = resolveVerification(
      submitVerification(consumer('2000-01-01'), 'id_upload', clock),
      { documentReadable: false, documentDateOfBirth: null },
      clock,
    );
    assert.equal(account.verification.rejectionReason, 'unreadable_document');
  });

  it('rejects an under-age document even when signup claimed otherwise', () => {
    // Self-reported dates of birth are not evidence — the document wins.
    const account = resolveVerification(
      submitVerification(consumer('1995-01-01'), 'id_upload', clock),
      readable('2012-01-01'),
      clock,
    );
    assert.equal(account.verification.status, 'rejected');
    assert.equal(account.verification.rejectionReason, 'under_age');
  });

  it('verifies an adult', () => {
    const account = resolveVerification(
      submitVerification(consumer('1995-01-01'), 'id_upload', clock),
      readable('1995-01-01'),
      clock,
    );
    assert.equal(account.verification.status, 'verified');
    assert.equal(canEnter(account), true);
  });

  it('verifies a business without any age check', () => {
    const account = resolveVerification(
      submitVerification(business(), 'id_upload', clock),
      readable(null),
      clock,
    );
    assert.equal(account.verification.status, 'verified');
  });

  it('ignores a resolution for anything not pending', () => {
    const fresh = consumer('1995-01-01');
    assert.equal(resolveVerification(fresh, readable('1995-01-01'), clock), fresh);
  });
});

describe('rejection for age is terminal', () => {
  const rejectedFor = (dob: string) =>
    resolveVerification(
      submitVerification(consumer('1995-01-01'), 'id_upload', clock),
      readable(dob),
      clock,
    );

  it('does not let an under-age account retry its way in', () => {
    const account = rejectedFor('2012-01-01');
    assert.equal(mayRetryVerification(account), false);
    assert.equal(nextStep(account), 'blocked');
  });

  it('does let a bad scan try again', () => {
    const account = resolveVerification(
      submitVerification(consumer('1995-01-01'), 'id_upload', clock),
      { documentReadable: false, documentDateOfBirth: null },
      clock,
    );
    assert.equal(mayRetryVerification(account), true);
    assert.equal(nextStep(account), 'verify');
  });
});

describe('onboarding routes verification before profile', () => {
  const verified = (): Account =>
    resolveVerification(
      submitVerification(consumer('1995-01-01'), 'id_upload', clock),
      readable('1995-01-01'),
      clock,
    );

  it('sends a new account to verification first', () => {
    assert.equal(nextStep(consumer('1995-01-01')), 'verify');
  });

  it('waits while a check is pending', () => {
    assert.equal(nextStep(submitVerification(consumer('1995-01-01'), 'id_upload', clock)), 'awaiting_verification');
  });

  it('asks for a profile only once verified', () => {
    // Nobody should build a profile the age gate is about to reject.
    assert.equal(nextStep(verified()), 'profile');
  });

  it('walks through to ready', () => {
    const done = markOnboardingComplete(markProfileComplete(verified()));
    assert.equal(nextStep(done), 'ready');
  });
});
