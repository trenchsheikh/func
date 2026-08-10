import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { asPersonId } from '../../domain/ids';
import { mutualFriendCount } from '../../domain/visibility';
import { addFriendship, removeFriendship, socialGraph } from '../graph';
import type { FriendEdge } from '../schema';

const A = asPersonId('a');
const B = asPersonId('b');
const C = asPersonId('c');
const D = asPersonId('d');
const NOW = 1_000;

const build = (pairs: [typeof A, typeof A][]): readonly FriendEdge[] =>
  pairs.reduce<readonly FriendEdge[]>((edges, [x, y]) => addFriendship(edges, x, y, NOW), []);

describe('friendship edges', () => {
  it('stores one edge however the pair is ordered', () => {
    const once = addFriendship([], A, B, NOW);
    const twice = addFriendship(once, B, A, NOW);
    assert.equal(twice.length, 1);
  });

  it('refuses to befriend yourself', () => {
    assert.deepEqual(addFriendship([], A, A, NOW), []);
  });

  it('removes regardless of order', () => {
    assert.deepEqual(removeFriendship(build([[A, B]]), B, A), []);
  });

  it('removing something that is not there is harmless', () => {
    assert.equal(removeFriendship(build([[A, B]]), C, D).length, 1);
  });
});

describe('resolving relationships', () => {
  // a—b, b—c, c—d : a and c share b; a and d share nobody.
  const graph = socialGraph(build([[A, B], [B, C], [C, D]]));

  it('knows you', () => {
    assert.equal(graph.relationship(A, A), 'self');
  });

  it('sees a direct friend', () => {
    assert.equal(graph.relationship(A, B), 'friend');
    assert.equal(graph.relationship(B, A), 'friend');
  });

  it('sees a friend of a friend as a mutual', () => {
    assert.equal(graph.relationship(A, C), 'mutual');
    assert.equal(graph.relationship(C, A), 'mutual');
  });

  it('sees nobody two hops further out', () => {
    // d is a friend-of-a-friend-of-a-friend. Not a mutual, not anything.
    assert.equal(graph.relationship(A, D), 'none');
  });

  it('is symmetric everywhere', () => {
    for (const [x, y] of [[A, B], [A, C], [A, D], [B, D]] as const) {
      assert.equal(
        graph.relationship(x, y),
        graph.relationship(y, x),
        `asymmetric between ${x} and ${y}`,
      );
    }
  });

  it('prefers friend over mutual when both would apply', () => {
    // b is a's friend and also reachable via c. Direct wins.
    const dense = socialGraph(build([[A, B], [B, C], [A, C]]));
    assert.equal(dense.relationship(A, B), 'friend');
  });

  it('returns none for someone with no edges at all', () => {
    assert.equal(graph.relationship(A, asPersonId('stranger')), 'none');
    assert.equal(graph.relationship(asPersonId('ghost'), A), 'none');
  });

  it('lists friends', () => {
    assert.deepEqual([...graph.friendsOf(B)].sort(), ['a', 'c']);
    assert.deepEqual(graph.friendsOf(asPersonId('nobody')), []);
  });
});

describe('mutual friend counts', () => {
  it('counts shared friends, not relationship depth', () => {
    // a and d both know b and c.
    const graph = socialGraph(build([[A, B], [A, C], [D, B], [D, C]]));
    assert.equal(mutualFriendCount(A, D, graph), 2);
  });

  it('is zero when nothing is shared', () => {
    const graph = socialGraph(build([[A, B], [C, D]]));
    assert.equal(mutualFriendCount(A, C, graph), 0);
  });
});
