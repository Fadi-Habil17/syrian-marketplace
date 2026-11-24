import type { NextConfig } from 'next';
import path from 'node:path';

const config: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [{ source: '/:path*', headers: [{ key: 'Referrer-Policy', value: 'no-referrer' }] }];
  },
  poweredByHeader: false,
  experimental: { serverActions: { bodySizeLimit: '51mb' } },
  outputFileTracingRoot: path.resolve(__dirname, '..'),
  transpilePackages: ['@syrian-marketplace/contracts', '@syrian-marketplace/i18n'],
};

export default config;
