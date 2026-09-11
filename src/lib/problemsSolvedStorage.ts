export type ProblemsSolvedMap = Record<
  string,
  {
    question: {
      difficulty: 'Easy' | 'Medium' | 'Hard';
      questionId: number | string;
    };
    timestamp: number;
  }
>;

const PROBLEMS_SOLVED_KEY = 'problemsSolved';

// Reads the solved problems from local storage and returns them.
// If local storage is empty but sync storage still holds legacy data, the
// data is migrated to local storage (where 'unlimitedStorage' applies) and
// removed from sync storage, since chrome.storage.sync has a hard per-item
// quota that silently drops writes once exceeded.
export const getProblemsSolved = async (): Promise<ProblemsSolvedMap> => {
  const local = await chrome.storage.local.get(PROBLEMS_SOLVED_KEY);
  if (local[PROBLEMS_SOLVED_KEY]) return local[PROBLEMS_SOLVED_KEY];

  const synced = await chrome.storage.sync.get(PROBLEMS_SOLVED_KEY);
  if (synced[PROBLEMS_SOLVED_KEY]) {
    const migrated = synced[PROBLEMS_SOLVED_KEY];
    await chrome.storage.local.set({ [PROBLEMS_SOLVED_KEY]: migrated });
    await chrome.storage.sync.remove(PROBLEMS_SOLVED_KEY);
    return migrated;
  }

  return {};
};

export const saveProblemsSolved = async (problemsSolved: ProblemsSolvedMap): Promise<void> => {
  await chrome.storage.local.set({ [PROBLEMS_SOLVED_KEY]: problemsSolved });
};
