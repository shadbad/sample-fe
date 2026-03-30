// #region Imports
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AUTH_CONFIG } from '../auth.config';
import type { AuthModel, AuthResponseDto, UserModel } from '../models';
import { AuthMapper, isAuthDto, isUserDto, UserMapper } from '../models';
// #endregion Imports

// #region Service
/**
 * HTTP service for the Auth feature.
 *
 * Handles all REST calls to the `/auth/*` and user-resolution endpoints.
 * All methods return `Promise`s — no `Observable`s are surfaced to callers.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  // #region Dependencies
  readonly #http = inject(HttpClient);
  readonly #config = inject(AUTH_CONFIG);
  // #endregion Dependencies

  // #region Auth Endpoints

  /**
   * Authenticates a user with email and password.
   *
   * Calls `POST /auth/login` and returns the token payload on success.
   *
   * @param email    - The user's email address.
   * @param password - The user's plaintext password.
   * @returns A `Promise` resolving to the {@link AuthModel} on success.
   * @throws When the server returns a non-2xx response.
   */
  async login(email: string, password: string): Promise<AuthModel> {
    const response = await firstValueFrom(
      this.#http.post<AuthResponseDto>(
        `${this.#config.apiBase}/auth/login`,
        { email, password },
        { withCredentials: true },
      ),
    );
    if (!isAuthDto(response.data)) {
      throw new TypeError('Unexpected shape for auth login response');
    }
    return AuthMapper.dtoToModel(response.data);
  }

  /**
   * Registers a new user with full name, email address, and password.
   *
   * Calls `POST /auth/register`. Self-registered users have `role = null` until
   * an admin assigns one.
   *
   * @param fullName - The user's full display name.
   * @param email    - The user's email address.
   * @param password - The user's chosen plaintext password.
   * @returns A `Promise` resolving to the {@link AuthModel} on success.
   * @throws When the server returns a non-2xx response.
   */
  async register(fullName: string, email: string, password: string): Promise<AuthModel> {
    const response = await firstValueFrom(
      this.#http.post<AuthResponseDto>(
        `${this.#config.apiBase}/auth/register`,
        { fullName, email, password },
        { withCredentials: true },
      ),
    );
    if (!isAuthDto(response.data)) {
      throw new TypeError('Unexpected shape for auth register response');
    }
    return AuthMapper.dtoToModel(response.data);
  }

  /**
   * Exchanges the `HttpOnly` refresh-token cookie for a new access token.
   *
   * Calls `POST /auth/refresh` (no body; the browser sends the cookie).
   *
   * @returns A `Promise` resolving to the refreshed {@link AuthModel}.
   * @throws When the refresh token is expired or the server returns non-2xx.
   */
  async refresh(): Promise<AuthModel> {
    const response = await firstValueFrom(
      this.#http.post<AuthResponseDto>(
        `${this.#config.apiBase}/auth/refresh`,
        {},
        { withCredentials: true },
      ),
    );
    if (!isAuthDto(response.data)) {
      throw new TypeError('Unexpected shape for auth refresh response');
    }
    return AuthMapper.dtoToModel(response.data);
  }

  /**
   * Invalidates the current session.
   *
   * Calls `POST /auth/logout`. Returns `void`; any 204 response is a success.
   *
   * @throws When the server returns a non-2xx response.
   */
  async logout(): Promise<void> {
    await firstValueFrom(
      this.#http.post<void>(`${this.#config.apiBase}/auth/logout`, {}, { withCredentials: true }),
    );
  }

  // #endregion Auth Endpoints

  // #region User Resolution

  /**
   * Resolves the currently authenticated user's full profile.
   *
   * Calls `GET /users/:id` using the `userId` extracted from the JWT `sub` claim.
   * This is feature-internal; callers should use {@link AuthFacade.currentUser} instead.
   *
   * @param userId - The UUID extracted from the JWT `sub` field.
   * @returns A `Promise` resolving to the {@link UserModel}.
   * @throws {TypeError} When the API response does not match {@link UserDto}.
   * @throws When the server returns a non-2xx response.
   */
  async fetchCurrentUser(userId: string): Promise<UserModel> {
    const response = await firstValueFrom(
      this.#http.get<{ readonly data: unknown }>(`${this.#config.apiBase}/users/${userId}`),
    );
    if (!isUserDto(response.data)) {
      throw new TypeError(`Unexpected shape for user ${userId}`);
    }
    return UserMapper.dtoToModel(response.data);
  }

  // #endregion User Resolution
}
// #endregion Service
