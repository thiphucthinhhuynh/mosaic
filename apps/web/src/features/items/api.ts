import type { PublicItem, PublicItemDetail } from '@mosaic/shared';
import { apiClient, apiClientWithMeta } from '@/lib/apiClient';

export type ItemsListMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export async function fetchItemsByStore(
  storeId: string,
  params: { page: number; limit: number },
): Promise<{ items: PublicItem[]; meta: ItemsListMeta }> {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  });
  const { data, meta } = await apiClientWithMeta<PublicItem[]>(
    `/api/v1/stores/${storeId}/items?${query}`,
  );
  return { items: data, meta: meta as ItemsListMeta };
}

export function fetchItemById(id: string): Promise<PublicItemDetail> {
  return apiClient<PublicItemDetail>(`/api/v1/items/${id}`);
}
