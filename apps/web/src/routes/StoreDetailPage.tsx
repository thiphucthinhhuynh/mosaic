import { Link, useParams } from 'react-router';
import { useAuth } from '@/features/auth';
import { StoreItemList } from '@/features/items';
import { DeleteStoreButton, useStoreQuery } from '@/features/stores';
import { ApiError } from '@/lib/apiClient';

export function StoreDetailPage() {
  // Only ever rendered via the /stores/:id route, so id is always present.
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
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

  const isOwner = user?.id === store.owner.id;

  return (
    <>
      <h1>{store.name}</h1>
      {store.location && <p>{store.location}</p>}
      {store.description && <p>{store.description}</p>}
      <p>Owned by {store.owner.username}</p>
      {isOwner && (
        <>
          <Link to={`/stores/${store.id}/edit`}>Edit store</Link>
          <Link to={`/stores/${store.id}/items/new`}>Add an item</Link>
          <DeleteStoreButton storeId={store.id} />
        </>
      )}
      <StoreItemList key={store.id} storeId={store.id} />
    </>
  );
}
