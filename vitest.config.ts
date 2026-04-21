// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [],
  test: {
    // Test browser environment
    environment: 'jsdom',

    // Shared test file search mode
    // Ensure it can find test files in all subpackages
    include: ['**/*.spec.ts'],

    // disable string truncation when asserting
    chaiConfig: {
      truncateThreshold: 0,
    },

    // Coverage configuration
    coverage: {
      // Don't generate coverage files
      enabled: false,
    },

    // Configure the root directory
    root: './',

    // Pass even if there are no test files
    passWithNoTests: true,

    // Use global variables describe, it, expect
    globals: true,
  },
});
