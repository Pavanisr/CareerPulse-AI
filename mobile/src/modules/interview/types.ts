export type QuestionType = 'technical' | 'behavioral';
export interface InterviewQuestion {
  text: string;
  type: QuestionType;
}
export interface Dimension {
  score: number;
  comment: string;
}
export interface TurnEvaluation {
  score: number;
  technicalAccuracy: Dimension;
  clarity: Dimension;
  starUsage: Dimension & { applicable: boolean };
  strengths: string[];
  improvements: string[];
  missingSkills: string[];
  idealAnswerHint: string;
}
export interface TurnResponse {
  evaluation: TurnEvaluation;
  nextQuestion: InterviewQuestion | null;
}
export interface Weakness {
  topic: string;
  detail: string;
}
export interface InterviewSummary {
  overallScore: number;
  summaryText: string;
  keyWeaknesses: Weakness[];
  studyRecommendations: { title: string; why: string; action: string }[];
  flashcards: { topic: string; question: string; answer: string }[];
}
export interface CompletedTurn {
  question: InterviewQuestion;
  answer: string;
  evaluation: TurnEvaluation;
}
