// #region Imports
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, isDevMode, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { environment } from '@env';
import { authInterceptor, provideAuthConfig } from '@features/auth';
import { provideMembersConfig } from '@features/members';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { provideLogConfig } from './core/logging/log-config.token';
import { LogLevel } from './core/logging/log.model';

import { routes } from './app.routes';
// #endregion Imports

/**
 * Root application configuration.
 *
 * Registers global providers for routing, HTTP, i18n (ngx-translate), and auth.
 * Supported locales: `en` (default) and `de`.
 * Translation files are loaded from `public/i18n/{lang}.json` (served at `/i18n/{lang}.json`) at runtime.
 * `lang: 'en'` activates English on startup; `fallbackLang: 'en'` is used for any missing keys.
 * The HTTP loader is configured as the `loader` property inside `provideTranslateService` so that
 * `TranslateService` picks it up — passing it as a sibling provider is a no-op.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    // #region Core
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    // #endregion Core

    // #region Auth
    provideAuthConfig({
      apiBase: environment.apiBase,
    }),
    // #endregion Auth

    // #region Members
    provideMembersConfig({
      apiBase: environment.apiBase,
      // TODO: replace with dynamic GET /roles fetch — endpoint available at GET /roles
      roles: [{ id: '82643745-f3f0-440f-885a-d9b88d0f3d18', name: 'admin' }],
    }),
    // #endregion Members

    // #region i18n
    provideTranslateService({
      loader: provideTranslateHttpLoader({ prefix: '/i18n/', suffix: '.json' }),
      lang: 'en',
      fallbackLang: 'en',
    }),
    // #endregion i18n

    // #region Observability
    provideLogConfig({
      minLevel: isDevMode() ? LogLevel.Debug : LogLevel.Warn,
    }),
    // #endregion Observability
  ],
};
