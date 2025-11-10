import browser from 'webextension-polyfill';
import * as submissionApi from '../api/submissions/getSubmission';
import LeetCodeHandler from '../handlers/LeetCodeHandler';

jest.mock('webextension-polyfill', () => {
  const { join } = require('path');
  const modulePath = join(__dirname, '../../__mocks__/webextension-polyfill.js');
  // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
  const mockBrowser = require(modulePath);
  return {
    __esModule: true,
    default: mockBrowser,
    ...mockBrowser,
  };
});
jest.mock('../api/submissions/getSubmission');

describe('LeetCodeHandler getSubmission', () => {
  const mockBrowser = browser as jest.Mocked<typeof browser>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockBrowser.storage.sync.get.mockResolvedValue({});
  });

  it('returns null when there is no session token', async () => {
    const handler = new LeetCodeHandler();
    const result = await handler.getSubmission('two-sum');
    expect(result).toBeNull();
  });

  it('returns null when no submissions exist', async () => {
    mockBrowser.storage.sync.get.mockResolvedValue({ leetcode_session: 'sess' });
    (submissionApi.getAllSubmission as jest.Mock).mockResolvedValue({});
    const handler = new LeetCodeHandler();
    const result = await handler.getSubmission('two-sum');
    expect(result).toBeNull();
  });

  it('returns latest submission details', async () => {
    mockBrowser.storage.sync.get.mockResolvedValue({ leetcode_session: 'sess' });
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
