---
applyTo: '**/*.spec.ts'
---

# Testing Standards — Sample-FE (Vitest + Angular Testing Library)

These rules govern every `.spec.ts` file in the project. Tests are the executable specification
of the application — they must be readable, isolated, and maintainable.

---

## 1. Toolchain

| Tool                                                     | Role                                                         |
| -------------------------------------------------------- | ------------------------------------------------------------ |
| **Vitest**                                               | Test runner and assertion library                            |
| **Angular Testing Library** (`@testing-library/angular`) | Component rendering and DOM queries                          |
| **`@testing-library/user-event`**                        | Realistic user interaction simulation                        |
| **`@testing-library/jest-dom`**                          | Extended matchers (`.toBeVisible()`, `.toHaveValue()`, etc.) |

---

## 2. File Co-location

Every spec file lives **next to** its source file:

```
src/app/features/user-profile/
├── user-profile.facade.ts
├── user-profile.facade.spec.ts   ← co-located
├── user-profile.service.ts
└── user-profile.service.spec.ts  ← co-located
```

---

## 3. Query Priority (Angular Testing Library)

Queries must be chosen in this strict priority order. Using a lower-priority query when a
higher one is available is a **violation**.

| Priority | Query                  | When to use                                                         |
| -------- | ---------------------- | ------------------------------------------------------------------- |
| 1        | `getByRole`            | Interactive elements — buttons, links, headings, inputs, checkboxes |
| 2        | `getByLabelText`       | Form fields associated with a `<label>`                             |
| 3        | `getByPlaceholderText` | Inputs where a label is not available                               |
| 4        | `getByText`            | Non-interactive text nodes, paragraphs                              |
| 5        | `getByDisplayValue`    | Select / textarea current values                                    |
| 6        | `getByAltText`         | Images                                                              |
| 7        | `getByTitle`           | Elements with a `title` attribute                                   |

**CSS class selectors and `data-testid` are forbidden.** The application never adds
`data-testid` attributes; tests must rely solely on accessible roles, labels, and text.

```ts
// ✅ Correct — role-based query
const button = screen.getByRole('button', { name: /sign in/i });

// ✅ Correct — label-based query
const emailInput = screen.getByLabelText(/email address/i);

// ❌ Forbidden — CSS selector
container.querySelector('.login-form__submit');

// ❌ Forbidden — test id
screen.getByTestId('submit-btn');
```

---

## 4. Mocking Strategy

### 4.1 Mock at the provider level

Dependencies are always mocked by substituting them at the Angular `TestBed` provider level.
Never mock by replacing module exports or monkey-patching prototypes.

```ts
// ✅ Correct — provider-level mock
const mockUserService = {
  findById: vi.fn<[string], Promise<UserDto>>(),
};

TestBed.configureTestingModule({
  providers: [{ provide: UserService, useValue: mockUserService }],
});
```

### 4.2 `vi.fn()` for all mocks

Use Vitest's `vi.fn()` for all mock functions. Type the generic parameters explicitly.

```ts
// ✅ Correct — typed vi.fn
const mockFindById = vi.fn<[string], Promise<UserDto>>();

// ❌ Avoid — untyped mock (loses type safety)
const mockFindById = vi.fn();
```

### 4.3 Reset mocks between tests

Call `vi.clearAllMocks()` in `beforeEach` to prevent state leakage between tests.

```ts
beforeEach(() => {
  vi.clearAllMocks();
});
```

---

## 5. Test File Structure

Every spec file **must** use `// #region` / `// #endregion` markers, and tests must follow the
**Arrange → Act → Assert** pattern.

