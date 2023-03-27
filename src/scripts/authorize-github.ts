import { GithubHandler } from '../handlers';

const github = new GithubHandler();

try {
  const url = new URL(window.location.href);
  const code = url.searchParams.get('code');
  const referrer = url.searchParams.get('referrer');
  if (code && referrer === 'leetsync') {
    github.authorize(code);
  }
} catch (e) {
  console.error(e);
}
