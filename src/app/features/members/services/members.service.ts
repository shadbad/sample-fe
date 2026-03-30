// #region Imports
import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { MEMBERS_CONFIG } from '../members.config';
import {
  isMemberDto,
  MemberMapper,
  type MemberDto,
  type MemberListResponseDto,
  type MemberModel,
} from '../models';
// #endregion Imports

// #region Payload Types
/**
 * Payload shape for creating a new member (`POST /users`).
 */
export interface CreateMemberPayload {
  /** The new member's full display name. */
  readonly fullName: string;
  /** The new member's email address. */
  readonly email: string;
  /** Optional role UUID to assign at creation time. */
  readonly roleId?: string;
}

/**
 * Payload shape for updating an existing member (`PATCH /users/:id`).
 */
export interface UpdateMemberPayload {
  /** Updated full name (optional). */
  readonly fullName?: string;
  /** Updated email address (optional). */
  readonly email?: string;
  /** Updated role UUID (optional). */
  readonly roleId?: string;
}

/**
 * Query parameters forwarded to `GET /users`.
 */
export interface MembersQueryParams {
  /** 1-based page number. */
  readonly page: number;
  /** Items per page. */
  readonly limit: number;
  /** Case-insensitive substring match on fullName or email. */
  readonly search?: string;
  /** Field to sort by. */
  readonly sortBy?: 'fullName' | 'email' | 'createdAt';
  /** Sort direction. */
  readonly sortOrder?: 'asc' | 'desc';
}

/**
 * Result returned by {@link MembersService.fetchMembers}.
 */
export interface MembersPage {
  /** Members for the requested page. */
  readonly members: readonly MemberModel[];
  /** Total number of records matching the current query (across all pages). */
  readonly total: number;
}
// #endregion Payload Types

// #region Service
/**
 * HTTP service for the Members feature.
 *
 * Handles all REST calls to the `/users/*` endpoints.
 * All methods return `Promise`s — no `Observable`s are surfaced to callers.
 */
@Injectable({ providedIn: 'root' })
export class MembersService {
  // #region Dependencies

  readonly #http = inject(HttpClient);
  readonly #config = inject(MEMBERS_CONFIG);

  // #endregion Dependencies

  // #region Read

  /**
   * Fetches a paginated, optionally filtered and sorted page of members.
   *
   * Calls `GET /users` with the provided query parameters.
   *
   * @param params - Pagination, search, and sort query parameters.
   * @returns A `Promise` resolving to the current {@link MembersPage}.
   * @throws When the server returns a non-2xx response.
   */
  async fetchMembers(params: MembersQueryParams): Promise<MembersPage> {
    let httpParams = new HttpParams()
      .set('page', String(params.page))
      .set('limit', String(params.limit));

    if (params.search) {
      httpParams = httpParams.set('search', params.search);
    }
    if (params.sortBy) {
      httpParams = httpParams.set('sortBy', params.sortBy);
    }
    if (params.sortOrder) {
      httpParams = httpParams.set('sortOrder', params.sortOrder);
    }

    const response = await firstValueFrom(
      this.#http.get<MemberListResponseDto>(`${this.#config.apiBase}/users`, {
        params: httpParams,
      }),
    );

    const members = response.data.map((dto: MemberDto) => {
      if (!isMemberDto(dto)) {
        throw new TypeError(`Unexpected shape for member DTO: ${JSON.stringify(dto)}`);
      }
      return MemberMapper.dtoToModel(dto);
    });

    return { members, total: response.meta.total };
  }

  // #endregion Read

  // #region Create

  /**
   * Creates a new member (`POST /users`).
   *
   * Admin-only. The new member will have `role = null` unless a `roleId` is supplied.
   *
   * @param payload - The new member's details.
   * @returns A `Promise` resolving to the created {@link MemberModel}.
   * @throws When the server returns a non-2xx response.
   */
  async createMember(payload: CreateMemberPayload): Promise<MemberModel> {
    const response = await firstValueFrom(
      this.#http.post<{ readonly data: MemberDto }>(`${this.#config.apiBase}/users`, payload),
    );
    if (!isMemberDto(response.data)) {
      throw new TypeError('Unexpected shape for create member response');
    }
    return MemberMapper.dtoToModel(response.data);
  }

  // #endregion Create

  // #region Update

  /**
   * Updates an existing member (`PATCH /users/:id`).
   *
   * Admin-only. Only the supplied fields are updated.
   *
   * @param id      - The UUID of the member to update.
   * @param payload - The fields to update.
   * @returns A `Promise` resolving to the updated {@link MemberModel}.
   * @throws When the server returns a non-2xx response.
   */
  async updateMember(id: string, payload: UpdateMemberPayload): Promise<MemberModel> {
    const response = await firstValueFrom(
      this.#http.patch<{ readonly data: MemberDto }>(
        `${this.#config.apiBase}/users/${id}`,
        payload,
      ),
    );
    if (!isMemberDto(response.data)) {
      throw new TypeError('Unexpected shape for update member response');
    }
    return MemberMapper.dtoToModel(response.data);
  }

  // #endregion Update

  // #region Delete

  /**
   * Deletes a member (`DELETE /users/:id`).
   *
   * Admin-only. Returns `void` on a 204 success response.
   *
   * @param id - The UUID of the member to delete.
   * @throws When the server returns a non-2xx response.
   */
  async deleteMember(id: string): Promise<void> {
    await firstValueFrom(this.#http.delete<void>(`${this.#config.apiBase}/users/${id}`));
  }

  // #endregion Delete
}
// #endregion Service
