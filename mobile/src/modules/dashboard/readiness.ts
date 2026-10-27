/**
 * Career readiness (0-100) = weighted blend of
 *   - interview performance: average of the last 5 sessions (60%)
 *   - flashcard mastery:     mean of min(interval / 21d, 1) over all cards (40%)
 * If only one signal exists it is used on its own, so new users still see a meaningful number.
 */
export const INTERVIEW_WEIGHT = 0.6;
export const FLASHCARD_WEIGHT = 0.4;

export function computeReadiness(interviewScores: number[], flashcardMastery: number, totalCards: number): number {
  const hasInterviews = interviewScores.length > 0;
  const hasCards = totalCards > 0;
  const interviewPart = hasInterviews ? interviewScores.reduce((a, b) => a + b, 0) / interviewScores.length : 0;
  const cardPart = flashcardMastery * 100;

  if (hasInterviews && hasCards) return Math.round(INTERVIEW_WEIGHT * interviewPart + FLASHCARD_WEIGHT * cardPart);
  if (hasInterviews) return Math.round(interviewPart);
  if (hasCards) return Math.round(cardPart);
  return 0;
}
