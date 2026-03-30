// #region Imports
import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthFacade } from '../auth.facade';
// #endregion Imports

/**
 * Route guard that protects guest-only routes (login, register).
 *
 * Redirects already-authenticated users away from `/login` and `/register`
 * to `/users`. Unauthenticated visitors are allowed to proceed.
 *
 * @example
 * ```ts
 * const routes: Routes = [
 *   { path: 'login', loadComponent: () => ..., canActivate: [guestGuard] },
 * ];
 * ```
 */
export const guestGuard: CanActivateFn = () => {
  const authFacade = inject(AuthFacade);
  const router = inject(Router);

  if (!authFacade.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/users']);
};
