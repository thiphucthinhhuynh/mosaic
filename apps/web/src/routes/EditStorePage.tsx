import { Navigate, useParams } from 'react-router';
import { useAuth } from '@/features/auth';
import { EditStoreForm, useStoreQuery } from '@/features/stores';
import { ApiError } from '@/lib/apiClient';

export function EditStorePage() {
  // Only ever rendered via the /stores/:id/edit route, so id is always present.
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
  // ownership check the route itself can't express.
  if (store.owner.id !== user!.id) {
    return <Navigate to={`/stores/${store.id}`} replace />;
  }

  return (
    <>
      <h1>Edit {store.name}</h1>
      <EditStoreForm store={store} />
    </>
  );
}
