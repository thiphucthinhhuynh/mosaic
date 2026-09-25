import { Link, useParams } from 'react-router';
import { useAuth } from '@/features/auth';
import { DeleteItemButton, useItemQuery } from '@/features/items';
import { ApiError } from '@/lib/apiClient';
import { formatPrice } from '@/lib/formatPrice';

export function ItemDetailPage() {
  // Only ever rendered via the /items/:id route, so id is always present.
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

  // An item has no owner of its own — it's owned by whoever owns its store.
  const isOwner = user?.id === item.store.owner.id;

  return (
    <>
      <h1>{item.name}</h1>
      <p>
        {formatPrice(item.price)} · {item.category}
      </p>
      <p>{item.quantity > 0 ? `${item.quantity} in stock` : 'Out of stock'}</p>
      {item.description && <p>{item.description}</p>}
      {item.images.length > 0 && (
        <ul aria-label="Item images">
          {item.images.map((image) => (
            <li key={image.id}>
              <img src={image.url} alt={item.name} loading="lazy" width={240} />
            </li>
          ))}
        </ul>
      )}
      <p>
        Sold by <Link to={`/stores/${item.store.id}`}>{item.store.name}</Link> (
        {item.store.owner.username})
      </p>
      {isOwner && (
        <>
          <Link to={`/items/${item.id}/edit`}>Edit item</Link>
          <DeleteItemButton itemId={item.id} storeId={item.store.id} />
        </>
      )}
    </>
  );
}
