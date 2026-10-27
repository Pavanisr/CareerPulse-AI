import { DAY_MS } from './sm2';

export interface StreakInfo {
  current: number;
  longest: number;
  studiedToday: boolean;
}

export const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** `days` are local-date keys (YYYY-MM-DD) on which at least one card was reviewed. */
export function computeStreak(days: string[], today: Date = new Date()): StreakInfo {
  const set = new Set(days);
  const studiedToday = set.has(dayKey(today));

  // Current streak: today counts if studied, otherwise it may still be alive from yesterday.
  const cursor = new Date(today);
  if (!studiedToday) cursor.setDate(cursor.getDate() - 1);
  let current = 0;
  while (set.has(dayKey(cursor))) {
    current++;
    cursor.setDate(cursor.getDate() - 1);
  }

  let longest = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const key of [...set].sort()) {
    const [y, m, d] = key.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    run = prev && Math.round((dt.getTime() - prev.getTime()) / DAY_MS) === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = dt;
  }
  return { current, longest, studiedToday };
}
