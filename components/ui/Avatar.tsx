import { cn } from '@/lib/cn';

type AvatarProps = {
  name: string | null;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg';
  ringed?: boolean;
  className?: string;
};

const SIZE_CLASSES: Record<NonNullable<AvatarProps['size']>, string> = {
  sm: 'h-32 w-32 text-caption',
  md: 'h-40 w-40 text-body-small',
  lg: 'h-96 w-96 text-heading-h2',
};

function initials(name: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase() || '?';
}

/** Circular avatar — photo if provided, initials fallback otherwise. `ringed` matches the Profile screen's gold-ring treatment. */
export function Avatar({ name, src, size = 'md', ringed = false, className }: AvatarProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary-container font-medium text-on-secondary-container',
        SIZE_CLASSES[size],
        ringed && 'ring-2 ring-achievement ring-offset-2 ring-offset-surface',
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- avatars can be data: URIs or arbitrary remote URLs; next/image needs neither here.
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        initials(name)
      )}
    </span>
  );
}
