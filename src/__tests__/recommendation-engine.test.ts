import { RecommendationEngine } from '../services/recommendationEngine';
import { ProblemRecord, TopicPerformance } from '../types/Revision';

describe('RecommendationEngine', () => {
  const problems: Record<string, ProblemRecord> = {
    'target-problem': {
      slug: 'target-problem',
      title: 'Target Problem',
      difficulty: 'Medium',
      topicTags: ['Binary Search', 'Array'],
      firstSolvedTimestamp: 1700000000000,
      lastSolvedTimestamp: 1700000000000,
      attemptsCount: 1,
      failedAttemptsCount: 0,
      revisionCount: 0,
    },
    'similar-bs': {
      slug: 'similar-bs',
      title: 'Similar Binary Search',
      difficulty: 'Medium',
      topicTags: ['Binary Search', 'Array'],
      firstSolvedTimestamp: 1700000000000,
      lastSolvedTimestamp: 1700000000000,
      attemptsCount: 2,
      failedAttemptsCount: 1,
      revisionCount: 1,
      lastRevisionOutcome: 'hints',
    },
    'unrelated-dp': {
      slug: 'unrelated-dp',
      title: 'Unrelated DP',
      difficulty: 'Hard',
      topicTags: ['Dynamic Programming'],
      firstSolvedTimestamp: 1700000000000,
      lastSolvedTimestamp: 1700000000000,
      attemptsCount: 1,
      failedAttemptsCount: 0,
      revisionCount: 0,
    },
  };

  const topicPerformances: TopicPerformance[] = [
    {
      topic: 'Binary Search',
      problemsSolved: 2,
      totalAttempts: 3,
      failedAttempts: 1,
      attemptSuccessRate: 66.7,
      totalRevisions: 1,
      revisionsIndependent: 0,
      revisionsHints: 1,
      revisionsFailed: 0,
      revisionSuccessRate: 40,
      masteryScore: 45,
      classification: 'Weakness',
      evidenceSummary: 'Identified as a Weakness',
      evidenceDetails: [],
    },
  ];

  it('recommends similar problem sharing verified tags and excludes target problem', () => {
    const recs = RecommendationEngine.getSimilarProblems(
      problems['target-problem'],
      problems,
      topicPerformances
    );

    expect(recs.length).toBe(1);
    expect(recs[0].problem.slug).toBe('similar-bs');
    expect(recs[0].sharedTags).toEqual(['Binary Search', 'Array']);
    expect(recs[0].relevanceTag).toBe('Weak Topic Reinforcement');
    expect(recs[0].reason).toContain('Target Problem');
  });

  it('does not recommend problems when tags do not overlap', () => {
    const recs = RecommendationEngine.getSimilarProblems(
      problems['unrelated-dp'],
      problems,
      topicPerformances
    );

    expect(recs.length).toBe(0);
  });
});
