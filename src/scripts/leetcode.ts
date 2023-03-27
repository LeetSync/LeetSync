//this script should only run in leetcode/problems/*.com pages  (i.e. the problem page)

import { LeetCodeHandler } from '../handlers';
import { GithubHandler } from '../handlers';

const leetcode = new LeetCodeHandler();
const github = new GithubHandler();

chrome.runtime.onMessage.addListener(async function (request, s, r) {
  if (request && request.type === 'get-submission') {
    const submissionId = request?.data?.submissionId;

    if (!submissionId) return;

    const submission = await leetcode.getSubmission(submissionId);
    if (!submission) return r({ message: 'Hello from leetcode script' });
    await github.submit(submission);
  }
  r({ message: 'Hello from leetcode script' });
});
