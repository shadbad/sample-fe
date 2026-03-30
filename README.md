# Sample-FE

> Angular 21 · Standalone · Zoneless · Signals-first · NgRx Signal Store

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Development Commands](#development-commands)
3. [Execution Mandate](#execution-mandate)
4. [Project Stack](#project-stack)
5. [Architecture Overview](#architecture-overview)
6. [Directory Structure](#directory-structure)
7. [Routing](#routing)
8. [Zoneless & Signal-first Architecture](#zoneless--signal-first-architecture)
9. [NgRx Signal Store Facade Pattern](#ngrx-signal-store-facade-pattern)
10. [Feature Architecture (Facade + Config Bridge)](#feature-architecture-facade--config-bridge)
11. [Atomic Design — Shared Components](#atomic-design--shared-components)
12. [Models, DTOs & Mappers](#models-dtos--mappers)
13. [Core Services](#core-services)
14. [Authentication Architecture](#authentication-architecture)
15. [Internationalisation](#internationalisation)
16. [Styling Architecture](#styling-architecture)
17. [Path Aliases & Barrel Exports](#path-aliases--barrel-exports)
18. [Testing Strategy](#testing-strategy)
19. [Environment Configuration](#environment-configuration)
20. [Coding Standards](#coding-standards)
21. [Instruction Files](#instruction-files)
22. [MCP Filesystem Setup](#mcp-filesystem-setup)
23. [Contributing](#contributing)
24. [Decision Log](#decision-log)

---

## Quick Start

```bash
# Install dependencies
npm install

# Start the development server (http://localhost:4200)
npm start

# Run all tests in watch mode
npm test

# Run a single full check (format → lint → typecheck → test → build)
npx prettier --write . && npx ng lint --fix && npx tsc --noEmit && npx vitest run && npx ng build
```

---

## Development Commands

| Command                                    | Description                                                   |
| ------------------------------------------ | ------------------------------------------------------------- |
| `npm start`                                | Development server on `http://localhost:4200` with hot reload |
| `npm test`                                 | Vitest in watch mode                                          |
| `npm run test:run`                         | Single test run (CI)                                          |
| `npm run test:coverage`                    | Single run with coverage report                               |
| `npm run format:check`                     | Check formatting without writing                              |
| `npm run format:fix`                       | Format all files                                              |
| `npm run lint:check`                       | ESLint (report only)                                          |
| `npm run lint:fix`                         | ESLint with auto-fix                                          |
| `npm run type:check`                       | Type-check without emitting                                   |
| `npx ng build`                             | Production build to `dist/`                                   |
| `npx ng build --configuration development` | Development build                                             |

---

## Execution Mandate

After **any** change to a code-related file you **must** run the full pipeline automatically,
in order:

| Step         | Command                  | Pass Condition     |
| ------------ | ------------------------ | ------------------ |
| 1. Format    | `npx prettier --write .` | Exit 0             |
| 2. Lint      | `npx ng lint --fix`      | 0 errors remaining |
| 3. Typecheck | `npx tsc --noEmit`       | 0 errors           |
| 4. Test      | `npx vitest run`         | All tests green    |
| 5. Build     | `npx ng build`           | Exit 0             |

No broken code is ever committed. No step may be skipped.

---

## Project Stack

| Concern   | Choice                                                     |
| --------- | ---------------------------------------------------------- |
| Framework | Angular 21 (Standalone, Zoneless)                          |
| Language  | TypeScript 5.9 (strict mode)                               |
| Styling   | SCSS + BEM — no utility frameworks                         |
| State     | NgRx Signal Store 21                                       |
| Testing   | Vitest 4 + Angular Testing Library                         |
| Auth      | JWT Bearer (`@nestjs/jwt` + `passport-jwt`)                |
| i18n      | ngx-translate 17 (`@ngx-translate/core`) — `en`, `de`     |
| Linter    | Angular ESLint                                             |
| Formatter | Prettier                                                   |

---

## Architecture Overview

### Zoneless + Signals-first

Zone.js is **removed**. Change detection is triggered exclusively by Angular Signals. No
`ChangeDetectorRef.markForCheck()`, no `NgZone`, no `setTimeout` wrapped in zone callbacks.

### NgRx Signal Store Facade

Every feature slice of state is encapsulated in a `signalStore` that acts as the Facade for that
feature. Components never touch HTTP services directly — they call the Facade, which manages
async state transitions via `patchState`.

### Atomic Design

Shared UI components follow the Atomic Design hierarchy under `src/app/components/`:

```
atoms → molecules → organisms → templates
```

Feature-specific components live exclusively inside their feature folder.

### Facade + Config Bridge

Features are **fully decoupled** from the host application. A Config Bridge (`InjectionToken` +
`provide*` factory) allows the host to supply runtime configuration without the feature knowing
anything about its environment.

---

## Directory Structure

```
sample-fe/
├── .github/
│   ├── copilot-instructions.md              # Global AI agent rules
│   └── instructions/
│       ├── angular.instructions.md          # Component & template standards
│       ├── features.instructions.md         # Feature architecture
│       ├── models-dtos.instructions.md      # DTOs, models & mappers
│       ├── styling.instructions.md          # SCSS + BEM
│       ├── testing.instructions.md          # Vitest + ATL
│       └── typescript.instructions.md       # TS strict standards
├── public/
│   ├── favicon/
│   ├── fonts/
│   ├── i18n/
│   │   ├── en.json                          # English translations (default)
│   │   └── de.json                          # German translations
│   └── icons/
├── scripts/
│   └── setup-mcp-filesystem.sh
├── src/
│   ├── main.ts                              # Bootstrap (no Zone.js)
│   ├── index.html
│   ├── test-setup.ts                        # Vitest global setup
│   ├── app/
│   │   ├── app.ts                           # Root component (shell + router-outlet)
│   │   ├── app.html                         # <app-header> + <main> + <app-footer> + <app-toast-container>
│   │   ├── app.scss
│   │   ├── app.spec.ts
│   │   ├── app.config.ts                    # Root ApplicationConfig (providers, HTTP, router, i18n)
│   │   ├── app.routes.ts                    # Root route table (lazy loads features)
│   │   │
│   │   ├── components/                      # Shared UI components (Atomic Design)
│   │   │   ├── atoms/
│   │   │   │   ├── app-logo-link/           # Clickable logo linking to home
│   │   │   │   ├── badge/                   # Status badge with variants
│   │   │   │   ├── button/                  # Generic button with variants
│   │   │   │   ├── input-field/             # Form input field
│   │   │   │   ├── nav-link/                # Navigation link
│   │   │   │   └── index.ts                 # Barrel: all atom exports
│   │   │   ├── molecules/
│   │   │   │   ├── app-nav/                 # Navigation bar (composes nav-link atoms)
│   │   │   │   ├── dialog/                  # Modal dialog
│   │   │   │   ├── search-bar/              # Search input with action
│   │   │   │   └── index.ts
│   │   │   ├── organisms/
│   │   │   │   ├── footer/                  # App footer
│   │   │   │   ├── header/                  # App header (composes app-nav, logo-link)
│   │   │   │   ├── paginate/                # Sortable paginated table
│   │   │   │   └── index.ts
│   │   │   └── templates/
│   │   │       └── index.ts                 # (empty — no template components yet)
│   │   │
│   │   ├── core/                            # App-wide singletons
│   │   │   ├── logging/
│   │   │   │   ├── log-config.token.ts      # LOG_CONFIG InjectionToken + provideLogConfig()
│   │   │   │   ├── log.model.ts             # LogLevel enum, LogEntry, LogConfig interfaces
│   │   │   │   ├── log.service.ts           # Console wrapper with level filtering + toasts
│   │   │   │   ├── toast/
│   │   │   │   │   ├── toast.model.ts       # ToastLevel, ToastEntry interfaces
│   │   │   │   │   └── toast.store.ts       # NgRx Signal Store for toast notifications
│   │   │   │   └── components/
│   │   │   │       └── toast-container/     # Toast container + toast-item molecule
│   │   │   └── theme/
│   │   │       ├── theme.model.ts           # Theme = 'light' | 'dark'
│   │   │       └── theme.service.ts         # Reads prefers-color-scheme, persists to localStorage
│   │   │
│   │   └── features/                        # Self-contained feature slices
│   │       ├── auth/
│   │       │   ├── auth.facade.ts           # AuthFacade (signalStore)
│   │       │   ├── auth.config.ts           # AuthConfig token + provideAuthConfig()
│   │       │   ├── auth.routes.ts           # /login, /register (guestGuard)
│   │       │   ├── components/
│   │       │   │   ├── login-form/
│   │       │   │   └── register-form/
│   │       │   ├── guards/
│   │       │   │   ├── auth.guard.ts        # Protects authenticated routes
│   │       │   │   └── guest.guard.ts       # Protects guest-only routes
│   │       │   ├── interceptors/
│   │       │   │   └── auth.interceptor.ts  # Attaches Bearer token
│   │       │   ├── models/
│   │       │   │   ├── auth.model.ts        # AuthModel, AuthDto, AuthResponseDto, AuthMapper
│   │       │   │   └── user.model.ts        # UserModel, UserDto, UserMapper
│   │       │   ├── pages/
│   │       │   │   ├── login/
│   │       │   │   └── register/
│   │       │   ├── services/
│   │       │   │   ├── auth.service.ts
│   │       │   │   └── token-storage.service.ts
│   │       │   └── index.ts
│   │       │
│   │       └── members/
│   │           ├── members.facade.ts        # MembersFacade (signalStore)
│   │           ├── members.config.ts        # MembersConfig token + provideMembersConfig()
│   │           ├── members.routes.ts        # /users (authGuard)
│   │           ├── components/
│   │           │   ├── member-delete-dialog/
│   │           │   ├── member-form-dialog/
│   │           │   ├── member-list/
│   │           │   ├── member-table/
│   │           │   └── reset-password-dialog/
│   │           ├── models/
│   │           │   └── member.model.ts      # MemberModel, MemberDto, MemberMapper
│   │           ├── pages/
│   │           │   └── users/
│   │           ├── services/
│   │           │   └── members.service.ts
│   │           └── index.ts
│   │
│   ├── environments/
│   │   ├── environment.model.ts             # Environment interface
│   │   ├── environment.ts                   # Dev: http://localhost:3000/v1
│   │   └── environment.prod.ts              # Prod: https://api.example.com/v1
│   │
│   └── styles/
│       ├── main.scss                        # Imports all general partials
│       └── general/
│           ├── _colors.scss                 # Colour design tokens
│           ├── _common.scss                 # Shared utility styles
│           ├── _fonts.scss                  # Font-face declarations
│           ├── _icons.scss                  # Icon definitions
│           └── _reset.scss                  # CSS reset
│
├── angular.json
├── eslint.config.js
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.spec.json
└── vitest-base.config.ts
```

---

## Routing

The root route table in `app.routes.ts` lazy-loads features:

| Path        | Feature  | Guard        | Page           |
| ----------- | -------- | ------------ | -------------- |
| `/`         | —        | —            | Redirects to `/users` |
| `/login`    | Auth     | `guestGuard` | `LoginPage`    |
| `/register` | Auth     | `guestGuard` | `RegisterPage` |
| `/users`    | Members  | `authGuard`  | `UsersPage`    |

---

## Zoneless & Signal-first Architecture

### Why zoneless?

Zone.js monkey-patches async browser APIs (`setTimeout`, `Promise`, `addEventListener`, etc.) to
trigger change detection. While powerful, this approach:

- adds ~50 KB to the bundle,
- causes unnecessary change-detection runs application-wide,
- makes debugging async code confusing (stack traces include Zone internals), and
- is incompatible with certain browser APIs and Web Workers.

Angular supports a **fully zoneless** mode where change detection fires only when a **Signal**
notifies Angular that a value has changed.

### What replaces Zone.js?

| Zone.js pattern                     | Zoneless replacement                     |
| ----------------------------------- | ---------------------------------------- |
| `ChangeDetectorRef.markForCheck()`  | Signal update (automatic)                |
| `ChangeDetectorRef.detectChanges()` | Signal update (automatic)                |
| `NgZone.run(fn)`                    | Signal update (automatic)                |
| `async pipe`                        | `resource()` or `toSignal()`             |
| `setTimeout` to defer CD            | `signal.set()` after the async operation |

### Bootstrap configuration

```ts
// main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { appConfig } from './app/app.config';

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
```

Every component must use `ChangeDetectionStrategy.OnPush`.

### Signal API quick reference

| API                                   | Purpose                                            |
| ------------------------------------- | -------------------------------------------------- |
| `signal<T>(initialValue)`             | Creates a writable signal                          |
| `computed(() => expr)`                | Derives a read-only signal from other signals      |
| `effect(() => sideEffect)`            | Runs a side effect whenever tracked signals change |
| `input<T>()` / `input.required<T>()` | Signal-based component input                       |
| `output<T>()`                         | Typed event emitter (replaces `EventEmitter`)      |
| `model<T>()`                          | Two-way bindable signal                            |
| `resource({ request, loader })`       | Async data with loading/error/value state          |
| `toSignal(observable$)`               | Wraps an Observable in a read-only signal          |

---

## NgRx Signal Store Facade Pattern

### Why the Facade?

Components should be dumb. They read signals and call methods — they never know where the data
comes from or how it is fetched. The **Facade** is the single contact point between a component
and all the infrastructure (HTTP services, caches, transformations) beneath it.

### Structure

```
Component
    │  reads signals, calls methods
    ▼
[Feature Facade]   ← signalStore — owns state, orchestrates async
    │  calls service methods (returns Promises)
    ▼
[Feature Service]  ← HTTP via firstValueFrom(HttpClient.get(...))
    │  validates + maps raw API data
    ▼
[Mapper + DTO]     ← pure data transformation, no side effects
```

### Signal Store anatomy

```ts
export const UserStore = signalStore(
  { providedIn: 'root' },

  // 1. State — flat, readonly interface with an initialState constant
  withState<UserState>(initialState),

  // 2. Computed — derived read-only signals (no async, no side effects)
  withComputed(({ users, isLoading }) => ({
    activeUsers: computed(() => users().filter((u) => u.isActive)),
    hasUsers: computed(() => users().length > 0),
  })),

  // 3. Methods — async operations use async/await + patchState
  withMethods((store) => {
    const service = inject(UserService);
    return {
      async loadAll(): Promise<void> {
        patchState(store, { isLoading: true, error: null });
        try {
          const users = await service.findAll();
          patchState(store, { users, isLoading: false });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          patchState(store, { error: message, isLoading: false });
        }
      },
    };
  }),
);
```

### Rules

1. `patchState` is the **only** way to mutate state.
2. **No Observable** is returned from `withMethods` functions.
3. Every store resets cleanly via a `reset()` method.
4. Stores are `providedIn: 'root'` unless feature-scoped instances are explicitly required.

---

## Feature Architecture (Facade + Config Bridge)

### Why isolate features?

A feature that imports from another feature creates hidden coupling. When feature A changes, it
silently breaks feature B. The **zero cross-imports rule** eliminates this class of bug entirely.

### Feature directory layout

```
src/app/features/<feature-name>/
├── components/              # Feature-private components (never exported via index.ts)
├── models/                  # Feature-local DTOs, models, mappers
├── pages/                   # Route-level page components
├── services/                # HTTP services (return Promises)
├── guards/                  # Route guards (if applicable)
├── interceptors/            # HTTP interceptors (if applicable)
├── <feature>.facade.ts      # NgRx Signal Store Facade
├── <feature>.config.ts      # Config Bridge (InjectionToken + factory)
├── <feature>.routes.ts      # Lazy-loaded route definitions
└── index.ts                 # Public API — only Facade, Config, routes, guards, interceptors
```

### Data flow

```
Host App (app.config.ts)
    │  provides config via provide*Config(...)
    │  registers routes
    ▼
Feature: <name>/
    ├── Config (InjectionToken)              ← decouples from host
    ├── Facade (signalStore)                 ← state + async
    ├── Service (HTTP)                       ← firstValueFrom(HttpClient)
    └── Components (OnPush, Signals)         ← read-only facade consumers
```

### Config Bridge pattern

```ts
// 1. Define the contract
export interface MembersConfig {
  readonly apiBase: string;
  readonly roles: ReadonlyArray<{ id: string; name: string }>;
}

// 2. Create the token
export const MEMBERS_CONFIG = new InjectionToken<MembersConfig>('MEMBERS_CONFIG');

// 3. Create the provider factory
export function provideMembersConfig(cfg: MembersConfig): Provider {
  return { provide: MEMBERS_CONFIG, useValue: cfg };
}

// 4. Host registers it (app.config.ts)
provideMembersConfig({ apiBase: environment.apiBase, roles: [{ id: '...', name: 'admin' }] });
```

### Current features

| Feature     | Public API exports                                                                         | Routes                |
| ----------- | ------------------------------------------------------------------------------------------ | --------------------- |
| **Auth**    | `AuthFacade`, `provideAuthConfig`, `authGuard`, `guestGuard`, `authInterceptor`            | `/login`, `/register` |
| **Members** | `MembersFacade`, `provideMembersConfig`                                                    | `/users`              |

---

## Atomic Design — Shared Components

Every reusable UI component lives under `src/app/components/` and is placed in the correct
atomic tier:

| Tier          | Location                 | Dependencies           | Current components                                              |
| ------------- | ------------------------ | ---------------------- | --------------------------------------------------------------- |
| **Atoms**     | `components/atoms/`      | None                   | `app-logo-link`, `badge`, `button`, `input-field`, `nav-link`   |
| **Molecules** | `components/molecules/`  | Atoms only             | `app-nav`, `dialog`, `search-bar`                               |
| **Organisms** | `components/organisms/`  | Atoms + Molecules      | `footer`, `header`, `paginate`                                  |
| **Templates** | `components/templates/`  | Layout slots only      | *(none yet)*                                                    |

- Atoms have **no** child component dependencies.
- Molecules depend only on atoms.
- Organisms may depend on atoms and molecules.
- Templates define layout slots only; they contain zero business logic.
- Feature-specific components live inside their feature folder and are **never** placed here.

---

## Models, DTOs & Mappers

Models are **scoped per feature**, not shared globally. Each feature's `models/` directory
contains co-located domain models, DTOs, type guards, and mappers in a single file per entity.

### Three-layer data model

```
API (JSON)
    ▼  isXxxDto() type guard validates shape
  XxxDto           ← mirrors exact API field names (snake_case)
    ▼  XxxMapper.dtoToModel()
  XxxModel         ← camelCase, Date objects, booleans — what the app uses
    ▼  XxxMapper.modelToDto()
  XxxDto           ← serialised back for write operations
    ▼
API (JSON)
```

### Current model files

| Feature  | File              | Exports                                                                       |
| -------- | ----------------- | ----------------------------------------------------------------------------- |
| Auth     | `auth.model.ts`   | `AuthModel`, `AuthDto`, `AuthResponseDto`, `AuthMapper`, `isAuthDto()`        |
| Auth     | `user.model.ts`   | `UserModel`, `UserDto`, `UserMapper`, `isUserDto()`                           |
| Members  | `member.model.ts` | `MemberModel`, `MemberDto`, `MemberListResponseDto`, `MemberMapper`, `isMemberDto()` |

---

## Core Services

App-wide singletons live under `src/app/core/`:

### Logging (`core/logging/`)

| Artefact                    | Responsibility                                                              |
| --------------------------- | --------------------------------------------------------------------------- |
| `LogService`                | Console wrapper with level filtering; emits toasts for user-facing messages |
| `LogLevel` enum             | `Debug` (0) → `Info` (1) → `Warn` (2) → `Error` (3)                       |
| `LOG_CONFIG` token          | Controls `minLevel` — `Debug` in dev, `Warn` in prod                       |
| `ToastStore`                | NgRx Signal Store for toast notifications (add, auto-dismiss)              |
| `ToastContainerComponent`   | Renders active toasts; includes `toast-item` molecule                      |

### Theme (`core/theme/`)

| Artefact       | Responsibility                                                                          |
| -------------- | --------------------------------------------------------------------------------------- |
| `ThemeService` | Reads `prefers-color-scheme`, persists to `localStorage`, sets `data-theme` on `<html>` |
| `Theme` type   | `'light' \| 'dark'`                                                                     |

---

## Authentication Architecture

```
Browser Memory
    └── accessToken: string | null   ← never persisted to localStorage

HttpOnly Cookie (backend-set)
    └── refreshToken                 ← opaque to JavaScript

AuthInterceptor (features/auth/interceptors/)
    └── Attaches Authorization: Bearer <accessToken> to every outbound request

Token refresh flow (Promise chain, no RxJS)
    1. Request fails with 401
    2. AuthInterceptor calls authService.refresh()
    3. POST /auth/refresh → new accessToken in response body
    4. TokenStorageService stores new token in memory
    5. Original request retried with new token

Session initialisation
    └── provideAppInitializer(() => inject(AuthFacade).initSession())
```

There is no OAuth and no third-party auth provider. The backend is `@nestjs/jwt` + `passport-jwt`.

---

## Internationalisation

- Supported locales: **en** (default), **de**.
- Powered by **[ngx-translate](https://github.com/ngx-translate/core)** (`@ngx-translate/core` + `@ngx-translate/http-loader`).
- JSON translation files live in `public/i18n/` and are served at `/i18n/{lang}.json`.
- Angular's built-in `i18n` attribute and `$localize` are **forbidden** (incompatible with ngx-translate).
- Hard-coded display strings in templates or components are **forbidden**.

### Setup (already configured in `app.config.ts`)

```ts
provideTranslateService({
  loader: provideTranslateHttpLoader({ prefix: '/i18n/', suffix: '.json' }),
  lang: 'en',
  fallbackLang: 'en',
}),
```

### Translation key namespaces

| Namespace  | Purpose                                                                       |
| ---------- | ----------------------------------------------------------------------------- |
| `common`   | Generic actions/labels (`loading`, `save`, `cancel`, `delete`, `search`, …)   |
| `app`      | App-level strings (`welcomeTitle`)                                            |
| `header`   | Header component (`logoAriaLabel`, `navAriaLabel`)                            |
| `nav`      | Navigation links (`users`, `logout`, …)                                       |
| `footer`   | Footer content (`copyright` with `{{year}}` param)                            |
| `auth`     | Login, register, auth errors                                                  |
| `errors`   | Validation messages (`required`, `invalidEmail`, `minLength`, …)              |
| `paginate` | Pagination controls and aria labels                                           |
| `a11y`     | Accessibility labels (`closeDialog`, `openMenu`, `loading`, …)                |
| `log`      | Toast/log messages (`genericError`, `networkError`, `sessionExpired`, …)      |
| `members`  | Members feature (page title, table columns, dialogs, form labels)             |

### Usage in components

```ts
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  imports: [TranslatePipe],
  template: `<h1>{{ 'nav.users' | translate }}</h1>`,
})
export class MyComponent {}
```

### Adding new keys

1. Add the key to **both** `public/i18n/en.json` and `public/i18n/de.json`.
2. Use the same namespace structure in both files.
3. For parametrised strings, use `{{ value }}` interpolation.

---

## Styling Architecture

```
SCSS + BEM (no utility classes)

Design tokens
    CSS custom properties in src/styles/general/_colors.scss
    consumed everywhere via var(--token-name)

Global partials — src/styles/general/
    _colors.scss     → Colour tokens
    _fonts.scss      → Font-face declarations
    _icons.scss      → Icon definitions
    _reset.scss      → CSS reset
    _common.scss     → Shared utility styles

Entry point — src/styles/main.scss
    Imports all general partials

Component styles
    :host = BEM block root
    SCSS nesting via &__element and &--modifier

Units
    rem exclusively (1px = 0.0625rem)
    em for media query breakpoints only

Responsive
    Mobile-first: base styles → @media (min-width: $bp-*)
```

### BEM naming rules

| Rule                        | Detail                                                                       |
| --------------------------- | ---------------------------------------------------------------------------- |
| Block = component           | One BEM block per component; name matches the component's default CSS class  |
| Elements separated by `__`  | `.card__title`, `.card__body`                                                |
| Modifiers separated by `--` | `.card__title--truncated`, `.card--loading`                                  |
| No element of element       | `.card__header__title` is **forbidden**; use `.card__title` instead           |
| No ID selectors             | `#id` selectors are forbidden in component styles                            |

---

## Path Aliases & Barrel Exports

Import using aliases at all times. Deep relative paths across boundaries are forbidden.

| Alias                   | Resolves to                                  |
| ----------------------- | -------------------------------------------- |
| `@components/atoms`     | `src/app/components/atoms/index.ts`          |
| `@components/molecules` | `src/app/components/molecules/index.ts`      |
| `@components/organisms` | `src/app/components/organisms/index.ts`      |
| `@components/templates` | `src/app/components/templates/index.ts`      |
| `@features/*`           | `src/app/features/*/index.ts`                |
| `@models`               | `src/app/models/index.ts`                    |
| `@env`                  | `src/environments/environment.ts`            |

Configured in `tsconfig.json`:

```jsonc
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@components/atoms": ["src/app/components/atoms/index.ts"],
      "@components/molecules": ["src/app/components/molecules/index.ts"],
      "@components/organisms": ["src/app/components/organisms/index.ts"],
      "@components/templates": ["src/app/components/templates/index.ts"],
      "@features/*": ["src/app/features/*/index.ts"],
      "@models": ["src/app/models/index.ts"],
      "@env": ["src/environments/environment.ts"]
    }
  }
}
```

### Barrel rules

1. Every directory that exposes a public API **must** have an `index.ts`.
2. `index.ts` re-exports **only** the public API — internal helpers are never re-exported.
3. Within the **same directory**, relative imports are permitted.
4. Across directory boundaries, alias imports are **mandatory**.

---

## Testing Strategy

| Layer                    | Tool                    | Coverage target |
| ------------------------ | ----------------------- | --------------- |
| Facades (signalStore)    | Vitest                  | 100% branches   |
| Services                 | Vitest                  | ≥ 90% branches  |
| Mappers                  | Vitest                  | 100% branches   |
| Pipes                    | Vitest                  | 100%            |
| Components               | Angular Testing Library | Critical paths  |

### Global coverage thresholds (enforced in CI)

- **80%** statements, branches, functions, and lines

### Query priority (Angular Testing Library)

`getByRole` → `getByLabelText` → `getByPlaceholderText` → `getByText` → `getByDisplayValue` → `getByAltText` → `getByTitle`

CSS class selectors and `data-testid` attributes are **forbidden**. Tests must rely solely on
accessible roles, labels, and text.

### Mocking

All dependencies are mocked at the Angular provider level using `vi.fn()` with explicit generic
types. `vi.clearAllMocks()` runs in `beforeEach`.

### Running tests

```bash
npm test              # Watch mode
npm run test:run      # Single run (CI)
npm run test:coverage # Single run with coverage report
```

---

## Environment Configuration

| File                   | `production` | `apiBase`                    |
| ---------------------- | ------------ | ---------------------------- |
| `environment.ts` (dev) | `false`      | `http://localhost:3000/v1`   |
| `environment.prod.ts`  | `true`       | `https://api.example.com/v1` |

Production builds use file replacement via `angular.json` configuration.

### Build budgets

| Type            | Warning | Error |
| --------------- | ------- | ----- |
| Initial bundle  | 500 kB  | 1 MB  |
| Component style | 4 kB    | 8 kB  |

---

## Coding Standards

### Non-negotiable rules at a glance

| Rule                 | Standard                                                                   |
| -------------------- | -------------------------------------------------------------------------- |
| Change detection     | Signals only — `OnPush` mandatory                                          |
| Zone.js              | Removed — completely forbidden                                             |
| Dependency injection | `inject()` — constructor injection forbidden                               |
| Component I/O        | `input()` / `output()` / `model()` — decorator-based I/O forbidden         |
| Async                | `async/await` + `firstValueFrom` — `Observable` not returned from services |
| RxJS                 | Last resort only — must include justification comment                      |
| `any` type           | Forbidden — use `unknown` + type guard                                     |
| Styles               | SCSS + BEM — no utility classes                                            |
| State                | `signalStore` Facade — no raw component state for shared data              |
| Testing              | `getByRole` first — no CSS selectors, no `data-testid`                     |
| i18n                 | `translate` pipe / `TranslateService` — no hard-coded display strings      |
| Documentation        | JSDoc on every symbol — no exceptions                                      |

---

## Instruction Files

GitHub Copilot instruction files provide the AI with project-specific coding standards.
They live in `.github/instructions/` and are applied automatically to matching files.

| File                           | Applied to                          | Governs                                    |
| ------------------------------ | ----------------------------------- | ------------------------------------------ |
| `copilot-instructions.md`     | All files                           | Global agent workflow and execution mandate |
| `angular.instructions.md`     | `**/*.ts`, `**/*.html`, `**/*.scss` | Component architecture, templates, a11y    |
| `features.instructions.md`    | `src/app/features/**`               | Facade pattern, Config Bridge, routing     |
| `models-dtos.instructions.md` | `**/*.ts`                           | DTOs, domain models, mappers               |
| `typescript.instructions.md`  | `**/*.ts`                           | TS strict standards, immutability, naming  |
| `styling.instructions.md`     | `**/*.scss`                         | SCSS, BEM, tokens, units                   |
| `testing.instructions.md`     | `**/*.spec.ts`                      | Vitest, ATL, query priority, mocking       |

---

## MCP Filesystem Setup

The script `scripts/setup-mcp-filesystem.sh` wires up the
[MCP Filesystem server](https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem)
as a VS Code MCP server so that GitHub Copilot (and other MCP clients) can read files from the
**backend** project alongside this frontend workspace.

### Prerequisites

- [Docker](https://www.docker.com/) installed and running.
- The backend project cloned locally at a known path.

### Running the script

```bash
bash scripts/setup-mcp-filesystem.sh
```

What it does:

1. **Pulls** the `mcp/filesystem` Docker image.
2. **Prompts** for the absolute path to the backend project folder (supports `~` expansion).
3. **Patches** `.vscode/mcp.json` — adds a `filesystem` server entry that mounts the backend
   folder as a **read-only** bind mount at `/projects/backend` inside the container.

The resulting entry in `.vscode/mcp.json` looks like:

```json
"filesystem": {
  "command": "docker",
  "args": [
    "run", "-i", "--rm",
    "--mount", "type=bind,src=/your/backend,dst=/projects/backend,readonly",
    "mcp/filesystem:1.0.2",
    "/projects/backend"
  ]
}
```

Reload MCP servers in VS Code (`MCP: Restart All Servers`) or restart VS Code to pick up the
change.

> **Note:** The mount is read-only — the MCP server can read backend files but cannot modify them.

---

## Contributing

1. Create a feature branch from `main`: `git checkout -b feat/<ticket>-description`
2. Make your changes.
3. Run the full pipeline: format → lint → typecheck → test → build.
4. Open a pull request — all pipeline steps must be green before review.

> All contributions must adhere to the standards described in the `.github/instructions/` files.

---

## Decision Log

| Decision                             | Rationale                                                           | Date    |
| ------------------------------------ | ------------------------------------------------------------------- | ------- |
| Zoneless Angular                     | Smaller bundles, predictable CD, no Zone debugging overhead         | 2025-01 |
| NgRx Signal Store over traditional   | Signals-native, less boilerplate, no selectors/effects split        | 2025-01 |
| `firstValueFrom` over `.toPromise()` | `.toPromise()` is deprecated in RxJS 7+                             | 2025-01 |
| No `data-testid`                     | Forces accessible markup; tests verify real user experience         | 2025-01 |
| `rem` units only                     | Respects user font-size preferences; predictable scaling            | 2025-01 |
| JWT in memory only                   | Prevents XSS from reading tokens; refresh via HttpOnly cookie       | 2025-01 |
| Facade + Config Bridge               | Eliminates feature coupling; enables host-controlled configuration  | 2025-01 |
| Atomic Design                        | Enforces reuse hierarchy; prevents organisms depending on organisms | 2025-01 |
| Feature-scoped models                | Models stay close to their consumers; no global model directory     | 2025-01 |
