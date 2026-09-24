import { Link, Navigate, useParams } from 'react-router';
import { useAuth } from '@/features/auth';
import { CreateItemForm } from '@/features/items';
import { useStoreQuery } from '@/features/stores';
import { ApiError } from '@/lib/apiClient';

export function CreateItemPage() {
  // Only ever rendered via the /stores/:id/items/new route, so id is always present.
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

  // <ProtectedRoute> already guarantees a signed-in user; this is the
  // ownership check the route itself can't express. The API's
  // requireOwnership remains the real enforcement boundary.
  if (store.owner.id !== user!.id) {
    return <Navigate to={`/stores/${store.id}`} replace />;
  }

  return (
    <>
      <h1>Add an item to {store.name}</h1>
      <CreateItemForm storeId={store.id} />
      <p>
        <Link to={`/stores/${store.id}`}>Back to {store.name}</Link>
      </p>
    </>
  );
}
