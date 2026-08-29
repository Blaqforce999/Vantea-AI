'use client';

import { useRef, useState, type ChangeEvent } from 'react';

import type { Category } from '@prisma/client';
import { ImagePlus } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { CATEGORY_OPTIONS } from '@/lib/constants';
import { compressImageFile, ImageTooLargeError } from '@/lib/image';

export type ItemFormValues = {
  imageUrl: string | null;
  name: string;
  category: Category;
  value: string;
  currency: string;
  acquiredDate: string;
  whyNote: string;
};

type ItemFormFieldsProps = {
  values: ItemFormValues;
  onChange: (values: ItemFormValues) => void;
  disabled?: boolean;
  idPrefix: string;
};

/**
 * The shared field set behind both the AI review modal (ParsePreview) and
 * Manual Entry — image, name, category, value/currency, date, why-it-
 * mattered. Fully controlled so both callers own their own state and can
 * seed it differently (parsed values vs. blank), while the actual form
 * markup only exists once.
 */
export function ItemFormFields({ values, onChange, disabled, idPrefix }: ItemFormFieldsProps) {
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof ItemFormValues>(key: K, value: ItemFormValues[K]) {
    onChange({ ...values, [key]: value });
  }

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageError(null);
    try {
      set('imageUrl', await compressImageFile(file));
    } catch (err) {
      setImageError(err instanceof ImageTooLargeError ? err.message : "Couldn't read that image.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return (
    <div className="flex flex-col gap-12">
      <div className="flex items-center gap-12">
        {values.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- item photos are data: URIs or arbitrary https URLs, not a known remote-image domain set.
          <img src={values.imageUrl} alt="" className="h-64 w-64 shrink-0 rounded-lg object-cover" />
        ) : (
          <div className="flex h-64 w-64 shrink-0 items-center justify-center rounded-lg bg-surface-container-high text-on-surface-variant">
            <ImagePlus size={22} aria-hidden="true" />
          </div>
        )}
        <div className="flex flex-col items-start gap-6">
          <Button type="button" variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} disabled={disabled}>
            {values.imageUrl ? 'Change photo' : 'Add a photo'}
          </Button>
          {values.imageUrl && (
            <button
              type="button"
              onClick={() => set('imageUrl', null)}
              disabled={disabled}
              className="text-caption text-on-surface-variant hover:text-error"
            >
              Remove photo
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageChange}
          disabled={disabled}
        />
      </div>
      {imageError && <p className="text-caption text-error">{imageError}</p>}

      <Input
        id={`${idPrefix}-name`}
        label="Name"
        value={values.name}
        onChange={(e) => set('name', e.target.value)}
        disabled={disabled}
      />
      <Select
        id={`${idPrefix}-category`}
        label="Category"
        options={CATEGORY_OPTIONS}
        value={values.category}
        onChange={(e) => set('category', e.target.value as Category)}
        disabled={disabled}
      />
      <div className="flex gap-8">
        <Input
          id={`${idPrefix}-value`}
          label="Value"
          type="number"
          min="0"
          inputMode="decimal"
          value={values.value}
          onChange={(e) => set('value', e.target.value)}
          disabled={disabled}
          className="flex-1"
        />
        <Input
          id={`${idPrefix}-currency`}
          label="Currency"
          value={values.currency}
          onChange={(e) => set('currency', e.target.value)}
          disabled={disabled}
          placeholder="NGN"
          maxLength={3}
          className="w-96"
        />
      </div>
      <Input
        id={`${idPrefix}-date`}
        label="Acquired date"
        type="date"
        value={values.acquiredDate}
        onChange={(e) => set('acquiredDate', e.target.value)}
        disabled={disabled}
      />
      <Textarea
        id={`${idPrefix}-why`}
        label="Why it mattered (optional)"
        value={values.whyNote}
        onChange={(e) => set('whyNote', e.target.value)}
        disabled={disabled}
      />
    </div>
  );
}
