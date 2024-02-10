import { getTotalNumberOfStreaks } from './streak.helper';
import { formatProblemsPerDay } from './streak.helper';

const getDaysBefore = (numberOfDays: number) => {
  return new Date(new Date().getTime() - numberOfDays * 24 * 60 * 60 * 1000);
};

describe('getTotalNumberOfStreaks', () => {
  it('should return 0 if the user has not solved a problem yesterday or today', () => {
    const streak = {};
    const totalStreaks = getTotalNumberOfStreaks(streak);
    expect(totalStreaks).toBe(0);
  });

  it('should return 1 if the user has solved a problem today but not yesterday', () => {
    const streak = {
      [new Date().toLocaleDateString()]: 1,
    };
    const totalStreaks = getTotalNumberOfStreaks(streak);
    expect(totalStreaks).toBe(1);
  });
  it('should return 1 if the user has solved a problem today but not yesterday', () => {
    const streak = {
      [getDaysBefore(1).toLocaleDateString()]: 1,
    };
    const totalStreaks = getTotalNumberOfStreaks(streak);
    expect(totalStreaks).toBe(1);
  });
  it('should return 0 if the user has solved a problem today but not yesterday', () => {
    const streak = {
      [getDaysBefore(2).toLocaleDateString()]: 1,
    };
    const totalStreaks = getTotalNumberOfStreaks(streak);
    expect(totalStreaks).toBe(0);
  });

  it('should return the correct number of streaks if there are consecutive days with solved problems', () => {
    const streak = {
      [getDaysBefore(0).toLocaleDateString()]: 1,
      [getDaysBefore(1).toLocaleDateString()]: 1,
      [getDaysBefore(2).toLocaleDateString()]: 1,
      [getDaysBefore(3).toLocaleDateString()]: 1,
    };
    const totalStreaks = getTotalNumberOfStreaks(streak);
    expect(totalStreaks).toBe(4);
  });

  it('should return the correct number of streaks if there is a break in the streak', () => {
    const streak = {
      [getDaysBefore(0).toLocaleDateString()]: 1,
      [getDaysBefore(1).toLocaleDateString()]: 1,
      [getDaysBefore(2).toLocaleDateString()]: 0, // GAB
      [getDaysBefore(3).toLocaleDateString()]: 1,
    };

    const totalStreaks = getTotalNumberOfStreaks(streak);
    expect(totalStreaks).toBe(2);
  });
  it("should return 2 as there's a gap in day 2", () => {
    const streak = {
      [getDaysBefore(0).toLocaleDateString()]: 1,
      [getDaysBefore(1).toLocaleDateString()]: 1,
      [getDaysBefore(3).toLocaleDateString()]: 1, // GAB
    };

    const totalStreaks = getTotalNumberOfStreaks(streak);
    expect(totalStreaks).toBe(2);
  });
  it("should return the correct number of streaks if I didn't solve a problem today", () => {
    const streak = {
      [getDaysBefore(1).toLocaleDateString()]: 1,
      [getDaysBefore(2).toLocaleDateString()]: 1,
      [getDaysBefore(3).toLocaleDateString()]: 1,
    };

    const totalStreaks = getTotalNumberOfStreaks(streak);
    expect(totalStreaks).toBe(3);
  });
  it("should return the correct number of streaks if I didn't solve a problem today", () => {
    const streak = {
      [getDaysBefore(2).toLocaleDateString()]: 1,
      [getDaysBefore(3).toLocaleDateString()]: 1,
      [getDaysBefore(6).toLocaleDateString()]: 1,
    };

    const totalStreaks = getTotalNumberOfStreaks(streak);
    expect(totalStreaks).toBe(0);
  });
  it("should return the correct number of streaks if I didn't solve a problem today", () => {
    const streak = {
      [getDaysBefore(0).toLocaleDateString()]: 1,
      [getDaysBefore(1).toLocaleDateString()]: 1,
      [getDaysBefore(2).toLocaleDateString()]: 1,
      [getDaysBefore(4).toLocaleDateString()]: 1,
    };

    const totalStreaks = getTotalNumberOfStreaks(streak);
    expect(totalStreaks).toBe(3);
  });
  it("should return the correct number of streaks if I didn't solve a problem today", () => {
    const streak = {
      [getDaysBefore(1).toLocaleDateString()]: 1,
      [getDaysBefore(2).toLocaleDateString()]: 1,
      [getDaysBefore(4).toLocaleDateString()]: 1,
    };

    const totalStreaks = getTotalNumberOfStreaks(streak);
    expect(totalStreaks).toBe(2);
  });
  it("should return the correct number of streaks if I didn't solve a problem today", () => {
    const streak = {
      [getDaysBefore(1).toLocaleDateString()]: 1,
      [getDaysBefore(2).toLocaleDateString()]: 1,
      [getDaysBefore(3).toLocaleDateString()]: 1,
    };

    const totalStreaks = getTotalNumberOfStreaks(streak);
    expect(totalStreaks).toBe(3);
  });
});
describe('formatProblemsPerDay', () => {
  it('should return an empty object if no problems are solved', () => {
    const problemsSolved: any[] = [];
    const problemsPerDay = formatProblemsPerDay(problemsSolved);
    expect(problemsPerDay).toEqual({});
  });

  it('should return the correct number of problems per day', () => {
    const problemsSolved = [
      { timestamp: new Date('2022-01-01').getTime() },
      { timestamp: new Date('2022-01-01').getTime() },
      { timestamp: new Date('2022-01-02').getTime() },
      { timestamp: new Date('2022-01-03').getTime() },
      { timestamp: new Date('2022-01-03').getTime() },
    ];
    const problemsPerDay = formatProblemsPerDay(problemsSolved);
    expect(problemsPerDay).toEqual({
      '1/1/2022': 2,
      '1/2/2022': 1,
      '1/3/2022': 2,
    });
  });
});
