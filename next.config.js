/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // All payment routes run on the Node runtime (crypto SHA512, server secrets).
  // No secrets are exposed to the client; this app serves no customer-facing UI.
  poweredByHeader: false,
};

module.exports = nextConfig;
