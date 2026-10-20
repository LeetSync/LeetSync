import { getClient } from '../lib/client';

export const GET_QUESTION_TAGS_QUERY = `
query questionData($titleSlug: String!) {
  question(titleSlug: $titleSlug) {
    questionId
    questionFrontendId
    title
    titleSlug
    difficulty
    topicTags {
      name
      slug
    }
  }
}
`;

export interface QuestionDataResponse {
  question?: {
    questionId: string;
    questionFrontendId?: string;
    title: string;
    titleSlug: string;
    difficulty: string;
    topicTags: {
      name: string;
      slug: string;
    }[];
  };
}

export class LeetCodeApiService {
  /**
   * Fetches official verified question details (tags, frontend ID, title) directly from LeetCode.
   * Does not fabricate tags if unavailable.
   */
  static async fetchQuestionDetails(titleSlug: string): Promise<{
    frontendQuestionId?: string;
    title?: string;
    difficulty?: 'Easy' | 'Medium' | 'Hard';
    topicTags: string[];
  } | null> {
    try {
      const client = getClient();
      const response = await client.request<QuestionDataResponse>(GET_QUESTION_TAGS_QUERY, {
        titleSlug,
      });

      if (!response?.question) {
        return null;
      }

      const q = response.question;
      const rawDiff = q.difficulty;
      const difficulty =
        rawDiff === 'Easy' || rawDiff === 'Medium' || rawDiff === 'Hard' ? rawDiff : 'Medium';

      const topicTags = Array.isArray(q.topicTags)
        ? q.topicTags.map((t) => t.name).filter(Boolean)
        : [];

      return {
        frontendQuestionId: q.questionFrontendId || q.questionId,
        title: q.title,
        difficulty,
        topicTags,
      };
    } catch (err) {
      console.warn(`Failed to fetch LeetCode question tags for ${titleSlug}:`, err);
      return null;
    }
  }
}
