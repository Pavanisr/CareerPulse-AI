import { getDb } from '../../shared/db/database';
import { Weakness } from './types';

export interface InterviewRecord {
  id: number;
  roleTitle: string;
  score: number;
  weaknesses: Weakness[];
  sessionDate: number;
}

export async function saveInterview(roleTitle: string, score: number, weaknesses: Weakness[]): Promise<void> {
  const db = await getDb();
  await db.runAsync('INSERT INTO interview_history (role_title, score, key_weaknesses_json, session_date) VALUES (?, ?, ?, ?)', [
    roleTitle,
    Math.round(score),
    JSON.stringify(weaknesses),
    Date.now(),
  ]);
}

export async function getRecentInterviews(limit = 5): Promise<InterviewRecord[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ id: number; role_title: string; score: number; key_weaknesses_json: string; session_date: number }>(
    'SELECT * FROM interview_history ORDER BY session_date DESC LIMIT ?',
    [limit],
  );
  return rows.map((r) => ({
    id: r.id,
    roleTitle: r.role_title,
    score: r.score,
    sessionDate: r.session_date,
    weaknesses: safeParse(r.key_weaknesses_json),
  }));
}

function safeParse(json: string): Weakness[] {
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
