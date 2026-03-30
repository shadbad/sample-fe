// #region Imports
import { Injectable } from '@angular/core';
// #endregion Imports

// #region Constants

/** `sessionStorage` key used to persist the JWT access token across page refreshes. */
const TOKEN_KEY = 'access_token';

// #endregion Constants

// #region Service

/**
 * Lightweight persistence layer for the JWT access token.
 *
 * Uses `sessionStorage` instead of `localStorage` so the token is automatically
 * discarded when the browser tab is closed, minimising the XSS exposure window
 * while still surviving a page refresh within the same tab session.
 *
 * This service is the **single source of truth** for token persistence — no other
 * code should read from or write to `sessionStorage` directly.
 */
@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  /**
   * Reads the persisted access token from `sessionStorage`.
   *
   * @returns The JWT string if present, or `null` when the token has not been
   *   stored or has already been cleared.
   */
  getToken(): string | null {
    return sessionStorage.getItem(TOKEN_KEY);
  }

  /**
   * Persists the access token to `sessionStorage`.
   *
   * Called after a successful login, registration, or silent token refresh.
   *
   * @param token - The JWT access token to store.
   */
  setToken(token: string): void {
    sessionStorage.setItem(TOKEN_KEY, token);
  }

  /**
   * Removes the access token from `sessionStorage`.
   *
   * Called on logout or when a refresh attempt fails and the session is
   * considered definitively expired.
   */
  clearToken(): void {
    sessionStorage.removeItem(TOKEN_KEY);
  }
}

// #endregion Service
