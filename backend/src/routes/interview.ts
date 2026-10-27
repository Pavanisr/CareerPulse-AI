import { NextFunction, Request, Response, Router } from 'express';
import { generateJson } from '../gemini';
import {
  buildStartPrompt,
  buildSummaryPrompt,
  buildTurnPrompt,
  START_SYSTEM,
  SUMMARY_SYSTEM,
  TURN_SYSTEM,
} from '../prompts';
import {
  StartModelSchema,
  StartRequestSchema,
  SummaryModelSchema,
  SummaryRequestSchema,
  TurnModelSchema,
  TurnRequestSchema,
} from '../schemas';

export const interviewRouter = Router();

const wrap =
  (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res).catch(next);

/** Server-side overall score: the model can't be talked into a 100. */
function overallScore(type: 'technical' | 'behavioral', tech: number, clarity: number, star: number) {
  const s = type === 'behavioral' ? tech * 0.4 + clarity * 0.25 + star * 0.35 : tech * 0.65 + clarity * 0.35;
  return Math.round(s);
}

interviewRouter.post(
  '/start',
  wrap(async (req, res) => {
    const body = StartRequestSchema.parse(req.body);
    const out = await generateJson(
      StartModelSchema,
      START_SYSTEM,
      buildStartPrompt(body.roleTitle, body.jobDescription, body.totalQuestions),
    );
    res.json({ question: out.question });
  }),
);

interviewRouter.post(
  '/turn',
  wrap(async (req, res) => {
    const body = TurnRequestSchema.parse(req.body);
    const out = await generateJson(TurnModelSchema, TURN_SYSTEM, buildTurnPrompt(body));
    const isLast = body.questionNumber >= body.totalQuestions;
    const behavioral = body.question.type === 'behavioral';
    const star = behavioral
      ? out.starUsage
      : { score: 0, comment: 'Not applicable to technical questions.' };

    res.json({
      evaluation: {
        score: overallScore(body.question.type, out.technicalAccuracy.score, out.clarity.score, star.score),
        technicalAccuracy: out.technicalAccuracy,
        clarity: out.clarity,
        starUsage: { ...star, applicable: behavioral },
        strengths: out.strengths,
        improvements: out.improvements,
        missingSkills: out.missingSkills,
        idealAnswerHint: out.idealAnswerHint,
      },
      nextQuestion: isLast ? null : out.nextQuestion,
    });
  }),
);

interviewRouter.post(
  '/summary',
  wrap(async (req, res) => {
    const body = SummaryRequestSchema.parse(req.body);
    const out = await generateJson(
      SummaryModelSchema,
      SUMMARY_SYSTEM,
      buildSummaryPrompt(body.roleTitle, body.jobDescription, body.turns),
    );
    const overall = Math.round(body.turns.reduce((s, t) => s + t.score, 0) / body.turns.length);
    res.json({ overallScore: overall, ...out });
  }),
);
