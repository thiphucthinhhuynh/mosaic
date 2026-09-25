import type { UseFormReturn } from 'react-hook-form';
import type { CreateItemInput } from '@mosaic/shared';

// The field set shared by CreateItemForm and EditItemForm. Both validate
// against createItemSchema (the edit form always submits the full pre-filled
// item, so every field is required there too), which is why one form type
// serves both.
export function ItemFormFields({ form }: { form: UseFormReturn<CreateItemInput> }) {
  const {
    register,
    watch,
    setValue,
    formState: { errors, isSubmitted },
  } = form;

  // useFieldArray doesn't support arrays of plain strings, and the shared
  // schema's imageUrls is string[] — so the list is driven by watch/setValue
  // instead, which keeps the form validating against createItemSchema as-is.
  const imageUrls = watch('imageUrls') ?? [];

  const setImageUrls = (next: string[]) =>
    setValue('imageUrls', next, { shouldValidate: isSubmitted, shouldDirty: true });

  return (
    <>
      <div>
        <label htmlFor="item-name">Name</label>
        <input id="item-name" type="text" {...register('name')} />
        {errors.name && <p role="alert">{errors.name.message}</p>}
      </div>
      <div>
        <label htmlFor="item-description">Description</label>
        <textarea id="item-description" {...register('description')} />
        {errors.description && <p role="alert">{errors.description.message}</p>}
      </div>
      <div>
        <label htmlFor="item-price">Price (USD)</label>
        <input
          id="item-price"
          type="number"
          step="0.01"
          inputMode="decimal"
          {...register('price', { valueAsNumber: true })}
        />
        {errors.price && <p role="alert">{errors.price.message}</p>}
      </div>
      <div>
        <label htmlFor="item-quantity">Quantity in stock</label>
        <input
          id="item-quantity"
          type="number"
          step="1"
          inputMode="numeric"
          {...register('quantity', { valueAsNumber: true })}
        />
        {errors.quantity && <p role="alert">{errors.quantity.message}</p>}
      </div>
      <div>
        <label htmlFor="item-category">Category</label>
        <input id="item-category" type="text" {...register('category')} />
        {errors.category && <p role="alert">{errors.category.message}</p>}
      </div>
      <fieldset>
        <legend>Image URLs</legend>
        {imageUrls.map((url, index) => (
          // Index keys are safe here: inputs are controlled by `url`, so a
          // removal can't leave stale uncontrolled state behind.
          <div key={index}>
            <label htmlFor={`item-image-${index}`}>Image {index + 1}</label>
            <input
              id={`item-image-${index}`}
              type="url"
              value={url}
              onChange={(e) =>
                setImageUrls(imageUrls.map((u, i) => (i === index ? e.target.value : u)))
              }
            />
            <button
              type="button"
              onClick={() => setImageUrls(imageUrls.filter((_, i) => i !== index))}
            >
              Remove image {index + 1}
            </button>
            {errors.imageUrls?.[index] && <p role="alert">{errors.imageUrls[index].message}</p>}
          </div>
        ))}
        <button type="button" onClick={() => setImageUrls([...imageUrls, ''])}>
          Add image URL
        </button>
      </fieldset>
    </>
  );
}
