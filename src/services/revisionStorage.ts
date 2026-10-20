import {
  DEFAULT_SCORING_WEIGHTS,
  ProblemRecord,
  RevisionLogEntry,
  RevisionOutcome,
  RevisionTrackerStorageData,
  ScoringWeights,
} from '../types/Revision';

export const REVISION_STORAGE_KEY = 'leetsync_revision_tracker_v1';
export const CURRENT_STORAGE_VERSION = 1;

let memoryFallbackStorage: Record<string, any> = {};

export const getStorageEngine = () => {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    return {
      async get<T = any>(key: string): Promise<T | null> {
        return new Promise((resolve) => {
          chrome.storage.local.get([key], (result) => {
            if (chrome.runtime?.lastError) {
              console.warn('Storage get error:', chrome.runtime.lastError.message);
              resolve(null);
            } else {
              resolve((result && result[key]) ?? null);
            }
          });
        });
      },
      async set(key: string, value: any): Promise<boolean> {
        return new Promise((resolve) => {
          chrome.storage.local.set({ [key]: value }, () => {
            if (chrome.runtime?.lastError) {
              console.error('Storage set error:', chrome.runtime.lastError.message);
              resolve(false);
            } else {
              resolve(true);
            }
          });
        });
      },
      async getSync<T = any>(key: string): Promise<T | null> {
        return new Promise((resolve) => {
          if (!chrome.storage.sync) {
            resolve(null);
            return;
          }
          chrome.storage.sync.get([key], (result) => {
            if (chrome.runtime?.lastError) {
              resolve(null);
            } else {
              resolve((result && result[key]) ?? null);
            }
          });
        });
      },
    };
  }

  // Fallback for Node/test environments or mock contexts
  return {
    async get<T = any>(key: string): Promise<T | null> {
      return (memoryFallbackStorage[key] as T) ?? null;
    },
    async set(key: string, value: any): Promise<boolean> {
      memoryFallbackStorage[key] = value;
      return true;
    },
    async getSync<T = any>(key: string): Promise<T | null> {
      return (memoryFallbackStorage[key] as T) ?? null;
    },
  };
};

