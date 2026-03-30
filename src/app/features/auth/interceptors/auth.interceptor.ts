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

// #region URL Skip Lists

/**
 * URL substrings for endpoints that must **not** receive an `Authorization: Bearer`
 * header. These are fully public or self-authenticating endpoints.
 *
 * - Login / register: anonymous endpoints, no session exists yet.
 * - Refresh: self-authenticating via HttpOnly cookie; sending a (potentially
 *   expired) Bearer token here would be misleading.
 */
const SKIP_TOKEN_URLS: readonly string[] = ['/auth/login', '/auth/register', '/auth/refresh'];

/**
 * URL substrings for endpoints that must **not** trigger the 401 refresh-retry
 * logic, even when they do carry a Bearer token.
 *
 * - Logout: the session is being torn down; retrying with a refreshed token
 *   would be nonsensical and could cause an infinite loop.
 * - Refresh: if the refresh endpoint itself returns 401 the session is already
 *   fully expired — retrying would loop forever.
 */
const SKIP_RETRY_URLS: readonly string[] = ['/auth/logout', '/auth/refresh'];

// #endregion URL Skip Lists

// #region Interceptor

/**
 * Functional HTTP interceptor that manages JWT Bearer token attachment and
 * silent token refresh on `401 Unauthorized` responses.
 *
 * Responsibilities:
 * 1. Attaches `Authorization: Bearer <token>` to all outbound requests whose
 *    URL does not match {@link SKIP_TOKEN_URLS}.
 * 2. On `401` from a non-skipped, non-retried request:
 *    a. Calls {@link AuthFacade.refreshToken} once.
 *    b. Retries the original request with the new token (marked as retried).
 * 3. If the refresh fails, calls {@link AuthFacade.logout} and navigates to `/login`.
 * 4. Requests matching {@link SKIP_RETRY_URLS} still receive the Bearer token
 *    but are never retried on 401 — this prevents an infinite logout/refresh loop.
 *
 * RxJS JUSTIFIED: `HttpInterceptorFn` must return `Observable<HttpEvent<unknown>>`.
 * No Signal or Promise equivalent exists for the interceptor contract. `switchMap`
 * and `from()` are used solely to bridge the async `refreshToken()` Promise into
 * the Observable pipeline.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authFacade = inject(AuthFacade);
  const router = inject(Router);

  // #region Attach Token
  const shouldSkipToken = SKIP_TOKEN_URLS.some((url) => req.url.includes(url));
  const token = authFacade.accessToken();
  const authedReq =
    !shouldSkipToken && token
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;
  // #endregion Attach Token

  // #region Handle 401 with One Refresh Retry
  const shouldSkipRetry = SKIP_RETRY_URLS.some((url) => req.url.includes(url));
  const isRetry = req.context.get(AUTH_RETRY);

  return next(authedReq).pipe(
    catchError((error: unknown) => {
      // Skip retry logic for designated endpoints, already-retried requests,
      // or non-401 errors.
      if (
        shouldSkipRetry ||
        !(error instanceof HttpErrorResponse) ||
        error.status !== 401 ||
        isRetry
      ) {
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
