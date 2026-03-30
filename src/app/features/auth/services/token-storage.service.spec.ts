// #region Imports
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TokenStorageService } from './token-storage.service';
// #endregion Imports

// #region Test Suite

describe('TokenStorageService', () => {
  // #region Setup
  let service: TokenStorageService;

  beforeEach(() => {
    service = new TokenStorageService();
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });
  // #endregion Setup

  // #region getToken()
  describe('getToken()', () => {
    it('returns null when no token has been stored', () => {
      expect(service.getToken()).toBeNull();
    });

    it('returns the stored token after setToken() is called', () => {
      service.setToken('my.jwt.token');
      expect(service.getToken()).toBe('my.jwt.token');
    });
  });
  // #endregion getToken()

  // #region setToken()
  describe('setToken()', () => {
    it('persists the token in sessionStorage under the expected key', () => {
      service.setToken('test.token.value');
      expect(sessionStorage.getItem('access_token')).toBe('test.token.value');
    });

    it('overwrites a previously stored token', () => {
      service.setToken('old.token');
      service.setToken('new.token');
      expect(service.getToken()).toBe('new.token');
    });
  });
  // #endregion setToken()

  // #region clearToken()
  describe('clearToken()', () => {
    it('removes the stored token', () => {
      service.setToken('some.token');
      service.clearToken();
      expect(service.getToken()).toBeNull();
    });

    it('is a no-op when no token is stored', () => {
      expect(() => service.clearToken()).not.toThrow();
      expect(service.getToken()).toBeNull();
    });
  });
  // #endregion clearToken()
});

// #endregion Test Suite
