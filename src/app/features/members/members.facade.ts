// #region Imports
import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import type { MemberModel } from './models';
import type { CreateMemberPayload, UpdateMemberPayload } from './services/members.service';
import { MembersService } from './services/members.service';
// #endregion Imports

// #region State Shape
/**
 * Internal state shape for the Members feature store.
 */
interface MembersState {
  /** Current page of members returned by the last API response. */
  readonly members: readonly MemberModel[];
  /** Total number of members matching the current search (from API `meta.total`). */
  readonly total: number;
  /** `true` while a page-fetch (`GET /users`) is in progress. */
  readonly isLoading: boolean;
  /** `true` while a create/update/delete mutation is in progress. */
  readonly isMutating: boolean;
  /** Last error message, or `null` when no error. */
  readonly error: string | null;

  // --- Server-side filter / sort / pagination ---

  /** Search query forwarded to the backend as `?search=`. Empty string means no filter. */
  readonly searchQuery: string;
  /**
   * Sort field forwarded as `?sortBy=`.
   * `null` uses the backend default (`createdAt DESC`).
   */
  readonly sortField: 'fullName' | 'email' | 'createdAt' | null;
  /** Sort direction forwarded as `?sortOrder=`. */
  readonly sortDirection: 'asc' | 'desc';
  /** 1-based current page forwarded as `?page=`. */
  readonly currentPage: number;
  /** Items per page forwarded as `?limit=`. */
  readonly pageSize: number;
}

/** Initial state for the Members feature store. */
const initialState: MembersState = {
  members: [],
  total: 0,
  isLoading: false,
  isMutating: false,
  error: null,
  searchQuery: '',
  sortField: null,
  sortDirection: 'desc',
  currentPage: 1,
  pageSize: 10,
};
// #endregion State Shape

// #region Store
/**
 * Facade (NgRx Signal Store) for the Members feature.
 *
 * Owns all member-list state, async CRUD operations, and derived computations.
 * All server-side filtering, sorting, and pagination are orchestrated through the
 * methods on this store — no client-side computed filtering is performed.
 *
 * @example Injecting in a component:
 * ```ts
 * readonly #members = inject(MembersFacade);
 * readonly members = this.#members.members;
 * ```
 */
export const MembersFacade = signalStore(
  { providedIn: 'root' },
  withState(initialState),

  // #region Computed
  withComputed(({ total, pageSize, members, isLoading, error }) => ({
    /**
     * Total number of pages, derived from `total` and `pageSize`.
     * Always at least `1`.
     */
    totalPages: computed(() => Math.max(1, Math.ceil(total() / pageSize()))),

    /**
     * `true` when there are no members AND no fetch is in progress.
     * Useful for rendering an empty-state placeholder.
     */
    isEmpty: computed(() => members().length === 0 && !isLoading()),

    /**
     * `true` when an error is present in the store.
     */
    hasError: computed(() => error() !== null),
  })),
  // #endregion Computed

  // #region Methods
  withMethods((store) => {
    const membersService = inject(MembersService);

    /**
     * Internal helper — fires `GET /users` with the current store params.
     *
     * Sets `isLoading` before the request and resets it afterwards.
     * On error, stores the message and re-throws.
     */
    async function loadPage(): Promise<void> {
      patchState(store, { isLoading: true, error: null });
      try {
        const { members, total } = await membersService.fetchMembers({
          page: store.currentPage(),
          limit: store.pageSize(),
          search: store.searchQuery() || undefined,
          sortBy: store.sortField() ?? undefined,
          sortOrder: store.sortDirection(),
        });
        patchState(store, { members, total, isLoading: false });
      } catch (err) {
        const error = err instanceof Error ? err.message : 'Unknown error';
        patchState(store, { isLoading: false, error });
        throw err;
      }
    }

    return {
      /**
       * Fetches the current page of members using the active search, sort, and
       * pagination parameters from the store.
       *
       * @throws Propagates any HTTP error after storing the message.
       */
      async load(): Promise<void> {
        await loadPage();
      },

      /**
       * Updates the search query and resets to page 1 before fetching.
       *
       * @param query - The new search string (empty string clears the filter).
       */
      setSearch(query: string): void {
        patchState(store, { searchQuery: query, currentPage: 1 });
        loadPage().catch(() => undefined);
      },

      /**
       * Updates the active sort and resets to page 1 before fetching.
       *
       * @param field     - The column to sort by, or `null` to use the backend default.
       * @param direction - `'asc'` or `'desc'`.
       */
      setSort(field: MembersState['sortField'], direction: 'asc' | 'desc'): void {
        patchState(store, { sortField: field, sortDirection: direction, currentPage: 1 });
        loadPage().catch(() => undefined);
      },

      /**
       * Navigates to a different page and fetches it.
       *
       * @param page - The 1-based page number to navigate to.
       */
      setPage(page: number): void {
        patchState(store, { currentPage: page });
        loadPage().catch(() => undefined);
      },

      /**
       * Changes the page size and resets to page 1 before fetching.
       *
       * @param size - The new number of items per page.
       */
      setPageSize(size: number): void {
        patchState(store, { pageSize: size, currentPage: 1 });
        loadPage().catch(() => undefined);
      },

      /**
       * Creates a new member (`POST /users`) and refreshes the current page on success.
       *
       * Admin-only. Sets `isMutating` during the operation.
       *
       * @param dto - The new member's details.
       * @throws Propagates any HTTP error after storing the message.
       */
      async createMember(dto: CreateMemberPayload): Promise<void> {
        patchState(store, { isMutating: true, error: null });
        try {
          await membersService.createMember(dto);
          patchState(store, { isMutating: false });
          await loadPage();
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Unknown error';
          patchState(store, { isMutating: false, error });
          throw err;
        }
      },

      /**
       * Updates an existing member (`PATCH /users/:id`) and refreshes the current page on success.
       *
       * Admin-only. Sets `isMutating` during the operation.
       *
       * @param id  - The UUID of the member to update.
       * @param dto - The fields to update.
       * @throws Propagates any HTTP error after storing the message.
       */
      async updateMember(id: string, dto: UpdateMemberPayload): Promise<void> {
        patchState(store, { isMutating: true, error: null });
        try {
          await membersService.updateMember(id, dto);
          patchState(store, { isMutating: false });
          await loadPage();
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Unknown error';
          patchState(store, { isMutating: false, error });
          throw err;
        }
      },

      /**
       * Deletes a member (`DELETE /users/:id`) and refreshes the current page on success.
       *
       * Admin-only. Sets `isMutating` during the operation.
       *
       * @param id - The UUID of the member to delete.
       * @throws Propagates any HTTP error after storing the message.
       */
      async deleteMember(id: string): Promise<void> {
        patchState(store, { isMutating: true, error: null });
        try {
          await membersService.deleteMember(id);
          patchState(store, { isMutating: false });
          await loadPage();
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Unknown error';
          patchState(store, { isMutating: false, error });
          throw err;
        }
      },

      /**
       * Stub for an admin "Reset Password" action.
       *
       * The backend does not yet expose a `POST /auth/reset-password` endpoint.
       * This method throws a `NotImplementedError` so the UI can catch it and
       * inform the user that the feature is unavailable.
       *
       * @param _id - The UUID of the member (unused until the endpoint exists).
       * @throws Always throws `Error('reset-password/not-implemented')`.
       */

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      async resetPassword(_id: string): Promise<void> {
        throw new Error('reset-password/not-implemented');
      },
    };
  }),
  // #endregion Methods
);
// #endregion Store
