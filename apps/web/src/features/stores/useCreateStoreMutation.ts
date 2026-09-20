import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createStore } from './api';

export function useCreateStoreMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createStore,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['stores', 'list'] });
    },
  });
}
