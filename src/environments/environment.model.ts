// #region Environment Model

/**
 * Shape of the compile-time environment configuration object.
 *
 * `src/environments/environment.ts` (development) is the default.
 * `src/environments/environment.prod.ts` is swapped in by the Angular CLI
 * via `fileReplacements` during a production build.
 */
export interface Environment {
  /** Whether the application is compiled in production mode. */
  readonly production: boolean;

  /**
   * Base URL for the API gateway, without a trailing slash.
   *
   * @example 'http://localhost:3000/v1'   // development
   * @example 'https://api.example.com/v1' // production
   */
  readonly apiBase: string;
}

// #endregion Environment Model
