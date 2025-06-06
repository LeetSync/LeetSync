import LeetCodeHandler from '../handlers/LeetCodeHandler';
import * as submissionApi from '../api/submissions/getSubmission';

jest.mock('../api/submissions/getSubmission');

describe('LeetCodeHandler getSubmission', () => {
  beforeEach(() => {
    (global as any).chrome = {
      storage: { sync: { get: jest.fn() } }
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns null when there is no session token', async () => {
    (global as any).chrome.storage.sync.get.mockResolvedValue({});
    const handler = new LeetCodeHandler();
    const result = await handler.getSubmission('two-sum');
    expect(result).toBeNull();
  });

  it('returns null when no submissions exist', async () => {
    (global as any).chrome.storage.sync.get.mockResolvedValue({ leetcode_session: 'sess' });
    (submissionApi.getAllSubmission as jest.Mock).mockResolvedValue({});
    const handler = new LeetCodeHandler();
    const result = await handler.getSubmission('two-sum');
    expect(result).toBeNull();
  });

  it('returns latest submission details', async () => {
    (global as any).chrome.storage.sync.get.mockResolvedValue({ leetcode_session: 'sess' });
    (submissionApi.getAllSubmission as jest.Mock).mockResolvedValue({
      questionSubmissionList: { submissions: [{ id: 1 }] }
    });
    const details = { id: 1, code: 'code' } as any;
    (submissionApi.getSubmission as jest.Mock).mockResolvedValue({ submissionDetails: details });

    const handler = new LeetCodeHandler();
    const result = await handler.getSubmission('two-sum');
    expect(result).toEqual(details);
  });
});
