import { useQuery } from '@tanstack/react-query';
import { fetchStoreById } from './api';

export function useStoreQuery(id: string) {
  return useQuery({
    queryKey: ['stores', 'detail', id] as const,
    queryFn: () => fetchStoreById(id),
  });
}
