// #region Jest-DOM Matchers
/**
 * Extends Vitest's `expect` with custom DOM matchers from `@testing-library/jest-dom`.
 * Uses the Vitest-specific entry point so matchers augment `vitest`'s `expect`,
 * not Jest's. Provides matchers like `.toBeVisible()`, `.toHaveValue()`, `.toBeDisabled()`, etc.
 *
 * This file is registered as a global setup file in `angular.json` via `setupFiles`.
 * Angular's `TestBed` initialisation always runs before this file.
 */
import '@testing-library/jest-dom/vitest';
// #endregion Jest-DOM Matchers

// #region Browser API Polyfills
/**
 * jsdom does not implement `window.matchMedia`. Any service or component that
 * reads media queries at construction time (e.g. {@link ThemeService}) will
 * throw without this stub. The mock always returns `false` for `.matches` so
 * tests default to the light theme unless explicitly overridden.
 */
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      addListener: () => {},
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      removeListener: () => {},
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      addEventListener: () => {},
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList,
});
// #endregion Browser API Polyfills
