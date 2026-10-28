/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig = {
  // PGlite (banco local de desenvolvimento) e pg rodam só no servidor Node
  serverExternalPackages: ['@electric-sql/pglite', 'pg'],
  poweredByHeader: false,
  images: {
    // Domínios de onde o admin poderá servir pôsteres autorizados (ex.: Supabase Storage)
    remotePatterns: [{ protocol: 'https', hostname: '*.supabase.co' }],
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
