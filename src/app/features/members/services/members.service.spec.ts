// #region Imports
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MEMBERS_CONFIG } from '../members.config';
import type { MemberDto, MemberListResponseDto } from '../models';
import { MembersService } from './members.service';
// #endregion Imports

// #region Test Helpers

/**
 * A minimal valid {@link MemberDto} used across tests to avoid repetition.
 */
const TEST_MEMBER_DTO: MemberDto = {
  id: 'uuid-1',
  email: 'alice@example.com',
  fullName: 'Alice Smith',
  role: { id: 'role-uuid', name: 'admin' },
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-02T00:00:00.000Z',
};

// #endregion Test Helpers

// #region Test Suite
describe('MembersService', () => {
  let service: MembersService;
  let httpMock: HttpTestingController;

  // #region Setup
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MembersService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MEMBERS_CONFIG, useValue: { apiBase: '/api', roles: [] } },
      ],
    });

    service = TestBed.inject(MembersService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });
  // #endregion Setup

  // #region fetchMembers
  describe('fetchMembers', () => {
    it('calls GET /users with page and limit params', async () => {
      const responseBody: MemberListResponseDto = {
        data: [TEST_MEMBER_DTO],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      };

      const promise = service.fetchMembers({ page: 1, limit: 10 });

      const req = httpMock.expectOne((r) => r.url === '/api/users');
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('page')).toBe('1');
      expect(req.request.params.get('limit')).toBe('10');
      req.flush(responseBody);

      const result = await promise;
      expect(result.members).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.members[0]?.id).toBe('uuid-1');
      expect(result.members[0]?.createdAt).toBeInstanceOf(Date);
    });

    it('appends search, sortBy, sortOrder when provided', async () => {
      const promise = service.fetchMembers({
        page: 2,
        limit: 25,
        search: 'alice',
        sortBy: 'email',
        sortOrder: 'asc',
      });

      const req = httpMock.expectOne((r) => r.url === '/api/users');
      expect(req.request.params.get('search')).toBe('alice');
      expect(req.request.params.get('sortBy')).toBe('email');
      expect(req.request.params.get('sortOrder')).toBe('asc');
      expect(req.request.params.get('page')).toBe('2');
      expect(req.request.params.get('limit')).toBe('25');

      req.flush({
        data: [],
        meta: { total: 0, page: 2, limit: 25, totalPages: 0 },
      });

      await promise;
    });
  });
  // #endregion fetchMembers

  // #region createMember
  describe('createMember', () => {
    it('calls POST /users and returns the mapped model', async () => {
      const promise = service.createMember({ fullName: 'Bob Jones', email: 'bob@example.com' });

      const req = httpMock.expectOne('/api/users');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toMatchObject({ fullName: 'Bob Jones', email: 'bob@example.com' });

      req.flush({ data: { ...TEST_MEMBER_DTO, id: 'uuid-new', fullName: 'Bob Jones' } });

      const member = await promise;
      expect(member.id).toBe('uuid-new');
      expect(member.fullName).toBe('Bob Jones');
    });
  });
  // #endregion createMember

  // #region updateMember
  describe('updateMember', () => {
    it('calls PATCH /users/:id and returns the mapped model', async () => {
      const promise = service.updateMember('uuid-1', { fullName: 'Alice Updated' });

      const req = httpMock.expectOne('/api/users/uuid-1');
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toMatchObject({ fullName: 'Alice Updated' });

      req.flush({ data: { ...TEST_MEMBER_DTO, fullName: 'Alice Updated' } });

      const member = await promise;
      expect(member.fullName).toBe('Alice Updated');
    });
  });
  // #endregion updateMember

  // #region deleteMember
  describe('deleteMember', () => {
    it('calls DELETE /users/:id', async () => {
      const promise = service.deleteMember('uuid-1');

      const req = httpMock.expectOne('/api/users/uuid-1');
      expect(req.request.method).toBe('DELETE');

      req.flush(null, { status: 204, statusText: 'No Content' });

      await promise;
    });
  });
  // #endregion deleteMember
});
// #endregion Test Suite
