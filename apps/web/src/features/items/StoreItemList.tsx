import { useState } from 'react';
import { Link } from 'react-router';
import { formatPrice } from '@/lib/formatPrice';
import { useStoreItemsQuery } from './useStoreItemsQuery';

const PAGE_SIZE = 20;

// Guest-visible list of a store's items, rendered on the store detail page.
// Owns its own pagination state and loading/error states so a failure here
// never blanks the rest of the store page.
export function StoreItemList({ storeId }: { storeId: string }) {
  const [page, setPage] = useState(1);
  const { data, isPending, isError, error } = useStoreItemsQuery(storeId, {
    page,
    limit: PAGE_SIZE,
  });

  if (isPending) {
    return <p>Loading items…</p>;
  }

  if (isError) {
    return <p role="alert">Failed to load items: {error.message}</p>;
  }

  const { items, meta } = data;

  return (
    <section aria-labelledby="store-items-heading">
      <h2 id="store-items-heading">Items</h2>
      {items.length === 0 ? (
        <p>This store has no items yet.</p>
      ) : (
        <ul>
          {items.map((item) => (
            <li key={item.id}>
              <Link to={`/items/${item.id}`}>{item.name}</Link>
              <span>
                {' '}
                — {formatPrice(item.price)} · {item.category}
                {item.quantity === 0 && ' · Out of stock'}
              </span>
            </li>
          ))}
        </ul>
      )}
      {meta.totalPages > 1 && (
        <div>
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </button>
          <span>
            {' '}
            Page {meta.page} of {meta.totalPages}{' '}
          </span>
          <button
            type="button"
            disabled={page >= meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
}
