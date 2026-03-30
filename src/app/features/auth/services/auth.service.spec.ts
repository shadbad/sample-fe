// #region Imports
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { AUTH_CONFIG } from '../auth.config';
import { AuthService } from './auth.service';
// #endregion Imports

// #region Test Suite
describe('AuthService', () => {
  // #region Setup
  let service: AuthService;
  let httpController: HttpTestingController;

  /** Minimal auth config used across all tests. */
  const TEST_CONFIG = { apiBase: '/api' };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AUTH_CONFIG, useValue: TEST_CONFIG },
      ],
    });

    service = TestBed.inject(AuthService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });
  // #endregion Setup

  // #region login()
  describe('login()', () => {
    it('posts to /auth/login and maps the response to AuthModel', async () => {
      const mockResponse = {
        data: { accessToken: 'tok123', tokenType: 'Bearer', expiresIn: 3600 },
      };

      const promise = service.login('user@example.com', 'password123');

      const req = httpController.expectOne('/api/auth/login');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email: 'user@example.com', password: 'password123' });
      req.flush(mockResponse);

      const result = await promise;
      expect(result.accessToken).toBe('tok123');
      expect(result.tokenType).toBe('Bearer');
      expect(result.expiresIn).toBe(3600);
    });

    it('throws TypeError when the response data has an unexpected shape', async () => {
      const promise = service.login('user@example.com', 'password123');

      const req = httpController.expectOne('/api/auth/login');
      req.flush({ data: { invalid: true } });

      await expect(promise).rejects.toThrow(TypeError);
    });
  });
  // #endregion login()

  // #region register()
  describe('register()', () => {
    it('posts to /auth/register without a roleId and returns AuthModel', async () => {
      const mockResponse = {
        data: { accessToken: 'tok456', tokenType: 'Bearer', expiresIn: 3600 },
      };

      const promise = service.register('Alice Smith', 'alice@example.com', 'password123');

      const req = httpController.expectOne('/api/auth/register');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        fullName: 'Alice Smith',
        email: 'alice@example.com',
        password: 'password123',
      });
      // roleId must NOT be sent
      expect(req.request.body).not.toHaveProperty('roleId');
      req.flush(mockResponse);

      const result = await promise;
      expect(result.accessToken).toBe('tok456');
    });
  });
  // #endregion register()

  // #region refresh()
  describe('refresh()', () => {
    it('posts to /auth/refresh and returns a refreshed AuthModel', async () => {
      const mockResponse = {
        data: { accessToken: 'newTok', tokenType: 'Bearer', expiresIn: 3600 },
      };

      const promise = service.refresh();

      const req = httpController.expectOne('/api/auth/refresh');
      expect(req.request.method).toBe('POST');
      expect(req.request.withCredentials).toBe(true);
      req.flush(mockResponse);

      const result = await promise;
      expect(result.accessToken).toBe('newTok');
    });
  });
  // #endregion refresh()

  // #region logout()
  describe('logout()', () => {
    it('posts to /auth/logout and resolves void', async () => {
      const promise = service.logout();

      const req = httpController.expectOne('/api/auth/logout');
      expect(req.request.method).toBe('POST');
      req.flush(null, { status: 204, statusText: 'No Content' });

      await expect(promise).resolves.toBeUndefined();
    });
  });
  // #endregion logout()

  // #region fetchCurrentUser()
  describe('fetchCurrentUser()', () => {
    it('fetches GET /users/:id and maps to UserModel', async () => {
      const mockUser = {
        id: 'uuid-1',
        email: 'alice@example.com',
        fullName: 'Alice Smith',
        role: { id: 'role-1', name: 'admin' },
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      };

      const promise = service.fetchCurrentUser('uuid-1');

      const req = httpController.expectOne('/api/users/uuid-1');
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockUser });

      const result = await promise;
      expect(result.id).toBe('uuid-1');
      expect(result.fullName).toBe('Alice Smith');
      expect(result.role?.name).toBe('admin');
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('maps null role correctly for users without an assigned role', async () => {
      const mockUser = {
        id: 'uuid-2',
        email: 'bob@example.com',
        fullName: 'Bob Jones',
        role: null,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      };

      const promise = service.fetchCurrentUser('uuid-2');

      httpController.expectOne('/api/users/uuid-2').flush({ data: mockUser });

      const result = await promise;
      expect(result.role).toBeNull();
    });

    it('throws TypeError when the response data has an unexpected shape', async () => {
      const promise = service.fetchCurrentUser('uuid-bad');

      httpController.expectOne('/api/users/uuid-bad').flush({ data: { broken: true } });

      await expect(promise).rejects.toThrow(TypeError);
    });
  });
  // #endregion fetchCurrentUser()
});
// #endregion Test Suite
