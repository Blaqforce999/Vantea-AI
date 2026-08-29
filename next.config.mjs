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
};

export default nextConfig;
