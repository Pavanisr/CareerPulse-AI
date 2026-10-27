import { getFlashcardStats, getStreak, FlashcardStats } from '../flashcards/repository';
import { StreakInfo } from '../flashcards/streak';
import { getRecentInterviews, InterviewRecord } from '../interview/history';
import { computeReadiness } from './readiness';

export interface DashboardData {
  readiness: number;
  stats: FlashcardStats;
  streak: StreakInfo;
  recent: InterviewRecord[];
  weakTopics: { topic: string; count: number }[];
}

export async function loadDashboard(): Promise<DashboardData> {
  const [stats, streak, recent] = await Promise.all([getFlashcardStats(), getStreak(), getRecentInterviews(5)]);

  const counts = new Map<string, number>();
  recent.forEach((r) => r.weaknesses.forEach((w) => counts.set(w.topic, (counts.get(w.topic) ?? 0) + 1)));
  const weakTopics = [...counts.entries()]
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  return {
    readiness: computeReadiness(recent.map((r) => r.score), stats.mastery, stats.total),
    stats,
    streak,
    recent,
    weakTopics,
  };
}
