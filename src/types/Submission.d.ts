import { Question } from './Question';

export class Distribution {
  lang: string;
  distribution: [string, number];
}

export class Submission {
  runtime: number;
  runtimeDisplay: string;
  runtimePercentile: number;
  runtimeDistribution: Distribution;
  memory: number;
  memoryDisplay: string;
  memoryPercentile: number;
  memoryDistribution: Distribution;
  code: string;
  timestamp: number;
  statusCode: number;
  lang: {
    name: string;
    verboseName: string;
  };
  question: Question;
  notes?: string;
  topicTags?: { tagId: string; slug: string; name: string }[];
  runtimeError?: string;
  compileError?: string;
  lastTestcase?: string;
  user: {
    username: string;
    profile: {
      realName: string;
      userAvatar: string;
    };
  };
}
