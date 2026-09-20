import { useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '@/features/auth';
import { useStoresQuery } from '@/features/stores';

const PAGE_SIZE = 20;

export function StoresPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const { data, isPending, isError, error } = useStoresQuery({ page, limit: PAGE_SIZE });

  if (isPending) {
    return <p>Loading stores…</p>;
  }

  if (isError) {
    return <p role="alert">Failed to load stores: {error.message}</p>;
  }

  const { stores, meta } = data;

  return (
    <>
      <h1>Stores</h1>
      {user && <Link to="/stores/new">Create a store</Link>}
      {stores.length === 0 ? (
        <p>No stores yet.</p>
      ) : (
        <ul>
          {stores.map((store) => (
            <li key={store.id}>
              <Link to={`/stores/${store.id}`}>{store.name}</Link>
              {store.location && <span> — {store.location}</span>}
            </li>
          ))}
        </ul>
      )}
      <div>
        <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          Previous
        </button>
        <span>
          {' '}
          Page {meta.page} of {Math.max(meta.totalPages, 1)}{' '}
        </span>
        <button
          type="button"
          disabled={page >= meta.totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
      </div>
    </>
  );
}
