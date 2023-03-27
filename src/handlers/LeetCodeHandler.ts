import { getSubmission } from '../api/submissions/getSubmission';
import * as config from '../config';
import { API_BASE_URL } from '../constants';
import { Submission } from '../types/Submission';
class LeetCodeHandler {
  constructor() {
    //inject QuestionHandler dependency
    //inject GithubHandler dependency
  }

  static async parseProblemURL() {
    //parse the url and return the problem slug
  }

  static async parseSubmissionURL() {
    //parse the url and return the submission id
  }

  async attachListener() {
    //attach listener to the button
    //  so when it navigates to the submission page, we call getSubmission
    /* 
            when the button is clicked,
            - attach webNavigation listener to the current tab (if not already attached)
            - getSubmission from the leetcode API and check if it is accepted (we can also get the problem from the leetcode API using the same query)
            - if it is accepted, use GithubHandler to create a new file in the repo with the problem name and the solution
        */

    const btn = document.getElementsByClassName(
      config['submit-btn-class-name']
    );

    if (btn.length === 0) {
      alert('submit btn not found');

      return;
    }

    const submitBtn = btn[0] as HTMLButtonElement;
    alert('submit btn found');
    submitBtn.addEventListener('click', () => {
      alert('submit btn clicked');

      chrome.runtime.sendMessage(
        {
          type: 'submit-code-btn-clicked',
          data: {
            code: 'a7a',
            language: 'javascript',
          },
        },
        (response) => {
          console.log(`🚀 ~ file: leetcode.ts:9 ~ response`, response);
        }
      );

      //attach a webNavigation listener to the current tab
    });
  }
  // ...
  async getProblem(slug: string) {
    //use QuestionHandler to get the problem
    // return the question
  }
  // ...
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

    //get leetcode session from storage
    //send a request to the leetcode API to get the submission
    //return the submission
  }
}

export default LeetCodeHandler;
