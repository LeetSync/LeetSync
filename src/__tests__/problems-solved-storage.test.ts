import { getProblemsSolved, saveProblemsSolved } from '../lib/problemsSolvedStorage';

const createProblemsSolved = (count: number) => {
  const problems: Record<string, any> = {};
  for (let i = 0; i < count; i++) {
    problems[`problem-${i}`] = {
      question: {
        difficulty: i % 3 === 0 ? 'Easy' : i % 3 === 1 ? 'Medium' : 'Hard',
        questionId: i + 1,
      },
      timestamp: 1700000000000 + i,
    };
  }
  return problems;
};

describe('ProblemsSolvedStorage', () => {
  let localData: Record<string, any>;
  let syncData: Record<string, any>;
  let localRemove: jest.Mock;
  let syncRemove: jest.Mock;

  beforeEach(() => {
    localData = {};
    syncData = {};
    const removeFrom = (store: Record<string, any>) => (keyOrKeys: string | string[]) => {
      const keys = Array.isArray(keyOrKeys) ? keyOrKeys : [keyOrKeys];
      keys.forEach((key: string) => (store[key] = undefined));
    };
    localRemove = jest.fn(removeFrom(localData));
    syncRemove = jest.fn(removeFrom(syncData));

    (global as any).chrome = {
      storage: {
        local: {
          get: jest.fn(async (keys) =>
            Array.isArray(keys)
              ? keys.reduce((acc: any, k: string) => ({ ...acc, [k]: localData[k] }), {})
              : { [keys]: localData[keys] },
          ),
          set: jest.fn(async (items) => Object.assign(localData, items)),
          remove: localRemove,
        },
        sync: {
          get: jest.fn(async (keys) =>
            Array.isArray(keys)
              ? keys.reduce((acc: any, k: string) => ({ ...acc, [k]: syncData[k] }), {})
              : { [keys]: syncData[keys] },
          ),
          set: jest.fn(async (items) => Object.assign(syncData, items)),
          remove: syncRemove,
        },
      },
      runtime: {},
    };
  });

  describe('getProblemsSolved', () => {
    it('returns the local problemsSolved when present', async () => {
      const problems = createProblemsSolved(2);
      localData.problemsSolved = problems;
      syncData.problemsSolved = { 'legacy-problem': {} };

      const result = await getProblemsSolved();

      expect(result).toEqual(problems);
      expect(syncRemove).not.toHaveBeenCalled();
    });

    it('migrates problemsSolved from sync storage when local is empty', async () => {
      const problems = createProblemsSolved(70);
      syncData.problemsSolved = problems;

      const result = await getProblemsSolved();

      expect(result).toEqual(problems);
      expect(localData.problemsSolved).toEqual(problems);
      expect(syncRemove).toHaveBeenCalledWith('problemsSolved');
      expect(syncData.problemsSolved).toBeUndefined();
    });

    it('returns an empty object when problemsSolved does not exist anywhere', async () => {
      const result = await getProblemsSolved();
      expect(result).toEqual({});
      expect(syncRemove).not.toHaveBeenCalled();
    });
  });

  describe('saveProblemsSolved', () => {
    it('writes problemsSolved to local storage', async () => {
      const problems = createProblemsSolved(100);
      await saveProblemsSolved(problems);
      expect(localData.problemsSolved).toEqual(problems);
    });
  });
});
