import {
  DEFAULT_SCORING_WEIGHTS,
  PriorityBand,
  PriorityExplanation,
  ProblemRecord,
  RankedProblem,
  ScoringWeights,
  TopicPerformance,
} from '../types/Revision';
import { DSAPatternDetector } from './dsaPatternDetector';

export class RevisionPrioritizer {
  /**
   * Computes priority scores for all solved problems and returns a dynamically
   * ranked queue with full transparent explanations and duplicate prevention.
   */
  static rankQueue(
    problems: Record<string, ProblemRecord> | ProblemRecord[],
    topicPerformances: TopicPerformance[],
    weights: ScoringWeights = DEFAULT_SCORING_WEIGHTS,
    now: number = Date.now()
  ): RankedProblem[] {
    const problemsList: ProblemRecord[] = Array.isArray(problems)
      ? problems
      : Object.values(problems);

    // Topic weakness map
    const weaknessMap = DSAPatternDetector.getTopicWeaknessMap(topicPerformances);

    // Normalize weights to ensure sum = 1
    const rawSum =
      weights.weightTimeSinceSolve +
      weights.weightTopicWeakness +
      weights.weightFailedAttempts +
      weights.weightRevisionOutcome;

    const normalizedWeights: ScoringWeights =
      rawSum > 0
        ? {
            weightTimeSinceSolve: weights.weightTimeSinceSolve / rawSum,
            weightTopicWeakness: weights.weightTopicWeakness / rawSum,
            weightFailedAttempts: weights.weightFailedAttempts / rawSum,
            weightRevisionOutcome: weights.weightRevisionOutcome / rawSum,
          }
        : { ...DEFAULT_SCORING_WEIGHTS };

    // Deduplicate problems by slug
    const uniqueProblemsMap = new Map<string, ProblemRecord>();
    for (const p of problemsList) {
      if (p.slug) {
        uniqueProblemsMap.set(p.slug, p);
      }
    }

    const ranked: RankedProblem[] = [];

    for (const problem of Array.from(uniqueProblemsMap.values())) {
      const lastInteraction =
        problem.lastRevisionTimestamp || problem.lastSolvedTimestamp || now;
      const daysSinceLastInteraction = Math.max(
        0,
        Math.floor((now - lastInteraction) / (1000 * 60 * 60 * 24))
      );

      const missingDataNotes: string[] = [];

      // 1. Recency Factor (0 - 100)
      // Memory decay curve: 0-1 day low priority, reaching max at ~28 days
      let recencyRatio = Math.min(1, daysSinceLastInteraction / 28);
      // Give small bump after 7 days
      if (daysSinceLastInteraction >= 7) {
        recencyRatio = Math.min(1, 0.4 + (daysSinceLastInteraction - 7) / 21 * 0.6);
      } else {
        recencyRatio = (daysSinceLastInteraction / 7) * 0.4;
      }
      const recencyScore = Number((recencyRatio * 100).toFixed(1));
      const recencyReason =
        daysSinceLastInteraction === 0
          ? 'Interacted with today (fresh in memory).'
          : `${daysSinceLastInteraction} day${daysSinceLastInteraction === 1 ? '' : 's'} since last solve/revision.`;

      // 2. Revision Outcome Factor (0 - 100)
      let outcomeScore = 50; // Default neutral if never revised
      let outcomeReason = 'Never revised yet; initial reinforcement pending.';
      if (problem.lastRevisionOutcome) {
        if (problem.lastRevisionOutcome === 'failed') {
          outcomeScore = 100;
          outcomeReason = 'Last revision failed (could not solve independently). Needs immediate follow-up.';
        } else if (problem.lastRevisionOutcome === 'hints') {
          outcomeScore = 70;
          outcomeReason = 'Last revision required hints/assistance to complete.';
        } else if (problem.lastRevisionOutcome === 'independent') {
          outcomeScore = 15;
          outcomeReason = 'Last revision solved independently without hints.';
        }
      } else {
        missingDataNotes.push('No revision history recorded for this problem yet.');
      }

      // 3. Topic Weakness Factor (0 - 100)
      let topicScore = 40; // Neutral baseline
      let topicReason = '';
      if (problem.topicTags && problem.topicTags.length > 0) {
        let maxWeakness = 0;
        let weakTag = '';
        for (const tag of problem.topicTags) {
          const w = weaknessMap[tag] ?? 0.45;
          if (w > maxWeakness) {
            maxWeakness = w;
            weakTag = tag;
          }
        }
        topicScore = Number((maxWeakness * 100).toFixed(1));
        const matchedPerformance = topicPerformances.find((t) => t.topic === weakTag);
        if (matchedPerformance?.classification === 'Weakness') {
          topicReason = `Associated with verified weak topic "${weakTag}" (${matchedPerformance.masteryScore ?? 'low'}% mastery).`;
        } else if (matchedPerformance?.classification === 'Strength') {
          topicReason = `Associated with strong topic "${weakTag}" (${matchedPerformance.masteryScore}% mastery). Lower urgency.`;
        } else {
          topicReason = `Associated with topic "${weakTag}" (classification: ${matchedPerformance?.classification || 'Developing'}).`;
        }
      } else {
        missingDataNotes.push('Topic tags not yet synced; neutral topic weight applied.');
        topicReason = 'Topic tags unverified; neutral baseline applied without penalty.';
      }

      // 4. Failed Attempts Factor (0 - 100)
      const failedCount = problem.failedAttemptsCount || 0;
      const attemptsRatio = Math.min(1, failedCount / 3);
      const attemptsScore = Number((attemptsRatio * 100).toFixed(1));
      const attemptsReason =
        failedCount > 0
          ? `${failedCount} failed submission attempt${failedCount === 1 ? '' : 's'} recorded.`
          : 'Solved on first submission with 0 recorded failures.';

      // Contributions
      const recencyContribution = Number(
        (recencyScore * normalizedWeights.weightTimeSinceSolve).toFixed(1)
      );
      const outcomeContribution = Number(
        (outcomeScore * normalizedWeights.weightRevisionOutcome).toFixed(1)
      );
      const topicContribution = Number(
        (topicScore * normalizedWeights.weightTopicWeakness).toFixed(1)
      );
      const attemptsContribution = Number(
        (attemptsScore * normalizedWeights.weightFailedAttempts).toFixed(1)
      );

      const totalScore = Math.min(
        100,
        Math.max(
          0,
          Math.round(
            recencyContribution + outcomeContribution + topicContribution + attemptsContribution
          )
        )
      );

      let priorityBand: PriorityBand = 'Low';
      if (totalScore >= 75) {
        priorityBand = 'Immediate';
      } else if (totalScore >= 55) {
        priorityBand = 'High';
      } else if (totalScore >= 35) {
        priorityBand = 'Medium';
      }

      // Recommended next revision date based on priority
      let intervalDays = 14;
      if (priorityBand === 'Immediate') intervalDays = 1;
      else if (priorityBand === 'High') intervalDays = 3;
      else if (priorityBand === 'Medium') intervalDays = 7;
      else intervalDays = 21;

      const nextRecommendedDate = lastInteraction + intervalDays * 24 * 60 * 60 * 1000;

      const explanation: PriorityExplanation = {
        recencyScore,
        recencyContribution,
        recencyDays: daysSinceLastInteraction,
        recencyReason,
        outcomeScore,
        outcomeContribution,
        outcomeReason,
        topicScore,
        topicContribution,
        topicReason,
        attemptsScore,
        attemptsContribution,
        attemptsReason,
        activeWeights: normalizedWeights,
        missingDataNotes,
      };

      ranked.push({
        ...problem,
        priorityScore: totalScore,
        priorityBand,
        explanation,
        daysSinceLastInteraction,
        nextRecommendedDate,
      });
    }

    // Sort descending by priority score; tiebreak by daysSinceLastInteraction descending
    return ranked.sort((a, b) => {
      if (b.priorityScore !== a.priorityScore) {
        return b.priorityScore - a.priorityScore;
      }
      return b.daysSinceLastInteraction - a.daysSinceLastInteraction;
    });
  }
}
