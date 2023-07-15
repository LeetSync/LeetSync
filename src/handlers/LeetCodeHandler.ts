import {
  getAllSubmission,
  getSubmission,
} from '../api/submissions/getSubmission';
import { Submission } from '../types/Submission';
class LeetCodeHandler {
  async getSubmission(questionSlug: string): Promise<Submission | null> {
    const leetcode_session = (
      await chrome.storage.sync.get('leetcode_session')
    )?.['leetcode_session'];

    if (!leetcode_session) {
      return null;
    }

    const submissions = (await getAllSubmission(questionSlug)) as any;

    if (!submissions?.questionSubmissionList?.submissions?.[0]?.id) {
      console.log('No question submissions were found for this problem');
      return null;
    }

    const latestSubmissionId =
      submissions?.questionSubmissionList?.submissions?.[0].id;

    const result = await getSubmission(latestSubmissionId, leetcode_session);

    if (!result?.submissionDetails) return null;

    return result.submissionDetails;
  }
}

export default LeetCodeHandler;
