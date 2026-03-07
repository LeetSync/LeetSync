// Mock the config before importing GithubHandler
jest.mock('../constants', () => ({
  GITHUB_CLIENT_ID: 'test-client-id',
  GITHUB_CLIENT_SECRET: 'test-client-secret',
  GITHUB_REDIRECT_URI: 'http://localhost:3000',
}));

import GithubHandler from '../handlers/GithubHandler';

// Mock chrome.storage.sync.get to provide credentials
const mockChromeStorageGet = jest.fn();

// Mock fetch globally
global.fetch = jest.fn();

describe('GithubHandler Error Handling', () => {
  let handler: GithubHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    (global as any).chrome = {
      storage: {
        sync: {
          get: mockChromeStorageGet,
          set: jest.fn(),
          clear: jest.fn(),
        },
      },
    };

    // Mock storage to return valid credentials
    mockChromeStorageGet.mockImplementation((keys: any, callback?: any) => {
      const result = {
        github_leetsync_token: 'test-token',
        github_username: 'test-user',
        github_leetsync_repo: 'test-repo',
        github_leetsync_subdirectory: '',
      };
      if (callback) {
        callback(result);
      }
      return Promise.resolve(result);
    });

    handler = new GithubHandler();
  });

  describe('upload error handling', () => {
    it('returns false when GitHub API returns 404', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ message: 'Not Found' }),
      });

      // Mock fileExists to return null (file doesn't exist)
      jest.spyOn(handler, 'fileExists').mockResolvedValueOnce(null);

      const result = await handler.upload('test-path', 'test.js', 'code', 'commit message');
      expect(result).toBe(false);
    });

    it('returns false when GitHub API returns 401 (unauthorized)', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ message: 'Bad credentials' }),
      });

      jest.spyOn(handler, 'fileExists').mockResolvedValueOnce(null);

      const result = await handler.upload('test-path', 'test.js', 'code', 'commit message');
      expect(result).toBe(false);
    });

    it('returns false when GitHub API returns 422 (validation failed)', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 422,
        statusText: 'Unprocessable Entity',
        json: async () => ({ message: 'Validation failed' }),
      });

      jest.spyOn(handler, 'fileExists').mockResolvedValueOnce(null);

      const result = await handler.upload('test-path', 'test.js', 'code', 'commit message');
      expect(result).toBe(false);
    });

    it('returns false on network error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      jest.spyOn(handler, 'fileExists').mockResolvedValueOnce(null);

      const result = await handler.upload('test-path', 'test.js', 'code', 'commit message');
      expect(result).toBe(false);
    });

    it('returns true on successful upload', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        statusText: 'Created',
        json: async () => ({ commit: { sha: 'abc123' } }),
      });

      jest.spyOn(handler, 'fileExists').mockResolvedValueOnce(null);

      const result = await handler.upload('test-path', 'test.js', 'code', 'commit message');
      expect(result).toBe(true);
    });

    it('logs error details when upload fails', async () => {
      const errorMessage = 'Repository not found';
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ message: errorMessage }),
      });

      jest.spyOn(handler, 'fileExists').mockResolvedValueOnce(null);

      await handler.upload('test-path', 'test.js', 'code', 'commit message');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to upload test.js: 404 Not Found'),
        expect.objectContaining({ message: errorMessage }),
      );
      consoleSpy.mockRestore();
    });
  });

  describe('fileExists error handling', () => {
    it('returns null on 404 (file not found)', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const result = await handler.fileExists('test-path', 'test.js');
      expect(result).toBeNull();
    });

    it('returns null on 401 (unauthorized)', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ message: 'Bad credentials' }),
      });

      const result = await handler.fileExists('test-path', 'test.js');
      expect(result).toBeNull();
    });

    it('returns null on network error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await handler.fileExists('test-path', 'test.js');
      expect(result).toBeNull();
    });

    it('returns sha on successful file check', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ sha: 'abc123def456' }),
      });

      const result = await handler.fileExists('test-path', 'test.js');
      expect(result).toBe('abc123def456');
    });
  });
});

