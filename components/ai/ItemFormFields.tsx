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
  /**
   * 'compact' switches to the two-column, filled-field layout used by the
   * Edit-item modal. The default stacked/bordered layout is untouched — it's
   * what the AI review (ParsePreview) and Manual Entry modals still render.
   */
  variant?: 'default' | 'compact';
};

// Filled, borderless field styling for the compact layout — applied via
// className only, so the shared Input/Select/Textarea components (and every
// other form that uses them) are unaffected.
const FILLED = 'border-transparent bg-surface-container-high';

/**
 * The shared field set behind the AI review modal (ParsePreview), Manual
 * Entry, and the Edit-item modal — image, name, category, value/currency,
 * date, why-it-mattered. Fully controlled so each caller owns its own state.
 */
export function ItemFormFields({ values, onChange, disabled, idPrefix, variant = 'default' }: ItemFormFieldsProps) {
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const compact = variant === 'compact';
  const fieldCls = compact ? FILLED : undefined;

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

  const nameField = (
    <Input
      id={`${idPrefix}-name`}
      label="Name"
      value={values.name}
      onChange={(e) => set('name', e.target.value)}
      disabled={disabled}
      className={fieldCls}
    />
  );

  const categoryField = (
    <Select
      id={`${idPrefix}-category`}
      label="Category"
      options={CATEGORY_OPTIONS}
      value={values.category}
      onChange={(e) => set('category', e.target.value as Category)}
      disabled={disabled}
      className={fieldCls}
    />
  );

  const valueCurrencyRow = compact ? (
    <div className="flex gap-8">
      <div className="flex-1">
        <Input
          id={`${idPrefix}-value`}
          label="Value"
          type="number"
          min="0"
          inputMode="decimal"
          value={values.value}
          onChange={(e) => set('value', e.target.value)}
          disabled={disabled}
          className={fieldCls}
        />
      </div>
      <div className="w-72 shrink-0">
        <Input
          id={`${idPrefix}-currency`}
          label="Currency"
          value={values.currency}
          onChange={(e) => set('currency', e.target.value)}
          disabled={disabled}
          placeholder="NGN"
          maxLength={3}
          className={fieldCls}
        />
      </div>
    </div>
  ) : (
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
  );

  const dateField = (
    <Input
      id={`${idPrefix}-date`}
      label="Acquired date"
      type="date"
      value={values.acquiredDate}
      onChange={(e) => set('acquiredDate', e.target.value)}
      disabled={disabled}
      className={fieldCls}
    />
  );

  const whyField = (
    <Textarea
      id={`${idPrefix}-why`}
      label="Why it mattered (optional)"
      value={values.whyNote}
      onChange={(e) => set('whyNote', e.target.value)}
      disabled={disabled}
      className={fieldCls}
    />
  );

  return (
    <div className={compact ? 'flex flex-col gap-16' : 'flex flex-col gap-12'}>
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

      {compact ? (
        <div className="grid gap-x-16 gap-y-16 sm:grid-cols-2">
          {nameField}
          {categoryField}
          {valueCurrencyRow}
          {dateField}
          <div className="sm:col-span-2">{whyField}</div>
        </div>
      ) : (
        <>
          {nameField}
          {categoryField}
          {valueCurrencyRow}
          {dateField}
          {whyField}
        </>
      )}
    </div>
  );
}
