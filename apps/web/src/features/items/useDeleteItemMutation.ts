import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteItem } from './api';

export function useDeleteItemMutation(id: string, storeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteItem(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['items', 'list', storeId] });
      // The item's detail query is deliberately left alone: the detail page
      // is still mounted when this runs, so invalidating or removing it would
      // trigger a refetch that 404s ("Item not found") before the caller's
      // navigation lands. The stale entry is garbage-collected, and a later
      // visit to /items/:id refetches and 404s correctly.
    },
  });
}
