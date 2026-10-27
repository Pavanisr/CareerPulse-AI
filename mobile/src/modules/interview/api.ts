import { API_URL } from '../../config';
import { InterviewQuestion, InterviewSummary, CompletedTurn, TurnResponse } from './types';

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function post<T>(path: string, body: unknown, timeoutMs = 60_000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_URL}/api/interview${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new ApiError(json?.error ?? `Request failed (${res.status})`, res.status);
    return json as T;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    if ((e as Error).name === 'AbortError') throw new ApiError('The AI took too long to respond. Try again.', 408);
    throw new ApiError('Cannot reach the server. Check your connection and EXPO_PUBLIC_API_URL.', 0);
  } finally {
    clearTimeout(timer);
  }
}

export const startInterview = (p: { roleTitle: string; jobDescription?: string; totalQuestions: number }) =>
  post<{ question: InterviewQuestion }>('/start', p);

export const submitAnswer = (p: {
  roleTitle: string;
  jobDescription?: string;
  question: InterviewQuestion;
  answer: string;
  questionNumber: number;
  totalQuestions: number;
  history: { question: string; answer: string }[];
}) => post<TurnResponse>('/turn', p);

export const summarizeInterview = (p: { roleTitle: string; jobDescription?: string; turns: CompletedTurn[] }) =>
  post<InterviewSummary>('/summary', {
    roleTitle: p.roleTitle,
    jobDescription: p.jobDescription,
    turns: p.turns.map((t) => ({
      question: t.question.text,
      type: t.question.type,
      answer: t.answer,
      score: t.evaluation.score,
      missingSkills: t.evaluation.missingSkills,
      improvements: t.evaluation.improvements,
    })),
  });
