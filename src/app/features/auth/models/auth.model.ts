// #region Domain Model
/**
 * Domain representation of a successful authentication response.
 *
 * Used internally by {@link AuthFacade} to manage the in-memory access token.
 * Never persisted to storage.
 */
export interface AuthModel {
  /** JWT access token — kept in memory only, never written to storage. */
  readonly accessToken: string;
  /** Token scheme, typically `'Bearer'`. */
  readonly tokenType: string;
  /** Number of seconds until the access token expires. */
  readonly expiresIn: number;
}
// #endregion Domain Model

// #region DTO
/**
 * Raw token payload returned by `/auth/login`, `/auth/register`, and `/auth/refresh`.
 *
 * Mirrors the JSON contract provided by the backend.
 */
export interface AuthDto {
  /** JWT access token string. */
  readonly accessToken: string;
  /** Token scheme, typically `'Bearer'`. */
  readonly tokenType: string;
  /** Seconds until the access token expires. */
  readonly expiresIn: number;
}

/**
 * Top-level API envelope wrapping an {@link AuthDto}.
 *
 * The backend wraps all success responses in a `{ data: ... }` object.
 */
export interface AuthResponseDto {
  /** The authentication payload. */
  readonly data: AuthDto;
}
// #endregion DTO

// #region Type Guard
/**
 * Narrows an `unknown` value to {@link AuthDto}.
 *
 * Use at the API boundary before passing to {@link AuthMapper.dtoToModel}.
 *
 * @param value - The raw value to check.
 * @returns `true` when `value` conforms to the {@link AuthDto} shape.
 */
export function isAuthDto(value: unknown): value is AuthDto {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v['accessToken'] === 'string' &&
    typeof v['tokenType'] === 'string' &&
    typeof v['expiresIn'] === 'number'
  );
}
// #endregion Type Guard

// #region Mapper
/**
 * Bidirectional mapper between {@link AuthDto} (API layer) and {@link AuthModel} (domain layer).
 *
 * All methods are static — this class is never instantiated.
 */
export class AuthMapper {
  private constructor() {
    // Non-instantiable — static utility class.
  }

  /**
   * Converts a raw API {@link AuthDto} to the internal {@link AuthModel}.
   *
   * @param dto - A validated DTO from the API.
   * @returns The equivalent domain {@link AuthModel}.
   */
  static dtoToModel(dto: AuthDto): AuthModel {
    return {
      accessToken: dto.accessToken,
      tokenType: dto.tokenType,
      expiresIn: dto.expiresIn,
    };
  }
}
// #endregion Mapper
