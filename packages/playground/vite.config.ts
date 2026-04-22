// @fuyeor/markdown-parser-playground/vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [],
  server: {
    port: 7820,
  },
  build: {
    // generate to dist/assets/build/
    outDir: 'dist',
    rollupOptions: {
      output: {
        entryFileNames: `assets/entry.[hash].js`,
        chunkFileNames: `assets/chunk.[hash].js`,
        assetFileNames: `assets/asset.[hash].[ext]`,
      },
    },
  },
});
