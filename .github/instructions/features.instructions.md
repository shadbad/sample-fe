---
applyTo: 'src/app/features/**'
---

# Feature Architecture — Sample-FE

These rules govern the internal structure of every feature module under `src/app/features/`.
They enforce a **Facade + Config Bridge** pattern that keeps features self-contained, testable,
and decoupled from the host application.

---

## 1. Directory Structure

Every feature lives under `src/app/features/<feature-name>/` and follows this layout:

```
src/app/features/
└── user-profile/
    ├── components/             # Feature-private components (never exported via index.ts)
    │   └── user-avatar/
    │       ├── user-avatar.component.ts
    │       ├── user-avatar.component.html
    │       └── user-avatar.component.scss
    ├── models/
    │   ├── user-profile.dto.ts         # Request/response shape from the API
    │   ├── user-profile.mapper.ts      # Maps raw API data → DTO
    │   └── index.ts                    # Re-exports public model types
    ├── user-profile.facade.ts          # NgRx Signal Store (the Facade)
    ├── user-profile.config.ts          # Config Bridge (DI tokens + factory)
    ├── user-profile.routes.ts          # Lazy-loaded route definitions
    └── index.ts                        # Public API — only Facade, Config, and routes
```

### Public API rule

`index.ts` exports **only**:

- The Facade (`UserProfileFacade`)
- The Config token/factory (`UserProfileConfig`, `provideUserProfileConfig`)
- Route definitions (`userProfileRoutes`)

Internal components and models are **never** re-exported.

```ts
// src/app/features/user-profile/index.ts
export { UserProfileFacade } from './user-profile.facade';
export { UserProfileConfig, provideUserProfileConfig } from './user-profile.config';
export { userProfileRoutes } from './user-profile.routes';
```

---

## 2. The Facade — NgRx Signal Store

The Facade **is** the NgRx Signal Store for the feature. It owns all state, async operations,
and derived computations for that feature slice.

### 2.1 Scaffold

```ts
// user-profile.facade.ts
import { signalStore, withState, withComputed, withMethods } from '@ngrx/signals';
import { inject } from '@angular/core';
import { computed } from '@angular/core';
import type { UserProfileDto } from './models';
import { UserProfileService } from './user-profile.service';

// #region State Shape
/** Internal state shape for the UserProfile feature. */
interface UserProfileState {
  /** The currently loaded profile, or null when not yet fetched. */
  readonly profile: UserProfileDto | null;
  /** Whether an async operation is in flight. */
  readonly isLoading: boolean;
  /** The last error message, or null when no error. */
  readonly error: string | null;
}

/** Default value for {@link UserProfileState}. */
const initialState: UserProfileState = {
  profile: null,
  isLoading: false,
  error: null,
};
// #endregion State Shape

// #region Store
/**
 * Facade for the UserProfile feature.
 * Exposes read-only signals and async methods for loading and mutating user profile data.
 */
export const UserProfileFacade = signalStore(
  { providedIn: 'root' },
  withState(initialState),

  // #region Computed
  withComputed(({ profile }) => ({
    /** The user's full display name, or an empty string when no profile is loaded. */
    displayName: computed(() => profile()?.displayName ?? ''),

    /** True when a profile has been successfully loaded. */
    hasProfile: computed(() => profile() !== null),
  })),
  // #endregion Computed

  // #region Methods
  withMethods((store) => {
    const service = inject(UserProfileService);

    return {
      /**
       * Loads the user profile for the given ID.
       * Sets `isLoading` during the request and populates `error` on failure.
       *
       * @param id - The unique identifier of the user to load.
       */
      async loadProfile(id: string): Promise<void> {
        patchState(store, { isLoading: true, error: null });
        try {
          const profile = await service.findById(id);
          patchState(store, { profile, isLoading: false });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          patchState(store, { error: message, isLoading: false });
        }
      },

      /**
       * Resets the feature state back to its initial values.
       */
      reset(): void {
        patchState(store, initialState);
      },
    };
  }),
  // #endregion Methods
);
// #endregion Store
```

### 2.2 Facade rules

| Rule                                                          | Rationale                                           |
| ------------------------------------------------------------- | --------------------------------------------------- |
| State is **always** initialised via `withState(initialState)` | Prevents undefined signal reads                     |
| Async methods use **`async/await`** inside `withMethods`      | Consistent with the project's async strategy        |
| Signals exposed to consumers are **read-only**                | Prevents accidental mutation from outside the store |
| `patchState` is the **only** mutation mechanism               | Keeps state transitions traceable                   |
| No `Observable` returned from `withMethods` functions         | Aligns with the no-Observable-in-stores rule        |

---

## 3. The Config Bridge

The Config Bridge decouples a feature's runtime requirements from how the host application
provides them. It exposes a typed configuration interface and a `provide*` factory.

### 3.1 Scaffold

