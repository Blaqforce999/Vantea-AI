'use client';

import { useState, type FormEvent } from 'react';

import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type UpgradeResponse =
  | { ok: true; data: { userId: string } }
  | { ok: false; error: { code: string; message: string } };

/**
 * A guest's data never moves — this just fills in email/password on the
 * same User row so it survives a cleared cookie. See lib/auth.ts
 * upgradeGuestToAccount and .agents/rules/architecture.md "Authentication".
 */
export function UpgradeAccountForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const res = await fetch('/api/auth/upgrade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: formData.get('email'),
        password: formData.get('password'),
        name: formData.get('name') || undefined,
      }),
    });
    const json = (await res.json()) as UpgradeResponse;
    setPending(false);

    if (!json.ok) {
      setError(json.error.message);
      return;
    }

    setDone(true);
    router.refresh();
  }

  if (done) {
    return <p className="text-body-regular text-tertiary">Your account is saved. Your data is unchanged.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-16">
      <Input id="upgrade-name" name="name" label="Name (optional)" />
      <Input id="upgrade-email" name="email" label="Email" type="email" required />
      <Input id="upgrade-password" name="password" label="Password" type="password" required minLength={8} />
      {error && <p className="text-caption text-error">{error}</p>}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? 'Saving…' : 'Save my account'}
      </Button>
    </form>
  );
}
