import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router';
import { createStoreSchema, type CreateStoreInput } from '@mosaic/shared';
import { ApiError } from '@/lib/apiClient';
import { useCreateStoreMutation } from './useCreateStoreMutation';

export function CreateStoreForm() {
  const navigate = useNavigate();
  const createStoreMutation = useCreateStoreMutation();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateStoreInput>({ resolver: zodResolver(createStoreSchema) });

  const onSubmit = async (data: CreateStoreInput) => {
    setFormError(null);
    try {
      const store = await createStoreMutation.mutateAsync(data);
      void navigate(`/stores/${store.id}`);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Something went wrong.');
    }
  };

  return (
    <form onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
      <div>
        <label htmlFor="store-name">Name</label>
        <input id="store-name" type="text" {...register('name')} />
        {errors.name && <p role="alert">{errors.name.message}</p>}
      </div>
      <div>
        <label htmlFor="store-description">Description</label>
        <textarea id="store-description" {...register('description')} />
        {errors.description && <p role="alert">{errors.description.message}</p>}
      </div>
      <div>
        <label htmlFor="store-location">Location</label>
        <input id="store-location" type="text" {...register('location')} />
        {errors.location && <p role="alert">{errors.location.message}</p>}
      </div>
      {formError && <p role="alert">{formError}</p>}
      <button type="submit" disabled={isSubmitting}>
        Create store
      </button>
    </form>
  );
}
