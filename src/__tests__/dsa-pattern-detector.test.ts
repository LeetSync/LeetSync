import { DSAPatternDetector } from '../services/dsaPatternDetector';
import { ProblemRecord, RevisionLogEntry } from '../types/Revision';

describe('DSAPatternDetector', () => {
  const sampleProblems: Record<string, ProblemRecord> = {
    'two-sum': {
      slug: 'two-sum',
      title: 'Two Sum',
      difficulty: 'Easy',
      topicTags: ['Array', 'Hash Table'],
      firstSolvedTimestamp: 1700000000000,
      lastSolvedTimestamp: 1700000000000,
      attemptsCount: 1,
      failedAttemptsCount: 0,
      revisionCount: 1,
      lastRevisionOutcome: 'independent',
    },
    '3sum': {
      slug: '3sum',
      title: '3Sum',
      difficulty: 'Medium',
      topicTags: ['Array', 'Two Pointers'],
      firstSolvedTimestamp: 1700000000000,
      lastSolvedTimestamp: 1700000000000,
      attemptsCount: 4,
      failedAttemptsCount: 3,
      revisionCount: 2,
      lastRevisionOutcome: 'hints',
    },
    'coin-change': {
      slug: 'coin-change',
      title: 'Coin Change',
      difficulty: 'Medium',
      topicTags: ['Dynamic Programming'],
      firstSolvedTimestamp: 1700000000000,
      lastSolvedTimestamp: 1700000000000,
      attemptsCount: 3,
      failedAttemptsCount: 2,
      revisionCount: 1,
      lastRevisionOutcome: 'failed',
    },
    'single-number': {
      slug: 'single-number',
      title: 'Single Number',
      difficulty: 'Easy',
      topicTags: ['Bit Manipulation'],
      firstSolvedTimestamp: 1700000000000,
      lastSolvedTimestamp: 1700000000000,
      attemptsCount: 1,
      failedAttemptsCount: 0,
      revisionCount: 0,
    },
  };

  const sampleRevisions: RevisionLogEntry[] = [
    {
      id: 'rev1',
      problemSlug: 'two-sum',
      problemTitle: 'Two Sum',
      timestamp: 1700500000000,
      outcome: 'independent',
      difficulty: 'Easy',
      topicTags: ['Array', 'Hash Table'],
    },
    {
      id: 'rev2',
      problemSlug: '3sum',
      problemTitle: '3Sum',
      timestamp: 1700500000000,
      outcome: 'hints',
      difficulty: 'Medium',
      topicTags: ['Array', 'Two Pointers'],
    },
    {
      id: 'rev3',
      problemSlug: '3sum',
      problemTitle: '3Sum',
      timestamp: 1700600000000,
      outcome: 'hints',
      difficulty: 'Medium',
      topicTags: ['Array', 'Two Pointers'],
    },
    {
      id: 'rev4',
      problemSlug: 'coin-change',
      problemTitle: 'Coin Change',
      timestamp: 1700700000000,
      outcome: 'failed',
      difficulty: 'Medium',
      topicTags: ['Dynamic Programming'],
    },
  ];

  it('correctly aggregates metrics for verified topic tags', () => {
    const analysis = DSAPatternDetector.analyzeTopics(sampleProblems, sampleRevisions);
    const arrayTopic = analysis.find((t) => t.topic === 'Array');

    expect(arrayTopic).toBeDefined();
    expect(arrayTopic?.problemsSolved).toBe(2); // Two Sum + 3Sum
    expect(arrayTopic?.totalAttempts).toBe(5); // 1 + 4
    expect(arrayTopic?.failedAttempts).toBe(3); // 0 + 3
    expect(arrayTopic?.totalRevisions).toBe(3); // 1 indep + 2 hints
    expect(arrayTopic?.revisionsIndependent).toBe(1);
    expect(arrayTopic?.revisionsHints).toBe(2);
  });

  it('classifies topic with failed revisions as Weakness with explicit evidence', () => {
    const analysis = DSAPatternDetector.analyzeTopics(sampleProblems, sampleRevisions);
    const dpTopic = analysis.find((t) => t.topic === 'Dynamic Programming');

    expect(dpTopic).toBeDefined();
    expect(dpTopic?.classification).toBe('Weakness');
    expect(dpTopic?.evidenceSummary).toContain('revision(s) could not be solved');
    expect(dpTopic?.evidenceDetails.length).toBeGreaterThan(0);
  });

  it('identifies Insufficient data when only 1 problem is solved with 0 revisions and 0 failed attempts', () => {
    const analysis = DSAPatternDetector.analyzeTopics(sampleProblems, sampleRevisions);
    const bitTopic = analysis.find((t) => t.topic === 'Bit Manipulation');

    expect(bitTopic).toBeDefined();
    expect(bitTopic?.classification).toBe('Insufficient data');
    expect(bitTopic?.masteryScore).toBeNull();
    expect(bitTopic?.evidenceSummary).toContain('Insufficient data');
  });

  it('never infers weaknesses from difficulty or problem title alone', () => {
    // A Hard problem solved cleanly without failures should NOT be marked as a weakness
    const hardProblems: Record<string, ProblemRecord> = {
      'trapping-rain-water': {
        slug: 'trapping-rain-water',
        title: 'Trapping Rain Water',
        difficulty: 'Hard',
        topicTags: ['Stack'],
        firstSolvedTimestamp: 1700000000000,
        lastSolvedTimestamp: 1700000000000,
        attemptsCount: 1,
        failedAttemptsCount: 0,
        revisionCount: 2,
        lastRevisionOutcome: 'independent',
      },
      'largest-rectangle': {
        slug: 'largest-rectangle',
        title: 'Largest Rectangle in Histogram',
        difficulty: 'Hard',
        topicTags: ['Stack'],
        firstSolvedTimestamp: 1700000000000,
        lastSolvedTimestamp: 1700000000000,
        attemptsCount: 1,
        failedAttemptsCount: 0,
        revisionCount: 1,
        lastRevisionOutcome: 'independent',
      },
    };

    const hardRevisions: RevisionLogEntry[] = [
      {
        id: 'r1',
        problemSlug: 'trapping-rain-water',
        problemTitle: 'Trapping Rain Water',
        timestamp: 1700100000000,
        outcome: 'independent',
        difficulty: 'Hard',
        topicTags: ['Stack'],
      },
      {
        id: 'r2',
        problemSlug: 'trapping-rain-water',
        problemTitle: 'Trapping Rain Water',
        timestamp: 1700200000000,
        outcome: 'independent',
        difficulty: 'Hard',
        topicTags: ['Stack'],
      },
      {
        id: 'r3',
        problemSlug: 'largest-rectangle',
        problemTitle: 'Largest Rectangle in Histogram',
        timestamp: 1700300000000,
        outcome: 'independent',
        difficulty: 'Hard',
        topicTags: ['Stack'],
      },
    ];

    const analysis = DSAPatternDetector.analyzeTopics(hardProblems, hardRevisions);
    const stackTopic = analysis.find((t) => t.topic === 'Stack');

    expect(stackTopic).toBeDefined();
    // In spite of being 'Hard' problems, performance is flawless, so it MUST be Strength, never Weakness!
    expect(stackTopic?.classification).toBe('Strength');
    expect(stackTopic?.masteryScore).toBe(100);
  });
});
