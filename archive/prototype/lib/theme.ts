// Single source of truth for the Func look: near-black, neon purple/pink/cyan.
export const colors = {
  bg: '#0A0A0F',
  surface: '#13131C',
  surfaceHi: '#1B1B27',
  border: '#26263A',
  text: '#F4F4FA',
  textDim: '#8A8AA3',
  primary: '#A855F7',
  secondary: '#EC4899',
  accent: '#22D3EE',
  success: '#34D399',
  danger: '#F87171',
  sea: '#0B1120',
} as const;

export const gradients = {
  brand: ['#A855F7', '#EC4899'] as const,
  hot: ['#EC4899', '#22D3EE'] as const,
  cool: ['#22D3EE', '#A855F7'] as const,
};

// Rotating palette for monogram avatars & event art (Decision 005: no photos).
export const avatarGradients: readonly (readonly [string, string])[] = [
  ['#A855F7', '#EC4899'],
  ['#22D3EE', '#A855F7'],
  ['#EC4899', '#F97316'],
  ['#6366F1', '#22D3EE'],
  ['#F43F5E', '#A855F7'],
  ['#10B981', '#22D3EE'],
  ['#F59E0B', '#EC4899'],
  ['#8B5CF6', '#3B82F6'],
];

export function gradientFor(key: string): readonly [string, string] {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return avatarGradients[h % avatarGradients.length];
}

export const radius = { sm: 8, md: 14, lg: 20, pill: 999 } as const;
export const spacing = { xs: 4, sm: 8, md: 14, lg: 20, xl: 28 } as const;
