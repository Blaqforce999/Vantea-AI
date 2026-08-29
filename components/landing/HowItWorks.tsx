import { SectionLabel } from '@/components/landing/SectionLabel';
import { cn } from '@/lib/cn';

const STEPS = [
  { n: 'ADD', title: 'Write it down', copy: 'A thing, a value you set, a date. Type it or say it in a sentence.' },
  { n: 'REVEAL', title: 'Watch it add up', copy: 'One quiet number. One honest timeline of your progress.' },
  { n: 'RETURN', title: 'See the distance', copy: 'Come back later. Then and now is the whole point.' },
];

export function HowItWorks() {
  return (
    <section id="how" className="py-[120px]">
      <div className="mx-auto max-w-[1180px] px-40 max-[759px]:px-24">
        <SectionLabel>02 / How it works</SectionLabel>
        <h2 className="mb-60 mt-20 font-serif text-[clamp(1.875rem,4vw,3.125rem)] font-normal tracking-[-0.01em] text-warm-ink">
          Three moves. That&apos;s the whole product.
        </h2>
        <div className="grid grid-cols-1 border-t border-outline-variant min-[821px]:grid-cols-3">
          {STEPS.map((step, index) => (
            <div
              key={step.n}
              className={cn(
                'border-b border-outline-variant py-28 transition-colors last:border-b-0 min-[821px]:border-b-0 min-[821px]:border-r min-[821px]:py-36 min-[821px]:pl-[34px] min-[821px]:pr-[34px] min-[821px]:hover:border-r-gold',
                index === 0 && 'pl-0 min-[821px]:pl-0',
                index === STEPS.length - 1 && 'pr-0 min-[821px]:border-r-0 min-[821px]:pr-0',
              )}
            >
              <div className="mb-20 font-mono text-caption tracking-wide text-gold">{step.n}</div>
              <h3 className="mb-10 font-serif text-[24px] font-medium text-warm-ink">{step.title}</h3>
              <p className="max-w-[260px] text-body-small text-slate">{step.copy}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
