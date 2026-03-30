// #region Imports
import type { Routes } from '@angular/router';
import { authGuard } from '@features/auth';
// #endregion Imports

/**
 * Lazy-loaded route definitions for the Members feature.
 *
 * The `/users` route mounts the `UsersPage` which renders either the admin
 * CRUD table or the regular read-only member list based on the current user's
 * role — both driven by `AuthFacade.isAdmin`.
 *
 * Route is protected by {@link authGuard}; unauthenticated users are redirected
 * to `/login`.
 *
 * @example Register in the host `app.routes.ts`:
 * ```ts
 * import { membersRoutes } from '@features/members';
 *
 * const routes: Routes = [
 *   { path: '', loadChildren: () => Promise.resolve(membersRoutes) },
 * ];
 * ```
 */
export const membersRoutes: Routes = [
  {
    path: 'users',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/users/users.page').then((m) => m.UsersPage),
  },
];