```ts
// user-profile.config.ts
import { InjectionToken, Provider } from '@angular/core';

// #region Config Interface
/**
 * Runtime configuration contract for the UserProfile feature.
 * The host application supplies values via {@link provideUserProfileConfig}.
 */
export interface UserProfileConfig {
  /** Base URL for the user-profile API (e.g. '/api/users'). */
  readonly apiBase: string;
  /** Maximum number of retry attempts on network failure. */
  readonly maxRetries: number;
  /** Whether avatar images should be displayed. */
  readonly showAvatars: boolean;
}
// #endregion Config Interface

// #region DI Token
/**
 * DI token for {@link UserProfileConfig}.
 * Inject this token wherever the feature config is needed.
 */
export const USER_PROFILE_CONFIG = new InjectionToken<UserProfileConfig>('USER_PROFILE_CONFIG');
// #endregion DI Token

// #region Factory
/**
 * Creates the Angular `Provider` that registers a {@link UserProfileConfig}
 * implementation for the UserProfile feature.
 *
 * @param config - The configuration values supplied by the host application.
 * @returns An Angular `Provider` to include in `ApplicationConfig` or a route's `providers`.
 */
export function provideUserProfileConfig(config: UserProfileConfig): Provider {
  return { provide: USER_PROFILE_CONFIG, useValue: config };
}
// #endregion Factory
```

### 3.2 Consuming the config inside the feature

```ts
// user-profile.service.ts
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { USER_PROFILE_CONFIG } from './user-profile.config';
import type { UserProfileDto } from './models';

/**
 * HTTP service for the UserProfile feature.
 * All endpoints are resolved relative to the injected {@link UserProfileConfig.apiBase}.
 */
export class UserProfileService {
  readonly #http = inject(HttpClient);
  readonly #config = inject(USER_PROFILE_CONFIG);

  /**
   * Fetches a single user profile by ID.
   *
   * @param id - The user's unique identifier.
   * @returns A Promise that resolves to the user's {@link UserProfileDto}.
   */
  async findById(id: string): Promise<UserProfileDto> {
    return (await this.#http
      .get<UserProfileDto>(`${this.#config.apiBase}/${id}`)
      .toPromise()) as UserProfileDto;
  }
}
```

### 3.3 Registering in the host application

```ts
// app.config.ts
import { provideUserProfileConfig } from '@features/user-profile';

export const appConfig: ApplicationConfig = {
  providers: [
    provideUserProfileConfig({
      apiBase: '/api/users',
      maxRetries: 3,
      showAvatars: true,
    }),
  ],
};
```

---

## 4. Zero Cross-Feature Imports

Features are **completely isolated**. They may only import from:

| Source                                                                | Allowed          |
| --------------------------------------------------------------------- | ---------------- |
| `@components/atoms`, `@components/molecules`, `@components/organisms` | ✅               |
| `@models`                                                             | ✅               |
| Angular / third-party packages                                        | ✅               |
| **Another feature** (`@features/other-feature`)                       | ❌ **Forbidden** |

If two features need to share data, the **host application** orchestrates the exchange —
either by passing data as inputs to a shared component, or by using a shared root-level service
that neither feature owns.

---

## 5. Routing Integration

Each feature exposes a `routes` constant for lazy loading.

```ts
// user-profile.routes.ts
import type { Routes } from '@angular/router';

/**
 * Lazy-loaded routes for the UserProfile feature.
 * Register these in the host application's root route configuration.
 */
export const userProfileRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/user-profile-shell/user-profile-shell.component').then(
        (m) => m.UserProfileShellComponent,
      ),
  },
];
```

```ts
// app.routes.ts (host)
import type { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'profile',
    loadChildren: () => import('@features/user-profile').then((m) => m.userProfileRoutes),
  },
];
```

---

## 6. Testing a Feature

### 6.1 Facade unit test

```ts
// user-profile.facade.spec.ts
import { TestBed } from '@angular/core/testing';
import { UserProfileFacade } from './user-profile.facade';
import { USER_PROFILE_CONFIG } from './user-profile.config';
import { UserProfileService } from './user-profile.service';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// #region Test Setup
describe('UserProfileFacade', () => {
  let facade: InstanceType<typeof UserProfileFacade>;
  let mockService: { findById: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockService = { findById: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        UserProfileFacade,
        { provide: UserProfileService, useValue: mockService },
        {
          provide: USER_PROFILE_CONFIG,
          useValue: { apiBase: '/api/users', maxRetries: 1, showAvatars: true },
        },
      ],
    });

    facade = TestBed.inject(UserProfileFacade);
  });
  // #endregion Test Setup

  // #region loadProfile
  it('sets isLoading while the request is in flight', async () => {
    mockService.findById.mockResolvedValue({ id: '1', displayName: 'Alice' });
    const promise = TestBed.runInInjectionContext(() => facade.loadProfile('1'));
    expect(facade.isLoading()).toBe(true);
    await promise;
    expect(facade.isLoading()).toBe(false);
  });

  it('populates the profile signal on success', async () => {
    const dto = { id: '1', displayName: 'Alice' };
    mockService.findById.mockResolvedValue(dto);
    await TestBed.runInInjectionContext(() => facade.loadProfile('1'));
    expect(facade.profile()).toEqual(dto);
  });
  // #endregion loadProfile
});
```
