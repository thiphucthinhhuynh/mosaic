import { Link, Navigate, useParams } from 'react-router';
import { useAuth } from '@/features/auth';
import { EditItemForm, useItemQuery } from '@/features/items';
import { ApiError } from '@/lib/apiClient';

export function EditItemPage() {
  // Only ever rendered via the /items/:id/edit route, so id is always present.
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data: item, isPending, isError, error } = useItemQuery(id!);

  if (isPending) {
    return <p>Loading item…</p>;
  }

  if (isError) {
    if (error instanceof ApiError && error.status === 404) {
      return <p role="alert">Item not found.</p>;
    }
    return <p role="alert">Failed to load item: {error.message}</p>;
  }

  // <ProtectedRoute> already guarantees a signed-in user; this is the
  // ownership check the route itself can't express. An item's owner is its
  // store's owner. The API's requireOwnership remains the real enforcement
  // boundary.
  if (item.store.owner.id !== user!.id) {
    return <Navigate to={`/items/${item.id}`} replace />;
  }

  return (
    <>
      <h1>Edit {item.name}</h1>
      <EditItemForm item={item} />
      <p>
        <Link to={`/items/${item.id}`}>Back to {item.name}</Link>
      </p>
    </>
  );
}
