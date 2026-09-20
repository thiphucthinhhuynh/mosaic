import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UpdateStoreInput } from '@mosaic/shared';
import { updateStore } from './api';

export function useUpdateStoreMutation(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateStoreInput) => updateStore(id, input),
    onSuccess: (store) => {
      queryClient.setQueryData(['stores', 'detail', id], store);
      void queryClient.invalidateQueries({ queryKey: ['stores', 'list'] });
    },
  });
}
