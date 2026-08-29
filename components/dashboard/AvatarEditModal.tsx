'use client';

import { useRef, useState, type ChangeEvent } from 'react';

import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';

import { updateProfile } from '@/app/(app)/(with-nav)/profile/actions';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { compressImageFile, ImageTooLargeError } from '@/lib/image';

type AvatarEditModalProps = {
  name: string | null;
  currentAvatarUrl: string | null;
  open: boolean;
  onClose: () => void;
  /** Fired after a successful save, before the modal closes — lets the parent track "a change was actually made." */
  onSaved?: () => void;
};

/** Deliberately the subtle shadow ([0_1px_2px_...], same as Card/ConfirmDialog) — not the strong floating-panel shadow used for AuthCard/the profile Menu dropdown. */
export function AvatarEditModal({ name, currentAvatarUrl, open, onClose, onSaved }: AvatarEditModalProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [preview, setPreview] = useState<string | null>(currentAvatarUrl);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      setPreview(await compressImageFile(file));
    } catch (err) {
      setError(err instanceof ImageTooLargeError ? err.message : "Couldn't read that image.");
    }
  }

  async function handleSave() {
    setSaving(true);
    const result = await updateProfile({ avatarUrl: preview });
    setSaving(false);

    if (!result.ok) {
      setError(result.error.message);
      showToast({ title: 'Could not update your avatar', description: result.error.message, variant: 'error' });
      return;
    }

    showToast({ title: 'Avatar updated', variant: 'success' });
    router.refresh();
    onSaved?.();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim-50 p-16" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-sm rounded-xl border border-outline-variant bg-surface-bright p-24 shadow-[0_1px_2px_var(--color-shadow)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-heading-h4 text-warm-ink">Update avatar</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-4 text-on-surface-variant hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="mt-16 flex flex-col items-center gap-16">
          <Avatar name={name} src={preview} size="lg" />
          <Button type="button" variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} disabled={saving}>
            Choose a photo
          </Button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>

        {error && <p className="mt-8 text-caption text-error">{error}</p>}

        <div className="mt-24 flex justify-end gap-8">
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving || !preview}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
}
