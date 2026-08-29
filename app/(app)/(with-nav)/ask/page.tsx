import { AskVantea } from '@/components/ai/AskVantea';
import { PageHeader } from '@/components/shared/PageHeader';

export default function AskPage() {
  return (
    <div className="flex flex-col gap-32">
      <PageHeader title="Ask Vantea" description="Ask about your things, your worth, your progress." />
      <AskVantea />
    </div>
  );
}
