import { DatingCard } from './types';

// 12 cards. Positions 3 and 7 (1-indexed) always match — the reliable pitch moment.
export const datingCards: DatingCard[] = [
  { userId: 'u-amara' },
  { userId: 'u-lena' },
  { userId: 'u-zara', alwaysMatch: true }, // #3
  { userId: 'u-freya' },
  { userId: 'u-isla' },
  { userId: 'u-becca' },
  { userId: 'u-nia', alwaysMatch: true }, // #7
  { userId: 'u-carmen' },
  { userId: 'u-tilly' },
  { userId: 'u-grace' },
  { userId: 'u-sofia' },
  { userId: 'u-elle' },
];
