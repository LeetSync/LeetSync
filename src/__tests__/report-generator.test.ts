import { ReportGenerator } from '../services/reportGenerator';
import { AttemptLogEntry, ProblemRecord, RevisionLogEntry } from '../types/Revision';

describe('ReportGenerator', () => {
  const now = new Date(2026, 9, 20, 14, 0, 0).getTime(); // Oct 20, 2026
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;

  const currentWeekProblem: ProblemRecord = {
    slug: 'two-sum',
    title: 'Two Sum',
    difficulty: 'Easy',
    topicTags: ['Array'],
    firstSolvedTimestamp: now - 2 * ONE_DAY_MS,
    lastSolvedTimestamp: now - 2 * ONE_DAY_MS,
    attemptsCount: 1,
    failedAttemptsCount: 0,
    revisionCount: 1,
  };

  const currentWeekRevision: RevisionLogEntry = {
    id: 'rev1',
    problemSlug: 'two-sum',
    problemTitle: 'Two Sum',
    timestamp: now - 1 * ONE_DAY_MS,
    outcome: 'independent',
    durationSeconds: 420, // 7 minutes
    difficulty: 'Easy',
    topicTags: ['Array'],
  };

  const previousWeekProblem: ProblemRecord = {
    slug: '3sum',
    title: '3Sum',
    difficulty: 'Medium',
    topicTags: ['Array'],
    firstSolvedTimestamp: now - 10 * ONE_DAY_MS,
    lastSolvedTimestamp: now - 10 * ONE_DAY_MS,
    attemptsCount: 2,
    failedAttemptsCount: 1,
    revisionCount: 1,
  };

  const previousWeekRevision: RevisionLogEntry = {
    id: 'rev2',
    problemSlug: '3sum',
    problemTitle: '3Sum',
    timestamp: now - 9 * ONE_DAY_MS,
    outcome: 'hints',
    durationSeconds: 900, // 15 minutes
    difficulty: 'Medium',
    topicTags: ['Array'],
  };

  it('aggregates metrics in current week using local date boundaries', () => {
    const report = ReportGenerator.generateWeeklyReport(
      [currentWeekProblem, previousWeekProblem],
      [currentWeekRevision, previousWeekRevision],
      [],
      now
    );

    expect(report.currentWeek.problemsSolved).toBe(1);
    expect(report.currentWeek.revisionsCompleted).toBe(1);
    expect(report.currentWeek.outcomeBreakdown.independent).toBe(1);
    expect(report.currentWeek.outcomeBreakdown.hints).toBe(0);
    expect(report.currentWeek.avgDurationSeconds).toBe(420);
    expect(report.currentWeek.topicBreakdown['Array'].solved).toBe(1);
  });

  it('correctly compares current week with previous week when data exists', () => {
    const report = ReportGenerator.generateWeeklyReport(
      [currentWeekProblem, previousWeekProblem],
      [currentWeekRevision, previousWeekRevision],
      [],
      now
    );

    expect(report.comparison.hasSufficientHistoricalData).toBe(true);
    expect(report.comparison.solvedDelta).toBe(0); // 1 - 1 = 0
    expect(report.comparison.revisionDelta).toBe(0); // 1 - 1 = 0
  });

  it('honestly reports insufficient historical data when previous period is empty', () => {
    // Only current week data, no previous week data
    const report = ReportGenerator.generateWeeklyReport(
      [currentWeekProblem],
      [currentWeekRevision],
      [],
      now
    );

    expect(report.comparison.hasSufficientHistoricalData).toBe(false);
    expect(report.comparison.insufficientDataReason).toContain(
      'Insufficient historical activity in the previous 7-day period'
    );
    expect(report.comparison.solvedDelta).toBeUndefined();
  });
});
