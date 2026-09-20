import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteStore } from './api';

export function useDeleteStoreMutation(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteStore(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['stores', 'list'] });
      queryClient.removeQueries({ queryKey: ['stores', 'detail', id] });
    },
  });
}
