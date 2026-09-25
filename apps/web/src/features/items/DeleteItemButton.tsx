import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ApiError } from '@/lib/apiClient';
import { useDeleteItemMutation } from './useDeleteItemMutation';

export function DeleteItemButton({ itemId, storeId }: { itemId: string; storeId: string }) {
  const navigate = useNavigate();
  const deleteItemMutation = useDeleteItemMutation(itemId, storeId);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setError(null);
    try {
      await deleteItemMutation.mutateAsync();
      void navigate(`/stores/${storeId}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.');
    }
  };

  if (!confirming) {
    return (
      <button type="button" onClick={() => setConfirming(true)}>
        Delete item
      </button>
    );
  }

  return (
    <div>
      <p>Are you sure you want to delete this item? This cannot be undone.</p>
      <button
        type="button"
        onClick={() => void handleDelete()}
        disabled={deleteItemMutation.isPending}
      >
        Yes, delete it
      </button>
      <button type="button" onClick={() => setConfirming(false)}>
        Cancel
      </button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
