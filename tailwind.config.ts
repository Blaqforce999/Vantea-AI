import type { Config } from 'tailwindcss';

/**
 * Design tokens live as CSS variables in tokens/tokens.css (imported into
 * app/globals.css). This file only maps Tailwind utility names onto those
 * variables — it never invents a color, size, or value of its own. See
 * .agents/rules/design-system.md for the token discipline and
 * .claude/plans/unified-crafting-charm.md ("Tailwind Token Mapping") for why
 * both a brand vocabulary (bg-parchment, text-gold) and the underlying
 * Material-3-style role vocabulary (bg-primary, bg-achievement) are exposed
 * side by side, pointed at the same variables.
 *
 * Spacing below fully REPLACES Tailwind's default rem-based scale (rather
 * than extending it) so that `p-16` means exactly `var(--spacing-16)` (16px)
 * with no ambiguity against Tailwind's default key-to-rem mapping.
 */

const spacingKeys = [
  '0', '1', '2', '4', '6', '8', '10', '12', '14', '16', '18', '20', '24', '28',
  '32', '36', '40', '44', '48', '52', '56', '60', '64', '72', '80', '88', '96',
  '104', '112', '120', '128', '144', '160', '176', '192', '208', '224', '240',
  '256', '288', '320', '384', '448', '512',
] as const;

const spacing = Object.fromEntries(spacingKeys.map((key) => [key, `var(--spacing-${key})`]));

const typographyStyles = [
  'caption', 'label', 'button',
  'display-xl', 'display-large', 'display-medium',
  'heading-h1', 'heading-h2', 'heading-h3', 'heading-h4',
  'body-large', 'body-regular', 'body-small',
  'worth-large', 'worth-medium',
  'metadata-mono',
] as const;

type FontSizeEntry = [string, { lineHeight: string; letterSpacing: string; fontWeight: string }];

const fontSize: Record<string, FontSizeEntry> = Object.fromEntries(
  typographyStyles.map((style): [string, FontSizeEntry] => [
    style,
    [
      `var(--font-size-${style})`,
      {
        lineHeight: `var(--line-height-${style})`,
        letterSpacing: `var(--letter-spacing-${style})`,
        fontWeight: `var(--font-weight-${style})`,
      },
    ],
  ]),
);

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    spacing,
    extend: {
      colors: {
        // --- Brand vocabulary (as used in .agents/rules/design-system.md prose) ---
        parchment: 'var(--color-background)',
        'warm-ink': 'var(--color-on-background)',
        gold: 'var(--color-achievement)',
        'on-gold': 'var(--color-on-achievement)',
        teal: 'var(--color-tertiary)',
        'on-teal': 'var(--color-on-tertiary)',
        slate: 'var(--color-secondary)',
        danger: 'var(--color-error)',
        'on-danger': 'var(--color-on-error)',

        // --- Full Material-3-style role vocabulary (matches tokens.css 1:1) ---
        primary: 'var(--color-primary)',
        'on-primary': 'var(--color-on-primary)',
        'primary-container': 'var(--color-primary-container)',
        'on-primary-container': 'var(--color-on-primary-container)',
        secondary: 'var(--color-secondary)',
        'on-secondary': 'var(--color-on-secondary)',
        'secondary-container': 'var(--color-secondary-container)',
        'on-secondary-container': 'var(--color-on-secondary-container)',
        tertiary: 'var(--color-tertiary)',
        'on-tertiary': 'var(--color-on-tertiary)',
        'tertiary-container': 'var(--color-tertiary-container)',
        'on-tertiary-container': 'var(--color-on-tertiary-container)',
        error: 'var(--color-error)',
        'on-error': 'var(--color-on-error)',
        'error-container': 'var(--color-error-container)',
        'on-error-container': 'var(--color-on-error-container)',
        achievement: 'var(--color-achievement)',
        'on-achievement': 'var(--color-on-achievement)',
        'achievement-container': 'var(--color-achievement-container)',
        'on-achievement-container': 'var(--color-on-achievement-container)',
        background: 'var(--color-background)',
        'on-background': 'var(--color-on-background)',
        surface: 'var(--color-surface)',
        'on-surface': 'var(--color-on-surface)',
        'surface-variant': 'var(--color-surface-variant)',
        'on-surface-variant': 'var(--color-on-surface-variant)',
        'surface-dim': 'var(--color-surface-dim)',
        'surface-bright': 'var(--color-surface-bright)',
        'surface-container-lowest': 'var(--color-surface-container-lowest)',
        'surface-container-low': 'var(--color-surface-container-low)',
        'surface-container': 'var(--color-surface-container)',
        'surface-container-high': 'var(--color-surface-container-high)',
        'surface-container-highest': 'var(--color-surface-container-highest)',
        outline: 'var(--color-outline)',
        'outline-variant': 'var(--color-outline-variant)',
        'inverse-surface': 'var(--color-inverse-surface)',
        'inverse-on-surface': 'var(--color-inverse-on-surface)',
        'inverse-primary': 'var(--color-inverse-primary)',
        scrim: 'var(--color-scrim)',
        // Pre-mixed rather than expressed as `bg-scrim/50`: our tokens bake
        // alpha into 8-digit hex, so Tailwind's `<color>/<opacity>` modifier
        // silently emits NO CSS for them at all (verified — not even a
        // fallback without the opacity). Add a new `scrim-{n}` entry here
        // rather than reaching for the opacity-slash syntax anywhere in the
        // app.
        'scrim-50': 'color-mix(in srgb, var(--color-scrim) 50%, transparent)',
        shadow: 'var(--color-shadow)',
      },
      borderWidth: {
        none: 'var(--border-none)',
        xs: 'var(--border-xs)',
        sm: 'var(--border-sm)',
        md: 'var(--border-md)',
        lg: 'var(--border-lg)',
        xl: 'var(--border-xl)',
        '2xl': 'var(--border-2xl)',
        '3xl': 'var(--border-3xl)',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-fraunces)', 'Georgia', 'serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'monospace'],
      },
      fontSize,
      backgroundImage: {
        'gradient-reveal': 'var(--gradient-reveal)',
        'gradient-achievement': 'var(--gradient-achievement)',
        'gradient-progress': 'var(--gradient-progress)',
        'gradient-dark': 'var(--gradient-dark)',
        'gradient-gold-foil': 'var(--gradient-gold-foil)',
      },
      keyframes: {
        rise: {
          from: { opacity: '0', transform: 'translateY(22px)' },
          to: { opacity: '1', transform: 'none' },
        },
        shine: {
          to: { backgroundPosition: '200% center' },
        },
      },
      animation: {
        // Entrance fade for landing-page copy. Always paired with the
        // `motion-safe:` variant at the call site, never applied bare — with
        // reduced motion requested, the element keeps its default (visible,
        // static) styling instead of inheriting the keyframe's 0%-opacity
        // start state.
        rise: 'rise 0.85s cubic-bezier(0.2,0.7,0.2,1) both',
        shine: 'shine 4s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
