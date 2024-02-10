//this script should only run in leetcode/problems/*.com pages  (i.e. the problem page)

import { LeetCodeHandler, GithubHandler } from '../handlers';

const leetcode = new LeetCodeHandler();
const github = new GithubHandler();

const sleep = async (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
chrome.runtime.onMessage.addListener(async function (request, _s, _sendResponse) {
  if (request && request.type === 'get-submission') {
    const questionSlug = request?.data?.questionSlug;

    if (!questionSlug) return;

    let retries = 0;
    let submission = await leetcode.getSubmission(questionSlug);
    while (!submission && retries < 3) {
      retries++;
      await sleep(retries * 1000);
      submission = await leetcode.getSubmission(questionSlug);
    }
    if (!submission) return;
    //validate submission's timestamp, if its was submitted more than 1 minute ago, then its an old submission and we should ignore it
    const now = new Date();
    const submissionDate = new Date(submission.timestamp * 1000);
    const diff = now.getTime() - submissionDate.getTime();
    const diffInMinutes = Math.floor(diff / 1000 / 60);

    if (diffInMinutes > 1) return;

    const isPushed = await github.submit(submission);
    if (isPushed) {
      chrome.runtime.sendMessage({ type: 'set-fire-icon' });
    }
  }
});
