import { RevisionStorageService, formatSlugToTitle } from '../services/revisionStorage';

describe('RevisionStorageService', () => {
  beforeEach(() => {
    RevisionStorageService.clearMemoryStorageForTests();
  });

  it('formats slug into title properly', () => {
    expect(formatSlugToTitle('two-sum')).toBe('Two Sum');
    expect(formatSlugToTitle('longest-substring-without-repeating-characters')).toBe(
      'Longest Substring Without Repeating Characters'
    );
  });

  it('initializes default storage data when empty', async () => {
    const service = RevisionStorageService.getInstance();
    const data = await service.loadData();

    expect(data.version).toBe(1);
    expect(data.problems).toEqual({});
    expect(data.revisions).toEqual([]);
    expect(data.attempts).toEqual([]);
    expect(data.settings.weights).toBeDefined();
  });

  it('records a live problem solve and logs attempt', async () => {
    const service = RevisionStorageService.getInstance();
    await service.recordSolve({
      slug: 'merge-k-sorted-lists',
      title: 'Merge k Sorted Lists',
      frontendQuestionId: '23',
      difficulty: 'Hard',
      topicTags: ['Linked List', 'Divide and Conquer', 'Heap (Priority Queue)'],
      isSuccess: true,
      runtimePercentile: 85.5,
      memoryPercentile: 72.1,
    });

    const data = await service.loadData();
    const problem = data.problems['merge-k-sorted-lists'];

    expect(problem).toBeDefined();
    expect(problem.title).toBe('Merge k Sorted Lists');
    expect(problem.difficulty).toBe('Hard');
    expect(problem.frontendQuestionId).toBe('23');
    expect(problem.topicTags).toContain('Heap (Priority Queue)');
    expect(problem.attemptsCount).toBe(1);
    expect(problem.failedAttemptsCount).toBe(0);
    expect(problem.runtimePercentile).toBe(85.5);
    expect(data.attempts.length).toBe(1);
    expect(data.attempts[0].success).toBe(true);
  });

  it('tracks failed submission attempts and updates attempt count', async () => {
    const service = RevisionStorageService.getInstance();
    // Failed attempt 1
    await service.recordSolve({
      slug: 'lru-cache',
      title: 'LRU Cache',
      difficulty: 'Medium',
      topicTags: ['Hash Table', 'Linked List'],
      isSuccess: false,
    });

    // Failed attempt 2
    await service.recordSolve({
      slug: 'lru-cache',
      title: 'LRU Cache',
      difficulty: 'Medium',
      topicTags: ['Hash Table', 'Linked List'],
      isSuccess: false,
    });

    // Successful attempt 3
    await service.recordSolve({
      slug: 'lru-cache',
      title: 'LRU Cache',
      difficulty: 'Medium',
      topicTags: ['Hash Table', 'Linked List'],
      isSuccess: true,
    });

    const data = await service.loadData();
    const problem = data.problems['lru-cache'];

    expect(problem.attemptsCount).toBe(3);
    expect(problem.failedAttemptsCount).toBe(2);
    expect(data.attempts.length).toBe(3);
  });

  it('records user revision with outcome, optional stopwatch duration, and notes', async () => {
    const service = RevisionStorageService.getInstance();
    await service.recordSolve({
      slug: 'valid-parentheses',
      title: 'Valid Parentheses',
      difficulty: 'Easy',
      topicTags: ['Stack', 'String'],
      isSuccess: true,
    });

    const { problem, logEntry } = await service.recordRevision({
      problemSlug: 'valid-parentheses',
      outcome: 'hints',
      durationSeconds: 310,
      notes: 'Double check closing brackets order',
    });

    expect(problem.lastRevisionOutcome).toBe('hints');
    expect(problem.revisionCount).toBe(1);
    expect(problem.notes).toBe('Double check closing brackets order');

    expect(logEntry.outcome).toBe('hints');
    expect(logEntry.durationSeconds).toBe(310);
    expect(logEntry.problemTitle).toBe('Valid Parentheses');

    const data = await service.loadData();
    expect(data.revisions.length).toBe(1);
  });

  it('updates problem tags after syncing from LeetCode', async () => {
    const service = RevisionStorageService.getInstance();
    await service.recordSolve({
      slug: 'climbing-stairs',
      title: 'Climbing Stairs',
      difficulty: 'Easy',
      topicTags: [], // Untagged
      isSuccess: true,
    });

    const updated = await service.updateProblemTags(
      'climbing-stairs',
      ['Dynamic Programming', 'Math', 'Memoization'],
      '70',
      'Climbing Stairs'
    );

    expect(updated).toBe(true);
    const data = await service.loadData();
    expect(data.problems['climbing-stairs'].tagsSynced).toBe(true);
    expect(data.problems['climbing-stairs'].topicTags).toEqual([
      'Dynamic Programming',
      'Math',
      'Memoization',
    ]);
  });
});
