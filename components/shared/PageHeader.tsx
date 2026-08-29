import { cn } from '@/lib/cn';

type PageHeaderProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col items-start justify-between gap-16 sm:flex-row sm:items-center', className)}>
      <div>
        <h1 className="text-heading-h1 text-warm-ink">{title}</h1>
        {description && <p className="mt-4 text-body-regular text-on-surface-variant">{description}</p>}
      </div>
      {action}
    </div>
  );
}
