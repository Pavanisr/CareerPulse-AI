import { getDb } from '../../shared/db/database';
import { SEED_DECKS } from './seedData';
import { calculateSM2, Rating, RATING_TO_QUALITY } from './sm2';
import { computeStreak, StreakInfo } from './streak';

/* -------------------------------------------------------------------------- types */
export interface Card {
  id: number;
  deckId: number;
  deckTitle?: string;
  question: string;
  answer: string;
  interval: number;
  repetitions: number;
  easeFactor: number;
  nextReview: number;
  topic: string | null;
}
interface CardRow {
  id: number;
  deck_id: number;
  deck_title?: string;
  question: string;
  answer: string;
  interval: number;
  repetitions: number;
  ease_factor: number;
  next_review: number;
  topic: string | null;
}
const toCard = (r: CardRow): Card => ({
  id: r.id,
  deckId: r.deck_id,
  deckTitle: r.deck_title,
  question: r.question,
  answer: r.answer,
  interval: r.interval,
  repetitions: r.repetitions,
  easeFactor: r.ease_factor,
  nextReview: r.next_review,
  topic: r.topic,
});

export interface DeckSummary {
  id: number;
  title: string;
  category: string;
  targetRole: string | null;
  source: 'seed' | 'interview' | 'custom';
  total: number;
  due: number;
}
export interface FlashcardStats {
  total: number;
  due: number;
  mastery: number; // 0..1
  reviewedToday: number;
}

/** Cards are "due today" until the end of the local day. */
export function endOfToday(now: Date = new Date()): number {
  const d = new Date(now);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}
const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

/* ---------------------------------------------------------------------- bootstrap */
export async function seedIfEmpty(): Promise<void> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM decks');
  if ((row?.n ?? 0) > 0) return;
  await db.withTransactionAsync(async () => {
    for (const deck of SEED_DECKS) {
      const res = await db.runAsync(
        'INSERT INTO decks (title, category, target_role, source) VALUES (?, ?, ?, ?)',
        [deck.title, deck.category, deck.targetRole, 'seed'],
      );
      for (const c of deck.cards) {
        await db.runAsync('INSERT OR IGNORE INTO cards (deck_id, question, answer) VALUES (?, ?, ?)', [
          res.lastInsertRowId,
          c.q,
          c.a,
        ]);
      }
    }
  });
}

/* -------------------------------------------------------------------------- reads */
export async function getDueCards(opts: { deckId?: number; limit?: number } = {}): Promise<Card[]> {
  const db = await getDb();
  const params: number[] = [endOfToday()];
  let sql = `SELECT c.*, d.title AS deck_title FROM cards c JOIN decks d ON d.id = c.deck_id WHERE c.next_review <= ?`;
  if (opts.deckId != null) {
    sql += ' AND c.deck_id = ?';
    params.push(opts.deckId);
  }
  sql += ' ORDER BY c.next_review ASC, c.id ASC LIMIT ?';
  params.push(opts.limit ?? 50);
  return (await db.getAllAsync<CardRow>(sql, params)).map(toCard);
}

export async function getDecks(): Promise<DeckSummary[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    id: number;
    title: string;
    category: string;
    target_role: string | null;
    source: DeckSummary['source'];
    total: number;
    due: number;
  }>(
    `SELECT d.id, d.title, d.category, d.target_role, d.source,
            COUNT(c.id) AS total,
            COALESCE(SUM(CASE WHEN c.next_review <= ? THEN 1 ELSE 0 END), 0) AS due
       FROM decks d LEFT JOIN cards c ON c.deck_id = d.id
      GROUP BY d.id
      ORDER BY (d.source = 'interview') DESC, d.title ASC`,
    [endOfToday()],
  );
  return rows.map((r) => ({ id: r.id, title: r.title, category: r.category, targetRole: r.target_role, source: r.source, total: r.total, due: r.due }));
}

/** Mastery = average of min(interval / 21 days, 1) across all cards. */
export async function getFlashcardStats(): Promise<FlashcardStats> {
  const db = await getDb();
  const s = await db.getFirstAsync<{ total: number; due: number; mastery: number }>(
    `SELECT COUNT(*) AS total,
            COALESCE(SUM(CASE WHEN next_review <= ? THEN 1 ELSE 0 END), 0) AS due,
            COALESCE(AVG(MIN(interval / 21.0, 1.0)), 0) AS mastery
       FROM cards`,
    [endOfToday()],
  );
  const r = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM reviews WHERE reviewed_at >= ?', [startOfToday()]);
  return { total: s?.total ?? 0, due: s?.due ?? 0, mastery: s?.mastery ?? 0, reviewedToday: r?.n ?? 0 };
}

export async function getStreak(): Promise<StreakInfo> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ d: string }>(
    `SELECT DISTINCT date(reviewed_at / 1000, 'unixepoch', 'localtime') AS d FROM reviews ORDER BY d DESC`,
  );
  return computeStreak(rows.map((r) => r.d));
}

/* ------------------------------------------------------------------------- writes */
/** Applies SM-2, updates the card and logs the review atomically. Works fully offline. */
export async function reviewCard(cardId: number, rating: Rating, now: number = Date.now()): Promise<Card> {
  const db = await getDb();
  const quality = RATING_TO_QUALITY[rating];
  let updated!: Card;
  await db.withTransactionAsync(async () => {
    const row = await db.getFirstAsync<CardRow>('SELECT * FROM cards WHERE id = ?', [cardId]);
    if (!row) throw new Error(`Card ${cardId} not found`);
    const next = calculateSM2({ interval: row.interval, repetitions: row.repetitions, easeFactor: row.ease_factor }, quality, now);
    await db.runAsync('UPDATE cards SET interval = ?, repetitions = ?, ease_factor = ?, next_review = ? WHERE id = ?', [
      next.interval,
      next.repetitions,
      next.easeFactor,
      next.nextReview,
      cardId,
    ]);
    await db.runAsync('INSERT INTO reviews (card_id, quality, reviewed_at) VALUES (?, ?, ?)', [cardId, quality, now]);
    updated = toCard({ ...row, ...{ interval: next.interval, repetitions: next.repetitions, ease_factor: next.easeFactor, next_review: next.nextReview } });
  });
  return updated;
}

/**
 * Interview -> flashcard sync. Finds (or creates) the "Interview Gaps: <role>" deck and inserts
 * AI-generated cards for weak topics. Duplicate questions are ignored. Returns number of NEW cards.
 */
export async function addInterviewGapCards(
  roleTitle: string,
  cards: { topic: string; question: string; answer: string }[],
): Promise<number> {
  if (cards.length === 0) return 0;
  const db = await getDb();
  const title = `Interview Gaps: ${roleTitle}`;
  let added = 0;
  await db.withTransactionAsync(async () => {
    const existing = await db.getFirstAsync<{ id: number }>("SELECT id FROM decks WHERE title = ? AND source = 'interview'", [title]);
    const deckId =
      existing?.id ??
      (await db.runAsync('INSERT INTO decks (title, category, target_role, source) VALUES (?, ?, ?, ?)', [title, 'Interview Gaps', roleTitle, 'interview'])).lastInsertRowId;
    for (const c of cards) {
      const res = await db.runAsync('INSERT OR IGNORE INTO cards (deck_id, question, answer, topic) VALUES (?, ?, ?, ?)', [deckId, c.question, c.answer, c.topic]);
      added += res.changes;
    }
  });
  return added;
}
