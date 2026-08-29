import { Scale } from 'lucide-react';

import { cn } from '@/lib/cn';

type AuthCardProps = {
  children: React.ReactNode;
  className?: string;
};

/**
 * The centered card for signup/login. Panel background, 16px radius
 * (rounded-2xl matches exactly, no arbitrary value needed), soft shadow so
 * it reads as a floating gate in front of the dimmed backdrop. The gold-ring
 * scale icon above the heading is the one visual addition from the Figma
 * redesign — purely decorative, same on both Login and Signup.
 */
export function AuthCard({ children, className }: AuthCardProps) {
  return (
    <div
      className={cn(
        'w-full max-w-[440px] rounded-2xl bg-surface-container p-40 shadow-[0_20px_60px_-15px_var(--color-shadow)] max-[639px]:p-24',
        className,
      )}
    >
      <div className="mb-24 flex justify-center">
        <span className="flex h-56 w-56 items-center justify-center rounded-full bg-achievement-container">
          <Scale size={24} className="text-on-achievement-container" aria-hidden="true" />
        </span>
      </div>
      {children}
    </div>
  );
}
