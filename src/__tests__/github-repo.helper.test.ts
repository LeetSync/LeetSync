import { normalizeGitHubRepoName, parseGitHubRepositoryUrl } from '../utils/github-repo.helper';

describe('github repo url helpers', () => {
  it('parses a GitHub repository URL and strips .git', () => {
    expect(parseGitHubRepositoryUrl('https://github.com/Dhruv0306/LeetCode.git')).toEqual({
      owner: 'Dhruv0306',
      repo: 'LeetCode',
    });
  });

  it('parses a GitHub repository URL with a trailing slash', () => {
    expect(parseGitHubRepositoryUrl('https://github.com/Dhruv0306/LeetCode.git/')).toEqual({
      owner: 'Dhruv0306',
      repo: 'LeetCode',
    });
  });

  it('returns the same normalized repo for URLs with and without .git', () => {
    const withGit = normalizeGitHubRepoName('https://github.com/Dhruv0306/LeetCode.git');
    const withoutGit = normalizeGitHubRepoName('https://github.com/Dhruv0306/LeetCode');

    expect(withGit).toBe('LeetCode');
    expect(withoutGit).toBe('LeetCode');
    expect(withGit).toBe(withoutGit);
  });

  it('returns null for invalid repository input', () => {
    expect(parseGitHubRepositoryUrl('not-a-repo-url')).toBeNull();
  });

  it('normalizes just the repository name from a URL', () => {
    expect(normalizeGitHubRepoName('https://github.com/Dhruv0306/LeetCode.git')).toBe(
      'LeetCode',
    );
  });

  it('normalizes an existing stored repository name with .git', () => {
    expect(normalizeGitHubRepoName('LeetCode.git')).toBe('LeetCode');
  });
});
