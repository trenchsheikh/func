import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSeed } from '../seed';
import * as selectors from '../selectors';
import { friendCount } from '../selectors';

const NOW = new Date('2026-08-21T22:00:00Z');

test('relationship selector derives friends, mutuals, self, and unrelated viewers from separate edges', () => {
  const snapshot = buildSeed(NOW);
  const relationshipOf = (selectors as typeof selectors & {
    relationshipOf?: (s: Parameters<typeof buildSeed> extends [infer _] ? ReturnType<typeof buildSeed> : never, viewerId: string, subjectId: string) => string;
  }).relationshipOf;

  assert.equal(typeof relationshipOf, 'function');
  assert.equal(relationshipOf?.(snapshot, 'u_maya', 'u_maya'), 'self');
  assert.equal(relationshipOf?.(snapshot, 'u_maya', 'u_theo'), 'friend');
  assert.equal(relationshipOf?.(snapshot, 'u_maya', 'u_kai'), 'mutual');
  assert.equal(relationshipOf?.(snapshot, 'u_maya', 'u_dev'), 'none');
  assert.ok(Array.isArray((snapshot as typeof snapshot & { friendships?: unknown }).friendships));
});

test('friendCount counts edges from the separate friendship graph, not a stored profile field', () => {
  const snapshot = buildSeed(NOW);
  assert.equal(friendCount(snapshot, 'u_maya'), 5);
  assert.equal(friendCount(snapshot, 'u_theo'), 3);
});

test('friendCount is zero for a seeded user with no friendship edges', () => {
  const snapshot = buildSeed(NOW);
  assert.equal(friendCount(snapshot, 'u_jun'), 0);
});
