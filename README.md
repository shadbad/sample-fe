# Sample-FE

> Angular 19+ · Standalone · Zoneless · Signals-first · NgRx Signal Store

## Table of Contents

1. [Quick Start](#quick-start)
2. [Development Commands](#development-commands)
3. [Execution Mandate](#execution-mandate)
4. [Project Stack](#project-stack)
5. [Core Principles](#core-principles)
6. [Zoneless & Signal-first Architecture](#zoneless--signal-first-architecture)
7. [NgRx Signal Store Facade Pattern](#ngrx-signal-store-facade-pattern)
8. [Atomic Design & Directory Structure](#atomic-design--directory-structure)
9. [Barrel Exports & Alias Strategy](#barrel-exports--alias-strategy)
10. [Feature Architecture (Facade + Config Bridge)](#feature-architecture-facade--config-bridge)
11. [Models, DTOs & Mappers](#models-dtos--mappers)
12. [Authentication Architecture](#authentication-architecture)
13. [Error Handling & Observability](#error-handling--observability)
14. [Internationalisation](#internationalisation)
15. [Testing Strategy](#testing-strategy)
16. [Styling Architecture](#styling-architecture)
17. [Coding Standards](#coding-standards)
18. [Instruction Files](#instruction-files)
19. [MCP Filesystem Setup](#mcp-filesystem-setup)
20. [Contributing](#contributing)
21. [Decision Log](#decision-log)

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

| Concern   | Choice                                      |
| --------- | ------------------------------------------- |
| Framework | Angular 19+ (Standalone, Zoneless)          |
| Language  | TypeScript 5 (strict mode)                  |
| Styling   | SCSS + BEM — no utility frameworks          |
| State     | NgRx Signal Store                           |
| Testing   | Vitest + Angular Testing Library            |
| Auth      | JWT Bearer (`@nestjs/jwt` + `passport-jwt`) |
| i18n      | `en`, `de` (ngx-translate)                  |
| Linter    | Angular ESLint                              |
| Formatter | Prettier                                    |

---

## Core Principles

| Principle                    | Application                                                                                    |
| ---------------------------- | ---------------------------------------------------------------------------------------------- |
| **Type safety above all**    | Strict TypeScript, no `any`, explicit return types, `readonly` everywhere                      |
| **Signals-first reactivity** | Signals drive all state; RxJS only as a last resort                                            |
| **Zoneless runtime**         | Zone.js is removed; `OnPush` + Signals replace it entirely                                     |
| **Accessibility by default** | ARIA semantics, keyboard operability, and Testing Library principles are built in from day one |
| **Feature isolation**        | Features never import from each other; the host orchestrates all cross-feature data flow       |
| **JSDoc everywhere**         | Every symbol — public or private — carries a JSDoc comment                                     |

---

## Zoneless & Signal-first Architecture

### Why zoneless?

Zone.js works by monkey-patching async browser APIs (`setTimeout`, `Promise`, `addEventListener`,
etc.) to trigger Angular's change-detection cycle. While powerful, this approach:

- adds ~50 KB to the bundle,
- causes unnecessary change-detection runs application-wide,
- makes debugging async code confusing (stack traces include Zone internals), and
- is incompatible with certain browser APIs and Web Workers.

Angular 19 supports a **fully zoneless** mode where change detection fires only when a **Signal**
notifies Angular that a value has changed.

### What replaces Zone.js?

| Zone.js pattern                     | Zoneless replacement                     |
| ----------------------------------- | ---------------------------------------- |
| `ChangeDetectorRef.markForCheck()`  | Signal update (automatic)                |
| `ChangeDetectorRef.detectChanges()` | Signal update (automatic)                |
| `NgZone.run(fn)`                    | Signal update (automatic)                |
| `async pipe`                        | `resource()` or `toSignal()`             |
| `setTimeout` to defer CD            | `signal.set()` after the async operation |

### Required configuration

```ts
// main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideExperimentalZonelessChangeDetection } from '@angular/core';
import { AppComponent } from './app/app';
import { appConfig } from './app/app.config';

bootstrapApplication(AppComponent, {
  ...appConfig,
  providers: [...appConfig.providers, provideExperimentalZonelessChangeDetection()],
});
```

```ts
// Every component
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
})
```

### Signal API quick reference

| API                                  | Purpose                                            |
| ------------------------------------ | -------------------------------------------------- |
| `signal<T>(initialValue)`            | Creates a writable signal                          |
| `computed(() => expr)`               | Derives a read-only signal from other signals      |
| `effect(() => sideEffect)`           | Runs a side effect whenever tracked signals change |
| `input<T>()` / `input.required<T>()` | Signal-based component input                       |
| `output<T>()`                        | Typed event emitter (replaces `EventEmitter`)      |
| `model<T>()`                         | Two-way bindable signal                            |
| `resource({ request, loader })`      | Async data with loading/error/value state          |
| `toSignal(observable$)`              | Wraps an Observable in a read-only signal          |

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
    const observability = inject(ObservabilityService);
    return {
      async loadAll(): Promise<void> {
        patchState(store, { isLoading: true, error: null });
        try {
          const users = await service.findAll();
          patchState(store, { users, isLoading: false });
        } catch (err) {
          const message = observability.handleError(err, 'UserStore.loadAll');
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

## Atomic Design & Directory Structure

### Atomic tiers

| Tier          | Location                       | Description               | Dependencies                       |
| ------------- | ------------------------------ | ------------------------- | ---------------------------------- |
| **Atoms**     | `shared/components/atoms/`     | Single-purpose primitives | None                               |
| **Molecules** | `shared/components/molecules/` | Compositions of atoms     | Atoms only                         |
| **Organisms** | `shared/components/organisms/` | Feature-sized UI sections | Atoms + Molecules                  |
| **Templates** | `shared/components/templates/` | Page-level layout shells  | Atoms + Molecules + `<ng-content>` |

Feature-specific components live inside the feature folder and **never** appear in `shared/`.

### Full directory map

```
sample-fe/
├── .github/
│   ├── copilot-instructions.md          # Global AI agent rules
│   └── instructions/
│       ├── angular.instructions.md      # Component & template standards
│       ├── features.instructions.md     # Feature architecture
│       ├── models-dtos.instructions.md  # DTOs, models & mappers
│       ├── state-observability.instructions.md
│       ├── styling.instructions.md      # SCSS + BEM
│       ├── testing.instructions.md      # Vitest + ATL
│       └── typescript.instructions.md  # TS strict standards
├── src/
│   ├── app/
│   │   ├── app.config.ts           ← Root ApplicationConfig (providers, HTTP, router)
│   │   ├── app.routes.ts           ← Root route table (lazy loads features)
│   │   ├── app.ts                  ← Root component (shell + router outlet)
│   │   │
│   │   ├── core/                   ← App-wide singletons
│   │   │   ├── interceptors/
│   │   │   │   └── auth.interceptor.ts      ← Attaches Bearer token
│   │   │   ├── guards/
│   │   │   │   └── auth.guard.ts
│   │   │   ├── observability.service.ts     ← Central error + tracing gateway
│   │   │   └── index.ts
│   │   │
│   │   ├── features/               ← Self-contained feature slices
│   │   │   └── <feature-name>/
│   │   │       ├── components/              ← Feature-private components
│   │   │       ├── models/                  ← Feature-local DTOs (not in @models)
│   │   │       ├── <feature>.facade.ts      ← NgRx Signal Store Facade
│   │   │       ├── <feature>.config.ts      ← Config Bridge (InjectionToken + factory)
│   │   │       ├── <feature>.service.ts     ← HTTP service (returns Promises)
│   │   │       ├── <feature>.routes.ts      ← Lazy-loaded route definitions
│   │   │       └── index.ts                 ← Public API (Facade, Config, routes)
│   │   │
│   │   ├── models/                 ← Shared domain models + DTOs + mappers
│   │   │   ├── user.model.ts
│   │   │   ├── order.model.ts
│   │   │   └── index.ts            ← @models barrel
│   │   │
│   │   └── shared/
│   │       └── components/
│   │           ├── atoms/
│   │           │   ├── button/
│   │           │   ├── icon/
│   │           │   ├── badge/
│   │           │   └── index.ts
│   │           ├── molecules/
│   │           │   ├── search-bar/
│   │           │   ├── form-field/
│   │           │   └── index.ts
│   │           ├── organisms/
│   │           │   ├── header/
│   │           │   ├── data-table/
│   │           │   └── index.ts
│   │           └── templates/
│   │               ├── dashboard-layout/
│   │               ├── auth-layout/
│   │               └── index.ts
│   │
│   ├── styles/
│   │   ├── _tokens.scss            ← CSS custom properties (:root)
│   │   ├── _breakpoints.scss       ← SCSS $bp-* variables + :root tokens
│   │   ├── _reset.scss
│   │   ├── _typography.scss
│   │   ├── _buttons.scss
│   │   ├── _forms.scss
│   │   ├── _animations.scss
│   │   └── _index.scss             ← @forwards all partials
│   │
│   ├── index.html
│   ├── main.ts
│   └── styles.scss                 ← @use 'styles/index' as *
├── angular.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.spec.json
└── package.json
```

---

## Barrel Exports & Alias Strategy

### Motivation

Deep relative imports (`../../../../../../models/user.model`) are brittle, hard to refactor, and
convey no intent. Path aliases give imports semantic meaning and make large-scale refactors safe.

### Alias table

| Alias                   | Points to                                      | Contains                                   |
| ----------------------- | ---------------------------------------------- | ------------------------------------------ |
| `@components/atoms`     | `src/app/shared/components/atoms/index.ts`     | Primitive UI components                    |
| `@components/molecules` | `src/app/shared/components/molecules/index.ts` | Composite UI components                    |
| `@components/organisms` | `src/app/shared/components/organisms/index.ts` | Section-level UI components                |
| `@components/templates` | `src/app/shared/components/templates/index.ts` | Layout shell components                    |
| `@features/<name>`      | `src/app/features/<name>/index.ts`             | Facade, Config, routes                     |
| `@models`               | `src/app/models/index.ts`                      | Domain models, DTOs, mappers               |
| `@core`                 | `src/app/core/index.ts`                        | Guards, interceptors, ObservabilityService |

### Barrel rules

1. Every directory that exposes a public API **must** have an `index.ts`.
2. `index.ts` re-exports **only** the public API — internal helpers are never re-exported.
3. Within the **same directory**, relative imports are permitted.
4. Across directory boundaries, alias imports are **mandatory**.

### `tsconfig.json` configuration

```jsonc
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@components/atoms": ["src/app/shared/components/atoms/index.ts"],
      "@components/molecules": ["src/app/shared/components/molecules/index.ts"],
      "@components/organisms": ["src/app/shared/components/organisms/index.ts"],
      "@components/templates": ["src/app/shared/components/templates/index.ts"],
      "@features/*": ["src/app/features/*/index.ts"],
      "@models": ["src/app/models/index.ts"],
      "@core": ["src/app/core/index.ts"],
    },
  },
}
```

---

## Feature Architecture (Facade + Config Bridge)

### Why isolate features?

A feature that imports from another feature creates hidden coupling. When feature A changes, it
silently breaks feature B. The **zero cross-imports rule** eliminates this class of bug entirely.

### Data flow diagram

```
Host App (app.config.ts)
    │  provides UserProfileConfig via provideUserProfileConfig(...)
    │  registers routes via userProfileRoutes
    ▼
Feature: user-profile/
    ├── UserProfileConfig (InjectionToken)   ← decouples from host
    ├── UserProfileFacade (signalStore)      ← state + async
    ├── UserProfileService (HTTP)            ← firstValueFrom(HttpClient)
    └── Components (OnPush, Signals)         ← read-only facades
```

### Config Bridge pattern

```ts
// 1. Define the contract
export interface UserProfileConfig {
  readonly apiBase: string;
  readonly maxRetries: number;
}

// 2. Create the token
export const USER_PROFILE_CONFIG = new InjectionToken<UserProfileConfig>('USER_PROFILE_CONFIG');

// 3. Create the provider factory
export function provideUserProfileConfig(cfg: UserProfileConfig): Provider {
  return { provide: USER_PROFILE_CONFIG, useValue: cfg };
}

// 4. Host registers it (app.config.ts)
provideUserProfileConfig({ apiBase: '/api/users', maxRetries: 3 });
```

---

## Models, DTOs & Mappers

The three-layer data model keeps API contracts quarantined from domain logic:

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

All three artefacts (`XxxModel`, `XxxDto`, `XxxMapper`) live in a single `<entity>.model.ts`
file. The `@models` alias exposes their public API.

---

## Authentication Architecture

```
Browser Memory
    └── accessToken: string | null   ← never persisted to localStorage

HttpOnly Cookie (backend-set)
    └── refreshToken                 ← opaque to JavaScript

AuthInterceptor
    └── Attaches Authorization: Bearer <accessToken> to every outbound request

Token refresh flow (Promise chain, no RxJS)
    1. Request fails with 401
    2. AuthInterceptor calls authService.refresh()
    3. authService.refresh() POST /auth/refresh → new accessToken in response body
    4. authService stores new token in memory
    5. Original request retried with new token
```

There is no OAuth and no third-party auth provider. The backend is `@nestjs/jwt` + `passport-jwt`.

---

## Error Handling & Observability

All errors are routed through `ObservabilityService`. It is the **single exit point** for
errors — no `console.error`, no swallowed exceptions.

```
Error thrown (network, parse, business logic)
    ▼
ObservabilityService.handleError(err, 'StoreName.methodName')
    ▼
ErrorLoggingAdapter.log(...)   ← swap for Sentry, Datadog, etc. without touching call-sites
    ▼
Returns user-safe string message
    ▼
patchState(store, { error: message })
    ▼
Component reads error() signal → displays <app-error-banner>
```

---

## Internationalisation

- Supported locales: **en** (default), **de**.
- Translations are powered by **[ngx-translate](https://github.com/ngx-translate/core)** (`@ngx-translate/core` + `@ngx-translate/http-loader`).
- JSON translation files live in `src/app/assets/i18n/` and are served as static assets at `/i18n/{lang}.json`.
- Translation keys follow the nested namespace pattern `feature.component.key` (e.g. `auth.login`, `errors.required`).
- Hard-coded display strings in templates or components are **forbidden**.

### Setup (already configured)

```ts
// app.config.ts — providers registered automatically
provideTranslateHttpLoader({ prefix: '/i18n/', suffix: '.json' }),
provideTranslateService({ defaultLanguage: 'en' }),
```

### Usage in components

```ts
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  imports: [TranslatePipe],
  template: `<h1>{{ 'nav.home' | translate }}</h1>`,
})
export class MyComponent {}
```

### Switching language at runtime

```ts
readonly #translate = inject(TranslateService);

switchToGerman(): void {
  this.#translate.use('de');
}
```

### Adding new keys

1. Add the key to **both** `src/app/assets/i18n/en.json` and `src/app/assets/i18n/de.json`.
2. Use the same namespace structure in both files.
3. For parametrised strings use `{{ value }}` interpolation: `"minLength": "Minimum length is {{value}} characters."`.

---

## Testing Strategy

```
Unit tests (Vitest)
    ├── Facades (signalStore)     → 100% branch coverage
    ├── Services                  → ≥ 90% branch coverage
    ├── Mappers                   → 100% branch coverage
    └── Pipes                     → 100%

Component tests (Angular Testing Library)
    ├── Critical user interactions
    ├── Loading / error / empty states
    └── Accessibility — role/label queries only (no CSS selectors, no data-testid)
```

**Query priority:** `getByRole` → `getByLabelText` → `getByText`. CSS selectors and `data-testid`
attributes are forbidden.

**Mocking:** All dependencies are mocked at the Angular provider level using `vi.fn()` with
explicit generic types. `vi.clearAllMocks()` runs in `beforeEach`.

---

## Styling Architecture

```
SCSS + BEM (no utility classes)

Design tokens → src/styles/_tokens.scss
    CSS custom properties on :root
    consumed everywhere via var(--token-name)

Component styles
    :host = BEM block root
    SCSS nesting via &__element and &--modifier

Units
    rem exclusively (1px = 0.0625rem)
    em for media query breakpoints only

Responsive
    Mobile-first: base styles → @media (min-width: $bp-*)
```

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

| File                                  | Applied to                          | Governs                                     |
| ------------------------------------- | ----------------------------------- | ------------------------------------------- |
| `copilot-instructions.md`             | All files                           | Global agent workflow and execution mandate |
| `typescript.instructions.md`          | `**/*.ts`                           | TS strict standards, immutability, naming   |
| `angular.instructions.md`             | `**/*.ts`, `**/*.html`, `**/*.scss` | Component architecture, templates, a11y     |
| `features.instructions.md`            | `src/app/features/**`               | Facade pattern, Config Bridge, routing      |
| `state-observability.instructions.md` | `**/*.ts`                           | NgRx Signal Store, error handling           |
| `models-dtos.instructions.md`         | `**/*.ts`                           | DTOs, domain models, mappers                |
| `styling.instructions.md`             | `**/*.scss`                         | SCSS, BEM, tokens, units                    |
| `testing.instructions.md`             | `**/*.spec.ts`                      | Vitest, ATL, query priority, mocking        |

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

1. **Pulls** the `mcp/filesystem:1.0.2` Docker image.
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

4. **Reload MCP servers** in VS Code (`MCP: Restart All Servers`) or restart VS Code to pick up the
   change.

> **Note:** The mount is read-only — the MCP server can read backend files but cannot modify them.
> Re-run the script any time the backend folder moves.

---

## Contributing

1. Create a feature branch from `main`: `git checkout -b feat/<ticket>-description`
2. Make your changes.
3. Run the full pipeline: format → lint → typecheck → test → build.
4. Open a pull request — all pipeline steps must be green before review.

> All contributions must adhere to the standards described in the `.github/instructions/` files.

---

## Decision Log

| Decision                                | Rationale                                                           | Date    |
| --------------------------------------- | ------------------------------------------------------------------- | ------- |
| Zoneless Angular                        | Smaller bundles, predictable CD, no Zone debugging overhead         | 2025-01 |
| NgRx Signal Store over NgRx traditional | Signals-native, less boilerplate, no selectors/effects split        | 2025-01 |
| `firstValueFrom` over `.toPromise()`    | `.toPromise()` is deprecated in RxJS 7+                             | 2025-01 |
| No `data-testid`                        | Forces accessible markup; tests verify real user experience         | 2025-01 |
| `rem` units only                        | Respects user font-size preferences; predictable scaling            | 2025-01 |
| JWT in memory only                      | Prevents XSS from reading tokens; refresh via HttpOnly cookie       | 2025-01 |
| Facade + Config Bridge                  | Eliminates feature coupling; enables host-controlled configuration  | 2025-01 |
| Atomic Design                           | Enforces reuse hierarchy; prevents organisms depending on organisms | 2025-01 |

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
| `npx vitest run`                           | Single test run (CI)                                          |
| `npx ng build`                             | Production build to `dist/`                                   |
| `npx ng build --configuration development` | Development build                                             |
| `npx tsc --noEmit`                         | Type-check without emitting                                   |
| `npx ng lint`                              | ESLint (report only)                                          |
| `npx ng lint --fix`                        | ESLint with auto-fix                                          |
| `npx prettier --write .`                   | Format all files                                              |
| `npx prettier --check .`                   | Check formatting without writing                              |

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

| Concern   | Choice                                      |
| --------- | ------------------------------------------- |
| Framework | Angular 19+ (Standalone, Zoneless)          |
| Language  | TypeScript 5 (strict mode)                  |
| Styling   | SCSS + BEM — no utility frameworks          |
| State     | NgRx Signal Store                           |
| Testing   | Vitest + Angular Testing Library            |
| Auth      | JWT Bearer (`@nestjs/jwt` + `passport-jwt`) |
| i18n      | `en`, `de` (ngx-translate)                  |
| Linter    | Angular ESLint                              |
| Formatter | Prettier                                    |

---

## Architecture Overview

See [ARCHITECTURE.md](./ARCHITECTURE.md) for a full deep-dive. The key architectural pillars are:

### Zoneless + Signals-first

Zone.js is **removed**. Change detection is triggered exclusively by Angular Signals. No
`ChangeDetectorRef.markForCheck()`, no `NgZone`, no `setTimeout` wrapped in zone callbacks.

### NgRx Signal Store Facade

Every feature slice of state is encapsulated in a `signalStore` that acts as the Facade for that
feature. Components never touch HTTP services directly — they call the Facade, which manages async
state transitions via `patchState`.

### Atomic Design

Shared UI components follow the Atomic Design hierarchy:

```
atoms → molecules → organisms → templates
```

Feature-specific components live exclusively inside their feature folder.

### Facade + Config Bridge

Features are **fully decoupled** from the host application. A `Config Bridge` (`InjectionToken` +
`provide*` factory) allows the host to supply runtime configuration without the feature knowing
anything about its environment.

---

## Directory Structure

```
sample-fe/
├── .github/
│   ├── copilot-instructions.md          # Global AI agent rules
│   └── instructions/
│       ├── angular.instructions.md      # Component & template standards
│       ├── features.instructions.md     # Feature architecture
│       ├── models-dtos.instructions.md  # DTOs, models & mappers
│       ├── state-observability.instructions.md
│       ├── styling.instructions.md      # SCSS + BEM
│       ├── testing.instructions.md      # Vitest + ATL
│       └── typescript.instructions.md  # TS strict standards
├── src/
│   ├── app/
│   │   ├── core/                        # App-wide singletons (guards, interceptors, observability)
│   │   ├── features/                    # Self-contained feature modules
│   │   │   └── <feature-name>/
│   │   │       ├── components/
│   │   │       ├── models/
│   │   │       ├── <feature>.facade.ts
│   │   │       ├── <feature>.config.ts
│   │   │       ├── <feature>.routes.ts
│   │   │       └── index.ts
│   │   ├── models/                      # Shared domain models + DTOs + mappers
│   │   │   └── index.ts
│   │   └── shared/
│   │       └── components/
│   │           ├── atoms/
│   │           ├── molecules/
│   │           ├── organisms/
│   │           └── templates/
│   ├── styles/                          # Global SCSS tokens, reset, typography
│   │   ├── _tokens.scss
│   │   ├── _breakpoints.scss
│   │   ├── _reset.scss
│   │   ├── _typography.scss
│   │   └── _index.scss
│   ├── index.html
│   ├── main.ts
│   └── styles.scss
├── ARCHITECTURE.md
├── angular.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.spec.json
└── package.json
```

---

## Path Aliases

Import using aliases at all times. Deep relative paths across boundaries are forbidden.

| Alias                   | Resolves to                                    |
| ----------------------- | ---------------------------------------------- |
| `@components/atoms`     | `src/app/shared/components/atoms/index.ts`     |
| `@components/molecules` | `src/app/shared/components/molecules/index.ts` |
| `@components/organisms` | `src/app/shared/components/organisms/index.ts` |
| `@components/templates` | `src/app/shared/components/templates/index.ts` |
| `@features/*`           | `src/app/features/*/index.ts`                  |
| `@models`               | `src/app/models/index.ts`                      |
| `@core`                 | `src/app/core/index.ts`                        |

Configure in `tsconfig.json`:

```jsonc
{
  "compilerOptions": {
    "paths": {
      "@components/atoms": ["src/app/shared/components/atoms/index.ts"],
      "@components/molecules": ["src/app/shared/components/molecules/index.ts"],
      "@components/organisms": ["src/app/shared/components/organisms/index.ts"],
      "@components/templates": ["src/app/shared/components/templates/index.ts"],
      "@features/*": ["src/app/features/*/index.ts"],
      "@models": ["src/app/models/index.ts"],
      "@core": ["src/app/core/index.ts"],
    },
  },
}
```

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

| File                                  | Applied to                          | Governs                                     |
| ------------------------------------- | ----------------------------------- | ------------------------------------------- |
| `copilot-instructions.md`             | All files                           | Global agent workflow and execution mandate |
| `typescript.instructions.md`          | `**/*.ts`                           | TS strict standards, immutability, naming   |
| `angular.instructions.md`             | `**/*.ts`, `**/*.html`, `**/*.scss` | Component architecture, templates, a11y     |
| `features.instructions.md`            | `src/app/features/**`               | Facade pattern, Config Bridge, routing      |
| `state-observability.instructions.md` | `**/*.ts`                           | NgRx Signal Store, error handling           |
| `models-dtos.instructions.md`         | `**/*.ts`                           | DTOs, domain models, mappers                |
| `styling.instructions.md`             | `**/*.scss`                         | SCSS, BEM, tokens, units                    |
| `testing.instructions.md`             | `**/*.spec.ts`                      | Vitest, ATL, query priority, mocking        |

---

## Contributing

1. Create a feature branch from `main`: `git checkout -b feat/<ticket>-description`
2. Make your changes.
3. Run the full pipeline: format → lint → typecheck → test → build.
4. Open a pull request — all pipeline steps must be green before review.

> All contributions must adhere to the standards described in the `.github/instructions/` files.
