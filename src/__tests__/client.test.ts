import { getClient, LEETCODE_GRAPHQL_API_URL } from '../lib/client';
import { GraphQLClient } from 'graphql-request';

describe('getClient', () => {
  it('returns a GraphQLClient instance with the correct url', () => {
    const client = getClient();
    expect(client).toBeInstanceOf(GraphQLClient);
    expect((client as any).url).toBe(LEETCODE_GRAPHQL_API_URL);
  });

  it('returns the same instance on subsequent calls', () => {
    const first = getClient();
    const second = getClient();
    expect(first).toBe(second);
  });
});
