import { SectionLabel } from '@/components/landing/SectionLabel';

const IS = ['A private diary of what you own', 'Your own numbers, added up', 'Free to start', 'Yours alone'];
const IS_NOT = ['A bank or a wallet', 'An investment adviser', 'Connected to any account', 'Watching or selling your data'];

/**
 * The reference's own CSS has two `.priv` rules; the later one
 * (`background: var(--panel) !important`) wins the cascade, so the section
 * actually renders on the light panel surface with ink text, not the dark
 * ink treatment its first rule suggests. Reproduced here as that final,
 * cascaded appearance — `--panel` (#F2EEE8) maps to `--color-surface-container`
 * (#F2F0E8), the closest existing token.
 */
export function Privacy() {
  return (
    <section id="priv" className="bg-surface-container py-[120px]">
      <div className="mx-auto max-w-[1180px] px-40 max-[759px]:px-24">
        <SectionLabel>03 / Your data</SectionLabel>
        <h2 className="mb-44 mt-20 max-w-[640px] font-serif text-[clamp(1.875rem,4.4vw,3.25rem)] font-normal leading-[1.05] tracking-[-0.02em] text-warm-ink">
          Clear about what it is.{' '}
          <em className="animate-shine bg-gradient-gold-foil bg-[length:200%_auto] bg-clip-text italic text-transparent">
            Clearer about what it isn&apos;t.
          </em>
        </h2>

        <div className="grid grid-cols-1 gap-24 min-[821px]:grid-cols-2">
          <div className="rounded-[18px] border border-outline-variant bg-parchment p-[30px]">
            <h4 className="mb-18 font-serif text-[22px] font-medium text-warm-ink">Vantea is</h4>
            <ul className="flex flex-col gap-12">
              {IS.map((item) => (
                <li key={item} className="relative pl-[26px] text-body-small text-warm-ink">
                  <span className="absolute left-0 font-semibold text-gold" aria-hidden="true">
                    &#10003;
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[18px] border border-outline-variant bg-parchment p-[30px]">
            <h4 className="mb-18 font-serif text-[22px] font-medium text-warm-ink">Vantea isn&apos;t</h4>
            <ul className="flex flex-col gap-12">
              {IS_NOT.map((item) => (
                <li key={item} className="relative pl-[26px] text-body-small text-slate">
                  <span className="absolute left-0 text-slate" aria-hidden="true">
                    &#10005;
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
