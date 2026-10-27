import { seedIfEmpty } from '../modules/flashcards/repository';
import { getDb } from '../shared/db/database';

/** Opens/migrates SQLite and seeds starter decks on first launch. No network needed. */
export async function bootstrap(): Promise<void> {
  await getDb();
  await seedIfEmpty();
}
