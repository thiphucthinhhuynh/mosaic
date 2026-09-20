import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router';
import { updateStoreSchema, type PublicStore, type UpdateStoreInput } from '@mosaic/shared';
import { ApiError } from '@/lib/apiClient';
import { useUpdateStoreMutation } from './useUpdateStoreMutation';

export function EditStoreForm({ store }: { store: PublicStore }) {
  const navigate = useNavigate();
  const updateStoreMutation = useUpdateStoreMutation(store.id);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateStoreInput>({
    resolver: zodResolver(updateStoreSchema),
    defaultValues: {
      name: store.name,
      description: store.description ?? '',
      location: store.location ?? '',
    },
  });

  const onSubmit = async (data: UpdateStoreInput) => {
    setFormError(null);
    try {
      await updateStoreMutation.mutateAsync(data);
      void navigate(`/stores/${store.id}`);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Something went wrong.');
    }
  };

  return (
    <form onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
      <div>
        <label htmlFor="edit-store-name">Name</label>
        <input id="edit-store-name" type="text" {...register('name')} />
        {errors.name && <p role="alert">{errors.name.message}</p>}
      </div>
      <div>
        <label htmlFor="edit-store-description">Description</label>
        <textarea id="edit-store-description" {...register('description')} />
        {errors.description && <p role="alert">{errors.description.message}</p>}
      </div>
      <div>
        <label htmlFor="edit-store-location">Location</label>
        <input id="edit-store-location" type="text" {...register('location')} />
        {errors.location && <p role="alert">{errors.location.message}</p>}
      </div>
      {formError && <p role="alert">{formError}</p>}
      <button type="submit" disabled={isSubmitting}>
        Save changes
      </button>
    </form>
  );
}
