import { GithubHandler } from '../handlers';

const github = new GithubHandler();

try {
  const url = new URL(window.location.href);
  const code = url.searchParams.get('code');
  const referrer = url.searchParams.get('referrer');
  if (code && referrer === 'leetsync') {
    await github.authorize(code);  // Ensure authorize is awaited if it's an async function
  }
} catch (e) {
  console.error('Authorization failed:', e);  // Added a more descriptive error message
}
