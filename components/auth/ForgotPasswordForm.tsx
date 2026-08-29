'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';

import { AuthField } from '@/components/auth/AuthField';
import { Button } from '@/components/ui/Button';

// Mirrors AuthForm's pattern.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * UI and interaction flow only, per explicit instruction — this does not
 * call the real (currently inert) /api/auth/forgot-password endpoint. That
 * route 404s as NOT_AVAILABLE until a domain is connected to Resend (see
 * lib/password-reset.ts's EMAIL_ENABLED gate); wiring this form to it now
 * would either surface that error to every user or require faking a
 * network call. The submit here simulates the pending → sent transition so
 * the full flow is real and reviewable, with the actual email dispatch left
 * for whoever wires EMAIL_ENABLED on later.
 */
export function ForgotPasswordForm({ next: _next }: { next: string }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setEmail(event.target.value);
    if (error) setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const trimmed = email.trim();
    if (!trimmed) {
      setError('Email is required');
      return;
    }
    if (!EMAIL_REGEX.test(trimmed)) {
      setError('Enter a valid email address');
      return;
    }

    setPending(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setPending(false);
    setSent(true);
  }

  if (sent) {
    return (
      <div
        role="status"
        className="flex flex-col items-center gap-8 rounded-xl bg-tertiary-container px-16 py-24 text-center text-on-tertiary-container"
      >
        <p className="text-body-regular font-medium">Check your email</p>
        <p className="text-body-small">
          If an account exists for {email.trim()}, we&apos;ve sent a link to reset your password.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-16">
      <AuthField
        id="forgot-password-email"
        name="email"
        label="Email"
        type="email"
        required
        placeholder="you@example.com"
        autoComplete="email"
        state={error ? 'error' : 'neutral'}
        message={error ?? undefined}
        value={email}
        onChange={handleChange}
      />
      <Button
        type="submit"
        variant="primary"
        disabled={pending}
        aria-busy={pending}
        className="w-full rounded-xl bg-warm-ink text-parchment hover:opacity-90"
      >
        {pending ? 'Sending…' : 'Send reset link'}
      </Button>
    </form>
  );
}
