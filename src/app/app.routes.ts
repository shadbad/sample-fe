// #region Imports
import type { Routes } from '@angular/router';
import { authGuard, authRoutes } from '@features/auth';
// #endregion Imports

/**
 * Root application route table.
 *
 * - `/`          — Redirects to `/users` (the default authenticated landing page).
 * - `/login`     — Public login page (guest-only via `guestGuard` in `authRoutes`).
 * - `/register`  — Public registration page (guest-only via `guestGuard` in `authRoutes`).
 * - `/users`     — Protected user list / management page (auth-only via `authGuard`).
 *                  Component loaded lazily once the `users` feature is implemented.
 */
export const routes: Routes = [
  // #region Default Redirect
  {
    path: '',
    redirectTo: 'users',
    pathMatch: 'full',
  },
  // #endregion Default Redirect

  // #region Auth Feature Routes (login, register)
  {
    path: '',
    loadChildren: () => Promise.resolve(authRoutes),
  },
  // #endregion Auth Feature Routes

  // #region Users Route — placeholder (users feature pending)
  {
    path: 'users',
    canActivate: [authGuard],
    // TODO: replace with lazy-loaded UsersPage once the users feature is implemented
    loadComponent: () =>
      import('./components/organisms/header/header.component').then((m) => m.HeaderComponent),
  },
  // #endregion Users Route
];
