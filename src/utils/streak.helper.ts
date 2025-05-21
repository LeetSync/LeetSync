import titles from './streak_levels_messages.json';

export const getTotalNumberOfStreaks = (streak: { [date: string]: number }) => {
  const streakDates = Object.keys(streak)
    .filter((date) => streak[date] > 0)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  if (streakDates.length === 0) return 0;

  let streaks = 1;
  for (let i = 1; i < streakDates.length; i++) {
    const prev = new Date(streakDates[i - 1]);
    const curr = new Date(streakDates[i]);
    const diff = Math.round((prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 1) {
      streaks++;
    } else {
      break;
    }
  }
  return streaks;
};

export const formatProblemsPerDay = (
  problemsSolved: { timestamp: number }[],
): { [date: string]: number } => {
  const problemsPerDay: { [date: string]: number } = {};
  problemsSolved.forEach((problem) => {
    const date = new Date(problem.timestamp);
    const dateStr = date.toISOString().split('T')[0];
    problemsPerDay[dateStr] = (problemsPerDay[dateStr] || 0) + 1;
  });
  return problemsPerDay;
};

export const hasSolvedAProblemToday = (lastSolved: number): boolean => {
  if (!lastSolved || isNaN(lastSolved)) return false;
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const lastSolvedStr = new Date(lastSolved).toISOString().split('T')[0];
  return todayStr === lastSolvedStr;
};

export function generateTitle(dailyProblemsSolved: number): [string, string] {
  if (dailyProblemsSolved == null || isNaN(dailyProblemsSolved)) dailyProblemsSolved = 0;
  if (dailyProblemsSolved < 0) dailyProblemsSolved = 0;
  const entry = titles.find((t) => t.level === dailyProblemsSolved) || titles[titles.length - 1];
  return [entry.title, entry.message];
}
