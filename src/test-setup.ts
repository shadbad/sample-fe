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
