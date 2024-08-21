import { getAllSubmission, getSubmission } from '../api/submissions/getSubmission';
import { Submission } from '../types/Submission';

class LeetCodeHandler {
  async getSubmission(questionSlug: string): Promise<Submission | null> {
    const leetcode_session = (await chrome.storage.sync.get('leetcode_session'))?.['leetcode_session'];

    if (!leetcode_session) {
      return null;
    }

    const submissions = (await getAllSubmission(questionSlug)) as any;

    if (!submissions?.questionSubmissionList?.submissions?.[0]?.id) {
      console.log('No question submissions were found for this problem');
      return null;
    }

    const latestSubmissionId = submissions?.questionSubmissionList?.submissions?.[0].id;

    const result = await getSubmission(latestSubmissionId, leetcode_session);

    if (!result?.submissionDetails) return null;

    return result.submissionDetails;
  }

  getAllQuestion = async () => {
    const allQuestions = await fetch(`https://leetcode.com/api/problems/all/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',

        Accept: 'application/json',
      },
    }).then((response) => response.json());

    let allQuestionsList: string[] = [];

    allQuestions.stat_status_pairs.forEach((que: any) => {
      let question = `${que.stat.frontend_question_id}-${que.stat.question__title_slug}|${que.difficulty.level}`;

      allQuestionsList.push(question);
    });

    if (allQuestionsList !== undefined && allQuestionsList.length > 0) {
      chrome.storage.local.set({ allLeetcodeQuestions: allQuestionsList });
      return allQuestionsList;
    }

    throw 'Unable to fetch All Leetcode Questions';
  };
}

export default LeetCodeHandler;
