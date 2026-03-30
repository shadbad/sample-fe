// #region Log Level

/**
 * Ordered log severity levels.
 * Numeric values allow `>=` comparisons for level filtering.
 *
 * @example
 * // Only emit warn and above in production:
 * const config: LogConfig = { minLevel: LogLevel.Warn };
 */
export enum LogLevel {
  Debug = 0,
  Info = 1,
  Warn = 2,
  Error = 3,
}
// #endregion Log Level

// #region Log Entry

/**
 * The payload passed to every `LogService` method.
 */
export interface LogEntry {
  /**
   * Primary log message (developer-facing; always written to the console).
   * Use a static string here — avoid putting user-visible text in this field.
   */
  readonly message: string;

  /**
   * Optional structured data attached to the log line (serialised to the console).
   * Must be JSON-serialisable.
   */
  readonly data?: Readonly<Record<string, unknown>>;

  /**
   * Optional i18n translation key.
   * When provided the service will look up the key via `TranslateService`
   * and display the translated string as a toast notification whose severity
   * matches the log level of the call.
   *
   * Keys follow the project convention: `@@feature.component.key`.
   *
   * @example 'errors.serverError'
   * @example 'auth.logoutSuccess'
   */
  readonly toastKey?: string;

  /**
   * Optional interpolation params forwarded to `TranslateService.instant()`.
   *
   * @example { value: 8 }  // for key "errors.minLength" → "Minimum length is 8 characters."
   */
  readonly toastParams?: Readonly<Record<string, unknown>>;
}
// #endregion Log Entry

// #region Log Config

/**
 * Runtime configuration for {@link LogService}.
 * Provided via the `LOG_CONFIG` injection token.
 */
export interface LogConfig {
  /**
   * The minimum level to emit.
   * Any call whose level is below this threshold is silently dropped.
   *
   * @example LogLevel.Debug  // development — emit everything
   * @example LogLevel.Warn   // production  — emit only warn + error
   */
  readonly minLevel: LogLevel;
}
// #endregion Log Config
