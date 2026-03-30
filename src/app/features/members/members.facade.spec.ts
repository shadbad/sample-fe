// #region Imports
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MEMBERS_CONFIG } from './members.config';
import { MembersFacade } from './members.facade';
import type { MembersPage } from './services/members.service';
import { MembersService } from './services/members.service';
// #endregion Imports

// #region Test Helpers

/** Minimal {@link MembersPage} returned by mock service calls that load data. */
const EMPTY_PAGE: MembersPage = { members: [], total: 0 };

/** A non-empty {@link MembersPage} for tests that need real data. */
const SAMPLE_PAGE: MembersPage = {
  members: [
    {
      id: 'uuid-1',
      email: 'alice@example.com',
      fullName: 'Alice Smith',
      role: { id: 'role-uuid', name: 'admin' },
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-02'),
    },
  ],
  total: 1,
};

// #endregion Test Helpers

// #region Test Suite
describe('MembersFacade', () => {
  // #region Mocks
  let mockMembersService: {
    fetchMembers: ReturnType<typeof vi.fn>;
    createMember: ReturnType<typeof vi.fn>;
    updateMember: ReturnType<typeof vi.fn>;
    deleteMember: ReturnType<typeof vi.fn>;
  };
  // #endregion Mocks

  // #region Setup
  beforeEach(() => {
    mockMembersService = {
      fetchMembers: vi.fn<() => Promise<MembersPage>>(),
      createMember: vi.fn(),
      updateMember: vi.fn(),
      deleteMember: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        MembersFacade,
        { provide: MembersService, useValue: mockMembersService },
        {
          provide: MEMBERS_CONFIG,
          useValue: { apiBase: '/api', roles: [] },
        },
      ],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });
  // #endregion Setup

  // #region Initial State
  describe('initial state', () => {
    it('has empty members, zero total, false isLoading/isMutating, null error', () => {
      const facade = TestBed.inject(MembersFacade);

      expect(facade.members()).toEqual([]);
      expect(facade.total()).toBe(0);
      expect(facade.isLoading()).toBe(false);
      expect(facade.isMutating()).toBe(false);
      expect(facade.error()).toBeNull();
      expect(facade.currentPage()).toBe(1);
      expect(facade.pageSize()).toBe(10);
      expect(facade.searchQuery()).toBe('');
      expect(facade.sortField()).toBeNull();
      expect(facade.sortDirection()).toBe('desc');
    });

    it('totalPages defaults to 1 when total is 0', () => {
      const facade = TestBed.inject(MembersFacade);
      expect(facade.totalPages()).toBe(1);
    });

    it('isEmpty is true when members is empty and not loading', () => {
      const facade = TestBed.inject(MembersFacade);
      expect(facade.isEmpty()).toBe(true);
    });
  });
  // #endregion Initial State

  // #region load
  describe('load()', () => {
    it('sets isLoading during fetch and populates members on success', async () => {
      const facade = TestBed.inject(MembersFacade);
      mockMembersService.fetchMembers.mockResolvedValue(SAMPLE_PAGE);

      const promise = facade.load();
      expect(facade.isLoading()).toBe(true);

      await promise;
      expect(facade.isLoading()).toBe(false);
      expect(facade.members()).toHaveLength(1);
      expect(facade.total()).toBe(1);
      // #region Verify call params
      expect(mockMembersService.fetchMembers).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, limit: 10 }),
      );
    });

    it('stores error message on failure and resets isLoading', async () => {
      const facade = TestBed.inject(MembersFacade);
      mockMembersService.fetchMembers.mockRejectedValue(new Error('Server error'));

      await expect(facade.load()).rejects.toThrow('Server error');
      expect(facade.isLoading()).toBe(false);
      expect(facade.error()).toBe('Server error');
    });
  });
  // #endregion load

  // #region setSearch
  describe('setSearch()', () => {
    it('updates searchQuery, resets page to 1, and calls load', async () => {
      const facade = TestBed.inject(MembersFacade);
      mockMembersService.fetchMembers.mockResolvedValue(EMPTY_PAGE);

      facade.setSearch('alice');

      expect(facade.searchQuery()).toBe('alice');
      expect(facade.currentPage()).toBe(1);

      // Wait for the async load to complete
      await vi.waitFor(() => !facade.isLoading());

      expect(mockMembersService.fetchMembers).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'alice', page: 1 }),
      );
    });
  });
  // #endregion setSearch

  // #region setSort
  describe('setSort()', () => {
    it('updates sortField and sortDirection, resets page to 1', async () => {
      const facade = TestBed.inject(MembersFacade);
      mockMembersService.fetchMembers.mockResolvedValue(EMPTY_PAGE);

      facade.setSort('email', 'asc');

      expect(facade.sortField()).toBe('email');
      expect(facade.sortDirection()).toBe('asc');
      expect(facade.currentPage()).toBe(1);

      await vi.waitFor(() => !facade.isLoading());
      expect(mockMembersService.fetchMembers).toHaveBeenCalledWith(
        expect.objectContaining({ sortBy: 'email', sortOrder: 'asc' }),
      );
    });
  });
  // #endregion setSort

  // #region setPage
  describe('setPage()', () => {
    it('updates currentPage and calls load', async () => {
      const facade = TestBed.inject(MembersFacade);
      mockMembersService.fetchMembers.mockResolvedValue(EMPTY_PAGE);

      facade.setPage(3);

      expect(facade.currentPage()).toBe(3);

      await vi.waitFor(() => !facade.isLoading());
      expect(mockMembersService.fetchMembers).toHaveBeenCalledWith(
        expect.objectContaining({ page: 3 }),
      );
    });
  });
  // #endregion setPage

  // #region setPageSize
  describe('setPageSize()', () => {
    it('updates pageSize, resets page to 1, and calls load', async () => {
      const facade = TestBed.inject(MembersFacade);
      mockMembersService.fetchMembers.mockResolvedValue(EMPTY_PAGE);

      facade.setPageSize(25);

      expect(facade.pageSize()).toBe(25);
      expect(facade.currentPage()).toBe(1);

      await vi.waitFor(() => !facade.isLoading());
      expect(mockMembersService.fetchMembers).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 25 }),
      );
    });
  });
  // #endregion setPageSize

  // #region createMember
  describe('createMember()', () => {
    it('sets isMutating during operation and refreshes on success', async () => {
      const facade = TestBed.inject(MembersFacade);
      mockMembersService.createMember.mockResolvedValue(SAMPLE_PAGE.members[0]);
      mockMembersService.fetchMembers.mockResolvedValue(SAMPLE_PAGE);

      const promise = facade.createMember({ fullName: 'Bob', email: 'bob@example.com' });
      expect(facade.isMutating()).toBe(true);

      await promise;
      expect(facade.isMutating()).toBe(false);
      expect(mockMembersService.createMember).toHaveBeenCalledOnce();
      expect(mockMembersService.fetchMembers).toHaveBeenCalledOnce();
    });
  });
  // #endregion createMember

  // #region deleteMember
  describe('deleteMember()', () => {
    it('sets isMutating during deletion and refreshes on success', async () => {
      const facade = TestBed.inject(MembersFacade);
      mockMembersService.deleteMember.mockResolvedValue(undefined);
      mockMembersService.fetchMembers.mockResolvedValue(EMPTY_PAGE);

      await facade.deleteMember('uuid-1');

      expect(facade.isMutating()).toBe(false);
      expect(mockMembersService.deleteMember).toHaveBeenCalledWith('uuid-1');
      expect(mockMembersService.fetchMembers).toHaveBeenCalledOnce();
    });
  });
  // #endregion deleteMember

  // #region resetPassword
  describe('resetPassword()', () => {
    it('throws a not-implemented error', async () => {
      const facade = TestBed.inject(MembersFacade);
      await expect(facade.resetPassword('uuid-1')).rejects.toThrow(
        'reset-password/not-implemented',
      );
    });
  });
  // #endregion resetPassword

  // #region computed totalPages
  describe('totalPages computed', () => {
    it('calculates total pages from total and pageSize', async () => {
      const facade = TestBed.inject(MembersFacade);
      mockMembersService.fetchMembers.mockResolvedValue({ members: [], total: 47 });

      await facade.load();
      expect(facade.totalPages()).toBe(5); // ceil(47/10) = 5
    });
  });
  // #endregion computed totalPages
});
// #endregion Test Suite
