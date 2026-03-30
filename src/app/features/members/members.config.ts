// #region Imports
import type { InjectionToken as InjectionTokenType, Provider } from '@angular/core';
import { InjectionToken } from '@angular/core';
// #endregion Imports

// #region Config Interface
/**
 * Runtime configuration contract for the Members feature.
 *
 * The host application must supply these values via {@link provideMembersConfig}
 * before `MembersFacade` or `MembersService` are used.
 */
export interface MembersConfig {
  /** Base URL of the API gateway (e.g. `'/api'`). */
  readonly apiBase: string;
  /**
   * Available role options shown in the create/edit member form.
   *
   * Until a `GET /roles` endpoint exists, these are configured statically
   * by the host application. Each entry maps a backend UUID to a display name.
   */
  readonly roles: readonly { readonly id: string; readonly name: string }[];
}
// #endregion Config Interface

// #region DI Token
/**
 * DI token for {@link MembersConfig}.
 *
 * Inject this token wherever the members feature configuration is needed.
 *
 * @example
 * ```ts
 * readonly #config = inject(MEMBERS_CONFIG);
 * ```
 */
export const MEMBERS_CONFIG: InjectionTokenType<MembersConfig> = new InjectionToken<MembersConfig>(
  'MEMBERS_CONFIG',
);
// #endregion DI Token

// #region Factory
/**
 * Creates the Angular `Provider` that registers a {@link MembersConfig}
 * implementation for the Members feature.
 *
 * Register in `ApplicationConfig` (or a route's `providers` array):
 *
 * @example
 * ```ts
 * provideMembersConfig({
 *   apiBase: '/api',
 *   roles: [{ id: 'uuid-admin', name: 'admin' }, { id: 'uuid-user', name: 'user' }],
 * })
 * ```
 *
 * @param config - The configuration values supplied by the host application.
 * @returns An Angular `Provider` to include in `ApplicationConfig` or route providers.
 */
export function provideMembersConfig(config: MembersConfig): Provider {
  return { provide: MEMBERS_CONFIG, useValue: config };
}
// #endregion Factory
