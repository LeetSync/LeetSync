import { getClient } from '../../lib/client';
import { Submission } from '../../types/Submission';
import { GET_SUBMISSION_DETAILS } from './submission.query';

export const getSubmission = async (
  submissionId: number | string,
  leetcode_session: String
): Promise<{ submissionDetails: Submission } | null> => {
  try {
    const client = getClient();
    return client.request(
      GET_SUBMISSION_DETAILS,
      {
        submissionId,
      },
      {
        cookie: `LEETCODE_SESSION=${leetcode_session} `,
      }
    );
  } catch (e) {
    console.log(e);
    return null;
  }
};
