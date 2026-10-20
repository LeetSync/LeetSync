import {
  AttemptLogEntry,
  PeriodComparison,
  ProblemRecord,
  RevisionLogEntry,
  WeeklyReport,
  WeekPeriodMetrics,
} from '../types/Revision';

export class ReportGenerator {
  /**
   * Generates a weekly performance report comparing the current 7-day period
   * against the preceding 7-day period using consistent local date boundaries.
   * Never fabricates historical activity or improvement claims.
   */
  static generateWeeklyReport(
    problems: Record<string, ProblemRecord> | ProblemRecord[],
    revisions: RevisionLogEntry[],
    attempts: AttemptLogEntry[] = [],
    now: number = Date.now()
  ): WeeklyReport {
    const problemsList: ProblemRecord[] = Array.isArray(problems)
      ? problems
      : Object.values(problems);

    // Calculate local midnight boundaries
    const nowDate = new Date(now);
    // End of today: 23:59:59.999
    const endOfCurrent = new Date(
      nowDate.getFullYear(),
      nowDate.getMonth(),
      nowDate.getDate(),
      23,
      59,
      59,
      999
    ).getTime();

    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const startOfCurrent = endOfCurrent - SEVEN_DAYS_MS + 1;

    const endOfPrevious = startOfCurrent - 1;
    const startOfPrevious = endOfPrevious - SEVEN_DAYS_MS + 1;

    const currentMetrics = this.aggregatePeriodMetrics(
      startOfCurrent,
      endOfCurrent,
      problemsList,
      revisions,
      attempts
    );

    const previousMetrics = this.aggregatePeriodMetrics(
      startOfPrevious,
      endOfPrevious,
      problemsList,
      revisions,
      attempts
    );

    const comparison = this.calculateComparison(currentMetrics, previousMetrics);

    return {
      currentWeek: currentMetrics,
      previousWeek: previousMetrics,
      comparison,
    };
  }

  private static formatLocalISODate(timestamp: number): string {
    const d = new Date(timestamp);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  private static aggregatePeriodMetrics(
    startTimestamp: number,
    endTimestamp: number,
    problems: ProblemRecord[],
    revisions: RevisionLogEntry[],
    attempts: AttemptLogEntry[]
  ): WeekPeriodMetrics {
    // Solved problems in period
    const solvedInPeriod = problems.filter(
      (p) =>
        p.lastSolvedTimestamp >= startTimestamp && p.lastSolvedTimestamp <= endTimestamp
    );

    const newProblemsSolved = problems.filter(
      (p) =>
        p.firstSolvedTimestamp >= startTimestamp && p.firstSolvedTimestamp <= endTimestamp
    ).length;

    // Revisions in period
    const revisionsInPeriod = revisions.filter(
      (r) => r.timestamp >= startTimestamp && r.timestamp <= endTimestamp
    );

    const outcomeBreakdown = {
      independent: 0,
      hints: 0,
      failed: 0,
    };

    let totalDurationSeconds = 0;
    let timedRevisionCount = 0;

    for (const r of revisionsInPeriod) {
      if (r.outcome === 'independent') outcomeBreakdown.independent++;
      else if (r.outcome === 'hints') outcomeBreakdown.hints++;
      else if (r.outcome === 'failed') outcomeBreakdown.failed++;

      if (typeof r.durationSeconds === 'number' && r.durationSeconds > 0) {
        totalDurationSeconds += r.durationSeconds;
        timedRevisionCount++;
      }
    }

    // Attempts in period
    const attemptsInPeriod = attempts.filter(
      (a) => a.timestamp >= startTimestamp && a.timestamp <= endTimestamp
    );

    let totalAttempts = attemptsInPeriod.length;
    let failedAttempts = attemptsInPeriod.filter((a) => !a.success).length;

    // If no granular attempt logs in range, count from solved problems in range
    if (totalAttempts === 0 && solvedInPeriod.length > 0) {
      for (const p of solvedInPeriod) {
        totalAttempts += p.attemptsCount || 1;
        failedAttempts += p.failedAttemptsCount || 0;
      }
    }

    // Topic breakdown
    const topicBreakdown: Record<string, { solved: number; revisions: number }> = {};
    for (const p of solvedInPeriod) {
      for (const tag of p.topicTags || []) {
        if (!topicBreakdown[tag]) topicBreakdown[tag] = { solved: 0, revisions: 0 };
        topicBreakdown[tag].solved++;
      }
    }
    for (const r of revisionsInPeriod) {
      for (const tag of r.topicTags || []) {
        if (!topicBreakdown[tag]) topicBreakdown[tag] = { solved: 0, revisions: 0 };
        topicBreakdown[tag].revisions++;
      }
    }

    return {
      startDate: this.formatLocalISODate(startTimestamp),
      endDate: this.formatLocalISODate(endTimestamp),
      startTimestamp,
      endTimestamp,
      problemsSolved: solvedInPeriod.length,
      newProblemsSolved,
      revisionsCompleted: revisionsInPeriod.length,
      totalAttempts,
      failedAttempts,
      outcomeBreakdown,
      topicBreakdown,
      timedRevisionCount,
      avgDurationSeconds:
        timedRevisionCount > 0
          ? Math.round(totalDurationSeconds / timedRevisionCount)
          : null,
    };
  }

  private static calculateComparison(
    current: WeekPeriodMetrics,
    previous: WeekPeriodMetrics
  ): PeriodComparison {
    const hasPreviousActivity =
      previous.problemsSolved > 0 ||
      previous.revisionsCompleted > 0 ||
      previous.totalAttempts > 0;

    if (!hasPreviousActivity) {
      return {
        hasSufficientHistoricalData: false,
        insufficientDataReason:
          'Insufficient historical activity in the previous 7-day period to compute comparative progress.',
      };
    }

    const solvedDelta = current.problemsSolved - previous.problemsSolved;
    const revisionDelta = current.revisionsCompleted - previous.revisionsCompleted;

    const failureRateCurrent =
      current.totalAttempts > 0
        ? Number(((current.failedAttempts / current.totalAttempts) * 100).toFixed(1))
        : null;

    const failureRatePrevious =
      previous.totalAttempts > 0
        ? Number(((previous.failedAttempts / previous.totalAttempts) * 100).toFixed(1))
        : null;

    const failureRateDelta =
      failureRateCurrent !== null && failureRatePrevious !== null
        ? Number((failureRateCurrent - failureRatePrevious).toFixed(1))
        : null;

    return {
      hasSufficientHistoricalData: true,
      solvedDelta,
      revisionDelta,
      failureRateCurrent,
      failureRatePrevious,
      failureRateDelta,
    };
  }
}
