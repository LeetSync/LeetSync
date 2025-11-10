const makeResolved = (value) => jest.fn().mockResolvedValue(value);

const browser = {
  storage: {
    sync: {
      get: makeResolved({}),
      set: makeResolved(undefined),
      clear: makeResolved(undefined),
      remove: makeResolved(undefined),
    },
  },
  tabs: {
    query: makeResolved([]),
    sendMessage: makeResolved(undefined),
    getCurrent: makeResolved(undefined),
    create: makeResolved(undefined),
    remove: makeResolved(undefined),
  },
  runtime: {
    onMessage: {
      addListener: jest.fn(),
    },
    sendMessage: makeResolved(undefined),
  },
  action: {
    setIcon: makeResolved(undefined),
  },
  cookies: {
    get: makeResolved(undefined),
    onChanged: {
      addListener: jest.fn(),
    },
  },
  webRequest: {
    onCompleted: {
      addListener: jest.fn(),
    },
  },
};

module.exports = browser;
