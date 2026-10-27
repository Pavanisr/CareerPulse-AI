import { addInterviewGapCards } from '../flashcards/repository';
import { saveInterview } from './history';
import { InterviewSummary } from './types';

/**
 * Persists the finished interview and pushes the AI-generated weak-topic cards into the
 * "Interview Gaps: <role>" flashcard deck so they show up in tomorrow's review queue.
 */
export async function syncInterviewResult(roleTitle: string, summary: InterviewSummary): Promise<{ newCards: number }> {
  await saveInterview(roleTitle, summary.overallScore, summary.keyWeaknesses);
  const newCards = await addInterviewGapCards(roleTitle, summary.flashcards);
  return { newCards };
}
