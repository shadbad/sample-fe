// #region Imports
import { resolve } from 'path';
import { defineConfig } from 'vitest/config';
// #endregion Imports

// #region Config
/**
 * Base Vitest configuration for Sample-FE.
 *
 * This file is picked up by Angular's `\@angular/build:unit-test` builder when
 * `runnerConfig: true` is set in `angular.json`. Angular injects its own plugins
 * (globals, jsdom environment, TestBed initialisation, polyfills) on top of this
 * base; only project-level overrides belong here.
 *
 * @see https://vitest.dev/config/
 */
export default defineConfig({
  resolve: {
    // #region Path Aliases
    /**
     * Mirror the TypeScript `paths` entries from `tsconfig.json` so Vitest can
     * resolve `@components/*`, `@features/*`, and `@models` at test time.
     */
    alias: {
      '@components/atoms': resolve(__dirname, 'src/app/components/atoms/index.ts'),
      '@components/molecules': resolve(__dirname, 'src/app/components/molecules/index.ts'),
      '@components/organisms': resolve(__dirname, 'src/app/components/organisms/index.ts'),
      '@components/templates': resolve(__dirname, 'src/app/components/templates/index.ts'),
      '@models': resolve(__dirname, 'src/app/models/index.ts'),
      '@features/auth': resolve(__dirname, 'src/app/features/auth/index.ts'),
      '@features/members': resolve(__dirname, 'src/app/features/members/index.ts'),
      '@features/users': resolve(__dirname, 'src/app/features/users/index.ts'),
    },
    // #endregion Path Aliases
  },
  test: {
    // #region Reporters
    /**
     * Use the default reporter in watch mode and verbose in CI.
     * Override via the `--reporter` CLI flag or `angular.json#reporters`.
     */
    reporters: process.env['CI'] ? ['verbose'] : ['default'],
    // #endregion Reporters

    // #region Coverage
    coverage: {
      /**
       * Coverage provider — v8 is fastest and requires no extra dependency.
       */
      provider: 'v8',

      /**
       * Source files to include in the coverage report.
       * Excludes spec files, barrel index files, and generated files.
       */
      include: ['src/app/**/*.ts'],
      exclude: [
        'src/app/**/*.spec.ts',
        'src/app/**/*.routes.ts',
        'src/app/**/index.ts',
        'src/app/**/*.config.ts',
        'src/main.ts',
      ],

      /**
       * Minimum coverage thresholds — build fails if any threshold is not met.
       */
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },

      /**
       * Coverage reporters: human-readable summary in the terminal +
       * lcov for CI coverage dashboards (Codecov, SonarQube, etc.).
       */
      reporter: ['text-summary', 'lcov', 'html'],
    },
    // #endregion Coverage
  },
});
// #endregion Config
