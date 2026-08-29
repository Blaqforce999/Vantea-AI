/**
 * Full-viewport centered gate. The spec's preferred treatment is the real
 * landing page blurred behind the card; its own fallback note sanctions a
 * simpler background when that's too complex for this pass — ink with a
 * faint gold wash, used here, rather than importing interactive landing
 * components (the scrubber, its effects) into a static backdrop role.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-on-background px-24 py-48">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(ellipse at top, var(--color-achievement) 0%, transparent 60%)',
        }}
      />
      <div className="motion-safe:animate-rise relative z-10 flex w-full justify-center">{children}</div>
    </div>
  );
}
