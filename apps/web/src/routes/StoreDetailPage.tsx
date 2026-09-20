import { useParams } from 'react-router';
import { useStoreQuery } from '@/features/stores';
import { ApiError } from '@/lib/apiClient';

export function StoreDetailPage() {
  // Only ever rendered via the /stores/:id route, so id is always present.
  const { id } = useParams<{ id: string }>();
  const { data: store, isPending, isError, error } = useStoreQuery(id!);

  if (isPending) {
    return <p>Loading store…</p>;
  }

  if (isError) {
    if (error instanceof ApiError && error.status === 404) {
      return <p role="alert">Store not found.</p>;
    }
    return <p role="alert">Failed to load store: {error.message}</p>;
  }

  return (
    <>
      <h1>{store.name}</h1>
      {store.location && <p>{store.location}</p>}
      {store.description && <p>{store.description}</p>}
      <p>Owned by {store.owner.username}</p>
    </>
  );
}
