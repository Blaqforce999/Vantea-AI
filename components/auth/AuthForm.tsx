'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { AuthField, type FieldState } from '@/components/auth/AuthField';
import { Button } from '@/components/ui/Button';

type AuthFormProps = { mode: 'signup' | 'login'; next: string };

type AuthResponse = { ok: true; data: { userId: string } } | { ok: false; error: { code: string; message: string } };

// Requires a real TLD of at least 2 characters — `user@gmail.c` fails,
// `user@gmail.com` and `user@domain.co.uk` pass.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Mirrors lib/validators/auth.ts's passwordSchema — keep both in sync.
const PASSWORD_RULES: { label: string; test: (password: string) => boolean }[] = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: '1 uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: '1 number', test: (p) => /[0-9]/.test(p) },
  { label: '1 special character', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

const SUBMIT_COPY = {
  signup: { idle: 'Create account', busy: 'Creating account…' },
  login: { idle: 'Log in', busy: 'Logging in…' },
} as const;

export function AuthForm({ mode, next }: AuthFormProps) {
  const router = useRouter();

  const [name, setName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const [password, setPassword] = useState('');
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [pending, setPending] = useState(false);
  const [bannerError, setBannerError] = useState<string | null>(null);

  const emailValid = EMAIL_REGEX.test(email);
  // An explicit error (set on blur/submit/server response) always wins;
  // otherwise the success state is live so a correctly-typed value lights
  // up gold immediately, without waiting for another blur.
  const emailState: FieldState = emailError ? 'error' : emailTouched && email && emailValid ? 'success' : 'neutral';

  const passwordRulesPass = PASSWORD_RULES.every((rule) => rule.test(password));
  const passwordState: FieldState = passwordError
    ? 'error'
    : mode === 'signup' && passwordTouched && password && passwordRulesPass
      ? 'success'
      : 'neutral';
  const showChecklist = mode === 'signup' && (passwordFocused || (passwordTouched && !passwordRulesPass));

  function handleNameChange(event: ChangeEvent<HTMLInputElement>) {
    setName(event.target.value);
    if (nameError) setNameError(null);
  }

  function handleEmailChange(event: ChangeEvent<HTMLInputElement>) {
    setEmail(event.target.value);
    if (emailError) setEmailError(null);
  }

  function handlePasswordChange(event: ChangeEvent<HTMLInputElement>) {
    setPassword(event.target.value);
    if (passwordError) setPasswordError(null);
  }

  function validateEmailOnBlur() {
    setEmailTouched(true);
    if (!email) {
      setEmailError('Email is required');
    } else if (!EMAIL_REGEX.test(email)) {
      setEmailError('Enter a valid email address');
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return; // belt-and-suspenders alongside the disabled submit button

    const formData = new FormData(event.currentTarget);
    const nameValue = String(formData.get('name') ?? '').trim();
    const emailValue = String(formData.get('email') ?? '').trim();
    const passwordValue = String(formData.get('password') ?? '');

    // Client-side required-field checks run before any API call — no
    // network round-trip just to learn a field was left empty.
    let hasError = false;

    if (mode === 'signup' && !nameValue) {
      setNameError('Full name is required');
      hasError = true;
    }

    if (!emailValue) {
      setEmailError('Email is required');
      hasError = true;
    } else if (!EMAIL_REGEX.test(emailValue)) {
      setEmailError('Enter a valid email address');
      hasError = true;
    }

    if (!passwordValue) {
      setPasswordError('Password is required');
      hasError = true;
    } else if (mode === 'signup' && !PASSWORD_RULES.every((rule) => rule.test(passwordValue))) {
      setPasswordError('Password does not meet the requirements below');
      hasError = true;
    }

    if (hasError) return;

    setPending(true);
    setBannerError(null);

    const endpoint = mode === 'signup' ? '/api/auth/signup' : '/api/auth/login';
    const body =
      mode === 'signup' ? { name: nameValue || undefined, email: emailValue, password: passwordValue } : { email: emailValue, password: passwordValue };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = (await res.json()) as AuthResponse;

    if (!json.ok) {
      setPending(false);
      // Field-specific server errors land on the field they're about —
      // never in the banner. The banner is reserved for genuine
      // non-field failures (rate limiting, network, unexpected errors).
      if (json.error.code === 'EMAIL_TAKEN') {
        setEmailError('This email is already registered');
      } else if (json.error.code === 'INVALID_CREDENTIALS') {
        setPasswordError('Invalid email or password');
      } else {
        setBannerError(json.error.message);
      }
      return;
    }

    router.push(next);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-16">
      {bannerError && (
        <div role="alert" className="rounded-xl bg-error-container px-16 py-12 text-body-small text-on-error-container">
          {bannerError}
        </div>
      )}

      {mode === 'signup' && (
        <AuthField
          id="auth-name"
          name="name"
          label="Full name"
          autoComplete="name"
          placeholder="Adewale Okonkwo"
          state={nameError ? 'error' : 'neutral'}
          message={nameError ?? undefined}
          value={name}
          onChange={handleNameChange}
        />
      )}

      <AuthField
        id="auth-email"
        name="email"
        label="Email"
        type="email"
        required
        placeholder="you@example.com"
        autoComplete="email"
        state={emailState}
        message={emailError ?? undefined}
        value={email}
        onChange={handleEmailChange}
        onBlur={validateEmailOnBlur}
      />

      <div>
        <AuthField
          id="auth-password"
          name="password"
          label="Password"
          type="password"
          required
          placeholder={mode === 'signup' ? 'Min. 8 characters' : undefined}
          className={mode === 'signup' ? 'font-mono placeholder:font-mono' : undefined}
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          state={passwordState}
          message={passwordError ?? undefined}
          value={password}
          onChange={handlePasswordChange}
          onFocus={() => setPasswordFocused(true)}
          onBlur={() => {
            setPasswordFocused(false);
            setPasswordTouched(true);
          }}
          labelAction={
            mode === 'login' && (
              <Link
                href={`/auth/forgot-password?next=${encodeURIComponent(next)}`}
                className="text-caption text-on-surface-variant underline-offset-2 hover:underline"
              >
                Forgot password?
              </Link>
            )
          }
        />

        {showChecklist && (
          <ul className="mt-8 grid grid-cols-2 gap-x-16 gap-y-4">
            {PASSWORD_RULES.map((rule) => {
              const passed = rule.test(password);
              return (
                <li
                  key={rule.label}
                  className={`flex items-center gap-8 text-caption ${passed ? 'text-achievement' : 'text-outline'}`}
                >
                  <span aria-hidden="true">{passed ? '✓' : '○'}</span>
                  {rule.label}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* rounded-xl (12px) overrides Button's default rounded-lg (8px), and
          bg-warm-ink/text-parchment overrides the primary variant's brown
          bg-primary fill — both scoped to this one button via className
          rather than touching Button's shared primary variant (which is
          used all over the rest of the app). The Figma reference for
          Login/Signup specifically calls for a near-black button; reusing
          the existing warm-ink/parchment tokens gets that without inventing
          a new color. */}
      <Button
        type="submit"
        variant="primary"
        disabled={pending}
        aria-busy={pending}
        className="w-full rounded-xl bg-warm-ink text-parchment hover:opacity-90"
      >
        {pending ? SUBMIT_COPY[mode].busy : SUBMIT_COPY[mode].idle}
      </Button>
    </form>
  );
}
