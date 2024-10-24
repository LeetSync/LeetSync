import { LeetCodeHandler, GithubHandler } from '../handlers';

const leetcode = new LeetCodeHandler();
const github = new GithubHandler();

const sleep = async (ms) => new Promise((resolve) => setTimeout(resolve, ms));

chrome.runtime.onMessage.addListener(async function (request, _s, _sendResponse) {
  if (request && request.type === 'get-submission') {
    const questionSlug = request?.data?.questionSlug;

    if (!questionSlug) return;

    let retries = 0;
    let submission;
    while (!submission && retries < 3) {
      submission = await leetcode.getSubmission(questionSlug);
      if (!submission) {
        retries++;
        await sleep(retries * 1000);
      }
    }

    if (!submission) return;

    const now = new Date();
    const submissionDate = new Date(submission.timestamp * 1000);
    const diffInMinutes = Math.floor((now - submissionDate) / 1000 / 60);

    if (diffInMinutes > 1) return;

    const isPushed = await github.submit(submission);
    if (isPushed) {
      chrome.runtime.sendMessage({ type: 'set-fire-icon' });
    }
  }
});
