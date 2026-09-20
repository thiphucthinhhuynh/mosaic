import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ApiError } from '@/lib/apiClient';
import { useDeleteStoreMutation } from './useDeleteStoreMutation';

export function DeleteStoreButton({ storeId }: { storeId: string }) {
  const navigate = useNavigate();
  const deleteStoreMutation = useDeleteStoreMutation(storeId);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setError(null);
    try {
      await deleteStoreMutation.mutateAsync();
      void navigate('/stores');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.');
    }
  };

  if (!confirming) {
    return (
      <button type="button" onClick={() => setConfirming(true)}>
        Delete store
      </button>
    );
  }

  return (
    <div>
      <p>Are you sure you want to delete this store? This cannot be undone.</p>
      <button
        type="button"
        onClick={() => void handleDelete()}
        disabled={deleteStoreMutation.isPending}
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
