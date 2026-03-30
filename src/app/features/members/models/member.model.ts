// #region Domain Model
/**
 * Domain representation of a member (user entry in the system) as displayed
 * in the Users feature — the paginated member list and admin management table.
 *
 * Distinct from {@link UserModel} (the currently logged-in user held by
 * `AuthFacade`): a `MemberModel` is an entry in the `/users` collection and
 * may represent any account, including the current user's own record.
 *
 * The `role` field is nullable: self-registered members have no assigned role
 * until an admin explicitly assigns one.
 */
export interface MemberModel {
  /** Unique identifier (UUID). */
  readonly id: string;
  /** Member's email address. */
  readonly email: string;
  /** Member's full display name. */
  readonly fullName: string;
  /**
   * Role assigned to the member.
   * `null` for self-registered members who have not yet been assigned a role.
   */
  readonly role: { readonly id: string; readonly name: string } | null;
  /** Timestamp of account creation. */
  readonly createdAt: Date;
  /** Timestamp of last update. */
  readonly updatedAt: Date;
}
// #endregion Domain Model

// #region DTO
/**
 * Raw API response shape for a member resource (`GET /users`, `GET /users/:id`).
 *
 * Mirrors the JSON contract of the backend `UserResponse`; never used beyond
 * the mapper layer. `role` is nullable — backend returns `null` for members
 * with no assigned role.
 */
export interface MemberDto {
  /** Unique identifier (UUID). */
  readonly id: string;
  /** Member's email address. */
  readonly email: string;
  /** Member's full display name. */
  readonly fullName: string;
  /** Role DTO, or `null` when no role is assigned. */
  readonly role: { readonly id: string; readonly name: string } | null;
  /** ISO-8601 timestamp string. */
  readonly createdAt: string;
  /** ISO-8601 timestamp string. */
  readonly updatedAt: string;
}

/**
 * Paginated API envelope wrapping an array of {@link MemberDto}.
 *
 * Returned by `GET /users?page=&limit=&search=&sortBy=&sortOrder=`.
 */
export interface MemberListResponseDto {
  /** Current page of member records. */
  readonly data: readonly MemberDto[];
  /** Pagination metadata returned by the backend. */
  readonly meta: {
    /** Total number of matching records across all pages. */
    readonly total: number;
    /** 1-based current page number. */
    readonly page: number;
    /** Number of items per page. */
    readonly limit: number;
    /** Total number of pages for the current result set. */
    readonly totalPages: number;
  };
}
// #endregion DTO

// #region Type Guard
/**
 * Narrows an `unknown` value to {@link MemberDto}.
 *
 * Use at API boundaries before passing data to {@link MemberMapper}.
 *
 * @param value - The raw value to check.
 * @returns `true` when `value` conforms to the {@link MemberDto} shape.
 */
export function isMemberDto(value: unknown): value is MemberDto {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;

  if (
    typeof v['id'] !== 'string' ||
    typeof v['email'] !== 'string' ||
    typeof v['fullName'] !== 'string' ||
    typeof v['createdAt'] !== 'string' ||
    typeof v['updatedAt'] !== 'string'
  ) {
    return false;
  }

  if (v['role'] !== null) {
    if (typeof v['role'] !== 'object' || v['role'] === null) return false;
    const role = v['role'] as Record<string, unknown>;
    if (typeof role['id'] !== 'string' || typeof role['name'] !== 'string') return false;
  }

  return true;
}
// #endregion Type Guard

// #region Mapper
/**
 * Bidirectional mapper between {@link MemberDto} (API layer) and {@link MemberModel} (domain layer).
 *
 * All methods are static — this class is never instantiated.
 */
export class MemberMapper {
  private constructor() {
    // Non-instantiable — static utility class.
  }

  /**
   * Converts a raw API {@link MemberDto} to the internal {@link MemberModel}.
   *
   * @param dto - A validated DTO from the API.
   * @returns The equivalent domain {@link MemberModel}.
   */
  static dtoToModel(dto: MemberDto): MemberModel {
    return {
      id: dto.id,
      email: dto.email,
      fullName: dto.fullName,
      role: dto.role,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    };
  }

  /**
   * Converts an internal {@link MemberModel} back to a {@link MemberDto} for API writes.
   *
   * @param model - The domain model to serialise.
   * @returns The equivalent {@link MemberDto} ready for transmission.
   */
  static modelToDto(model: MemberModel): MemberDto {
    return {
      id: model.id,
      email: model.email,
      fullName: model.fullName,
      role: model.role,
      createdAt: model.createdAt.toISOString(),
      updatedAt: model.updatedAt.toISOString(),
    };
  }
}
// #endregion Mapper
