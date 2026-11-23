import type { NextConfig } from 'next';
import path from 'node:path';

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: { serverActions: { bodySizeLimit: '51mb' } },
  outputFileTracingRoot: path.resolve(__dirname, '..'),
  transpilePackages: ['@syrian-marketplace/contracts', '@syrian-marketplace/i18n'],
};

export default config;
