// #region Imports
import type { Routes } from '@angular/router';
import { guestGuard } from './guards/guest.guard';
// #endregion Imports

/**
 * Lazy-loaded route definitions for the Auth feature.
 *
 * Both `/login` and `/register` are protected by {@link guestGuard} so that
 * already-authenticated users are bounced back to `/users`.
 *
 * Register in the host application's root route configuration:
 *
 * @example
 * ```ts
 * import { authRoutes } from '@features/auth';
 *
 * const routes: Routes = [
 *   { path: '', loadChildren: () => Promise.resolve(authRoutes) },
 * ];
 * ```
 */
export const authRoutes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/register/register.page').then((m) => m.RegisterPage),
  },
];
