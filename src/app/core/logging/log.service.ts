// #region Imports
import { inject, Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import type { ToastLevel } from '../toast/toast.model';
import { ToastStore } from '../toast/toast.store';
import { LOG_CONFIG } from './log-config.token';
import type { LogEntry } from './log.model';
import { LogLevel } from './log.model';
// #endregion Imports

// #region Level Map

/**
 * Maps {@link LogLevel} values to {@link ToastLevel} severity strings.
 * Kept at module level to avoid re-creating the object on every call.
 */
const LEVEL_TO_TOAST: Readonly<Record<LogLevel, ToastLevel>> = {
  [LogLevel.Debug]: 'subtle',
  [LogLevel.Info]: 'info',
  [LogLevel.Warn]: 'warning',
  [LogLevel.Error]: 'error',
};
// #endregion Level Map

/**
 * Application-wide logging service.
 *
 * Wraps `console.*` behind a level-filtered API that matches the winston
 * convention (`debug | info | warn | error`).
 *
 * When a {@link LogEntry} includes a `toastKey`, the resolved translation
 * string is pushed to `ToastStore` with a severity that mirrors the log level.
 *
 * ### Level → Console / Toast mapping
 *
 * | LogLevel | Console method   | Toast severity |
 * |----------|-----------------|----------------|
 * | Debug    | `console.debug` | `'subtle'`     |
 * | Info     | `console.info`  | `'info'`       |
 * | Warn     | `console.warn`  | `'warning'`    |
 * | Error    | `console.error` | `'error'`      |
 *
 * @example
 * ```ts
 * // Developer-only console output, no toast
 * this.#log.debug({ message: 'User state loaded', data: { userId } });
 *
 * // Console + auto-dismissing info toast
 * this.#log.info({ message: 'Logout successful', toastKey: 'auth.logoutSuccess' });
 *
 * // Console + sticky error toast
 * this.#log.error({ message: 'API call failed', data: { status }, toastKey: 'errors.serverError' });
 * ```
 */
@Injectable({ providedIn: 'root' })
export class LogService {
  // #region Dependencies
  readonly #config = inject(LOG_CONFIG);
  readonly #translate = inject(TranslateService);
  readonly #toastStore = inject(ToastStore);
  // #endregion Dependencies

  // #region Public API

  /**
   * Emits a DEBUG-level entry.
   * Useful for tracing internal state during development.
   * Dropped entirely when `minLevel` is set above `Debug`.
   *
   * @param entry - The log entry payload.
   */
  debug(entry: LogEntry): void {
    this.#emit(LogLevel.Debug, entry);
  }

  /**
   * Emits an INFO-level entry.
   * Use for significant, non-critical lifecycle events.
   *
   * @param entry - The log entry payload.
   */
  info(entry: LogEntry): void {
    this.#emit(LogLevel.Info, entry);
  }

  /**
   * Emits a WARN-level entry.
   * Use for degraded-but-recoverable states.
   *
   * @param entry - The log entry payload.
   */
  warn(entry: LogEntry): void {
    this.#emit(LogLevel.Warn, entry);
  }

  /**
   * Emits an ERROR-level entry.
   * Use for unrecoverable failures the user should know about.
   *
   * @param entry - The log entry payload.
   */
  error(entry: LogEntry): void {
    this.#emit(LogLevel.Error, entry);
  }
  // #endregion Public API

  // #region Private Helpers

  /**
   * Core dispatch: filters by configured minimum level, writes to the console,
   * and optionally triggers a toast notification.
   *
   * @param level - Severity of this log entry.
   * @param entry - The {@link LogEntry} payload.
   */
  #emit(level: LogLevel, entry: LogEntry): void {
    if (level < this.#config.minLevel) return;

    this.#writeConsole(level, entry);

    if (entry.toastKey) {
      this.#showToast(level, entry.toastKey, entry.toastParams);
    }
  }

  /**
   * Writes the entry to the appropriate `console.*` method.
   * Always prefixes the output with the level name for quick scanning in DevTools.
   *
   * @param level - Severity of this log entry.
   * @param entry - The {@link LogEntry} payload.
   */
  #writeConsole(level: LogLevel, entry: LogEntry): void {
    const prefix = `[${LogLevel[level].toUpperCase()}]`;
    const args: unknown[] = [prefix, entry.message];
    if (entry.data) args.push(entry.data);

    switch (level) {
      case LogLevel.Debug:
        console.debug(...args);
        break;
      case LogLevel.Info:
        console.info(...args);
        break;
      case LogLevel.Warn:
        console.warn(...args);
        break;
      case LogLevel.Error:
        console.error(...args);
        break;
    }
  }

  /**
   * Resolves the i18n key synchronously and pushes a toast entry to `ToastStore`.
   * Uses `TranslateService.instant()` because translations are fully loaded before any
   * log call can occur (the translate service is bootstrapped in `app.config.ts`).
   *
   * @param level  - Log level used to derive the toast severity.
   * @param key    - ngx-translate key (e.g. `'errors.serverError'`).
   * @param params - Optional interpolation params forwarded to the translator.
   */
  #showToast(level: LogLevel, key: string, params?: Readonly<Record<string, unknown>>): void {
    const message = this.#translate.instant(key, params) as string;
    const toastLevel = LEVEL_TO_TOAST[level];
    this.#toastStore.push({ message, level: toastLevel });
  }
  // #endregion Private Helpers
}
