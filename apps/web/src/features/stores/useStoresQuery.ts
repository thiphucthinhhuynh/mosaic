import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { fetchStores } from './api';

export function useStoresQuery(params: { page: number; limit: number }) {
  return useQuery({
    queryKey: ['stores', 'list', params.page, params.limit] as const,
    queryFn: () => fetchStores(params),
    // Keeps the current page's rows on screen while the next page loads,
    // instead of flashing back to a loading state on every page change.
    placeholderData: keepPreviousData,
  });
}
