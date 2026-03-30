// #region Theme Type

/**
 * The visual colour scheme of the application.
 *
 * - `'light'` — light backgrounds, dark text.
 * - `'dark'`  — dark backgrounds, light text.
 */
export type Theme = 'light' | 'dark';

// #endregion Theme Type

// #region Constants

/**
 * The `localStorage` key used to persist the user's explicit theme preference
 * across sessions.
 */
export const THEME_STORAGE_KEY = 'app-theme' as const;

// #endregion Constants