export const formatSlugToTitle = (slug: string): string => {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export class RevisionStorageService {
  private static instance: RevisionStorageService;

  public static getInstance(): RevisionStorageService {
    if (!RevisionStorageService.instance) {
      RevisionStorageService.instance = new RevisionStorageService();
    }
    return RevisionStorageService.instance;
  }

  /**
   * Loads the revision tracker data and automatically performs backward-compatible migration
   * from existing legacy chrome.storage.sync problemsSolved.
   */
  async loadData(): Promise<RevisionTrackerStorageData> {
    const storage = getStorageEngine();
    let data = await storage.get<RevisionTrackerStorageData>(REVISION_STORAGE_KEY);

    if (!data || typeof data !== 'object') {
      data = {
        version: CURRENT_STORAGE_VERSION,
        problems: {},
        revisions: [],
        attempts: [],
        settings: {
          weights: { ...DEFAULT_SCORING_WEIGHTS },
        },
      };
    } else {
      // Ensure all required fields exist
      data.version = data.version || CURRENT_STORAGE_VERSION;
      data.problems = data.problems || {};
      data.revisions = Array.isArray(data.revisions) ? data.revisions : [];
      data.attempts = Array.isArray(data.attempts) ? data.attempts : [];
      data.settings = data.settings || { weights: { ...DEFAULT_SCORING_WEIGHTS } };
      data.settings.weights = { ...DEFAULT_SCORING_WEIGHTS, ...(data.settings.weights || {}) };
    }

    // Migrate from legacy chrome.storage.sync problemsSolved if any exist
    try {
      const legacyProblemsSolved = await storage.getSync<Record<string, any>>('problemsSolved');
      if (legacyProblemsSolved && typeof legacyProblemsSolved === 'object') {
        let hasNewImports = false;
        for (const [slug, item] of Object.entries(legacyProblemsSolved)) {
          if (!slug || typeof slug !== 'string') continue;
          if (!data.problems[slug]) {
            const rawDiff = item?.question?.difficulty;
            const difficulty = (rawDiff === 'Easy' || rawDiff === 'Medium' || rawDiff === 'Hard')
              ? rawDiff
              : 'Medium';
            const timestamp = typeof item?.timestamp === 'number' ? item.timestamp : Date.now();

            data.problems[slug] = {
              slug,
              title: formatSlugToTitle(slug),
              frontendQuestionId: item?.question?.questionFrontendId || item?.question?.questionId || '',
              difficulty,
              topicTags: Array.isArray(item?.question?.topicTags)
                ? item.question.topicTags.map((t: any) => typeof t === 'string' ? t : t?.name || t?.slug).filter(Boolean)
                : [],
              firstSolvedTimestamp: timestamp,
              lastSolvedTimestamp: timestamp,
              attemptsCount: 1, // At least the 1 verified solve
              failedAttemptsCount: 0,
              revisionCount: 0,
              tagsSynced: false,
            };
            hasNewImports = true;
          }
        }
        if (hasNewImports) {
          await this.saveData(data);
        }
      }
    } catch (e) {
      console.warn('Migration from sync storage failed:', e);
    }

    return data;
  }

  async saveData(data: RevisionTrackerStorageData): Promise<boolean> {
    const storage = getStorageEngine();
    return storage.set(REVISION_STORAGE_KEY, data);
  }

  /**
   * Records a problem solve directly from live LeetCode submission
   */
  async recordSolve(params: {
    slug: string;
    title: string;
    frontendQuestionId?: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    topicTags: string[];
    timestamp?: number;
    runtimePercentile?: number;
    memoryPercentile?: number;
    isSuccess: boolean;
  }): Promise<ProblemRecord> {
    const data = await this.loadData();
    const timestamp = params.timestamp || Date.now();
    const existing = data.problems[params.slug];

    let problem: ProblemRecord;
    if (existing) {
      problem = {
        ...existing,
        title: params.title || existing.title,
        frontendQuestionId: params.frontendQuestionId || existing.frontendQuestionId,
        difficulty: params.difficulty || existing.difficulty,
        topicTags: params.topicTags?.length ? params.topicTags : existing.topicTags,
        lastSolvedTimestamp: params.isSuccess ? timestamp : existing.lastSolvedTimestamp,
        attemptsCount: existing.attemptsCount + 1,
        failedAttemptsCount: params.isSuccess ? existing.failedAttemptsCount : existing.failedAttemptsCount + 1,
        runtimePercentile: params.runtimePercentile ?? existing.runtimePercentile,
        memoryPercentile: params.memoryPercentile ?? existing.memoryPercentile,
        tagsSynced: (params.topicTags && params.topicTags.length > 0) || existing.tagsSynced,
      };
    } else {
      problem = {
        slug: params.slug,
        title: params.title || formatSlugToTitle(params.slug),
        frontendQuestionId: params.frontendQuestionId || '',
        difficulty: params.difficulty || 'Medium',
        topicTags: params.topicTags || [],
        firstSolvedTimestamp: timestamp,
        lastSolvedTimestamp: timestamp,
        attemptsCount: 1,
        failedAttemptsCount: params.isSuccess ? 0 : 1,
        runtimePercentile: params.runtimePercentile,
        memoryPercentile: params.memoryPercentile,
        revisionCount: 0,
        tagsSynced: !!(params.topicTags && params.topicTags.length > 0),
      };
    }

    data.problems[params.slug] = problem;

    // Log the attempt
    data.attempts.push({
      id: `att_${timestamp}_${Math.random().toString(36).slice(2, 8)}`,
      problemSlug: params.slug,
      timestamp,
      success: params.isSuccess,
    });

    await this.saveData(data);
    return problem;
  }

  /**
   * Records a user revision session outcome with optional duration and notes.
   */
  async recordRevision(params: {
    problemSlug: string;
    outcome: RevisionOutcome;
    durationSeconds?: number;
    notes?: string;
    timestamp?: number;
  }): Promise<{ problem: ProblemRecord; logEntry: RevisionLogEntry }> {
    const data = await this.loadData();
    const timestamp = params.timestamp || Date.now();
    const problem = data.problems[params.problemSlug];

    if (!problem) {
      throw new Error(`Cannot record revision for untracked problem: ${params.problemSlug}`);
    }

    // Update problem stats
    problem.lastRevisionTimestamp = timestamp;
    problem.lastRevisionOutcome = params.outcome;
    problem.revisionCount = (problem.revisionCount || 0) + 1;
    if (params.notes !== undefined) {
      problem.notes = params.notes;
    }

    const logEntry: RevisionLogEntry = {
      id: `rev_${timestamp}_${Math.random().toString(36).slice(2, 8)}`,
      problemSlug: problem.slug,
      problemTitle: problem.title,
      timestamp,
      outcome: params.outcome,
      durationSeconds: params.durationSeconds, // Real timed duration only, never fabricated
      notes: params.notes,
      difficulty: problem.difficulty,
      topicTags: problem.topicTags || [],
    };

    data.revisions.push(logEntry);
    await this.saveData(data);

    return { problem, logEntry };
  }

  /**
   * Updates problem verified tags after syncing from LeetCode
   */
  async updateProblemTags(slug: string, tags: string[], frontendId?: string, title?: string): Promise<boolean> {
    const data = await this.loadData();
    const problem = data.problems[slug];
    if (!problem) return false;

    problem.topicTags = tags;
    problem.tagsSynced = true;
    if (frontendId) problem.frontendQuestionId = frontendId;
    if (title) problem.title = title;

    return this.saveData(data);
  }

  /**
   * Updates scoring weights
   */
  async updateWeights(weights: ScoringWeights): Promise<boolean> {
    const data = await this.loadData();
    // Normalize weights to sum to 1
    const total =
      weights.weightTimeSinceSolve +
      weights.weightTopicWeakness +
      weights.weightFailedAttempts +
      weights.weightRevisionOutcome;

    if (total <= 0) return false;

    data.settings.weights = {
      weightTimeSinceSolve: Number((weights.weightTimeSinceSolve / total).toFixed(4)),
      weightTopicWeakness: Number((weights.weightTopicWeakness / total).toFixed(4)),
      weightFailedAttempts: Number((weights.weightFailedAttempts / total).toFixed(4)),
      weightRevisionOutcome: Number((weights.weightRevisionOutcome / total).toFixed(4)),
    };

    return this.saveData(data);
  }

  /**
   * Clear test data (useful for test suites)
   */
  static clearMemoryStorageForTests(): void {
    memoryFallbackStorage = {};
  }
}
