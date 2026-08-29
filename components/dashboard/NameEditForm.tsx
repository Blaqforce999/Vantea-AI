'use client';

import { useState, type FormEvent } from 'react';

import { useRouter } from 'next/navigation';

import { updateProfile } from '@/app/(app)/(with-nav)/profile/actions';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

type NameEditFormProps = { currentName: string | null; onSaved?: () => void };

export function NameEditForm({ currentName, onSaved }: NameEditFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [name, setName] = useState(currentName ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = name.trim() !== (currentName ?? '').trim();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) {
      setError('Name cannot be empty.');
      return;
    }

    setSaving(true);
    setError(null);
    const result = await updateProfile({ name: name.trim() });
    setSaving(false);

    if (!result.ok) {
      setError(result.error.message);
      showToast({ title: 'Could not save your name', description: result.error.message, variant: 'error' });
      return;
    }

    showToast({ title: 'Name updated', variant: 'success' });
    router.refresh();
    onSaved?.();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-12">
      <Input
        id="profile-name"
        label="Name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        disabled={saving}
      />
      {error && <p className="text-caption text-error">{error}</p>}
      <Button type="submit" size="sm" disabled={saving || !dirty} className="self-start">
        {saving ? 'Saving…' : 'Save'}
      </Button>
    </form>
  );
}
