import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// jsdom ships no ResizeObserver; the toast library expects one.
globalThis.ResizeObserver =
  globalThis.ResizeObserver ||
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

afterEach(() => {
  cleanup();
  localStorage.clear();
});
