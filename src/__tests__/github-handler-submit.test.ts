/**
 * Tests for GithubHandler.submit() - the core submission workflow
 * Tests that submissions succeed/fail based on file uploads and credentials
 */

jest.mock('../constants', () => ({
  GITHUB_CLIENT_ID: 'test-client-id',
  GITHUB_CLIENT_SECRET: 'test-client-secret',
  GITHUB_REDIRECT_URI: 'http://localhost:3000',
}));

import GithubHandler from '../handlers/GithubHandler';
import { Submission } from '../types/Submission';

describe('GithubHandler.submit() - Submission Workflow', () => {
  let handler: GithubHandler;
  const mockChromeSyncGet = jest.fn();
  const mockChromeSyncSet = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (global as any).chrome = {
      storage: {
        sync: {
          get: mockChromeSyncGet,
          set: mockChromeSyncSet,
          clear: jest.fn(),
        },
      },
    };

    // Default mock: credentials are in storage and callback
    mockChromeSyncGet.mockImplementation((keys: any, callback?: any) => {
      const res = {
        github_leetsync_token: 'test-token',
        github_username: 'test-user',
        github_leetsync_repo: 'test-repo',
        github_leetsync_subdirectory: '',
        problemsSolved: {},
      };
      if (typeof callback === 'function') callback(res);
      return Promise.resolve(res);
    });

    handler = new GithubHandler();
  });

  const createMockSubmission = (
    overrides?: Partial<Submission>,
  ): Submission => ({
    code: 'def twoSum(nums, target):\n  return []',
    memory: 24.2,
    memoryDisplay: '24.2 MB',
    memoryPercentile: 75.5,
    memoryDistribution: { percentile: '75', value: 24.2 } as any,
    runtime: 45,
    runtimePercentile: 85.3,
    runtimeDisplay: '45 ms',
    runtimeDistribution: { percentile: '85', value: 45 } as any,
    lang: { name: 'Python', verboseName: 'Python3' } as any,
    statusCode: 10, // Success
    question: {
      questionId: '1',
      questionFrontendId: '1',
      acRate: 45.5,
      difficulty: 'Easy',
      freqBar: 5,
      isFavor: false,
      isPaidOnly: false,
      content: '<p>Given an array of integers...</p>',
      status: 'ac',
      title: 'Two Sum',
      titleSlug: 'two-sum',
      topicTags: [],
      hasSolution: true,
      hasVideoSolution: true,
    } as any,
    timestamp: Math.floor(Date.now() / 1000),
    notes: '',
    user: {} as any,
    lastTestcase: '',
    topicTags: [],
    runtimeError: undefined,
    compileError: undefined,
    ...overrides,
  });

  describe('Failed submissions', () => {
    it('should return false when statusCode is not 10 (failed attempt)', async () => {
      const submission = createMockSubmission({ statusCode: 11 }); // Wrong answer

      const result = await handler.submit(submission);

      expect(result).toBe(false);
    });

    it('should return false when language is not supported', async () => {
      const submission = createMockSubmission({
        lang: { name: 'Unknown', verboseName: 'Unknown' } as any,
      });

      const result = await handler.submit(submission);

      expect(result).toBe(false);
    });

    it('should return false when credentials are missing (no token)', async () => {
      // Make next storageGet call return missing token
      mockChromeSyncGet.mockImplementationOnce((keys: any, callback?: any) => {
        const res = {
          github_leetsync_token: undefined,
          github_username: 'test-user',
          github_leetsync_repo: 'test-repo',
        };
        if (typeof callback === 'function') callback(res);
        return Promise.resolve(res);
      });

      const submission = createMockSubmission();
      const result = await handler.submit(submission);

      expect(result).toBe(false);
    });

    it('should return false when credentials are missing (no username)', async () => {
      mockChromeSyncGet.mockImplementationOnce((keys: any, callback?: any) => {
        const res = {
          github_leetsync_token: 'test-token',
          github_username: undefined,
          github_leetsync_repo: 'test-repo',
        };
        if (typeof callback === 'function') callback(res);
        return Promise.resolve(res);
      });

      const submission = createMockSubmission();
      const result = await handler.submit(submission);

      expect(result).toBe(false);
    });

    it('should return false when credentials are missing (no repo)', async () => {
      mockChromeSyncGet.mockImplementationOnce((keys: any, callback?: any) => {
        const res = {
          github_leetsync_token: 'test-token',
          github_username: 'test-user',
          github_leetsync_repo: undefined,
        };
        if (typeof callback === 'function') callback(res);
        return Promise.resolve(res);
      });

      const submission = createMockSubmission();
      const result = await handler.submit(submission);

      expect(result).toBe(false);
    });

    it('should return false when README upload fails', async () => {
      // Mock upload methods: README fails
      jest.spyOn(handler as any, 'createReadmeFile').mockResolvedValueOnce(false);

      const submission = createMockSubmission();
      const result = await handler.submit(submission);

      expect(result).toBe(false);
    });

    it('should return false when solution file upload fails', async () => {
      // Mock successful README, but solution fails
      jest.spyOn(handler as any, 'createReadmeFile').mockResolvedValueOnce(true);
      jest.spyOn(handler as any, 'createSolutionFile').mockResolvedValueOnce(false);

      const submission = createMockSubmission();
      const result = await handler.submit(submission);

      expect(result).toBe(false);
    });
  });

  describe('Successful submissions', () => {
    it('should return true when all files upload successfully', async () => {
      jest.spyOn(handler as any, 'createReadmeFile').mockResolvedValue(true);
      jest.spyOn(handler as any, 'createSolutionFile').mockResolvedValue(true);

      const submission = createMockSubmission();
      const result = await handler.submit(submission);

      expect(result).toBe(true);
    });

    it('should upload all files (README, solution, notes) when notes exist', async () => {
      jest.spyOn(handler as any, 'createReadmeFile').mockResolvedValue(true);
      jest.spyOn(handler as any, 'createNotesFile').mockResolvedValue(true);
      jest.spyOn(handler as any, 'createSolutionFile').mockResolvedValue(true);

      const submission = createMockSubmission({ notes: 'Time limit: O(n), Space: O(1)' });
      const result = await handler.submit(submission);

      expect(result).toBe(true);
      expect((handler as any).createReadmeFile).toHaveBeenCalled();
      expect((handler as any).createNotesFile).toHaveBeenCalled();
      expect((handler as any).createSolutionFile).toHaveBeenCalled();
    });

    it('should skip notes upload when notes are empty', async () => {
      jest.spyOn(handler as any, 'createReadmeFile').mockResolvedValue(true);
      jest.spyOn(handler as any, 'createSolutionFile').mockResolvedValue(true);
      jest.spyOn(handler as any, 'createNotesFile').mockResolvedValue(false);

      const submission = createMockSubmission({ notes: '' });
      const result = await handler.submit(submission);

      expect(result).toBe(true);
      expect((handler as any).createReadmeFile).toHaveBeenCalled();
      expect((handler as any).createSolutionFile).toHaveBeenCalled();
    });

    it('should update existing files when they already exist', async () => {
      jest.spyOn(handler as any, 'createReadmeFile').mockResolvedValue(true);
      jest.spyOn(handler as any, 'createSolutionFile').mockResolvedValue(true);

      const submission = createMockSubmission();
      const result = await handler.submit(submission);

      expect(result).toBe(true);
    });
  });

  describe('Storage updates on success', () => {
    it('should update problemsSolved on successful submission', async () => {
      jest.spyOn(handler as any, 'createReadmeFile').mockResolvedValue(true);
      jest.spyOn(handler as any, 'createSolutionFile').mockResolvedValue(true);

      const submission = createMockSubmission();
      await handler.submit(submission);

      const setCalls = mockChromeSyncSet.mock.calls;
      const problemsSolvedUpdate = setCalls.find((call) => call[0].problemsSolved);

      expect(problemsSolvedUpdate).toBeDefined();
      expect(problemsSolvedUpdate[0].problemsSolved).toHaveProperty('two-sum');
    });

    it('should update lastSolved on successful submission', async () => {
      jest.spyOn(handler as any, 'createReadmeFile').mockResolvedValue(true);
      jest.spyOn(handler as any, 'createSolutionFile').mockResolvedValue(true);

      const submission = createMockSubmission();
      await handler.submit(submission);

      const setCalls = mockChromeSyncSet.mock.calls;
      const lastSolvedUpdate = setCalls.find((call) => call[0].lastSolved);

      expect(lastSolvedUpdate).toBeDefined();
      expect(lastSolvedUpdate[0].lastSolved).toHaveProperty('slug', 'two-sum');
      expect(lastSolvedUpdate[0].lastSolved).toHaveProperty('timestamp');
    });
  });

  describe('File path construction', () => {
    it('should construct correct path with questionFrontendId', async () => {
      const readmeSpy = jest.spyOn(handler as any, 'createReadmeFile').mockResolvedValue(true);
      jest.spyOn(handler as any, 'createSolutionFile').mockResolvedValue(true);

      const submission = createMockSubmission({ question: { ...createMockSubmission().question, questionFrontendId: '1', titleSlug: 'two-sum' } as any });
      await handler.submit(submission);

      expect(readmeSpy).toHaveBeenCalled();
      const firstArg = readmeSpy.mock.calls[0][0];
      expect(firstArg).toContain('1-two-sum');
    });

    it('should use questionId fallback when questionFrontendId is missing', async () => {
      const readmeSpy = jest.spyOn(handler as any, 'createReadmeFile').mockResolvedValue(true);
      jest.spyOn(handler as any, 'createSolutionFile').mockResolvedValue(true);

      const submission = createMockSubmission({ question: { ...createMockSubmission().question, questionFrontendId: undefined, questionId: '1', titleSlug: 'two-sum' } as any });
      await handler.submit(submission);

      const firstArg = readmeSpy.mock.calls[0][0];
      expect(firstArg).toContain('1-two-sum');
    });

    it('should use "unknown" when both questionFrontendId and questionId are missing', async () => {
      const readmeSpy = jest.spyOn(handler as any, 'createReadmeFile').mockResolvedValue(true);
      jest.spyOn(handler as any, 'createSolutionFile').mockResolvedValue(true);

      const submission = createMockSubmission({ question: { ...createMockSubmission().question, questionFrontendId: undefined, questionId: undefined, titleSlug: 'two-sum' } as any });
      await handler.submit(submission);

      const firstArg = readmeSpy.mock.calls[0][0];
      expect(firstArg).toContain('unknown-two-sum');
    });

    it('should prepend subdirectory when configured', async () => {
      // next storage get should return subdirectory
      mockChromeSyncGet.mockImplementationOnce((keys: any, callback?: any) => {
        const res = {
          github_leetsync_token: 'test-token',
          github_username: 'test-user',
          github_leetsync_repo: 'test-repo',
          github_leetsync_subdirectory: 'leetcode-solutions',
        };
        if (typeof callback === 'function') callback(res);
        return Promise.resolve(res);
      });

      // create new handler to pick up subdirectory via constructor callback
      const handlerWithSubdir = new GithubHandler();
      const readmeSpy = jest.spyOn(handlerWithSubdir as any, 'createReadmeFile').mockResolvedValue(true);
      jest.spyOn(handlerWithSubdir as any, 'createSolutionFile').mockResolvedValue(true);

      const submission = createMockSubmission();
      await handlerWithSubdir.submit(submission);

      const firstArg = readmeSpy.mock.calls[0][0];
      expect(firstArg).toContain('leetcode-solutions/1-two-sum');
    });
  });
});

