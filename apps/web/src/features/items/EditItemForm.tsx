import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router';
import { createItemSchema, type CreateItemInput, type PublicItemDetail } from '@mosaic/shared';
import { ApiError } from '@/lib/apiClient';
import { ItemFormFields } from './ItemFormFields';
import { useUpdateItemMutation } from './useUpdateItemMutation';

export function EditItemForm({ item }: { item: PublicItemDetail }) {
  const navigate = useNavigate();
  const updateItemMutation = useUpdateItemMutation(item.id, item.store.id);
  const [formError, setFormError] = useState<string | null>(null);
  // Validated with createItemSchema, not updateItemSchema: the form is
  // pre-filled with every field and always submits all of them, so the
  // stricter "everything required" schema is the right one — it stops a
  // required field being blanked, which updateItemSchema's partial() would
  // only catch per-field anyway. The full imageUrls list is sent, which the
  // API treats as a replacement set (removed rows disappear, new ones appear).
  const form = useForm<CreateItemInput>({
    resolver: zodResolver(createItemSchema),
    defaultValues: {
      name: item.name,
      description: item.description ?? '',
      // price arrives as a decimal string ("24.99"); the number input and the
      // schema both work in numbers.
      price: Number(item.price),
      quantity: item.quantity,
      category: item.category,
      imageUrls: item.images.map((image) => image.url),
    },
  });
  const { handleSubmit } = form;

  const onSubmit = async (data: CreateItemInput) => {
    setFormError(null);
    try {
      await updateItemMutation.mutateAsync(data);
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
        Save changes
      </button>
    </form>
  );
}
