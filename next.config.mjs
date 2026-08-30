// Development needs a looser policy: the Next dev server + React Refresh use
// eval and a websocket for HMR. Production locks both down. The app contacts
// no external origins at all (next/font self-hosts, no analytics, no CDN),
// so 'self' covers almost everything — the 'unsafe-inline' allowances are
// for Next's own hydration scripts and framer-motion's inline styles, since
// a nonce-based policy would require middleware and disable static rendering.
const isDev = process.env.NODE_ENV !== 'production';

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  'img-src \'self\' data: blob:',
  "font-src 'self'",
  `connect-src 'self'${isDev ? ' ws: wss:' : ''}`,
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  ...(isDev ? [] : ['upgrade-insecure-requests']),
].join('; ');

// microphone=(self) — the conversational input's voice mode uses the Web
// Speech API, which the microphone permission policy gates. Everything else
// the product never touches, so it's denied outright.
const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=(), payment=(), usb=()' },
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Server Actions default to a 1MB request body limit. A compressed item
  // photo (data: URI, capped at ~1MB by lib/validators/item.ts) plus the
  // rest of the form fields can land right at that ceiling, causing addItem
  // to fail at the network layer before it ever runs — the client sees a
  // generic "couldn't reach the server" error even though nothing was
  // actually wrong with the request itself. 4mb leaves real headroom.
  experimental: {
    serverActions: {
      bodySizeLimit: '4mb',
    },
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        // Nothing an authenticated API response returns should ever sit in a
        // shared or browser cache.
        source: '/api/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store, max-age=0' }],
      },
    ];
  },
};

export default nextConfig;
