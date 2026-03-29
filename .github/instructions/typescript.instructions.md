---
applyTo: '**/*.ts'
---

# TypeScript Standards — Sample-FE

These rules apply to **every** `.ts` file in the project, including source, spec, and
configuration files. All rules are enforced by ESLint; violations that cannot be auto-fixed must
be resolved manually before the file is committed.

---

## 1. Immutability First

Prefer **immutable** data structures at every layer.

```ts
// ✅ Correct — readonly interface fields
export interface UserDto {
  readonly id: string;
  readonly email: string;
  readonly displayName: string;
}

// ✅ Correct — readonly class property
export class AuthStore {
  readonly #token = signal<string | null>(null);
}

// ❌ Forbidden — mutable interface field
export interface UserDto {
  id: string; // missing readonly
}
```

- Use `readonly` on **every** interface property and class field that is not intentionally mutable.
- Use `const` by default; escalate to `let` only when reassignment is unavoidable.
- Prefer `Readonly<T>`, `ReadonlyArray<T>`, and `ReadonlyMap<K, V>` for shared data structures.

---

## 2. Strict Type Safety

### No `any`

`any` is **prohibited**. Use one of the following escape hatches instead:

| Situation              | Preferred alternative     |
| ---------------------- | ------------------------- |
| Unknown external shape | `unknown` + type guard    |
| Intentionally flexible | Generic `<T>`             |
| JSON deserialization   | Define a DTO + type guard |

```ts
// ✅ Correct — unknown with guard
function parsePayload(raw: unknown): UserDto {
  if (!isUserDto(raw)) throw new Error('Invalid payload');
  return raw;
}

// ❌ Forbidden
function parsePayload(raw: any): UserDto { ... }
```

### `import type` for type-only imports

```ts
// ✅ Correct
import type { UserDto } from '@models';

// ❌ Incorrect — value import for a type-only usage
import { UserDto } from '@models';
```

### Explicit return types

Every function and method **must** declare its return type explicitly.

```ts
// ✅ Correct
async loadProfile(id: string): Promise<UserDto> { ... }

// ❌ Missing return type
async loadProfile(id: string) { ... }
```

---

## 3. Async Integrity

### No floating Promises

Every `Promise` must be either `await`-ed or explicitly handled.

```ts
// ✅ Correct — awaited
await this.authFacade.logout();

// ✅ Correct — explicitly handled
this.authFacade.logout().catch((err) => this._logger.error(err));

// ❌ Floating — violation
this.authFacade.logout();
```

### Only await thenables

Do **not** `await` non-Promise values; it adds noise and signals a type error.

```ts
// ✅ Correct
const user = await this.userService.findById(id);

// ❌ Awaiting a synchronous value
const label = await computeLabel(user); // computeLabel returns string, not Promise
```

---

## 4. Barrel Policy & Path Aliases

See the root `copilot-instructions.md` for the full alias table. The rules here are:

- **Never** use deep relative paths (`../../`) to import across feature or library boundaries.
- Every directory exposes its public API through an `index.ts`.
- Internal implementation files may use relative imports within the **same** directory.

```ts
// ✅ Correct — alias import
import type { UserDto } from '@models';
import { ButtonComponent } from '@components/atoms';

// ❌ Forbidden — deep relative import across boundaries
import type { UserDto } from '../../../models/user.dto';
```

---

## 5. Naming Conventions

| Artifact          | Convention             | Example                                    |
| ----------------- | ---------------------- | ------------------------------------------ |
| Signal (writable) | `_camelCase` (private) | `_isLoading = signal(false)`               |
| Signal (exposed)  | `camelCase` (readonly) | `isLoading = this._isLoading.asReadonly()` |
| Computed          | `camelCase`            | `fullName = computed(...)`                 |
| DTO interface     | `PascalCaseDto`        | `UserDto`, `OrderLineDto`                  |
| Mapper class/fn   | `PascalCaseMapper`     | `UserMapper`                               |
| Type guard fn     | `isPascalCase`         | `isUserDto(v: unknown)`                    |
| Constant          | `SCREAMING_SNAKE_CASE` | `MAX_RETRY_COUNT`                          |
| Enum member       | `PascalCase`           | `LoadingState.Idle`                        |

---

## 6. Clean Code Rules

### No unused variables or parameters

Mark intentionally unused parameters with a leading underscore **only** if the signature is
imposed by an external contract (e.g., callback with a fixed arity).

```ts
// ✅ Acceptable — signature imposed by Array.prototype.map
items.map((_item, index) => index);

// ❌ Forbidden — unused parameter with no structural reason
function render(template: string, _unused: boolean): string { ... }
```

### Nullish coalescing over logical OR for defaults

```ts
// ✅ Correct
const name = user.displayName ?? 'Anonymous';

// ❌ Incorrect — falsy coalescing silently swallows empty strings
const name = user.displayName || 'Anonymous';
```

### No magic numbers

Extract numeric literals into named constants.

```ts
// ✅ Correct
const TOKEN_EXPIRY_MS = 15 * 60 * 1_000;

// ❌ Magic number
setTimeout(refresh, 900_000);
```

---

## 7. JSDoc Requirement

Every symbol — exported **or** private — must be documented with JSDoc.

```ts
/**
 * Maps a raw API response to a strongly-typed {@link UserDto}.
 *
 * @param raw - The untyped JSON object received from the API.
 * @returns A validated and typed {@link UserDto}.
 * @throws {TypeError} When `raw` does not conform to the expected shape.
 */
export function mapToUserDto(raw: unknown): UserDto { ... }
```

Minimum required tags per symbol type:

| Symbol type       | Required tags                                                 |
| ----------------- | ------------------------------------------------------------- |
| Function / method | `@param`, `@returns` (if non-void), `@throws` (if applicable) |
| Interface / class | Description sentence                                          |
| Signal / computed | Description sentence                                          |
| Constant          | Description sentence                                          |
