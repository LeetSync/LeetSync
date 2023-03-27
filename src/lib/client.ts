import { GraphQLClient } from 'graphql-request';
let client: GraphQLClient;

export const LEETCODE_GRAPHQL_API_URL = 'https://leetcode.com/graphql';
export function getClient() {
  if (!client) {
    client = new GraphQLClient(LEETCODE_GRAPHQL_API_URL);
  }
  return client;
}
