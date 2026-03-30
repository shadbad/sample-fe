// #region Production Environment
import type { Environment } from './environment.model';

/**
 * Production environment configuration.
 *
 * Swapped in by the Angular CLI `fileReplacements` mechanism when
 * `ng build --configuration production` is executed.
 * Replace the `apiBase` value with the real production API gateway URL
 * before deploying.
 */
export const environment: Environment = {
  production: true,
  apiBase: 'https://api.example.com/v1',
};

// #endregion Production Environment
