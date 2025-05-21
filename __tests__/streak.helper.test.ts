import {
  getTotalNumberOfStreaks,
  formatProblemsPerDay,
  hasSolvedAProblemToday,
  generateTitle,
} from '../src/utils/streak.helper';

describe('Streak Helper Functions', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    const mockDate = new Date('2024-01-15T12:00:00Z');
    jest.setSystemTime(mockDate);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getTotalNumberOfStreaks', () => {
    it('should return 0 when no streak exists', () => {
      expect(getTotalNumberOfStreaks({})).toBe(0);
    });
    it('should return 1 when only today has submissions', () => {
      expect(getTotalNumberOfStreaks({ '2024-01-15': 1 })).toBe(1);
    });
    it('should calculate correct streak for consecutive days', () => {
      expect(getTotalNumberOfStreaks({ '2024-01-15': 1, '2024-01-14': 1, '2024-01-13': 1 })).toBe(
        3,
      );
    });
    it('should break streak when there is a gap', () => {
      expect(getTotalNumberOfStreaks({ '2024-01-15': 1, '2024-01-13': 1 })).toBe(1);
    });
    it('should handle streak with zero submissions', () => {
      expect(getTotalNumberOfStreaks({ '2024-01-15': 1, '2024-01-14': 0, '2024-01-13': 1 })).toBe(
        1,
      );
    });
    it('should handle unordered input', () => {
      expect(getTotalNumberOfStreaks({ '2024-01-13': 1, '2024-01-15': 1, '2024-01-14': 1 })).toBe(
        3,
      );
    });
    it('should handle single day streaks in the past', () => {
      expect(getTotalNumberOfStreaks({ '2024-01-10': 1 })).toBe(1);
    });
    it('should handle streaks with zeros at the start', () => {
      expect(
        getTotalNumberOfStreaks({
          '2024-01-15': 1,
          '2024-01-14': 1,
          '2024-01-13': 0,
          '2024-01-12': 1,
        }),
      ).toBe(2);
    });
    it('should handle all zero streaks', () => {
      expect(getTotalNumberOfStreaks({ '2024-01-15': 0, '2024-01-14': 0 })).toBe(0);
    });
    it('should handle non-consecutive streaks', () => {
      expect(getTotalNumberOfStreaks({ '2024-01-15': 1, '2024-01-12': 1, '2024-01-10': 1 })).toBe(
        1,
      );
    });
  });

  describe('formatProblemsPerDay', () => {
    it('should format problems correctly for a single day', () => {
      const problems = [
        { timestamp: new Date('2024-01-15T10:00:00Z').getTime() },
        { timestamp: new Date('2024-01-15T14:00:00Z').getTime() },
      ];
      const result = formatProblemsPerDay(problems);
      expect(result['2024-01-15']).toBe(2);
    });
    it('should handle multiple days correctly', () => {
      const problems = [
        { timestamp: new Date('2024-01-15T10:00:00Z').getTime() },
        { timestamp: new Date('2024-01-15T14:00:00Z').getTime() },
        { timestamp: new Date('2024-01-14T10:00:00Z').getTime() },
      ];
      const result = formatProblemsPerDay(problems);
      expect(result['2024-01-15']).toBe(2);
      expect(result['2024-01-14']).toBe(1);
    });
    it('should handle empty array', () => {
      expect(formatProblemsPerDay([])).toEqual({});
    });
    it('should handle problems with same timestamp', () => {
      const timestamp = new Date('2024-01-15T10:00:00Z').getTime();
      const problems = [{ timestamp }, { timestamp }];
      const result = formatProblemsPerDay(problems);
      expect(result['2024-01-15']).toBe(2);
    });
    it('should ignore negative timestamps', () => {
      const problems = [{ timestamp: -1 }];
      const result = formatProblemsPerDay(problems);
      // Negative timestamp is 1969-12-31 in UTC
      expect(result['1969-12-31']).toBe(1);
    });
    it('should handle far future dates', () => {
      const problems = [{ timestamp: new Date('2099-12-31T23:59:59Z').getTime() }];
      const result = formatProblemsPerDay(problems);
      expect(result['2099-12-31']).toBe(1);
    });
    it('should handle non-integer timestamps', () => {
      const problems = [{ timestamp: 1705291200000.9 }];
      const result = formatProblemsPerDay(problems);
      expect(result['2024-01-15']).toBe(1);
    });
  });

  describe('hasSolvedAProblemToday', () => {
    it('should return true when last solved is today', () => {
      expect(hasSolvedAProblemToday(new Date('2024-01-15T12:00:00Z').getTime())).toBe(true);
    });
    it('should return false when last solved is not today', () => {
      expect(hasSolvedAProblemToday(new Date('2024-01-14T12:00:00Z').getTime())).toBe(false);
    });
    it('should handle invalid input', () => {
      expect(hasSolvedAProblemToday(NaN)).toBe(false);
      expect(hasSolvedAProblemToday(0)).toBe(false);
    });
    it('should handle edge case at midnight', () => {
      expect(hasSolvedAProblemToday(new Date('2024-01-15T00:00:00Z').getTime())).toBe(true);
    });
    it('should handle timestamps at the end of the day', () => {
      expect(hasSolvedAProblemToday(new Date('2024-01-15T23:59:59Z').getTime())).toBe(true);
    });
    it('should handle timestamps in different timezones', () => {
      // Simulate a timestamp for 2024-01-15 in UTC+8
      const timestamp = Date.UTC(2024, 0, 15, 8, 0, 0);
      expect(hasSolvedAProblemToday(timestamp)).toBe(true);
    });
    it('should return false for string input', () => {
      expect(hasSolvedAProblemToday('2024-01-15' as unknown as number)).toBe(false);
    });
    it('should return false for null/undefined', () => {
      expect(hasSolvedAProblemToday(null as unknown as number)).toBe(false);
      expect(hasSolvedAProblemToday(undefined as unknown as number)).toBe(false);
    });
  });

  describe('generateTitle', () => {
    it('should return correct title and message for each level', () => {
      const testCases = [
        { input: 0, expectedTitle: 'Beginner' },
        { input: 1, expectedTitle: 'Novice' },
        { input: 2, expectedTitle: 'Rookie' },
        { input: 3, expectedTitle: 'Intermediate' },
        { input: 4, expectedTitle: 'Skilled' },
        { input: 5, expectedTitle: 'Proficient' },
        { input: 6, expectedTitle: 'Expert' },
        { input: 7, expectedTitle: 'Master' },
        { input: 8, expectedTitle: 'Grandmaster' },
        { input: 9, expectedTitle: 'Legend' },
        { input: 10, expectedTitle: 'Mythic' },
        { input: 11, expectedTitle: 'Immortal' },
        { input: 12, expectedTitle: 'Titan' },
        { input: 13, expectedTitle: 'Deity' },
        { input: 14, expectedTitle: 'Celestial' },
        { input: 15, expectedTitle: 'Cosmic' },
      ];
      testCases.forEach(({ input, expectedTitle }) => {
        const [title, message] = generateTitle(input);
        expect(title).toBe(expectedTitle);
        expect(typeof message).toBe('string');
        expect(message.length).toBeGreaterThan(0);
      });
    });
    it('should handle negative input', () => {
      const [title, message] = generateTitle(-1);
      expect(title).toBe('Beginner');
      expect(typeof message).toBe('string');
      expect(message.length).toBeGreaterThan(0);
    });
    it('should handle very large input', () => {
      const [title, message] = generateTitle(1000);
      expect(title).toBe('Cosmic');
      expect(typeof message).toBe('string');
      expect(message.length).toBeGreaterThan(0);
    });
    it('should handle undefined/null/NaN', () => {
      const [title1] = generateTitle(undefined as unknown as number);
      const [title2] = generateTitle(null as unknown as number);
      const [title3] = generateTitle(NaN);
      expect(title1).toBe('Beginner');
      expect(title2).toBe('Beginner');
      expect(title3).toBe('Beginner');
    });
    it('should handle boundary values', () => {
      const [title0] = generateTitle(0);
      const [title1] = generateTitle(1);
      const [title6] = generateTitle(6);
      const [title7] = generateTitle(7);
      expect(title0).toBe('Beginner');
      expect(title1).toBe('Novice');
      expect(title6).toBe('Expert');
      expect(title7).toBe('Master');
    });
  });
});