```ts
// user-profile.facade.spec.ts

// #region Imports
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserProfileFacade } from './user-profile.facade';
import { UserProfileService } from './user-profile.service';
import { ObservabilityService } from '@core/observability.service';
import type { UserDto } from '@models';
// #endregion Imports

// #region Test Setup
describe('UserProfileFacade', () => {
  /** Typed mock for {@link UserProfileService}. */
  let mockService: { findById: ReturnType<typeof vi.fn<[string], Promise<UserDto>>> };
  /** Typed mock for {@link ObservabilityService}. */
  let mockObservability: { handleError: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();

    mockService = {
      findById: vi.fn<[string], Promise<UserDto>>(),
    };
    mockObservability = {
      handleError: vi.fn<[unknown, string], string>().mockReturnValue('Something went wrong'),
    };

    TestBed.configureTestingModule({
      providers: [
        UserProfileFacade,
        { provide: UserProfileService, useValue: mockService },
        { provide: ObservabilityService, useValue: mockObservability },
      ],
    });
  });
  // #endregion Test Setup

  // #region loadProfile — success
  describe('loadProfile', () => {
    it('sets isLoading to true during the request', async () => {
      // Arrange
      const dto: UserDto = {
        id: '1',
        display_name: 'Alice',
        created_at: '2024-01-01T00:00:00Z',
        is_verified: 1,
      };
      mockService.findById.mockResolvedValue(dto);
      const facade = TestBed.inject(UserProfileFacade);

      // Act
      const promise = TestBed.runInInjectionContext(() => facade.loadProfile('1'));

      // Assert — isLoading is true while the promise is pending
      expect(facade.isLoading()).toBe(true);
      await promise;
      expect(facade.isLoading()).toBe(false);
    });

    it('populates the profile signal on success', async () => {
      // Arrange
      const dto: UserDto = {
        id: '1',
        display_name: 'Alice',
        created_at: '2024-01-01T00:00:00Z',
        is_verified: 1,
      };
      mockService.findById.mockResolvedValue(dto);
      const facade = TestBed.inject(UserProfileFacade);

      // Act
      await TestBed.runInInjectionContext(() => facade.loadProfile('1'));

      // Assert
      expect(facade.profile()?.displayName).toBe('Alice');
    });
  });
  // #endregion loadProfile — success

  // #region loadProfile — error
  describe('loadProfile (error path)', () => {
    it('sets error via ObservabilityService when the request fails', async () => {
      // Arrange
      mockService.findById.mockRejectedValue(new Error('Network failure'));
      const facade = TestBed.inject(UserProfileFacade);

      // Act
      await TestBed.runInInjectionContext(() => facade.loadProfile('1'));

      // Assert
      expect(mockObservability.handleError).toHaveBeenCalledWith(
        expect.any(Error),
        'UserProfileFacade.loadProfile',
      );
      expect(facade.error()).toBe('Something went wrong');
    });
  });
  // #endregion loadProfile — error
});
```

---

## 6. Component Tests

Use `render()` from `@testing-library/angular` to mount components. Supply required inputs and
providers via the `render` options object.

```ts
// user-card.component.spec.ts

// #region Imports
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { UserCardComponent } from './user-card.component';
import type { UserModel } from '@models';
// #endregion Imports

// #region Fixtures
/** Minimal valid {@link UserModel} fixture for testing. */
const USER_FIXTURE: UserModel = {
  id: '1',
  displayName: 'Alice',
  createdAt: new Date('2024-01-01'),
  isVerified: true,
};
// #endregion Fixtures

// #region Tests
describe('UserCardComponent', () => {
  it('renders the user display name', async () => {
    // Arrange + Act
    await render(UserCardComponent, {
      componentInputs: { user: USER_FIXTURE },
    });

    // Assert
    expect(screen.getByText('Alice')).toBeVisible();
  });

  it('emits actionClick when the action button is pressed', async () => {
    // Arrange
    const user = userEvent.setup();
    const onActionClick = vi.fn();

    await render(UserCardComponent, {
      componentInputs: { user: USER_FIXTURE },
      componentOutputs: { actionClick: { emit: onActionClick } as any },
    });

    // Act
    await user.click(screen.getByRole('button', { name: /view profile/i }));

    // Assert
    expect(onActionClick).toHaveBeenCalledOnce();
  });
});
// #endregion Tests
```

---

## 7. Async Tests

Use `async/await` throughout. Never use `fakeAsync`/`tick` or `done` callbacks.

```ts
// ✅ Correct — async/await
it('loads data on init', async () => {
  mockService.getAll.mockResolvedValue([ORDER_FIXTURE]);
  const facade = TestBed.inject(OrderStore);
  await TestBed.runInInjectionContext(() => facade.loadAll());
  expect(facade.entities().length).toBe(1);
});

// ❌ Forbidden — fakeAsync / tick
it('loads data on init', fakeAsync(() => {
  ...
  tick();
  ...
}));
```

---

## 8. Coverage Targets

| Layer                   | Target                                    |
| ----------------------- | ----------------------------------------- |
| Facades (Signal Stores) | 100 % branch coverage                     |
| Services                | ≥ 90 % branch coverage                    |
| Mappers                 | 100 % branch coverage                     |
| Components              | Critical user interactions + error states |
| Pipes                   | 100 %                                     |

Coverage is enforced by Vitest's `coverage` configuration in `vitest.config.ts`.
