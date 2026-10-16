// @ffm/benchmark/window.ts
// @ts-nocheck

// Polyfill for window if needed by some specific logic
globalThis.window = {
  document: {
    createElement: () => ({ setHTML: () => {} }),
  },
  Sanitizer: null,
};
