import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateItemInput } from '@mosaic/shared';
import { createItem } from './api';

export function useCreateItemMutation(storeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateItemInput) => createItem(storeId, input),
    onSuccess: () => {
      // Matches every page of this store's item list (see useStoreItemsQuery's key).
      void queryClient.invalidateQueries({ queryKey: ['items', 'list', storeId] });
    },
  });
}
