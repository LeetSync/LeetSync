export const getTotalNumberOfStreaks = (streak: { [date: string]: number }) => {
  const today = new Date().toLocaleDateString();
  const yesterday = new Date();

  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayString = yesterday.toLocaleDateString();

  if (!streak[yesterdayString]) {
    //check if the user has solved a problem today and if so, return 1
    return streak[today] ? 1 : 0;
  }

  const streakDays = Object.keys(streak).sort((a, b) => {
    return new Date(b).getTime() - new Date(a).getTime();
  });

  //aggregate the number of streaks the user has each day until a break in the streak is found
  let streaks = 1;
  //iterate through the streak array until we find a break in the streak, (like one day where the user didn't solve a problem)
  for (let i = 1; i < streakDays.length; i++) {
    if (streak[streakDays[i]] <= 0) {
      break;
    }

    const prevStreakDate = new Date(streakDays[i - 1]);
    const currentStreakDate = new Date(streakDays[i]);

    const isDifferenceGreaterThanOneDay = Math.abs(currentStreakDate.getDate() - prevStreakDate.getDate()) > 1;
    //if the difference between the current streak and the previous streak is greater than 1 day, then we know that there was a break in the streak
    if (isDifferenceGreaterThanOneDay) {
      break;
    }
    streaks++;
  }
  return streaks;
};

export const formatProblemsPerDay = (problemsSolved: any): { [date: string]: number } => {
  const problemsPerDay: any = {};
  problemsSolved.forEach((problem: any) => {
    const date = new Date(problem).toLocaleDateString();
    if (!problemsPerDay[date]) {
      problemsPerDay[date] = 0;
    }
    problemsPerDay[date] += 1;
  });
  return problemsPerDay as { [date: string]: number };
};
export const hasSolvedAProblemToday = (lastSolved: number) => {
  return new Date().toLocaleDateString() === new Date(lastSolved).toLocaleDateString();
};

export function generateTitle(dailyProblemsSolved: number): [string, string] {
  let title: string;
  let message: string;

  switch (dailyProblemsSolved) {
    case 0:
      title = 'Beginner';
      message = 'Start solving problems to improve your skills and climb the ranks!';
      break;
    case 1:
      title = 'Novice';
      message = 'This is just the beginning for something great!';
      break;
    case 2:
      title = 'Rookie';
      message = "You're making progress!";
      break;
    case 3:
      title = 'Intermediate';
      message = "You're doing a fantastic job!, Keep solving problems to become a LeetCode expert!";
      break;
    case 4:
      title = 'Skilled';
      message = "Impressive work! You're well on your way to becoming a LeetCode pro!";
      break;
    case 5:
      title = 'Proficient';
      message = "You're a LeetCode pro! Keep up the amazing work!";
      break;
    case 6:
      title = 'Expert';
      message = "Amazing job! You're a LeetCode expert now. Keep solving problems to inspire others!";
      break;
    default:
      title = 'Master';
      message = "You're a LeetCode master! Keep solving problems to maintain your skills and challenge yourself!";
      break;
  }

  return [title, message];
}
