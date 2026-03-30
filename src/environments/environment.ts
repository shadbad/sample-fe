// #region Development Environment
import type { Environment } from './environment.model';

/**
 * Development environment configuration.
 *
 * This file is the default used by the Angular CLI.
 * It is replaced by `environment.prod.ts` during production builds
 * via the `fileReplacements` entry in `angular.json`.
 */
export const environment: Environment = {
  production: false,
  apiBase: 'http://localhost:3000/v1',
};

// #endregion Development Environment
