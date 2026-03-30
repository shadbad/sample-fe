// #region Imports
import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthFacade } from '../auth.facade';
// #endregion Imports

/**
 * Route guard that protects authenticated-only routes.
 *
 * Redirects unauthenticated users to `/login`. Authenticated users are allowed
 * to proceed to the requested route.
 *
 * @example
 * ```ts
 * import { authGuard } from '@features/auth';
 *
 * const routes: Routes = [
 *   { path: 'users', loadComponent: () => ..., canActivate: [authGuard] },
 * ];
 * ```
 */
export const authGuard: CanActivateFn = () => {
  const authFacade = inject(AuthFacade);
  const router = inject(Router);

  if (authFacade.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
