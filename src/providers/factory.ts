import { opencodeQuery } from '../opencode/provider.js';
import type { QueryOptions, QueryProvider, QueryProviderName, QueryResult } from './types.js';

const PROVIDERS: Record<QueryProviderName, QueryProvider> = {
  opencode: {
    name: 'opencode',
    query: opencodeQuery,
  },
};

export function getQueryProvider(name: QueryProviderName): QueryProvider {
  return PROVIDERS[name];
}

export async function queryWithProvider(
  name: QueryProviderName,
  options: QueryOptions,
): Promise<QueryResult> {
  return getQueryProvider(name).query(options);
}
