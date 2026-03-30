// #region Domain Model
/**
 * Domain representation of the currently authenticated user.
 *
 * Used exclusively within the `auth` feature — the Auth Facade holds a signal
 * of this type after a successful login or registration. Never used beyond the
 * auth boundary.
 *
 * The `role` field is nullable: self-registered users have no assigned role
 * until an admin explicitly assigns one.
 */
export interface UserModel {
  /** Unique identifier (UUID). */
  readonly id: string;
  /** User's email address. */
  readonly email: string;
  /** User's full display name. */
  readonly fullName: string;
  /**
   * Role assigned to the user.
   * `null` for users who registered themselves and have not yet been assigned a role.
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
 * Raw API response shape for the authenticated user resource (`GET /users/:id`).
 *
 * Mirrors the JSON contract of the backend; never used beyond the mapper layer.
 * `role` is nullable — backend returns `null` for users with no assigned role.
 */
export interface UserDto {
  /** Unique identifier (UUID). */
  readonly id: string;
  /** User's email address. */
  readonly email: string;
  /** User's full display name. */
  readonly fullName: string;
  /** Role DTO, or `null` when no role is assigned. */
  readonly role: { readonly id: string; readonly name: string } | null;
  /** ISO-8601 timestamp string. */
  readonly createdAt: string;
  /** ISO-8601 timestamp string. */
  readonly updatedAt: string;
}
// #endregion DTO

// #region Type Guard
/**
 * Narrows an `unknown` value to {@link UserDto}.
 *
 * Use at API boundaries before passing data to {@link UserMapper}.
 *
 * @param value - The raw value to check.
 * @returns `true` when `value` conforms to the {@link UserDto} shape.
 */
export function isUserDto(value: unknown): value is UserDto {
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
 * Bidirectional mapper between {@link UserDto} (API layer) and {@link UserModel} (domain layer).
 *
 * All methods are static — this class is never instantiated.
 */
export class UserMapper {
  private constructor() {
    // Non-instantiable — static utility class.
  }

  /**
   * Converts a raw API {@link UserDto} to the internal {@link UserModel}.
   *
   * @param dto - A validated DTO from the API.
   * @returns The equivalent domain {@link UserModel}.
   */
  static dtoToModel(dto: UserDto): UserModel {
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
   * Converts an internal {@link UserModel} back to a {@link UserDto} for API writes.
   *
   * @param model - The domain model to serialise.
   * @returns The equivalent {@link UserDto} ready for transmission.
   */
  static modelToDto(model: UserModel): UserDto {
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
