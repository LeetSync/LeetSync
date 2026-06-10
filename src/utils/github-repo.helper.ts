type ParsedGitHubRepo = {
  owner: string;
  repo: string;
};

const normalizeRepoSegment = (segment: string) => segment.replace(/\.git$/i, '').trim();

export function parseGitHubRepositoryUrl(repositoryUrl?: string | null): ParsedGitHubRepo | null {
  if (!repositoryUrl) return null;

  const trimmedUrl = repositoryUrl.trim().replace(/\/+$/, '');
  if (!trimmedUrl) return null;

  const extractFromPath = (pathname: string): ParsedGitHubRepo | null => {
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length < 2) return null;

    const owner = parts[parts.length - 2]?.trim();
    const repo = normalizeRepoSegment(parts[parts.length - 1] ?? '');

    if (!owner || !repo) return null;
    return { owner, repo };
  };

  try {
    const parsedUrl = new URL(trimmedUrl);
    return extractFromPath(parsedUrl.pathname);
  } catch {
    return extractFromPath(trimmedUrl);
  }
}

export function normalizeGitHubRepoName(repositoryUrl?: string | null): string | null {
  const parsedRepo = parseGitHubRepositoryUrl(repositoryUrl)?.repo;
  if (!repositoryUrl) return null;

  const normalizedRepo = normalizeRepoSegment(repositoryUrl);
  if (parsedRepo) return parsedRepo;
  return normalizedRepo || null;
}
