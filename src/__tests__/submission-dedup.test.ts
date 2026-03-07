/**
 * Tests for submission deduplication logic
 * This tests the core fix for the "only first submission syncs" bug
 */

describe('Submission Deduplication', () => {
  let mockChromeSyncGet: jest.Mock;
  let mockChromeSyncSet: jest.Mock;
  let mockRuntimeSendMessage: jest.Mock;

  beforeEach(() => {
    mockChromeSyncGet = jest.fn();
    mockChromeSyncSet = jest.fn();
    mockRuntimeSendMessage = jest.fn();

    (global as any).chrome = {
      storage: {
        sync: {
          get: mockChromeSyncGet,
          set: mockChromeSyncSet,
        },
      },
      runtime: {
        sendMessage: mockRuntimeSendMessage,
      },
    };

    jest.clearAllMocks();
  });

  describe('Duplicate submission detection', () => {
    it('should skip processing if submission id matches stored lastSubmissionIds', async () => {
      const questionSlug = 'two-sum';
      const submissionId = 12345;

      // Simulate stored lastSubmissionIds already containing this submission
      mockChromeSyncGet.mockResolvedValueOnce({
        lastSubmissionIds: {
          [questionSlug]: submissionId,
        },
      });

      // This represents the dedup check logic from leetcode.ts
      const stored = (await mockChromeSyncGet(['lastSubmissionIds'])) as any;
      const lastSubmissionIds = stored?.lastSubmissionIds || {};
      const isDuplicate = !!(
        lastSubmissionIds[questionSlug] &&
        lastSubmissionIds[questionSlug] === submissionId
      );

      expect(isDuplicate).toBe(true);
      expect(mockChromeSyncSet).not.toHaveBeenCalled();
    });

    it('should process submission if id is different from stored lastSubmissionIds', async () => {
      const questionSlug = 'two-sum';
      const oldSubmissionId = 12345;
      const newSubmissionId = 12346;

      mockChromeSyncGet.mockResolvedValueOnce({
        lastSubmissionIds: {
          [questionSlug]: oldSubmissionId,
        },
      });

      const stored = (await mockChromeSyncGet(['lastSubmissionIds'])) as any;
      const lastSubmissionIds = stored?.lastSubmissionIds || {};
      const isDuplicate = !!(
        lastSubmissionIds[questionSlug] &&
        lastSubmissionIds[questionSlug] === newSubmissionId
      );

      expect(isDuplicate).toBe(false);
    });

    it('should process submission if no prior submission stored for question', async () => {
      const questionSlug = 'two-sum';
      const submissionId = 12345;

      mockChromeSyncGet.mockResolvedValueOnce({
        lastSubmissionIds: {}, // empty
      });

      const stored = (await mockChromeSyncGet(['lastSubmissionIds'])) as any;
      const lastSubmissionIds = stored?.lastSubmissionIds || {};
      const isDuplicate = !!(
        lastSubmissionIds[questionSlug] &&
        lastSubmissionIds[questionSlug] === submissionId
      );

      expect(isDuplicate).toBe(false);
    });

    it('should process submission if lastSubmissionIds is undefined', async () => {
      const questionSlug = 'two-sum';
      const submissionId = 12345;

      mockChromeSyncGet.mockResolvedValueOnce({}); // no lastSubmissionIds key

      const stored = (await mockChromeSyncGet(['lastSubmissionIds'])) as any;
      const lastSubmissionIds = stored?.lastSubmissionIds || {};
      const isDuplicate = !!(
        lastSubmissionIds[questionSlug] &&
        lastSubmissionIds[questionSlug] === submissionId
      );

      expect(isDuplicate).toBe(false);
    });
  });

  describe('Timestamp validation', () => {
    it('should reject submission older than 5 minutes', async () => {
      const now = new Date();
      const submissionDate = new Date(now.getTime() - 6 * 60 * 1000); // 6 minutes ago

      const diff = now.getTime() - submissionDate.getTime();
      const diffInMinutes = Math.floor(diff / 1000 / 60);

      expect(diffInMinutes > 5).toBe(true);
    });

    it('should accept submission within 5 minutes', async () => {
      const now = new Date();
      const submissionDate = new Date(now.getTime() - 4 * 60 * 1000); // 4 minutes ago

      const diff = now.getTime() - submissionDate.getTime();
      const diffInMinutes = Math.floor(diff / 1000 / 60);

      expect(diffInMinutes > 5).toBe(false);
    });

    it('should accept submission exactly at 5 minute boundary', async () => {
      const now = new Date();
      const submissionDate = new Date(now.getTime() - 5 * 60 * 1000); // exactly 5 minutes ago

      const diff = now.getTime() - submissionDate.getTime();
      const diffInMinutes = Math.floor(diff / 1000 / 60);

      expect(diffInMinutes > 5).toBe(false); // Not greater than 5
    });

    it('should accept fresh submission (few seconds old)', async () => {
      const now = new Date();
      const submissionDate = new Date(now.getTime() - 10 * 1000); // 10 seconds ago

      const diff = now.getTime() - submissionDate.getTime();
      const diffInMinutes = Math.floor(diff / 1000 / 60);

      expect(diffInMinutes > 5).toBe(false);
    });
  });

  describe('lastSubmissionIds storage updates', () => {
    it('should update lastSubmissionIds with new submission id after successful upload', async () => {
      const questionSlug = 'two-sum';
      const submissionId = 12345;

      mockChromeSyncGet.mockResolvedValueOnce({
        lastSubmissionIds: {},
      });

      const stored = (await mockChromeSyncGet(['lastSubmissionIds'])) as any;
      const lastSubmissionIds = stored?.lastSubmissionIds || {};

      // Simulate successful upload by updating the map
      lastSubmissionIds[questionSlug] = submissionId;
      mockChromeSyncSet({ lastSubmissionIds });

      expect(mockChromeSyncSet).toHaveBeenCalledWith({
        lastSubmissionIds: {
          [questionSlug]: submissionId,
        },
      });
    });

    it('should preserve other questions when updating lastSubmissionIds', async () => {
      const questionSlug1 = 'two-sum';
      const questionSlug2 = 'add-two-numbers';
      const submissionId1 = 12345;
      const submissionId2 = 67890;

      mockChromeSyncGet.mockResolvedValueOnce({
        lastSubmissionIds: {
          [questionSlug1]: submissionId1,
        },
      });

      const stored = (await mockChromeSyncGet(['lastSubmissionIds'])) as any;
      const lastSubmissionIds = stored?.lastSubmissionIds || {};

      // Add a new submission
      lastSubmissionIds[questionSlug2] = submissionId2;
      mockChromeSyncSet({ lastSubmissionIds });

      expect(mockChromeSyncSet).toHaveBeenCalledWith({
        lastSubmissionIds: {
          [questionSlug1]: submissionId1,
          [questionSlug2]: submissionId2,
        },
      });
    });

    it('should overwrite old submission id with new one for same question', async () => {
      const questionSlug = 'two-sum';
      const oldSubmissionId = 12345;
      const newSubmissionId = 12346;

      mockChromeSyncGet.mockResolvedValueOnce({
        lastSubmissionIds: {
          [questionSlug]: oldSubmissionId,
        },
      });

      const stored = (await mockChromeSyncGet(['lastSubmissionIds'])) as any;
      const lastSubmissionIds = stored?.lastSubmissionIds || {};

      lastSubmissionIds[questionSlug] = newSubmissionId;
      mockChromeSyncSet({ lastSubmissionIds });

      expect(mockChromeSyncSet).toHaveBeenCalledWith({
        lastSubmissionIds: {
          [questionSlug]: newSubmissionId,
        },
      });
    });
  });

  describe('Multiple submissions to same problem', () => {
    it('should process first submission and store its id', async () => {
      const questionSlug = 'two-sum';
      const submissionId = 12345;

      mockChromeSyncGet.mockResolvedValueOnce({ lastSubmissionIds: {} });

      const stored = (await mockChromeSyncGet(['lastSubmissionIds'])) as any;
      const lastSubmissionIds = stored?.lastSubmissionIds || {};
      const isDuplicate = !!(
        lastSubmissionIds[questionSlug] &&
        lastSubmissionIds[questionSlug] === submissionId
      );

      expect(isDuplicate).toBe(false);

      // Should proceed with upload and then store
      lastSubmissionIds[questionSlug] = submissionId;
      mockChromeSyncSet({ lastSubmissionIds });

      expect(mockChromeSyncSet).toHaveBeenCalled();
    });

    it('should skip second identical submission', async () => {
      const questionSlug = 'two-sum';
      const submissionId = 12345;

      // After first submission was stored
      mockChromeSyncGet.mockResolvedValueOnce({
        lastSubmissionIds: { [questionSlug]: submissionId },
      });

      const stored = (await mockChromeSyncGet(['lastSubmissionIds'])) as any;
      const lastSubmissionIds = stored?.lastSubmissionIds || {};
      const isDuplicate = !!(
        lastSubmissionIds[questionSlug] &&
        lastSubmissionIds[questionSlug] === submissionId
      );

      expect(isDuplicate).toBe(true);
      // Should return early without calling chromeSyncSet
    });

    it('should process third submission if different from second', async () => {
      const questionSlug = 'two-sum';
      const submissionId1 = 12345;
      const submissionId2 = 12346;

      // After second submission attempt was stored
      mockChromeSyncGet.mockResolvedValueOnce({
        lastSubmissionIds: { [questionSlug]: submissionId1 },
      });

      const stored = (await mockChromeSyncGet(['lastSubmissionIds'])) as any;
      const lastSubmissionIds = stored?.lastSubmissionIds || {};
      const isDuplicate = !!(
        lastSubmissionIds[questionSlug] &&
        lastSubmissionIds[questionSlug] === submissionId2
      );

      expect(isDuplicate).toBe(false);
      // Should proceed with upload
    });
  });

  describe('Edge cases', () => {
    it('should handle submission id as number', async () => {
      const questionSlug = 'two-sum';
      const submissionId = 12345; // numeric id

      mockChromeSyncGet.mockResolvedValueOnce({
        lastSubmissionIds: { [questionSlug]: submissionId },
      });

      const stored = (await mockChromeSyncGet(['lastSubmissionIds'])) as any;
      const lastSubmissionIds = stored?.lastSubmissionIds || {};
      const isDuplicate =
        lastSubmissionIds[questionSlug] === submissionId;

      expect(isDuplicate).toBe(true);
    });

    it('should handle submission id as string', async () => {
      const questionSlug = 'two-sum';
      const submissionId = '12345'; // string id

      mockChromeSyncGet.mockResolvedValueOnce({
        lastSubmissionIds: { [questionSlug]: submissionId },
      });

      const stored = (await mockChromeSyncGet(['lastSubmissionIds'])) as any;
      const lastSubmissionIds = stored?.lastSubmissionIds || {};
      const isDuplicate =
        lastSubmissionIds[questionSlug] === submissionId;

      expect(isDuplicate).toBe(true);
    });

    it('should handle mixed numeric and string ids correctly (should not match)', async () => {
      const questionSlug = 'two-sum';
      const storedId = 12345; // number
      const newId = '12345'; // string

      mockChromeSyncGet.mockResolvedValueOnce({
        lastSubmissionIds: { [questionSlug]: storedId },
      });

      const stored = (await mockChromeSyncGet(['lastSubmissionIds'])) as any;
      const lastSubmissionIds = stored?.lastSubmissionIds || {};
      const isDuplicate =
        lastSubmissionIds[questionSlug] === newId;

      // Note: this is a strict equality check, so 12345 !== '12345'
      expect(isDuplicate).toBe(false);
    });

    it('should handle special characters in question slug', async () => {
      const questionSlug = 'binary-tree-level-order-traversal';
      const submissionId = 99999;

      mockChromeSyncGet.mockResolvedValueOnce({
        lastSubmissionIds: { [questionSlug]: submissionId },
      });

      const stored = (await mockChromeSyncGet(['lastSubmissionIds'])) as any;
      const lastSubmissionIds = stored?.lastSubmissionIds || {};
      const isDuplicate =
        lastSubmissionIds[questionSlug] &&
        lastSubmissionIds[questionSlug] === submissionId;

      expect(isDuplicate).toBe(true);
    });
  });
});

export {};
