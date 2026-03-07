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
    let response = await leetcode.getSubmission(questionSlug);
    while (!response && retries < 3) {
      retries++;
      await sleep(retries * 1000);
      response = await leetcode.getSubmission(questionSlug);
    }
    if (!response) return;
    const submission = response.submissionDetails;
    const submissionId = response.id;

    // Deduplicate using lastSubmissionId stored per question
    const stored = (await chrome.storage.sync.get(['lastSubmissionIds'])) as any;
    const lastSubmissionIds = stored?.lastSubmissionIds || {};
    if (lastSubmissionIds[questionSlug] && lastSubmissionIds[questionSlug] === submissionId) {
      // already processed this exact submission id
      return;
    }

    //validate submission's timestamp, if it was submitted more than 5 minutes ago, then it's likely an older submission and we should ignore it
    const now = new Date();
    const submissionDate = new Date(submission.timestamp * 1000);
    const diff = now.getTime() - submissionDate.getTime();
    const diffInMinutes = Math.floor(diff / 1000 / 60);

    if (diffInMinutes > 5) return;

    const isPushed = await github.submit(submission);
    if (isPushed) {
      // mark this submission id as processed
      lastSubmissionIds[questionSlug] = submissionId;
      chrome.storage.sync.set({ lastSubmissionIds });
      chrome.runtime.sendMessage({ type: 'set-fire-icon' });
    }
  }
});
