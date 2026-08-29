import { cn } from '@/lib/cn';

/** The small numbered eyebrow label ("01 / The reveal") reused across four sections. */
export function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-12 font-mono text-caption uppercase tracking-wide text-gold before:h-px before:w-24 before:content-[''] before:bg-gold",
        className,
      )}
    >
      {children}
    </div>
  );
}
