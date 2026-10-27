import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

let client: GoogleGenAI | null = null;
function getClient() {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new HttpError(500, 'GEMINI_API_KEY is not set on the server.');
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

const MODEL = () => process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';

/** Strip accidental ```json fences and grab the outermost JSON object. */
export function extractJson(raw: string): unknown {
  const cleaned = raw.replace(/```json|```/gi, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON object found');
  return JSON.parse(cleaned.slice(start, end + 1));
}

/**
 * Calls Gemini in JSON mode, parses and validates with Zod.
 * Retries once with a repair hint if the output is malformed or fails validation.
 */
export async function generateJson<T>(
  schema: z.ZodType<T, z.ZodTypeDef, unknown>,
  systemInstruction: string,
  userPrompt: string,
): Promise<T> {
  let lastError = '';
  for (let attempt = 0; attempt < 2; attempt++) {
    const contents =
      attempt === 0
        ? userPrompt
        : `${userPrompt}\n\nYour previous reply was invalid (${lastError}). Reply again with ONLY the JSON object in the exact shape requested.`;
    try {
      const res = await getClient().models.generateContent({
        model: MODEL(),
        contents,
        config: { systemInstruction, responseMimeType: 'application/json', temperature: 0.4 },
      });
      const parsed = schema.safeParse(extractJson(res.text ?? ''));
      if (parsed.success) return parsed.data;
      lastError = parsed.error.issues.slice(0, 3).map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    } catch (e) {
      if (e instanceof HttpError) throw e;
      lastError = e instanceof Error ? e.message : 'unknown error';
      // Network/auth/quota errors won't be fixed by a retry with a repair hint.
      if (/API key|permission|quota|429|401|403/i.test(lastError)) {
        throw new HttpError(502, 'The AI service rejected the request. Check the server API key and quota.');
      }
    }
  }
  throw new HttpError(502, 'The AI returned an unreadable response. Please try again.');
}
