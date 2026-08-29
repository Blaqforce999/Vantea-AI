'use client';

import { useState } from 'react';

import { Sparkles } from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';

const VARIANTS = ['primary', 'secondary', 'ghost', 'danger'] as const;
const SIZES = ['sm', 'md', 'lg'] as const;

export function DevKitchenSink() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-32 p-24">
      <PageHeader title="Component Kitchen Sink" description="Manual QA for every UI primitive and state." />

      <section className="flex flex-col gap-16">
        <h2 className="text-heading-h3 text-warm-ink">Buttons</h2>
        {SIZES.map((size) => (
          <div key={size} className="flex flex-wrap items-center gap-8">
            {VARIANTS.map((variant) => (
              <Button key={`${variant}-${size}`} variant={variant} size={size}>
                {variant} / {size}
              </Button>
            ))}
            <Button disabled>disabled</Button>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-16">
        <h2 className="text-heading-h3 text-warm-ink">Badges</h2>
        <div className="flex flex-wrap gap-8">
          <Badge variant="neutral">Tech</Badge>
          <Badge variant="achievement">First thing</Badge>
          <Badge variant="progress">On track</Badge>
          <Badge variant="danger">Overdue</Badge>
        </div>
      </section>

      <section className="flex flex-col gap-16">
        <h2 className="text-heading-h3 text-warm-ink">Form Fields</h2>
        <Input id="dev-name" label="Item name" placeholder="MacBook Pro" />
        <Input id="dev-error" label="Personal value" error="Enter a number of 0 or more." required />
        <Select
          id="dev-category"
          label="Category"
          options={[
            { value: 'TECH', label: 'Tech' },
            { value: 'CARS_AND_VEHICLES', label: 'Cars and Vehicles' },
          ]}
        />
        <Textarea id="dev-why" label="Why it mattered" placeholder="Needed it for my design business." />
      </section>

      <section className="flex flex-col gap-16">
        <h2 className="text-heading-h3 text-warm-ink">Card</h2>
        <Card>A default card — subtle border, no shadow.</Card>
        <Card elevated>An elevated card — small shadow for floating surfaces.</Card>
      </section>

      <section className="flex flex-col gap-16">
        <h2 className="text-heading-h3 text-warm-ink">Empty State</h2>
        <EmptyState
          icon={Sparkles}
          title="Nothing here yet"
          description="Add the first thing you've built to start your collection."
          action={<Button size="sm">Add your first thing</Button>}
        />
      </section>

      <section className="flex flex-col gap-16">
        <h2 className="text-heading-h3 text-warm-ink">Confirm Dialog</h2>
        <div className="flex gap-8">
          <Button onClick={() => setDialogOpen(true)}>Open confirm dialog</Button>
        </div>
        <ConfirmDialog
          open={dialogOpen}
          title="Delete your old phone?"
          description="This removes the item from your collection. This can't be undone."
          confirmLabel="Delete"
          destructive
          onConfirm={() => setDialogOpen(false)}
          onCancel={() => setDialogOpen(false)}
        />
      </section>
    </main>
  );
}
