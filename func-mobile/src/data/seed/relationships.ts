import type { FriendEdge } from '../repository';

/** Seed-only social graph used by the simulated viewer projection. */
export const FRIENDSHIPS: readonly FriendEdge[] = [
  { a: 'u_maya', b: 'u_theo' },
  { a: 'u_maya', b: 'u_priya' },
  { a: 'u_maya', b: 'u_noor' },
  { a: 'u_maya', b: 'u_rosa' },
  { a: 'u_ines', b: 'u_maya' },
  { a: 'u_kai', b: 'u_theo' },
  { a: 'u_amara', b: 'u_theo' },
  { a: 'u_luca', b: 'u_priya' },
  { a: 'u_noor', b: 'u_sasha' },
  { a: 'u_felix', b: 'u_rosa' },
  { a: 'u_dev', b: 'u_sasha' },
];
