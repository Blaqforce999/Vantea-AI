import { SectionLabel } from '@/components/landing/SectionLabel';

const FAQ_COLUMNS: { question: string; answer: string }[][] = [
  [
    {
      question: 'What is Vantea?',
      answer: "A private place to record what you own and see how far you've come. Not a finance app.",
    },
    {
      question: 'Do you connect to my bank?',
      answer: "Never. Nothing is pulled from anywhere. You type what you want, or you don't.",
    },
    {
      question: 'Are the values real prices?',
      answer: 'No. You set your own numbers. Vantea only adds up what you write.',
    },
  ],
  [
    { question: 'Who can see my data?', answer: "Only you. It's private by default." },
    { question: 'Is it free?', answer: 'Yes. Free to start, nothing to connect.' },
    {
      question: 'What can I keep in it?',
      answer: 'Anything you own or built: things, savings, skills, milestones.',
    },
  ],
];

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-14 w-14 stroke-current stroke-2 transition-transform" fill="none" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function Faq() {
  return (
    <section id="faq" className="py-[120px]">
      <div className="mx-auto max-w-[1180px] px-40 max-[759px]:px-24">
        <SectionLabel>04 / Questions</SectionLabel>
        <h2 className="mt-20 mb-48 font-serif text-[clamp(2.125rem,5vw,3.75rem)] font-normal tracking-[-0.01em] text-warm-ink">
          Frequently asked
        </h2>
        <div className="grid grid-cols-1 gap-x-60 gap-y-20 min-[821px]:grid-cols-2">
          {FAQ_COLUMNS.map((column, columnIndex) => (
            <div key={columnIndex} className="flex flex-col">
              {column.map((item, itemIndex) => (
                <details
                  key={item.question}
                  open={columnIndex === 0 && itemIndex === 0}
                  className="group border-b border-outline-variant py-20"
                >
                  <summary className="flex cursor-pointer list-none items-start gap-16 font-serif text-[20px] font-medium text-warm-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary [&::-webkit-details-marker]:hidden">
                    <span className="mt-2 flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full bg-on-background text-parchment transition-colors group-open:bg-gold group-open:text-on-background">
                      <span className="group-open:rotate-180 [&>svg]:block">
                        <ChevronIcon />
                      </span>
                    </span>
                    {item.question}
                  </summary>
                  <p className="ml-[46px] mt-14 max-w-[440px] text-body-small leading-[1.65] text-slate">{item.answer}</p>
                </details>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
