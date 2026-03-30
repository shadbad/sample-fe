// #region Imports
import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';
import type { Theme } from './theme.model';
import { THEME_STORAGE_KEY } from './theme.model';
// #endregion Imports

/**
 * Application-wide service that manages the active colour theme.
 *
 * Responsibilities:
 * - Resolves the initial theme from `localStorage`, then falls back to
 *   the OS-level `prefers-color-scheme` media query.
 * - Applies the theme by setting `data-theme` on the `<html>` element so
 *   the CSS custom-property selectors in `_colors.scss` activate correctly.
 * - Persists explicit user choices to `localStorage` for cross-session
 *   consistency.
 *
 * @example
 * ```ts
 * // Toggle theme from a component:
 * readonly #theme = inject(ThemeService);
 * toggle(): void { this.#theme.toggleTheme(); }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  // #region Dependencies
  readonly #document = inject(DOCUMENT);
  // #endregion Dependencies

  // #region State

  /**
   * The currently active theme.
   * Initialised synchronously from storage / system preference.
   */
  readonly theme = signal<Theme>(this.#resolveInitialTheme());

  // #endregion State

  // #region Initialisation

  /**
   * Applies the resolved initial theme to the DOM immediately on service
   * construction so there is no flash of unstyled content.
   */
  constructor() {
    this.#apply(this.theme());
  }

  // #endregion Initialisation

  // #region Methods

  /**
   * Switches to the specified theme, applies it to the DOM, and persists the
   * choice to `localStorage`.
   *
   * @param theme - The target colour scheme to activate.
   */
  setTheme(theme: Theme): void {
    this.theme.set(theme);
    this.#apply(theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }

  /**
   * Toggles between `'light'` and `'dark'`.
   * Convenience wrapper around {@link setTheme}.
   */
  toggleTheme(): void {
    this.setTheme(this.theme() === 'light' ? 'dark' : 'light');
  }

  // #endregion Methods

  // #region Private Helpers

  /**
   * Determines the initial theme with the following priority:
   * 1. Explicit value stored in `localStorage`.
   * 2. OS-level `prefers-color-scheme: dark` media query.
   * 3. Falls back to `'light'`.
   *
   * @returns The resolved {@link Theme}.
   */
  #resolveInitialTheme(): Theme {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  /**
   * Writes `data-theme` onto the `<html>` element so the CSS theme selectors
   * in `_colors.scss` react immediately.
   *
   * @param theme - The theme value to write.
   */
  #apply(theme: Theme): void {
    this.#document.documentElement.setAttribute('data-theme', theme);
  }

  // #endregion Private Helpers
}
