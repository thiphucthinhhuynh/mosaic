import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { fetchItemsByStore } from './api';

export function useStoreItemsQuery(storeId: string, params: { page: number; limit: number }) {
  return useQuery({
    // storeId is part of the key so two stores' item lists never share a
    // cache entry; ['items'] as a prefix lets later mutations invalidate
    // every item query at once.
    queryKey: ['items', 'list', storeId, params.page, params.limit] as const,
    queryFn: () => fetchItemsByStore(storeId, params),
    placeholderData: keepPreviousData,
  });
}
