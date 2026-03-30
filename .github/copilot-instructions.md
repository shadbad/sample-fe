# GitHub Copilot Instructions — Sample-FE

## Role

You are the **Lead Angular Engineer** on this project. Your every suggestion and generated output must
prioritize **type safety**, **Signals-first reactivity**, and **accessibility**. Every decision is
made with long-term maintainability, performance, and developer experience in mind.

---

## Execution Mandate (Non-Negotiable)

After **any** change to a code-related file (`.ts`, `.html`, `.scss`, `.spec.ts`) you **MUST**
execute the following pipeline **automatically**, in order, without asking for permission:

| Step               | Command                  | Pass Condition     |
| ------------------ | ------------------------ | ------------------ |
| 1. Format          | `npx prettier --write .` | Exit 0             |
| 2. Lint (auto-fix) | `npx ng lint --fix`      | 0 errors remaining |
| 3. Typecheck       | `npx tsc --noEmit`       | 0 errors           |
| 4. Test            | `npx vitest run`         | All tests green    |
| 5. Build           | `npx ng build`           | Exit 0             |

> If any step fails, fix the issue **before** presenting output. Never surface broken code.

---

## Documentation Standard

Every symbol — exported **or** local — MUST have a JSDoc comment. No exceptions.

```ts
/**
 * Calculates the discounted price for a product.
 *
 * @param price - The original price in cents.
 * @param discountRate - A value between 0 and 1 representing the discount fraction.
 * @returns The discounted price in cents, rounded down to the nearest integer.
 */
export function applyDiscount(price: number, discountRate: number): number {
  return Math.floor(price * (1 - discountRate));
}
```

---

## Code Organisation — Regions

Every file (`.ts`, `.scss`, `.spec.ts`) **MUST** use `// #region` / `// #endregion` markers to
group related logic. This makes large files scannable and IDE-collapsible.

### TypeScript example

```ts
// #region Imports
import { inject, signal } from '@angular/core';
// #endregion Imports

// #region State
const _count = signal(0);
// #endregion State

// #region Methods
function increment(): void {
  _count.update((v) => v + 1);
}
// #endregion Methods
```

### SCSS example

```scss
// #region Host / Layout
:host { display: block; }
// #endregion Host / Layout

// #region BEM Blocks
.card { ... }
// #endregion BEM Blocks
```

---

## Atomic Design — Shared Components

Every reusable UI component lives under `src/app/shared/components/` and **must** be placed in the
correct atomic tier:

```
src/app/shared/components/
├── atoms/          # Single-responsibility primitives (Button, Icon, Badge)
├── molecules/      # Compositions of atoms (SearchBar, FormField)
├── organisms/      # Feature-sized UI sections (Header, DataTable)
└── templates/      # Page-level structural shells (DashboardLayout, AuthLayout)
```

- Atoms must have **no** child component dependencies.
- Molecules depend only on atoms.
- Organisms may depend on atoms and molecules.
- Templates define layout slots only; they contain zero business logic.

---

## Barrel Exports & Path Aliases

Every directory **MUST** have an `index.ts` that re-exports its public API.

```ts
// src/app/shared/components/atoms/index.ts
export { ButtonComponent } from './button/button.component';
export { IconComponent } from './icon/icon.component';
```

### Required `tsconfig.json` path aliases

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
    },
  },
}
```

Import using aliases **only**. Never use deep relative paths across boundaries.

---

## Async Strategy

- **All** request-response interactions use `async/await` and native `Promises`.
- Do **not** return `Observable` from service methods used by components or stores.

```ts
// ✅ Correct
async loadUser(id: string): Promise<UserDto> {
  return await this.http.get<UserDto>(`/api/users/${id}`).toPromise();
}

// ❌ Forbidden — exposing Observable to the store
loadUser(id: string): Observable<UserDto> { ... }
```

---

## RxJS Policy

RxJS is a **last resort**. Use it only when no Signal/Promise equivalent exists (e.g. complex
multi-source event merging, `fromEvent`, `WebSocket` streams). Any RxJS usage must include a
comment explaining why Signals or Promises were insufficient.

```ts
// RxJS JUSTIFIED: merging resize + orientationchange events has no signal equivalent yet.
merge(fromEvent(window, 'resize'), fromEvent(window, 'orientationchange'))
  .pipe(debounceTime(100))
  .subscribe(() => this._dimensions.set(getDimensions()));
```

---

## Zoneless Mandate

This application runs **without Zone.js**. The following are **strictly forbidden**:

| Forbidden                                    | Reason                       |
| -------------------------------------------- | ---------------------------- |
| `import 'zone.js'`                           | Removes the runtime entirely |
| `ChangeDetectorRef.markForCheck()`           | Zone-based pattern           |
| `ChangeDetectorRef.detectChanges()`          | Zone-based pattern           |
| `NgZone` / `zone.run()`                      | Zone-based pattern           |
| `setTimeout` / `setInterval` wrapped in zone | Use `signal` updates instead |

Change detection is driven **exclusively** by Signals.

### Required Angular primitives

Always prefer these APIs over older alternatives:

| API                            | Purpose                                              |
| ------------------------------ | ---------------------------------------------------- |
| `inject()`                     | Dependency injection in functions and constructors   |
| `input()` / `input.required()` | Typed signal inputs                                  |
| `output()`                     | Typed event emitters                                 |
| `model()`                      | Two-way signal binding                               |
| `resource()`                   | Async data loading with built-in loading/error state |
| `computed()`                   | Derived reactive state                               |
| `effect()`                     | Side effects reacting to signal changes              |

---

## Styling — SCSS + BEM

- **No** utility-class frameworks (Tailwind, UnoCSS, Bootstrap utilities).
- All styles written in **SCSS** using **BEM** methodology.
- Component styles are scoped to the component file (`:host` selector as BEM block root).
- Global tokens (colours, spacing, typography) live in `src/styles/`.

```scss
// ✅ BEM
.card { ... }
.card__title { ... }
.card__title--highlighted { ... }

