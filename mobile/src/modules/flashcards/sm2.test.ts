import { calculateSM2, DEFAULT_EASE, MIN_EASE, RATING_TO_QUALITY } from './sm2';

const fresh = { interval: 0, repetitions: 0, easeFactor: DEFAULT_EASE };
const NOW = 1_700_000_000_000;

describe('SM-2', () => {
  it('schedules 1 day, then 6 days, then interval * EF', () => {
    const r1 = calculateSM2(fresh, 4, NOW);
    expect([r1.interval, r1.repetitions]).toEqual([1, 1]);
    const r2 = calculateSM2(r1, 4, NOW);
    expect([r2.interval, r2.repetitions]).toEqual([6, 2]);
    const r3 = calculateSM2(r2, 4, NOW);
    expect(r3.interval).toBe(15); // round(6 * 2.5)
    expect(r3.nextReview).toBe(NOW + 15 * 86_400_000);
  });

  it('resets repetitions and interval on failure', () => {
    const learned = { interval: 15, repetitions: 3, easeFactor: 2.5 };
    const r = calculateSM2(learned, RATING_TO_QUALITY.again, NOW);
    expect([r.interval, r.repetitions]).toEqual([1, 0]);
  });

  it('adjusts ease factor per the SM-2 formula', () => {
    expect(calculateSM2(fresh, 5, NOW).easeFactor).toBe(2.6);
    expect(calculateSM2(fresh, 4, NOW).easeFactor).toBe(2.5);
    expect(calculateSM2(fresh, 3, NOW).easeFactor).toBe(2.36);
  });

  it('never lets ease factor drop below 1.3', () => {
    let s = { ...fresh, easeFactor: 1.35 };
    for (let i = 0; i < 10; i++) s = calculateSM2(s, 1, NOW);
    expect(s.easeFactor).toBe(MIN_EASE);
  });

  it('rejects invalid quality', () => {
    expect(() => calculateSM2(fresh, 6)).toThrow(RangeError);
    expect(() => calculateSM2(fresh, 2.5)).toThrow(RangeError);
  });
});
