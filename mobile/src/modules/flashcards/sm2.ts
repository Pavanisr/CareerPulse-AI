/**
 * SM-2 spaced repetition (SuperMemo-2, Piotr Wozniak, 1987).
 *
 * Quality (0-5): 0-2 = failed recall, 3 = recalled with serious difficulty,
 * 4 = recalled after hesitation, 5 = perfect recall.
 *
 * q >= 3 (pass):  rep 0 -> 1 day, rep 1 -> 6 days, otherwise round(prevInterval * EF); repetitions++
 * q <  3 (fail):  repetitions = 0, interval = 1 day
 * EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)), never below 1.3
 *
 * This file is pure (no I/O, no React) so it is trivially unit-testable.
 */
export type Quality = 0 | 1 | 2 | 3 | 4 | 5;
export type Rating = 'again' | 'hard' | 'good' | 'easy';

export const RATING_TO_QUALITY: Record<Rating, Quality> = { again: 1, hard: 3, good: 4, easy: 5 };

export const DAY_MS = 86_400_000;
export const MIN_EASE = 1.3;
export const DEFAULT_EASE = 2.5;

export interface SM2State {
  interval: number; // days
  repetitions: number;
  easeFactor: number;
}
export interface SM2Result extends SM2State {
  nextReview: number; // epoch ms
}

export function calculateSM2(state: SM2State, quality: number, now: number = Date.now()): SM2Result {
  if (!Number.isInteger(quality) || quality < 0 || quality > 5) {
    throw new RangeError(`SM-2 quality must be an integer 0-5, got ${quality}`);
  }

  let { interval, repetitions } = state;

  if (quality >= 3) {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.max(1, Math.round(interval * state.easeFactor));
    repetitions += 1;
  } else {
    repetitions = 0;
    interval = 1;
  }

  const delta = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
  const easeFactor = Math.max(MIN_EASE, round2(state.easeFactor + delta));

  return { interval, repetitions, easeFactor, nextReview: now + interval * DAY_MS };
}

/** Preview of the interval each button would produce (for the labels on the rating buttons). */
export function previewIntervals(state: SM2State, now: number = Date.now()): Record<Rating, number> {
  const out = {} as Record<Rating, number>;
  (Object.keys(RATING_TO_QUALITY) as Rating[]).forEach((r) => {
    out[r] = calculateSM2(state, RATING_TO_QUALITY[r], now).interval;
  });
  return out;
}

export function formatInterval(days: number): string {
  if (days < 1) return 'Today';
  if (days < 30) return `${days}d`;
  if (days < 365) return `${Math.round(days / 30)}mo`;
  return `${(days / 365).toFixed(1)}y`;
}

const round2 = (n: number) => Math.round(n * 100) / 100;
