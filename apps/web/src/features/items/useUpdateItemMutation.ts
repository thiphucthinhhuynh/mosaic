import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { PublicItemDetail, UpdateItemInput } from '@mosaic/shared';
import { updateItem } from './api';

export function useUpdateItemMutation(id: string, storeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateItemInput) => updateItem(id, input),
    onSuccess: (item) => {
      // The PUT response is a PublicItem (no embedded store), so merge it
      // into the cached detail rather than replacing it — this lets the
      // detail page show the new values immediately instead of flashing the
      // old ones until a refetch lands.
      queryClient.setQueryData<PublicItemDetail>(['items', 'detail', id], (cached) =>
        cached ? { ...cached, ...item } : cached,
      );
      void queryClient.invalidateQueries({ queryKey: ['items', 'list', storeId] });
    },
  });
}
