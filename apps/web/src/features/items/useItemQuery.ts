import { useQuery } from '@tanstack/react-query';
import { fetchItemById } from './api';

export function useItemQuery(id: string) {
  return useQuery({
    queryKey: ['items', 'detail', id] as const,
    queryFn: () => fetchItemById(id),
  });
}
