import browser from 'webextension-polyfill';
import GithubHandler from '../handlers/GithubHandler';
import { QuestionDifficulty } from '../types/Question';

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

jest.mock('../constants', () => ({
  GITHUB_CLIENT_ID: '',
  GITHUB_CLIENT_SECRET: '',
  GITHUB_REDIRECT_URI: '',
}));

describe('GithubHandler utility methods', () => {
  const mockBrowser = browser as jest.Mocked<typeof browser>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockBrowser.storage.sync.get.mockResolvedValue({});
  });

  it('returns correct file extension for a language', () => {
    const handler = new GithubHandler();
    expect(handler.getProblemExtension('Python')).toBe('.py');
    expect(handler.getProblemExtension('JavaScript')).toBe('.js');
  });

  it('returns correct difficulty color', () => {
    const handler = new GithubHandler();
    expect(handler.getDifficultyColor('Easy' as QuestionDifficulty)).toBe('brightgreen');
    expect(handler.getDifficultyColor('Medium' as QuestionDifficulty)).toBe('orange');
    expect(handler.getDifficultyColor('Hard' as QuestionDifficulty)).toBe('red');
  });

  it('creates a difficulty badge using the difficulty color', () => {
    const handler = new GithubHandler();
    const badge = handler.createDifficultyBadge('Medium' as QuestionDifficulty);
    expect(badge).toContain('img');
    expect(badge).toContain('Difficulty-Medium-orange');
  });

  it('loads token from storage', async () => {
    const handler = new GithubHandler();
    mockBrowser.storage.sync.get.mockResolvedValue({ github_leetsync_token: 'abc' });
    const token = await handler.loadTokenFromStorage();
    expect(token).toBe('abc');
  });

  it('returns empty string and clears storage when token missing', async () => {
    const handler = new GithubHandler();
    const token = await handler.loadTokenFromStorage();
    expect(token).toBe('');
    expect(mockBrowser.storage.sync.clear).toHaveBeenCalled();
  });
});
