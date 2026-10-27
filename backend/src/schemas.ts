import { z } from 'zod';

/* ---------- helpers: LLM output is sloppy, so we clamp/truncate instead of rejecting ---------- */
const score = z.number().transform((n) => Math.max(0, Math.min(100, Math.round(n))));
const str = (max: number) => z.string().transform((s) => s.trim().slice(0, max));
const list = (maxItems: number, maxLen = 300) =>
  z.array(z.string()).transform((a) => a.map((s) => s.trim().slice(0, maxLen)).filter(Boolean).slice(0, maxItems));

/* ---------------------------------- request schemas ---------------------------------- */
const roleTitle = z.string().trim().min(2).max(120);
const jobDescription = z.string().trim().max(6000).optional();
export const QuestionSchema = z.object({
  text: z.string().trim().min(5).max(600),
  type: z.enum(['technical', 'behavioral']),
});

export const StartRequestSchema = z.object({
  roleTitle,
  jobDescription,
  totalQuestions: z.number().int().min(1).max(10).default(5),
});

export const TurnRequestSchema = z.object({
  roleTitle,
  jobDescription,
  question: QuestionSchema,
  answer: z.string().trim().min(1).max(4000),
  questionNumber: z.number().int().min(1).max(10),
  totalQuestions: z.number().int().min(1).max(10),
  history: z
    .array(z.object({ question: z.string().max(600), answer: z.string().max(4000) }))
    .max(10)
    .default([]),
});

export const SummaryRequestSchema = z.object({
  roleTitle,
  jobDescription,
  turns: z
    .array(
      z.object({
        question: z.string().max(600),
        type: z.enum(['technical', 'behavioral']),
        answer: z.string().max(4000),
        score: z.number().min(0).max(100),
        missingSkills: z.array(z.string().max(200)).max(10).default([]),
        improvements: z.array(z.string().max(400)).max(10).default([]),
      }),
    )
    .min(1)
    .max(10),
});

/* ------------------------------ model output schemas ------------------------------ */
const dimension = z.object({ score, comment: str(600) });

export const StartModelSchema = z.object({ question: QuestionSchema });

export const TurnModelSchema = z.object({
  technicalAccuracy: dimension,
  clarity: dimension,
  starUsage: z.object({ score, comment: str(600) }),
  strengths: list(4),
  improvements: list(4),
  missingSkills: list(6, 80),
  idealAnswerHint: str(900),
  nextQuestion: QuestionSchema.nullable(),
});

export const SummaryModelSchema = z.object({
  summaryText: str(900),
  keyWeaknesses: z
    .array(z.object({ topic: str(80), detail: str(300) }))
    .transform((a) => a.slice(0, 6)),
  studyRecommendations: z
    .array(z.object({ title: str(100), why: str(300), action: str(300) }))
    .transform((a) => a.slice(0, 5)),
  flashcards: z
    .array(z.object({ topic: str(80), question: str(300), answer: str(600) }))
    .transform((a) => a.filter((c) => c.question && c.answer).slice(0, 12)),
});

export type Question = z.infer<typeof QuestionSchema>;
