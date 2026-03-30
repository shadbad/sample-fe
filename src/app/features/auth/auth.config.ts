// #region Imports
import type { InjectionToken as InjectionTokenType, Provider } from '@angular/core';
import { InjectionToken } from '@angular/core';
// #endregion Imports

// #region Config Interface
/**
 * Runtime configuration contract for the Auth feature.
 *
 * The host application must supply these values via {@link provideAuthConfig}
 * before the `AuthFacade` or `AuthService` are used.
 */
export interface AuthConfig {
  /** Base URL of the API gateway (e.g. `'/api'`). */
  readonly apiBase: string;
}
// #endregion Config Interface

// #region DI Token
/**
 * DI token for {@link AuthConfig}.
 *
 * Inject this token wherever the auth feature configuration is needed.
 *
 * @example
 * ```ts
 * readonly #config = inject(AUTH_CONFIG);
 * ```
 */
export const AUTH_CONFIG: InjectionTokenType<AuthConfig> = new InjectionToken<AuthConfig>(
  'AUTH_CONFIG',
);
// #endregion DI Token

// #region Factory
/**
 * Creates the Angular `Provider` that registers a {@link AuthConfig} implementation
 * for the Auth feature.
 *
 * Register in `ApplicationConfig` (or a route's `providers` array):
 *
 * @example
 * ```ts
 * provideAuthConfig({ apiBase: '/api' })
 * ```
 *
 * @param config - The configuration values supplied by the host application.
 * @returns An Angular `Provider` to include in `ApplicationConfig` or route providers.
 */
export function provideAuthConfig(config: AuthConfig): Provider {
  return { provide: AUTH_CONFIG, useValue: config };
}
// #endregion Factory
