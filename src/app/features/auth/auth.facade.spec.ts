// #region Imports
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AUTH_CONFIG } from './auth.config';
import { AuthFacade } from './auth.facade';
import type { UserModel } from './models';
import { AuthService } from './services/auth.service';
import { TokenStorageService } from './services/token-storage.service';
// #endregion Imports

// #region Test Helpers

/**
 * Creates a minimal test JWT with the given `sub` (user ID) claim.
 *
 * Includes a far-future `exp` (year 2099) so that the facade's `isJwtExpired`
 * utility treats the token as valid.
 *
 * @param sub - The subject (user ID) to embed in the JWT payload.
 * @returns A compact JWT string (`header.payload.fake-sig`).
 */
function makeTestJwt(sub: string): string {
  const toBase64Url = (str: string): string =>
    btoa(str).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const exp = Math.floor(new Date('2099-01-01').getTime() / 1000);
  const header = toBase64Url('{"alg":"none"}');
  const payload = toBase64Url(JSON.stringify({ sub, email: 'test@example.com', exp }));
  return `${header}.${payload}.test-sig`;
}

/**
 * Creates a test JWT whose `exp` claim is set in the past (year 2000),
 * causing `isJwtExpired` to return `true`.
 *
 * @param sub - The subject (user ID) to embed in the JWT payload.
 * @returns A compact JWT string (`header.payload.fake-sig`).
 */
function makeExpiredTestJwt(sub: string): string {
  const toBase64Url = (str: string): string =>
    btoa(str).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const exp = Math.floor(new Date('2000-01-01').getTime() / 1000);
  const header = toBase64Url('{"alg":"none"}');
  const payload = toBase64Url(JSON.stringify({ sub, email: 'test@example.com', exp }));
  return `${header}.${payload}.test-sig`;
}

/** Minimal {@link UserModel} returned by the mock service. */
const TEST_USER: UserModel = {
  id: 'test-user-id',
  email: 'test@example.com',
  fullName: 'Test User',
  role: null,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
};

// #endregion Test Helpers

