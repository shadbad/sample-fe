// #region Imports
import type { Routes } from '@angular/router';
import { authRoutes } from '@features/auth';
import { membersRoutes } from '@features/members';
// #endregion Imports

/**
 * Root application route table.
 *
 * - `/`          — Redirects to `/users` (the default authenticated landing page).
 * - `/login`     — Public login page (guest-only via `guestGuard` in `authRoutes`).
 * - `/register`  — Public registration page (guest-only via `guestGuard` in `authRoutes`).
 * - `/users`     — Protected user list / management page (auth-only via `authGuard`).
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

  // #region Members Feature Routes (/users)
  {
    path: '',
    loadChildren: () => Promise.resolve(membersRoutes),
  },
  // #endregion Members Feature Routes
];
