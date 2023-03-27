import { getSubmission } from '../api/submissions/getSubmission';
import { Submission } from '../types/Submission';
class LeetCodeHandler {
  async getSubmission(submissionId: string): Promise<Submission | null> {
    const leetcode_session = (
      await chrome.storage.sync.get('leetcode_session')
    )?.['leetcode_session'];

    if (!leetcode_session) {
      return null;
    }
    const result = await getSubmission(submissionId, leetcode_session);

    if (!result || !result.submissionDetails) return null;

    return result.submissionDetails as Submission;
  }
}

export default LeetCodeHandler;
