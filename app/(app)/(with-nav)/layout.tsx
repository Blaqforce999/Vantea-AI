import { AppHeader } from '@/components/dashboard/AppHeader';
import { BackButton } from '@/components/dashboard/BackButton';
import { ToastProvider } from '@/components/ui/Toast';

export default function WithNavLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AppHeader />
      <div className="mx-auto max-w-6xl px-24 py-32">
        <BackButton />
        {children}
      </div>
    </ToastProvider>
  );
}
