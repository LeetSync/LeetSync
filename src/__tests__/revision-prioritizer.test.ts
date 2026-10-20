import { RevisionPrioritizer } from '../services/revisionPrioritizer';
import { DSAPatternDetector } from '../services/dsaPatternDetector';
import { DEFAULT_SCORING_WEIGHTS, ProblemRecord, ScoringWeights } from '../types/Revision';

describe('RevisionPrioritizer', () => {
  const baseTimestamp = 1700000000000;
  const thirtyDaysLater = baseTimestamp + 30 * 24 * 60 * 60 * 1000;

  const sampleProblems: ProblemRecord[] = [
    {
      slug: 'fresh-solve',
      title: 'Fresh Solve',
      difficulty: 'Easy',
      topicTags: ['Array'],
      firstSolvedTimestamp: thirtyDaysLater, // Today
      lastSolvedTimestamp: thirtyDaysLater,
      attemptsCount: 1,
      failedAttemptsCount: 0,
      revisionCount: 0,
    },
    {
      slug: 'old-failed-rev',
      title: 'Old Failed Revision',
      difficulty: 'Medium',
      topicTags: ['Dynamic Programming'],
      firstSolvedTimestamp: baseTimestamp,
      lastSolvedTimestamp: baseTimestamp,
      lastRevisionTimestamp: baseTimestamp,
      lastRevisionOutcome: 'failed',
      attemptsCount: 3,
      failedAttemptsCount: 2,
      revisionCount: 1,
    },
    {
      slug: 'old-clean-solve',
      title: 'Old Clean Solve',
      difficulty: 'Easy',
      topicTags: ['Math'],
      firstSolvedTimestamp: baseTimestamp,
      lastSolvedTimestamp: baseTimestamp,
      lastRevisionTimestamp: thirtyDaysLater - 2 * 24 * 60 * 60 * 1000,
      lastRevisionOutcome: 'independent',
      attemptsCount: 1,
      failedAttemptsCount: 0,
      revisionCount: 2,
    },
  ];

  it('ranks problem with failed revision, weak topic, and elapsed time highest', () => {
    const topicPerformances = DSAPatternDetector.analyzeTopics(sampleProblems);
    const queue = RevisionPrioritizer.rankQueue(
      sampleProblems,
      topicPerformances,
      DEFAULT_SCORING_WEIGHTS,
      thirtyDaysLater
    );

    expect(queue.length).toBe(3);
    expect(queue[0].slug).toBe('old-failed-rev');
    expect(queue[0].priorityBand).toBe('Immediate');
    expect(queue[0].priorityScore).toBeGreaterThan(queue[1].priorityScore);
  });

  it('prevents duplicates when duplicate records are passed', () => {
    const duplicates = [
      ...sampleProblems,
      { ...sampleProblems[0] }, // Exact duplicate of fresh-solve
      { ...sampleProblems[1] }, // Exact duplicate of old-failed-rev
    ];

    const topicPerformances = DSAPatternDetector.analyzeTopics(duplicates);
    const queue = RevisionPrioritizer.rankQueue(
      duplicates,
      topicPerformances,
      DEFAULT_SCORING_WEIGHTS,
      thirtyDaysLater
    );

    const slugs = queue.map((p) => p.slug);
    const uniqueSlugs = Array.from(new Set(slugs));
    expect(slugs.length).toBe(uniqueSlugs.length);
    expect(queue.length).toBe(3);
  });

  it('honestly handles missing topic tags without applying arbitrary penalties', () => {
    const untaggedProblem: ProblemRecord = {
      slug: 'legacy-untagged',
      title: 'Legacy Untagged',
      difficulty: 'Medium',
      topicTags: [], // Missing / untagged
      firstSolvedTimestamp: baseTimestamp,
      lastSolvedTimestamp: baseTimestamp,
      attemptsCount: 1,
      failedAttemptsCount: 0,
      revisionCount: 0,
    };

    const queue = RevisionPrioritizer.rankQueue(
      [untaggedProblem],
      [],
      DEFAULT_SCORING_WEIGHTS,
      thirtyDaysLater
    );

    expect(queue.length).toBe(1);
    expect(queue[0].explanation.missingDataNotes).toContain(
      'Topic tags not yet synced; neutral topic weight applied.'
    );
    expect(queue[0].explanation.topicReason).toContain('neutral baseline applied without penalty');
  });

  it('adjusts priority scores when scoring weights are customized', () => {
    const topicPerformances = DSAPatternDetector.analyzeTopics(sampleProblems);

    // Weights prioritizing recency exclusively
    const recencyWeights: ScoringWeights = {
      weightTimeSinceSolve: 1.0,
      weightTopicWeakness: 0.0,
      weightFailedAttempts: 0.0,
      weightRevisionOutcome: 0.0,
    };

    const queue = RevisionPrioritizer.rankQueue(
      sampleProblems,
      topicPerformances,
      recencyWeights,
      thirtyDaysLater
    );

    // Fresh solve today should have lowest score
    const fresh = queue.find((p) => p.slug === 'fresh-solve');
    expect(fresh?.priorityScore).toBeLessThan(10);
  });
});
