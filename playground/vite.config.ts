// @/vite.config.ts
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { createViteConfig } from '@fuyeor/config/vite.config.js';

export default defineConfig(() => {
  return createViteConfig(
    {
      resolve: {
        alias: {
          '@app': resolve(__dirname, './src/@app'),
        },
      },
      server: {
        host: '0.0.0.0',
        port: 7820,
      },
    },
    import.meta.dirname,
  );
});
