'use client';

import { useEffect, useRef, useState } from 'react';

import { SectionLabel } from '@/components/landing/SectionLabel';

const TOTAL = 3650000;

function thingsAt(v: number): number {
  if (v < 34) return 2;
  if (v < 70) return Math.round(2 + ((v - 34) / 36) * 4);
  return Math.round(6 + ((v - 70) / 30) * 8);
}

function moneyAt(v: number): number {
  return Math.floor(TOTAL * Math.pow(v / 100, 1.15));
}

function fmt(n: number): string {
  return `₦${n.toLocaleString('en-US')}`;
}

const TICKS = [
  { year: 2023, q: '2 things', threshold: 0 },
  { year: 2024, q: '6 things', threshold: 34 },
  { year: 2025, q: '14 things', threshold: 70 },
];

const CHIPS = [
  { label: 'First laptop', at: 0, teal: false },
  { label: 'Savings', at: 0, teal: false },
  { label: 'Camera', at: 34, teal: false },
  { label: 'Certification', at: 34, teal: true },
  { label: 'Watch', at: 34, teal: false },
  { label: 'Plot of land', at: 70, teal: false },
  { label: 'Emergency fund', at: 70, teal: false },
  { label: 'Road bike', at: 70, teal: false },
];

const THUMB =
  "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-[30px] [&::-webkit-slider-thumb]:w-[30px] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-gold-foil [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-on-background [&::-webkit-slider-thumb]:shadow-[0_10px_24px_-8px_rgba(0,0,0,0.7)] [&::-moz-range-thumb]:h-[30px] [&::-moz-range-thumb]:w-[30px] [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:border-on-background [&::-moz-range-thumb]:bg-[#dab162]";

/**
 * The signature interaction. Renders at v=100 (fully revealed) on both
 * server and first client paint — identical markup, no hydration mismatch —
 * so with JavaScript disabled the final state (all chips, final number) is
 * exactly what's shown. The auto-play-once demo and click-to-drag handoff
 * are pure post-mount enhancement layered on top in an effect.
 */
export function RevealScrubber() {
  const [v, setV] = useState(100);
  const sectionRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasPlayedRef = useRef(false);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const section = sectionRef.current;
    if (reduce || !section || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !hasPlayedRef.current) {
            hasPlayedRef.current = true;
            observer.unobserve(entry.target);
            setV(0);
            let current = 0;
            timerRef.current = setInterval(() => {
              current += 3.5;
              if (current >= 100) {
                current = 100;
                if (timerRef.current) clearInterval(timerRef.current);
              }
              setV(current);
            }, 22);
          }
        }
      },
      { threshold: 0.5 },
    );

    observer.observe(section);
    return () => {
      observer.disconnect();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function stopAutoplay() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  const money = moneyAt(v);
  const things = thingsAt(v);

  return (
    <section ref={sectionRef} id="reveal" className="bg-on-background pb-[120px] pt-[100px] text-parchment">
      <div className="mx-auto max-w-[1180px] px-40 max-[759px]:px-24">
        <SectionLabel className="mb-24">01 / The reveal</SectionLabel>
        <h2 className="max-w-[640px] font-serif text-[clamp(1.875rem,4.4vw,3.25rem)] font-normal leading-[1.05] tracking-[-0.02em]">
          Drag the handle. Watch <em className="italic text-gold">three years add up.</em>
        </h2>

        <div className="mb-6 mt-56 text-center">
          <div className="break-words bg-gradient-gold-foil bg-clip-text font-serif text-[clamp(3.625rem,11vw,8rem)] font-medium leading-[0.95] tracking-[-0.06em] text-transparent max-[420px]:text-[2.75rem]">
            {fmt(money)}
          </div>
          <div className="mt-16 font-mono text-caption uppercase tracking-wide text-slate">
            Your Worth &middot; <b className="text-gold">{things}</b> things kept
          </div>
        </div>

        <div className="mx-auto mt-52 max-w-[820px]">
          <div className="relative mx-8 h-[3px] rounded-sm bg-[color-mix(in_srgb,var(--color-inverse-on-surface)_14%,transparent)]">
            <div className="absolute left-0 top-0 h-full rounded-sm bg-gradient-gold-foil" style={{ width: `${v}%` }} />
          </div>

          <div className="mx-8 mt-[22px] flex justify-between">
            {TICKS.map((tick) => (
              <div
                key={tick.year}
                className="flex-1 text-center transition-opacity"
                style={{ opacity: v < tick.threshold - 1 ? 0.3 : 1 }}
              >
                <div className="font-serif text-[20px] font-medium">{tick.year}</div>
                <div className="mt-2 font-mono text-[11px] uppercase text-slate">{tick.q}</div>
              </div>
            ))}
          </div>

          <input
            type="range"
            min={0}
            max={100}
            value={v}
            aria-label="Scrub through your years"
            onChange={(event) => setV(Number(event.target.value))}
            onPointerDown={stopAutoplay}
            className={`mx-8 mt-[26px] h-[26px] w-[calc(100%-16px)] cursor-grab appearance-none bg-transparent active:cursor-grabbing ${THUMB}`}
          />

          <div className="mt-44 flex min-h-44 flex-wrap justify-center gap-10">
            {CHIPS.map((chip, index) => (
              <span
                key={`${chip.label}-${index}`}
                className="flex items-center gap-8 rounded-[11px] border border-[color-mix(in_srgb,var(--color-inverse-on-surface)_12%,transparent)] bg-[color-mix(in_srgb,var(--color-inverse-on-surface)_5%,transparent)] px-[13px] py-[9px] text-body-small transition-[opacity,transform] duration-[400ms]"
                style={
                  v < chip.at - 1
                    ? { opacity: 0, transform: 'translateY(8px)' }
                    : { opacity: 1, transform: 'none' }
                }
              >
                <i className={`h-[7px] w-[7px] rounded-full ${chip.teal ? 'bg-tertiary' : 'bg-gold'}`} />
                {chip.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
