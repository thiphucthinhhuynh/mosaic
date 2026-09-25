import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router';
import { createItemSchema, type CreateItemInput } from '@mosaic/shared';
import { ApiError } from '@/lib/apiClient';
import { ItemFormFields } from './ItemFormFields';
import { useCreateItemMutation } from './useCreateItemMutation';

export function CreateItemForm({ storeId }: { storeId: string }) {
  const navigate = useNavigate();
  const createItemMutation = useCreateItemMutation(storeId);
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<CreateItemInput>({
    resolver: zodResolver(createItemSchema),
    defaultValues: { imageUrls: [] },
  });
  const { handleSubmit } = form;

  const onSubmit = async (data: CreateItemInput) => {
    setFormError(null);
    try {
      const item = await createItemMutation.mutateAsync(data);
      void navigate(`/items/${item.id}`);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Something went wrong.');
    }
  };

  return (
    <form onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
      <ItemFormFields form={form} />
      {formError && <p role="alert">{formError}</p>}
      <button type="submit" disabled={form.formState.isSubmitting}>
        Create item
      </button>
    </form>
  );
}
