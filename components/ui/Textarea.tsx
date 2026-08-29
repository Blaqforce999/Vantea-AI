import { cn } from '@/lib/cn';

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  id: string;
  label: string;
  error?: string;
  className?: string;
};

export function Textarea({ id, label, error, className, required, ...props }: TextareaProps) {
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className="flex flex-col gap-4">
      <label htmlFor={id} className="text-label text-warm-ink">
        {label}
        {required && <span className="text-error"> *</span>}
      </label>
      <textarea
        id={id}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId}
        className={cn(
          'min-h-80 rounded-lg border border-outline bg-surface px-12 py-8 text-body-regular text-on-surface placeholder:text-on-surface-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          error && 'border-error',
          className,
        )}
        {...props}
      />
      {error && (
        <p id={errorId} className="text-caption text-error">
          {error}
        </p>
      )}
    </div>
  );
}
