import { CostItem } from '../data/types';

export function costTotal(items: CostItem[]): { min: number; max: number } {
  return items.reduce(
    (acc, i) => ({ min: acc.min + i.min, max: acc.max + i.max }),
    { min: 0, max: 0 }
  );
}

export function formatRange(min: number, max: number): string {
  if (min === 0 && max === 0) return 'Free';
  if (min === max) return `£${min}`;
  return `£${min}–${max}`;
}

// e.g. "£24–47 night" for an event card chip
export function nightRange(items: CostItem[]): string {
  const t = costTotal(items);
  return t.max === 0 ? 'Free night' : `${formatRange(t.min, t.max)} night`;
}

// For venues with no linked event: spread ±30% around avgSpend so the Decision
// Card's cost meter (Map v3 spec §1.5) always has a range, never a single guess.
export function venueCostRange(avgSpend: number): { min: number; max: number } {
  return { min: Math.round(avgSpend * 0.7), max: Math.round(avgSpend * 1.3) };
}
