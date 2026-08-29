import { cn } from '@/lib/cn';

type SelectOption = { value: string; label: string };

type SelectProps = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> & {
  id: string;
  label: string;
  options: SelectOption[];
  error?: string;
  className?: string;
};

export function Select({ id, label, options, error, className, required, ...props }: SelectProps) {
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className="flex flex-col gap-4">
      <label htmlFor={id} className="text-label text-warm-ink">
        {label}
        {required && <span className="text-error"> *</span>}
      </label>
      <select
        id={id}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId}
        className={cn(
          'h-44 rounded-lg border border-outline bg-surface px-12 text-body-regular text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          error && 'border-error',
          className,
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={errorId} className="text-caption text-error">
          {error}
        </p>
      )}
    </div>
  );
}