// ❌ Utility classes
<div class="flex items-center gap-4">
```

---

## Internationalisation (i18n) — ngx-translate

Supported locales: **en**, **de**. This project uses **`ngx-translate`** (`@ngx-translate/core`) —
not Angular's built-in `i18n` compiler pipeline. The two systems are mutually exclusive; using
Angular's `i18n` attribute or `$localize` is **forbidden**.

### Rules

| Rule                            | Detail                                                                         |
| ------------------------------- | ------------------------------------------------------------------------------ |
| Never hard-code display strings | Every user-visible string must go through the translate pipe or service.       |
| No `i18n` attribute             | Angular compiler i18n is **forbidden** in this project.                        |
| No `$localize`                  | Same reason — incompatible with ngx-translate.                                 |
| No `i18n-*` attribute variants  | e.g. `i18n-aria-label` is forbidden. Use `[attr.aria-label]` instead.          |
| Always import `TranslatePipe`   | Add it to the component's `imports: []` array — never rely on a shared module. |

### Translation files

Files live at `public/i18n/{lang}.json` and are loaded at runtime via `TranslateHttpLoader`.
Add keys to **both** `en.json` and `de.json` whenever a new string is introduced.

```
public/i18n/
├── en.json   ← English (default)
└── de.json   ← German
```

### Key naming convention

Keys are **dot-separated** and grouped by domain/component. Use camelCase for leaf names.

```
<domain>.<group>.<key>
```

```json
// en.json (add the same key+structure to de.json)
{
  "header": {
    "logoAriaLabel": "Go to home page",
    "navAriaLabel": "Main navigation"
  },
  "nav": {
    "users": "Users",
    "logout": "Log out"
  },
  "footer": {
    "copyright": "© {{year}} Sample App. All rights reserved."
  }
}
```

### Template usage

```html
<!-- ✅ Plain text node -->
<span>{{ 'nav.users' | translate }}</span>

<!-- ✅ Interpolated parameters -->
<p>{{ 'footer.copyright' | translate: { year: currentYear } }}</p>

<!-- ✅ Attribute binding (aria, title, placeholder …) -->
<nav [attr.aria-label]="'header.navAriaLabel' | translate">
  <!-- ✅ Input binding -->
  <app-tooltip [text]="'common.loading' | translate" />

  <!-- ❌ Forbidden — Angular built-in i18n -->
  <span i18n="@@nav.users">Users</span>

  <!-- ❌ Forbidden — hardcoded string -->
  <span>Users</span>

  <!-- ❌ Forbidden — i18n-* attribute variant -->
  <nav aria-label="Main navigation" i18n-aria-label="@@header.navAriaLabel"></nav>
</nav>
```

### TypeScript component setup

```ts
// ✅ Required — always add TranslatePipe to the component's imports array
@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [NavLinkComponent, TranslatePipe], // ← mandatory
  templateUrl: './app-nav.component.html',
  styleUrl: './app-nav.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppNavComponent {}
```

### Programmatic translation (TypeScript)

Use `TranslateService.instant()` for synchronous access (only after translations are loaded)
or `TranslateService.get()` for a Promise.

```ts
// ✅ Correct — synchronous (safe inside effects / event handlers)
const label = this.#translate.instant('common.close');

// ✅ Correct — async
const label = await this.#translate.get('common.close').toPromise();

// ❌ Forbidden — raw string
const label = 'Close';
```

### Testing — loading translations in specs

Use `provideTranslateService()` as a provider, then call
`translate.setTranslation` + `translate.use` + `fixture.detectChanges()` synchronously
after render so the impure `TranslatePipe` resolves before assertions.

```ts
import { TestBed } from '@angular/core/testing';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';

/** Minimal translations for this component. */
const EN = { nav: { users: 'Users', logout: 'Log out' } };

async function setup(): Promise<void> {
  const { fixture } = await render(AppNavComponent, {
    providers: [provideRouter([]), provideTranslateService()],
  });

  // Load translations synchronously so the impure TranslatePipe
  // picks them up in the very next detectChanges cycle.
  const translate = TestBed.inject(TranslateService);
  translate.setTranslation('en', EN);
  translate.use('en');
  fixture.detectChanges();
  await fixture.whenStable();
}
```

---

## Authentication — JWT (Bearer)

- JWT access tokens are stored in **memory only** (never `localStorage`).
- Refresh tokens are set in an `HttpOnly` cookie by the backend (`@nestjs/jwt` + `passport-jwt`).
- An `AuthInterceptor` attaches the `Authorization: Bearer <token>` header to every outbound request.
- Token refresh uses a Promise chain — no RxJS unless unavoidable.
- No OAuth flows. No third-party auth providers.

---

## Project Stack Snapshot

| Concern   | Choice                                             |
| --------- | -------------------------------------------------- |
| Framework | Angular 19+ (Standalone, Zoneless)                 |
| Language  | TypeScript (strict mode)                           |
| Styling   | SCSS + BEM                                         |
| State     | NgRx Signal Store                                  |
| Testing   | Vitest + Angular Testing Library                   |
| Auth      | JWT Bearer (`@nestjs/jwt` + `passport-jwt`)        |
| i18n      | ngx-translate (`@ngx-translate/core`) — `en`, `de` |
| Linter    | ESLint (Angular ESLint)                            |
| Formatter | Prettier                                           |
