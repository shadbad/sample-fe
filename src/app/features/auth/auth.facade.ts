// #region Imports
import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import type { UserModel } from './models';
import { AuthService } from './services/auth.service';
// #endregion Imports

// #region JWT Utility

/**
 * Extracts the `sub` (subject / user ID) claim from a JWT access token.
 *
 * Performs a best-effort base64url decode of the payload section.
 * Returns `null` if the token is malformed or the `sub` field is missing.
 *
 * @param token - A compact JWT string (`header.payload.signature`).
 * @returns The string value of the `sub` claim, or `null` on failure.
 */
function extractSubFromJwt(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    // base64url → standard base64 (replace - with + and _ with /)
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64)) as Record<string, unknown>;
    return typeof payload['sub'] === 'string' ? payload['sub'] : null;
  } catch {
    return null;
  }
}

// #endregion JWT Utility

// #region State Shape
/**
 * Internal state shape for the Auth feature store.
 */
interface AuthState {
  /** In-memory JWT access token. `null` when not authenticated. Never persisted to storage. */
  readonly accessToken: string | null;
  /** The currently authenticated user resolved from the API. `null` before login. */
  readonly currentUser: UserModel | null;
  /** `true` while any asynchronous auth operation (login, register, refresh) is in flight. */
  readonly isLoading: boolean;
  /** The last error message, or `null` when no error. */
  readonly error: string | null;
}

/** Initial (unauthenticated) state. */
const initialState: AuthState = {
  accessToken: null,
  currentUser: null,
  isLoading: false,
  error: null,
};
// #endregion State Shape

// #region Store
/**
 * Facade (NgRx Signal Store) for the Auth feature.
 *
 * Owns all authentication state, async operations, and derived computations.
 * Provided at root level so guarded routes and the HTTP interceptor can access
 * the `accessToken` signal without additional providers.
 *
 * @example Injecting in a component:
 * ```ts
 * readonly #auth = inject(AuthFacade);
 * readonly isLoggedIn = this.#auth.isAuthenticated;
 * ```
 */
export const AuthFacade = signalStore(
  { providedIn: 'root' },
  withState(initialState),

  // #region Computed
  withComputed(({ accessToken, currentUser }) => ({
    /**
     * `true` when an access token is present in memory (user is authenticated).
     */
    isAuthenticated: computed(() => accessToken() !== null),

    /**
     * `true` when the current user has a role named `'admin'`.
     * Returns `false` for un-assigned (`role = null`) users.
     */
    isAdmin: computed(() => currentUser()?.role?.name === 'admin'),

    /**
     * The authenticated user's UUID, or `null` when not authenticated.
     */
    currentUserId: computed(() => currentUser()?.id ?? null),
  })),
  // #endregion Computed

  // #region Methods
  withMethods((store) => {
    const authService = inject(AuthService);

    return {
      /**
       * Authenticates a user with email and password.
       *
       * Flow:
       * 1. POST `/auth/login` → receive access token.
       * 2. Extract `sub` from JWT payload → user ID.
       * 3. GET `/users/:id` → resolve full user profile.
       * 4. Store token + profile in state.
       *
       * On failure the `error` signal is populated; `isLoading` is reset to `false`.
       *
       * @param email    - The user's email address.
       * @param password - The user's plaintext password.
       * @throws Re-throws the underlying error after updating store state.
       */
      async login(email: string, password: string): Promise<void> {
        patchState(store, { isLoading: true, error: null });
        try {
          const auth = await authService.login(email, password);
          const userId = extractSubFromJwt(auth.accessToken);
          if (!userId) throw new Error('JWT sub claim missing — cannot resolve current user');
          const currentUser = await authService.fetchCurrentUser(userId);
          patchState(store, { accessToken: auth.accessToken, currentUser, isLoading: false });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Login failed';
          patchState(store, { error: message, isLoading: false });
          throw err;
        }
      },

      /**
       * Registers a new user account.
       *
       * The backend creates the account with `role = null`; no `roleId` is sent.
       * After successful registration the same post-login flow applies
       * (token stored, profile resolved).
       *
       * @param fullName - The user's full display name.
       * @param email    - The user's email address.
       * @param password - The user's chosen plaintext password.
       * @throws Re-throws the underlying error after updating store state.
       */
      async register(fullName: string, email: string, password: string): Promise<void> {
        patchState(store, { isLoading: true, error: null });
        try {
          const auth = await authService.register(fullName, email, password);
          const userId = extractSubFromJwt(auth.accessToken);
          if (!userId) throw new Error('JWT sub claim missing — cannot resolve current user');
          const currentUser = await authService.fetchCurrentUser(userId);
          patchState(store, { accessToken: auth.accessToken, currentUser, isLoading: false });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Registration failed';
          patchState(store, { error: message, isLoading: false });
          throw err;
        }
      },

      /**
       * Silently refreshes the access token using the `HttpOnly` refresh-token cookie.
       *
       * Called by {@link authInterceptor} on `401` responses.
       * Updates only the `accessToken`; `currentUser` is preserved.
       *
       * @throws Re-throws the underlying error so the interceptor can handle fallback logout.
       */
      async refreshToken(): Promise<void> {
        try {
          const auth = await authService.refresh();
          patchState(store, { accessToken: auth.accessToken });
        } catch (err) {
          patchState(store, { error: 'Session expired. Please log in again.' });
          throw err;
        }
      },

      /**
       * Logs the current user out.
       *
       * Calls `POST /auth/logout` (clears the server-side refresh-token cookie),
       * then resets all auth state to the initial unauthenticated values.
       *
       * Errors from the logout call are silently swallowed — state is always cleared.
       */
      async logout(): Promise<void> {
        try {
          await authService.logout();
        } catch {
          // Ignore server errors — always clear local state
        } finally {
          patchState(store, initialState);
        }
      },
    };
  }),
  // #endregion Methods
);
// #endregion Store
