---
applyTo: '**/*.ts'
---

# Models, DTOs & Mappers — Sample-FE

These rules govern how domain data is typed, transported, and transformed throughout the
application. Every entity that crosses an API boundary must follow the pattern described here.

---

## 1. Co-location Rule

A domain entity's **model interface**, **DTO interface**, and **static Mapper class** are
co-located in a single file named `<entity>.model.ts`. No splitting across multiple files.

```
src/app/models/
├── user.model.ts       ← UserModel + UserDto + UserMapper (all in one file)
├── order.model.ts      ← OrderModel + OrderDto + OrderMapper
├── order-line.model.ts ← OrderLineModel + OrderLineDto + OrderLineMapper
└── index.ts            ← Re-exports all public types via @models
```

---

## 2. File Structure

The file is divided into four `#region` blocks in this exact order:

1. **Domain Model** — the shape the application works with internally.
2. **DTO** — the raw shape received from / sent to the API.
3. **Type Guard** — a runtime check that validates an unknown value is a valid DTO.
4. **Mapper** — static `dtoToModel` and `modelToDto` methods.

```ts
// src/app/models/user.model.ts

// #region Domain Model
/**
 * Domain representation of a user within the application.
 * All internal logic works with this shape — never with {@link UserDto} directly.
 */
export interface UserModel {
  /** Unique identifier. */
  readonly id: string;
  /** User's full display name. */
  readonly displayName: string;
  /** ISO-8601 timestamp of account creation. */
  readonly createdAt: Date;
  /** Whether the account has been verified. */
  readonly isVerified: boolean;
}
// #endregion Domain Model

// #region DTO
/**
 * Raw API response shape for a user resource.
 * Mirrors the JSON contract of the backend; never used beyond the mapper layer.
 */
export interface UserDto {
  /** Unique identifier. */
  readonly id: string;
  /** User's full display name. */
  readonly display_name: string;
  /** ISO-8601 timestamp string — note: string, not Date. */
  readonly created_at: string;
  /** 0 = unverified, 1 = verified. */
  readonly is_verified: 0 | 1;
}
// #endregion DTO

// #region Type Guard
/**
 * Narrows an `unknown` value to {@link UserDto}.
 * Use at API boundaries before passing data to {@link UserMapper}.
 *
 * @param value - The raw value to check.
 * @returns `true` when `value` conforms to the {@link UserDto} shape.
 */
export function isUserDto(value: unknown): value is UserDto {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Record<string, unknown>)['id'] === 'string' &&
    typeof (value as Record<string, unknown>)['display_name'] === 'string' &&
    typeof (value as Record<string, unknown>)['created_at'] === 'string' &&
    ((value as Record<string, unknown>)['is_verified'] === 0 ||
      (value as Record<string, unknown>)['is_verified'] === 1)
  );
}
// #endregion Type Guard

// #region Mapper
/**
 * Bidirectional mapper between {@link UserDto} (API layer) and {@link UserModel} (domain layer).
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
      displayName: dto.display_name,
      createdAt: new Date(dto.created_at),
      isVerified: dto.is_verified === 1,
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
      display_name: model.displayName,
      created_at: model.createdAt.toISOString(),
      is_verified: model.isVerified ? 1 : 0,
    };
  }
}
// #endregion Mapper
```

---

## 3. Barrel Exports — `models/index.ts`

The `src/app/models/index.ts` barrel re-exports **only the public API** of each model file:
domain models, DTOs, type guards, and mapper classes. Internal helpers stay unexported.

```ts
// src/app/models/index.ts

// User
export type { UserModel } from './user.model';
export type { UserDto } from './user.model';
export { isUserDto } from './user.model';
export { UserMapper } from './user.model';

// Order
export type { OrderModel } from './order.model';
export type { OrderDto } from './order.model';
export { isOrderDto } from './order.model';
export { OrderMapper } from './order.model';

// Order Line
export type { OrderLineModel } from './order-line.model';
export type { OrderLineDto } from './order-line.model';
export { isOrderLineDto } from './order-line.model';
export { OrderLineMapper } from './order-line.model';
```

Import from the alias **always**:

```ts
// ✅ Correct
import type { UserModel } from '@models';
import { UserMapper, isUserDto } from '@models';

// ❌ Forbidden — deep relative import
import type { UserModel } from '../../../models/user.model';
```

---

## 4. Naming Conventions

| Artifact               | Convention                  | Example                         |
| ---------------------- | --------------------------- | ------------------------------- |
| Domain model interface | `PascalCaseModel`           | `UserModel`, `OrderLineModel`   |
| DTO interface          | `PascalCaseDto`             | `UserDto`, `OrderLineDto`       |
| Type guard function    | `isPascalCaseDto`           | `isUserDto`, `isOrderLineDto`   |
| Mapper class           | `PascalCaseMapper`          | `UserMapper`, `OrderLineMapper` |
| Mapper static methods  | `dtoToModel` / `modelToDto` | (fixed — do not rename)         |

---

## 5. Mapper Rules

| Rule                                    | Detail                                                                                         |
| --------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **Static methods only**                 | Mapper classes are never instantiated. Mark the constructor `private`.                         |
| **No side effects**                     | Mappers are pure functions. No HTTP calls, no logging, no signal mutations.                    |
| **Type the input strictly**             | `dtoToModel` accepts only valid `XxxDto`, never `unknown`. Validate with the type guard first. |
| **Always validate at the API boundary** | Call `isXxxDto(raw)` before passing to `mapper.dtoToModel`.                                    |

```ts
// ✅ Correct — validate then map
const raw: unknown = await firstValueFrom(this.http.get(`/api/users/${id}`));
if (!isUserDto(raw)) throw new TypeError(`Unexpected shape for user ${id}`);
const user: UserModel = UserMapper.dtoToModel(raw);

// ❌ Forbidden — cast without validation
const user = UserMapper.dtoToModel(raw as UserDto);
```

---

## 6. Nested & Collection DTOs

When a DTO contains nested entities, map each nested object through its own mapper:

```ts
// order.model.ts — dtoToModel
static dtoToModel(dto: OrderDto): OrderModel {
  return {
    id:    dto.id,
    lines: dto.lines.map(line => OrderLineMapper.dtoToModel(line)),
    total: dto.total_cents,
  };
}
```

Never inline nested field mapping — always delegate to the appropriate `XxxMapper`.
