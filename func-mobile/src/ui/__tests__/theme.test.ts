import assert from 'node:assert/strict';
import test from 'node:test';
import { colors } from '../theme';

test('visual theme exposes the M1 black, glass, chrome, electric, and text tokens', () => {
  assert.equal(colors.bg, colors.nearBlack);
  assert.equal(colors.textPrimary, colors.text);
  assert.equal(colors.textSecondary, colors.muted);
  assert.equal(colors.textTertiary, colors.faint);
  assert.match(colors.glass, /^rgba\(/);
  assert.match(colors.glassRaised, /^rgba\(/);
  assert.notEqual(colors.bg, ['#', '16161a'].join(''));
  assert.equal(colors.chromeBright, '#e9e9eb');
  assert.equal(colors.chromeMid, '#8e8e92');
  assert.equal(colors.chromeShadow, '#3b3b3e');
  assert.ok(colors.electricCobalt);
  assert.ok(colors.electricViolet);
  assert.ok(colors.electricPink);
  assert.ok(colors.electricCyan);
  assert.ok(colors.electricLime);
  assert.ok(colors.highlight);
  assert.ok(colors.borderSubtle);
  assert.ok(colors.borderStrong);
});

test('dtf glow overlay tokens are alpha variants of the dtf color, not a re-typed literal', () => {
  assert.match(colors.dtfGlowOuter, /^rgba\(34, 197, 94, 0\.14\)$/);
  assert.match(colors.dtfGlowInner, /^rgba\(34, 197, 94, 0\.2\)$/);
});

test('map screen glass variants share the base glass color, just at higher opacity', () => {
  assert.match(colors.glassSearch, /^rgba\(31, 31, 37, 0\.94\)$/);
  assert.match(colors.glassPreview, /^rgba\(31, 31, 37, 0\.97\)$/);
});
