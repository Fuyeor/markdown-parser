// @fuyeor/markdown-parser-playground/vite.config.ts
import { defineConfig } from 'vite';
import { createViteConfig } from '@fuyeor/config/vite.config.js';

export default defineConfig(() => {
  return createViteConfig(
    {
      server: {
        host: '0.0.0.0',
        port: 7820,
      },
    },
    import.meta.dirname,
  );
});
