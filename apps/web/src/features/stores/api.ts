import type { PublicStore } from '@mosaic/shared';
import { apiClient, apiClientWithMeta } from '@/lib/apiClient';

export type StoresListMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export async function fetchStores(params: {
  page: number;
  limit: number;
}): Promise<{ stores: PublicStore[]; meta: StoresListMeta }> {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  });
  const { data, meta } = await apiClientWithMeta<PublicStore[]>(`/api/v1/stores?${query}`);
  return { stores: data, meta: meta as StoresListMeta };
}

export function fetchStoreById(id: string): Promise<PublicStore> {
  return apiClient<PublicStore>(`/api/v1/stores/${id}`);
}
