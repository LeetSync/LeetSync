export type RevisionOutcome = 'independent' | 'hints' | 'failed';

export type PriorityBand = 'Immediate' | 'High' | 'Medium' | 'Low';

export type TopicClassification = 'Strength' | 'Weakness' | 'Developing' | 'Insufficient data';

export interface ProblemRecord {
  slug: string;
  title: string;
  frontendQuestionId?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topicTags: string[];
  firstSolvedTimestamp: number;
  lastSolvedTimestamp: number;
  attemptsCount: number;
  failedAttemptsCount: number;
  runtimePercentile?: number;
  memoryPercentile?: number;
  lastRevisionTimestamp?: number;
  revisionCount: number;
  lastRevisionOutcome?: RevisionOutcome;
  notes?: string;
  tagsSynced?: boolean;
}

export interface RevisionLogEntry {
  id: string;
  problemSlug: string;
  problemTitle: string;
  timestamp: number;
  outcome: RevisionOutcome;
  durationSeconds?: number; // Measured reliably during active revision session only
  notes?: string;
  difficulty: string;
  topicTags: string[];
}

export interface AttemptLogEntry {
  id: string;
  problemSlug: string;
  timestamp: number;
  success: boolean;
  statusCode?: number;
  statusDisplay?: string;
  runtimeMs?: number;
}

export interface ScoringWeights {
  weightTimeSinceSolve: number;   // Default: 0.30
  weightTopicWeakness: number;    // Default: 0.25
  weightFailedAttempts: number;   // Default: 0.25
  weightRevisionOutcome: number;  // Default: 0.20
}

export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  weightTimeSinceSolve: 0.30,
  weightTopicWeakness: 0.25,
  weightFailedAttempts: 0.25,
  weightRevisionOutcome: 0.20,
};

export interface PriorityExplanation {
  recencyScore: number;
  recencyContribution: number;
  recencyDays: number;
  recencyReason: string;

  outcomeScore: number;
  outcomeContribution: number;
  outcomeReason: string;

  topicScore: number;
  topicContribution: number;
  topicReason: string;

  attemptsScore: number;
  attemptsContribution: number;
  attemptsReason: string;

  activeWeights: ScoringWeights;
  missingDataNotes: string[];
}

export interface RankedProblem extends ProblemRecord {
  priorityScore: number; // 0 - 100
  priorityBand: PriorityBand;
  explanation: PriorityExplanation;
  daysSinceLastInteraction: number;
  nextRecommendedDate: number;
}

export interface TopicPerformance {
  topic: string;
  problemsSolved: number;
  totalAttempts: number;
  failedAttempts: number;
  attemptSuccessRate: number | null; // null if no attempt counts tracked
  totalRevisions: number;
  revisionsIndependent: number;
  revisionsHints: number;
  revisionsFailed: number;
  revisionSuccessRate: number | null; // null if no revisions
  masteryScore: number | null; // 0 - 100, null if insufficient data
  classification: TopicClassification;
  evidenceSummary: string;
  evidenceDetails: string[];
}

export interface WeekPeriodMetrics {
  startDate: string; // ISO date YYYY-MM-DD
  endDate: string;   // ISO date YYYY-MM-DD
  startTimestamp: number;
  endTimestamp: number;
  problemsSolved: number;
  newProblemsSolved: number;
  revisionsCompleted: number;
  totalAttempts: number;
  failedAttempts: number;
  outcomeBreakdown: {
    independent: number;
    hints: number;
    failed: number;
  };
  topicBreakdown: Record<string, { solved: number; revisions: number }>;
  timedRevisionCount: number;
  avgDurationSeconds: number | null;
}

export interface PeriodComparison {
  hasSufficientHistoricalData: boolean;
  insufficientDataReason?: string;
  solvedDelta?: number;
  revisionDelta?: number;
  failureRateCurrent?: number | null;
  failureRatePrevious?: number | null;
  failureRateDelta?: number | null;
}

export interface WeeklyReport {
  currentWeek: WeekPeriodMetrics;
  previousWeek: WeekPeriodMetrics;
  comparison: PeriodComparison;
}

export interface SimilarProblemRecommendation {
  problem: ProblemRecord;
  targetProblemSlug: string;
  sharedTags: string[];
  similarityScore: number; // 0 - 100
  reason: string;
  relevanceTag: 'Weak Topic Reinforcement' | 'Shared Core Pattern' | 'Due for Revision';
}

export interface RevisionTrackerStorageData {
  version: number;
  problems: Record<string, ProblemRecord>;
  revisions: RevisionLogEntry[];
  attempts: AttemptLogEntry[];
  settings: {
    weights: ScoringWeights;
    lastSyncedAt?: number;
  };
}
