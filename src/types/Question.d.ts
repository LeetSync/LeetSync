export enum QuestionDifficulty {
  Easy = 'Easy',
  Medium = 'Medium',
  Hard = 'Hard',
}

export class QuestionListFilterInput {
  tags?: [string];
  difficulty?: QuestionDifficulty;
  sortOrder?: 'ASCENDING' | 'DESCENDING';
  sortBy?: 'FRONTEND_ID' | 'AC_RATE' | string;
}
export class Question {
  questionId: string;
  frontendQuestionId?: string;
  title: string;
  titleSlug: string;
  difficulty: QuestionDifficulty;
  content: string;
  likes: number;
  dislikes: number;
}
export class QuestionsCount {
  difficulty: QuestionDifficulty | 'All';
  count: number;
}

export class ProblemSet {
  questions: Question[];
  totalNum: QuestionsCount[];
}
