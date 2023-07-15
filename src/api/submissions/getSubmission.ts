import { getClient } from '../../lib/client';
import { Submission } from '../../types/Submission';
import { GET_SUBMISSIONS, GET_SUBMISSION_DETAILS } from './submission.query';

export const getSubmission = async (
  submissionId: number | string,
  leetcode_session?: string
): Promise<{ submissionDetails: Submission } | null> => {
  try {
    const client = getClient();
    return client.request(GET_SUBMISSION_DETAILS, {
      submissionId,
    });
  } catch (e) {
    console.log(e);
    return null;
  }
};
export const getAllSubmission = async (
  questionSlug: string
): Promise<{ submissionDetails: Submission } | null> => {
  try {
    const client = getClient();
    return client.request(GET_SUBMISSIONS, {
      questionSlug,
      limit: 20,
      offset: 0,
      lastKey: null,
      status: 10,
    });
  } catch (e) {
    console.log(e);
    return null;
  }
};
