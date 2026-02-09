import type { NextConfig } from 'next';
import withPWAInit, { runtimeCaching as defaultRuntimeCaching } from '@ducanh2912/next-pwa';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const runtimeCaching = [
  {
    urlPattern: ({ sameOrigin, url }: { sameOrigin: boolean; url: URL }) =>
      sameOrigin && url.pathname.startsWith('/api/'),
    handler: 'NetworkOnly' as const,
    method: 'GET' as const,
  },
  ...defaultRuntimeCaching.filter((entry) => entry.options?.cacheName !== 'apis'),
];

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
    runtimeCaching,
  },
});

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
};

export default withPWA(nextConfig);
