// #region Imports
import { InjectionToken, type Provider } from '@angular/core';
import type { LogConfig } from './log.model';
import { LogLevel } from './log.model';
// #endregion Imports

// #region Token

/**
 * DI token for {@link LogConfig}.
 *
 * Provide this token in `app.config.ts` (or a feature provider) to control
 * which log levels are emitted at runtime.
 *
 * The default factory emits everything (`LogLevel.Debug`), which is suitable
 * for development. Override using {@link provideLogConfig} in production.
 *
 * @example
 * // app.config.ts
 * providers: [
 *   provideLogConfig({ minLevel: isDevMode() ? LogLevel.Debug : LogLevel.Warn }),
 * ]
 */
export const LOG_CONFIG = new InjectionToken<LogConfig>('LOG_CONFIG', {
  factory: (): LogConfig => ({ minLevel: LogLevel.Debug }),
});
// #endregion Token

// #region Factory

/**
 * Convenience factory provider for {@link LOG_CONFIG}.
 *
 * Merges the supplied partial config on top of the default
 * (`{ minLevel: LogLevel.Debug }`).
 *
 * @param config - Partial overrides applied on top of the default config.
 * @returns An Angular `Provider` ready for use in `providers: []`.
 *
 * @example
 * provideLogConfig({ minLevel: isDevMode() ? LogLevel.Debug : LogLevel.Warn })
 */
export function provideLogConfig(config: Partial<LogConfig>): Provider {
  return {
    provide: LOG_CONFIG,
    useValue: { minLevel: LogLevel.Debug, ...config } satisfies LogConfig,
  };
}
// #endregion Factory
