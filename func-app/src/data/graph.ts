/**
 * The social graph, over stored friendship edges.
 *
 * Implements the domain's `SocialGraph` so `visibility.ts` never has to know
 * how relationships are stored. The prototype had no graph at all — `friend`
 * and `mutual` were flags on a person record meaning "relative to the demo
 * user", which is why nothing about it survived a second logged-in account.
 *
 * Friendship is symmetric and stored once. An edge is held with its endpoints
 * in a canonical order so `{a,b}` and `{b,a}` cannot both exist and drift apart.
 */

import type { Relationship, SocialGraph } from '../domain/visibility';
import type { PersonId } from '../domain/ids';
import type { FriendEdge } from './schema';

/** Canonical ordering, so an edge has exactly one representation. */
function orderEdge(x: PersonId, y: PersonId): [PersonId, PersonId] {
  return (x as string) <= (y as string) ? [x, y] : [y, x];
}

export function addFriendship(
  edges: readonly FriendEdge[],
  x: PersonId,
  y: PersonId,
  since: number,
): readonly FriendEdge[] {
  if ((x as string) === (y as string)) return edges;
  const [a, b] = orderEdge(x, y);
  if (edges.some((e) => e.a === a && e.b === b)) return edges;
  return [...edges, { a, b, since }];
}

export function removeFriendship(
  edges: readonly FriendEdge[],
  x: PersonId,
  y: PersonId,
): readonly FriendEdge[] {
  const [a, b] = orderEdge(x, y);
  return edges.filter((e) => !(e.a === a && e.b === b));
}

/**
 * A graph over an edge list.
 *
 * Adjacency is indexed once at construction. Visibility is evaluated for every
 * person at every venue on every map frame, so a linear scan per lookup would
 * be the first thing to fall over at any real scale.
 */
export function socialGraph(edges: readonly FriendEdge[]): SocialGraph {
  const adjacency = new Map<string, Set<string>>();

  const link = (from: PersonId, to: PersonId): void => {
    const key = from as string;
    const existing = adjacency.get(key);
    if (existing) existing.add(to as string);
    else adjacency.set(key, new Set([to as string]));
  };

  for (const edge of edges) {
    link(edge.a, edge.b);
    link(edge.b, edge.a);
  }

  const friendsOf = (person: PersonId): readonly PersonId[] =>
    [...(adjacency.get(person as string) ?? [])] as PersonId[];

  const relationship = (viewer: PersonId, subject: PersonId): Relationship => {
    if ((viewer as string) === (subject as string)) return 'self';

    const mine = adjacency.get(viewer as string);
    if (!mine) return 'none';
    if (mine.has(subject as string)) return 'friend';

    // Friend-of-friend. Walked from whichever side has fewer friends — the
    // answer is identical either way and the cost is not.
    const theirs = adjacency.get(subject as string);
    if (!theirs) return 'none';
    const [smaller, larger] = mine.size <= theirs.size ? [mine, theirs] : [theirs, mine];
    for (const id of smaller) {
      if (larger.has(id)) return 'mutual';
    }
    return 'none';
  };

  return { relationship, friendsOf };
}