// #region Test Suite
describe('AuthFacade', () => {
  // #region Mocks
  let mockAuthService: {
    login: ReturnType<typeof vi.fn>;
    register: ReturnType<typeof vi.fn>;
    refresh: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
    fetchCurrentUser: ReturnType<typeof vi.fn>;
  };

  let mockTokenStorage: {
    getToken: ReturnType<typeof vi.fn>;
    setToken: ReturnType<typeof vi.fn>;
    clearToken: ReturnType<typeof vi.fn>;
  };
  // #endregion Mocks

  // #region Setup
  beforeEach(() => {
    mockAuthService = {
      login: vi.fn(),
      register: vi.fn(),
      refresh: vi.fn(),
      logout: vi.fn(),
      fetchCurrentUser: vi.fn(),
    };

    mockTokenStorage = {
      // Default: no stored token, so onInit does not trigger user fetch
      getToken: vi.fn().mockReturnValue(null),
      setToken: vi.fn(),
      clearToken: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        AuthFacade,
        { provide: AuthService, useValue: mockAuthService },
        { provide: TokenStorageService, useValue: mockTokenStorage },
        { provide: AUTH_CONFIG, useValue: { apiBase: '/api' } },
      ],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });
  // #endregion Setup

  // #region Initial State
  describe('initial state', () => {
    it('has null accessToken, null currentUser, false isLoading, null error', () => {
      const facade = TestBed.inject(AuthFacade);

      expect(facade.accessToken()).toBeNull();
      expect(facade.currentUser()).toBeNull();
      expect(facade.isLoading()).toBe(false);
      expect(facade.error()).toBeNull();
    });

    it('isAuthenticated is false when no token is present', () => {
      const facade = TestBed.inject(AuthFacade);
      expect(facade.isAuthenticated()).toBe(false);
    });

    it('isAdmin is false when currentUser is null', () => {
      const facade = TestBed.inject(AuthFacade);
      expect(facade.isAdmin()).toBe(false);
    });

    it('currentUserId is null when not authenticated', () => {
      const facade = TestBed.inject(AuthFacade);
      expect(facade.currentUserId()).toBeNull();
    });
  });
  // #endregion Initial State

  // #region login()
  describe('login()', () => {
    it('sets isLoading to true while the request is in flight', async () => {
      const facade = TestBed.inject(AuthFacade);
      const jwt = makeTestJwt('test-user-id');

      mockAuthService.login.mockResolvedValue({
        accessToken: jwt,
        tokenType: 'Bearer',
        expiresIn: 3600,
      });
      mockAuthService.fetchCurrentUser.mockResolvedValue(TEST_USER);

      const promise = TestBed.runInInjectionContext(() => facade.login('a@b.com', 'pass'));
      expect(facade.isLoading()).toBe(true);
      await promise;
    });

    it('sets accessToken and currentUser on success', async () => {
      const facade = TestBed.inject(AuthFacade);
      const jwt = makeTestJwt('test-user-id');

      mockAuthService.login.mockResolvedValue({
        accessToken: jwt,
        tokenType: 'Bearer',
        expiresIn: 3600,
      });
      mockAuthService.fetchCurrentUser.mockResolvedValue(TEST_USER);

      await TestBed.runInInjectionContext(() => facade.login('a@b.com', 'pass'));

      expect(facade.accessToken()).toBe(jwt);
      expect(facade.currentUser()).toEqual(TEST_USER);
      expect(facade.isLoading()).toBe(false);
      expect(facade.error()).toBeNull();
      expect(facade.isAuthenticated()).toBe(true);
    });

    it('persists the token to storage on success', async () => {
      const facade = TestBed.inject(AuthFacade);
      const jwt = makeTestJwt('test-user-id');

      mockAuthService.login.mockResolvedValue({
        accessToken: jwt,
        tokenType: 'Bearer',
        expiresIn: 3600,
      });
      mockAuthService.fetchCurrentUser.mockResolvedValue(TEST_USER);

      await TestBed.runInInjectionContext(() => facade.login('a@b.com', 'pass'));

      expect(mockTokenStorage.setToken).toHaveBeenCalledWith(jwt);
    });

    it('fetches current user using the sub extracted from the JWT', async () => {
      const facade = TestBed.inject(AuthFacade);
      const jwt = makeTestJwt('test-user-id');

      mockAuthService.login.mockResolvedValue({
        accessToken: jwt,
        tokenType: 'Bearer',
        expiresIn: 3600,
      });
      mockAuthService.fetchCurrentUser.mockResolvedValue(TEST_USER);

      await TestBed.runInInjectionContext(() => facade.login('a@b.com', 'pass'));

      expect(mockAuthService.fetchCurrentUser).toHaveBeenCalledWith('test-user-id');
    });

    it('sets error and resets isLoading on failure', async () => {
      const facade = TestBed.inject(AuthFacade);
      mockAuthService.login.mockRejectedValue(new Error('Invalid credentials'));

      await expect(
        TestBed.runInInjectionContext(() => facade.login('a@b.com', 'wrong')),
      ).rejects.toThrow('Invalid credentials');

      expect(facade.error()).toBe('Invalid credentials');
      expect(facade.isLoading()).toBe(false);
      expect(facade.accessToken()).toBeNull();
    });

    it('isAdmin returns true when the current user has role.name === "admin"', async () => {
      const facade = TestBed.inject(AuthFacade);
      const jwt = makeTestJwt('admin-id');
      const adminUser: UserModel = {
        ...TEST_USER,
        id: 'admin-id',
        role: { id: 'role-admin', name: 'admin' },
      };

      mockAuthService.login.mockResolvedValue({
        accessToken: jwt,
        tokenType: 'Bearer',
        expiresIn: 3600,
      });
      mockAuthService.fetchCurrentUser.mockResolvedValue(adminUser);

      await TestBed.runInInjectionContext(() => facade.login('a@b.com', 'pass'));

      expect(facade.isAdmin()).toBe(true);
    });
  });
  // #endregion login()

  // #region register()
  describe('register()', () => {
    it('sets accessToken and currentUser on successful registration', async () => {
      const facade = TestBed.inject(AuthFacade);
      const jwt = makeTestJwt('test-user-id');

      mockAuthService.register.mockResolvedValue({
        accessToken: jwt,
        tokenType: 'Bearer',
        expiresIn: 3600,
      });
      mockAuthService.fetchCurrentUser.mockResolvedValue(TEST_USER);

      await TestBed.runInInjectionContext(() =>
        facade.register('Test User', 'a@b.com', 'pass1234'),
      );

      expect(facade.accessToken()).toBe(jwt);
      expect(facade.currentUser()?.role).toBeNull();
      expect(facade.isAuthenticated()).toBe(true);
    });

    it('persists the token to storage on successful registration', async () => {
      const facade = TestBed.inject(AuthFacade);
      const jwt = makeTestJwt('test-user-id');

      mockAuthService.register.mockResolvedValue({
        accessToken: jwt,
        tokenType: 'Bearer',
        expiresIn: 3600,
      });
      mockAuthService.fetchCurrentUser.mockResolvedValue(TEST_USER);

      await TestBed.runInInjectionContext(() =>
        facade.register('Test User', 'a@b.com', 'pass1234'),
      );

      expect(mockTokenStorage.setToken).toHaveBeenCalledWith(jwt);
    });
  });
  // #endregion register()

  // #region refreshToken()
  describe('refreshToken()', () => {
    it('updates accessToken without clearing currentUser', async () => {
      const facade = TestBed.inject(AuthFacade);

      // Seed state with an existing session
      const initialJwt = makeTestJwt('test-user-id');
      mockAuthService.login.mockResolvedValue({
        accessToken: initialJwt,
        tokenType: 'Bearer',
        expiresIn: 3600,
      });
      mockAuthService.fetchCurrentUser.mockResolvedValue(TEST_USER);
      await TestBed.runInInjectionContext(() => facade.login('a@b.com', 'pass'));

      // Refresh
      const newJwt = makeTestJwt('test-user-id') + '-refreshed';
      mockAuthService.refresh.mockResolvedValue({
        accessToken: newJwt,
        tokenType: 'Bearer',
        expiresIn: 3600,
      });

      await TestBed.runInInjectionContext(() => facade.refreshToken());

      expect(facade.accessToken()).toBe(newJwt);
      expect(facade.currentUser()).toEqual(TEST_USER);
    });

    it('persists the refreshed token to storage', async () => {
      const facade = TestBed.inject(AuthFacade);

      const initialJwt = makeTestJwt('test-user-id');
      mockAuthService.login.mockResolvedValue({
        accessToken: initialJwt,
        tokenType: 'Bearer',
        expiresIn: 3600,
      });
      mockAuthService.fetchCurrentUser.mockResolvedValue(TEST_USER);
      await TestBed.runInInjectionContext(() => facade.login('a@b.com', 'pass'));

      const newJwt = makeTestJwt('test-user-id') + '-refreshed';
      mockAuthService.refresh.mockResolvedValue({
        accessToken: newJwt,
        tokenType: 'Bearer',
        expiresIn: 3600,
      });

      await TestBed.runInInjectionContext(() => facade.refreshToken());

      expect(mockTokenStorage.setToken).toHaveBeenLastCalledWith(newJwt);
    });
  });
  // #endregion refreshToken()

  // #region logout()
  describe('logout()', () => {
    it('clears all state after logout', async () => {
      const facade = TestBed.inject(AuthFacade);
      const jwt = makeTestJwt('test-user-id');

      // Seed an authenticated session
      mockAuthService.login.mockResolvedValue({
        accessToken: jwt,
        tokenType: 'Bearer',
        expiresIn: 3600,
      });
      mockAuthService.fetchCurrentUser.mockResolvedValue(TEST_USER);
      await TestBed.runInInjectionContext(() => facade.login('a@b.com', 'pass'));
      expect(facade.isAuthenticated()).toBe(true);

      // Logout
      mockAuthService.logout.mockResolvedValue(undefined);
      await TestBed.runInInjectionContext(() => facade.logout());

      expect(facade.accessToken()).toBeNull();
      expect(facade.currentUser()).toBeNull();
      expect(facade.isAuthenticated()).toBe(false);
    });

    it('clears the stored token on logout', async () => {
      const facade = TestBed.inject(AuthFacade);
      const jwt = makeTestJwt('test-user-id');

      mockAuthService.login.mockResolvedValue({
        accessToken: jwt,
        tokenType: 'Bearer',
        expiresIn: 3600,
      });
      mockAuthService.fetchCurrentUser.mockResolvedValue(TEST_USER);
      await TestBed.runInInjectionContext(() => facade.login('a@b.com', 'pass'));

      mockAuthService.logout.mockResolvedValue(undefined);
      await TestBed.runInInjectionContext(() => facade.logout());

      expect(mockTokenStorage.clearToken).toHaveBeenCalled();
    });

    it('clears state even if the logout request fails', async () => {
      const facade = TestBed.inject(AuthFacade);
      const jwt = makeTestJwt('test-user-id');

      mockAuthService.login.mockResolvedValue({
        accessToken: jwt,
        tokenType: 'Bearer',
        expiresIn: 3600,
      });
      mockAuthService.fetchCurrentUser.mockResolvedValue(TEST_USER);
      await TestBed.runInInjectionContext(() => facade.login('a@b.com', 'pass'));

      mockAuthService.logout.mockRejectedValue(new Error('Network error'));
      await TestBed.runInInjectionContext(() => facade.logout());

      expect(facade.accessToken()).toBeNull();
      expect(facade.isAuthenticated()).toBe(false);
    });
  });
  // #endregion logout()

  // #region initSession() — session restore
  describe('initSession()', () => {
    it('restores session via cookie-based token refresh', async () => {
      const jwt = makeTestJwt('test-user-id');
      mockAuthService.refresh.mockResolvedValue({
        accessToken: jwt,
        tokenType: 'Bearer',
        expiresIn: 3600,
      });
      mockAuthService.fetchCurrentUser.mockResolvedValue(TEST_USER);

      const facade = TestBed.inject(AuthFacade);
      await TestBed.runInInjectionContext(() => facade.initSession());

      expect(facade.accessToken()).toBe(jwt);
      expect(facade.currentUser()).toEqual(TEST_USER);
      expect(facade.isAuthenticated()).toBe(true);
      expect(mockTokenStorage.setToken).toHaveBeenCalledWith(jwt);
    });

    it('falls back to a non-expired sessionStorage token when cookie refresh fails', async () => {
      const jwt = makeTestJwt('test-user-id');
      mockAuthService.refresh.mockRejectedValue(new Error('No cookie'));
      mockTokenStorage.getToken.mockReturnValue(jwt);
      mockAuthService.fetchCurrentUser.mockResolvedValue(TEST_USER);

      const facade = TestBed.inject(AuthFacade);
      await TestBed.runInInjectionContext(() => facade.initSession());

      expect(facade.accessToken()).toBe(jwt);
      expect(facade.currentUser()).toEqual(TEST_USER);
      expect(facade.isAuthenticated()).toBe(true);
    });

    it('stays unauthenticated when cookie refresh fails and sessionStorage token is expired', async () => {
      const expiredJwt = makeExpiredTestJwt('test-user-id');
      mockAuthService.refresh.mockRejectedValue(new Error('No cookie'));
      mockTokenStorage.getToken.mockReturnValue(expiredJwt);

      const facade = TestBed.inject(AuthFacade);
      await TestBed.runInInjectionContext(() => facade.initSession());

      expect(facade.accessToken()).toBeNull();
      expect(facade.isAuthenticated()).toBe(false);
      expect(mockTokenStorage.clearToken).toHaveBeenCalled();
    });

    it('stays unauthenticated when both cookie refresh and sessionStorage are unavailable', async () => {
      mockAuthService.refresh.mockRejectedValue(new Error('No cookie'));
      mockTokenStorage.getToken.mockReturnValue(null);

      const facade = TestBed.inject(AuthFacade);
      await TestBed.runInInjectionContext(() => facade.initSession());

      expect(facade.accessToken()).toBeNull();
      expect(facade.isAuthenticated()).toBe(false);
    });

    it('clears state when the sessionStorage fallback token is rejected by the server', async () => {
      const jwt = makeTestJwt('test-user-id');
      mockAuthService.refresh.mockRejectedValue(new Error('No cookie'));
      mockTokenStorage.getToken.mockReturnValue(jwt);
      mockAuthService.fetchCurrentUser.mockRejectedValue(new Error('Unauthorized'));

      const facade = TestBed.inject(AuthFacade);
      await TestBed.runInInjectionContext(() => facade.initSession());

      expect(facade.accessToken()).toBeNull();
      expect(facade.isAuthenticated()).toBe(false);
      expect(mockTokenStorage.clearToken).toHaveBeenCalled();
    });

    it('ignores a malformed sessionStorage token and clears storage', async () => {
      mockAuthService.refresh.mockRejectedValue(new Error('No cookie'));
      mockTokenStorage.getToken.mockReturnValue('not.a.valid.jwt.at.all.extra');

      const facade = TestBed.inject(AuthFacade);
      await TestBed.runInInjectionContext(() => facade.initSession());

      expect(facade.accessToken()).toBeNull();
      expect(mockTokenStorage.clearToken).toHaveBeenCalled();
    });
  });
  // #endregion initSession() — session restore
});
// #endregion Test Suite
