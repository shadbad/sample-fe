// #region Imports
import { HttpContextToken, HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { from, switchMap, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthFacade } from '../auth.facade';
// #endregion Imports

// #region Skip-Retry Token

/**
 * `HttpContext` token used to mark a request as already-retried after a token
 * refresh. When present and `true`, the interceptor skips the retry logic to
 * prevent infinite refresh loops.
 */
export const AUTH_RETRY = new HttpContextToken<boolean>(() => false);

// #endregion Skip-Retry Token

// #region URL Skip List

/**
 * URL substrings for endpoints that must NOT receive an `Authorization` header
 * and must bypass the 401 refresh-retry logic entirely.
 *
 * - Login / register: public endpoints, no token needed.
 * - Refresh: self-authenticating via HttpOnly cookie.
 * - Logout: must never trigger a refresh retry; if the server returns 401 the
 *   session is already invalid and retrying would cause an infinite loop.
 */
const SKIP_AUTH_URLS: readonly string[] = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/logout',
];

// #endregion URL Skip List

// #region Interceptor

/**
 * Functional HTTP interceptor that manages JWT Bearer token attachment and
 * silent token refresh on `401 Unauthorized` responses.
 *
 * Responsibilities:
 * 1. Attaches `Authorization: Bearer <token>` to all outbound requests
 *    whose URL does not match {@link SKIP_AUTH_URLS}.
 * 2. On `401` from a non-skipped, non-retried request:
 *    a. Calls {@link AuthFacade.refreshToken} once.
 *    b. Retries the original request with the new token (marked as retried).
 * 3. If the refresh fails, calls {@link AuthFacade.logout} and navigates to `/login`.
 *
 * RxJS JUSTIFIED: `HttpInterceptorFn` must return `Observable<HttpEvent<unknown>>`.
 * No Signal or Promise equivalent exists for the interceptor contract. `switchMap`
 * and `from()` are used solely to bridge the async `refreshToken()` Promise into
 * the Observable pipeline.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authFacade = inject(AuthFacade);
  const router = inject(Router);

  // #region Skip Auth Endpoints
  const shouldSkip = SKIP_AUTH_URLS.some((url) => req.url.includes(url));
  if (shouldSkip) {
    return next(req);
  }
  // #endregion Skip Auth Endpoints

  // #region Attach Token
  const token = authFacade.accessToken();
  const authedReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
  // #endregion Attach Token

  // #region Handle 401 with One Refresh Retry
  const isRetry = req.context.get(AUTH_RETRY);

  return next(authedReq).pipe(
    catchError((error: unknown) => {
      // Only intercept 401s on non-retry requests
      if (!(error instanceof HttpErrorResponse) || error.status !== 401 || isRetry) {
        return throwError(() => error);
      }

      // Attempt a single silent refresh, then retry the original request
      return from(authFacade.refreshToken()).pipe(
        switchMap(() => {
          const newToken = authFacade.accessToken();
          const retryReq = req.clone({
            setHeaders: { Authorization: `Bearer ${newToken ?? ''}` },
            context: req.context.set(AUTH_RETRY, true),
          });
          return next(retryReq);
        }),
        catchError((refreshError: unknown) => {
          // Refresh failed — force logout and redirect to login
          return from(authFacade.logout()).pipe(
            switchMap(() => {
              void router.navigate(['/login']);
              return throwError(() => refreshError);
            }),
          );
        }),
      );
    }),
  );
  // #endregion Handle 401 with One Refresh Retry
};

// #endregion Interceptor
