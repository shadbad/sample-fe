---
applyTo: '**/*.ts,**/*.html,**/*.scss'
---

# Angular Component & Template Standards — Sample-FE (v19+)

These rules govern every Angular component, directive, pipe, and template in the project.
They are calibrated for **Angular 19**, **Standalone**, **Zoneless**, and **Signals-first** development.

---

## 1. Component Architecture

### 1.1 Standalone by default

Every component, directive, and pipe **must** be standalone. `NgModule` is forbidden for new code.

```ts
// ✅ Correct
@Component({
  selector: 'app-user-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-card.component.html',
  styleUrl: './user-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserCardComponent { ... }
```

### 1.2 Always `OnPush`

`ChangeDetectionStrategy.OnPush` is **mandatory**. Default change detection is forbidden.

### 1.3 Dependency injection via `inject()`

Never use constructor-based injection. Use `inject()` at the field level.

```ts
// ✅ Correct
export class UserCardComponent {
  readonly #userFacade = inject(UserFacade);
}

// ❌ Forbidden — constructor injection
export class UserCardComponent {
  constructor(private readonly userFacade: UserFacade) {}
}
```

### 1.4 Signal Inputs, Outputs, and Models

| API                   | Usage                   |
| --------------------- | ----------------------- |
| `input<T>()`          | Optional typed input    |
| `input.required<T>()` | Mandatory typed input   |
| `output<T>()`         | Typed event emitter     |
| `model<T>()`          | Two-way bindable signal |

```ts
// ✅ Correct
export class UserCardComponent {
  /** The user to display. */
  readonly user = input.required<UserDto>();

  /** Emits when the card's action button is clicked. */
  readonly actionClick = output<string>();

  /** Controls the expanded state via two-way binding. */
  readonly expanded = model(false);
}

// ❌ Forbidden — legacy decorator-based I/O
@Input() user!: UserDto;
@Output() actionClick = new EventEmitter<string>();
```

### 1.5 No empty lifecycle hooks

Only implement a lifecycle hook when the body contains real logic.

```ts
// ❌ Forbidden — empty hook
ngOnInit(): void {}

// ❌ Forbidden — trivial hook that adds no value
ngOnDestroy(): void {
  // nothing
}
```

### 1.6 Atomic placement

Place every component at the correct atomic tier under `src/app/shared/components/`:

```
atoms/       → single-responsibility primitives with no child component deps
molecules/   → compose atoms only
organisms/   → compose atoms + molecules; may hold local UI state
templates/   → layout shells with <ng-content> slots; zero business logic
```

Feature-specific components live inside their feature folder and are **never** placed in `shared/`.

---

## 2. Template Standards

### 2.1 Minimal DOM — no unnecessary wrappers

```html
<!-- ✅ Correct — flat structure -->
<section class="user-list">
  @for (user of users(); track user.id) {
  <app-user-card [user]="user" />
  }
</section>

<!-- ❌ Forbidden — gratuitous div wrapper -->
<div>
  <section class="user-list">
    <div>@for (user of users(); track user.id) { ... }</div>
  </section>
</div>
```

### 2.2 Control flow — new syntax only

Use `@if`, `@for`, `@switch` exclusively. `*ngIf`, `*ngFor`, and `*ngSwitch` are **forbidden**.

```html
<!-- ✅ @if -->
@if (isLoggedIn()) {
<app-dashboard />
} @else {
<app-login />
}

<!-- ✅ @for with mandatory track -->
@for (item of items(); track item.id) {
<app-item-row [item]="item" />
} @empty {
<p i18n="@@shared.list.empty">No items found.</p>
}

<!-- ✅ @switch -->
@switch (status()) { @case ('idle') { <app-idle-state /> } @case ('loading') { <app-spinner /> }
@case ('error') { <app-error-banner /> } }

<!-- ❌ Forbidden -->
<div *ngIf="isLoggedIn()">...</div>
<li *ngFor="let item of items()">...</li>
```

### 2.3 No method calls in templates

Method calls in templates re-execute on every render cycle. Use `computed()` instead.

```ts
// ✅ Correct — computed signal
readonly fullName = computed(() => `${this.user().firstName} ${this.user().lastName}`);
```

```html
<!-- ✅ Correct — signal getter -->
<span>{{ fullName() }}</span>

<!-- ❌ Forbidden — method call in template -->
<span>{{ getFullName() }}</span>
```

### 2.4 Self-closing tags for components with no projected content

```html
<!-- ✅ Correct -->
<app-spinner />
<app-user-avatar [user]="user()" />

<!-- ❌ Unnecessary closing tag -->
<app-spinner></app-spinner>
```

### 2.5 No `data-testid` or `id` attributes for testing

Tests must rely on **accessible roles, labels, and visible text** (Angular Testing Library / ARIA).
Adding test-only attributes pollutes the DOM and couples tests to implementation details.

```html
<!-- ❌ Forbidden -->
<button data-testid="submit-btn">Submit</button>

<!-- ✅ Correct — discoverable by role + accessible name -->
<button type="submit" i18n="@@auth.login.submit">Sign in</button>
```

---

## 3. Accessibility (A11y)

### 3.1 Click targets must also respond to keyboard

Every element with a `(click)` handler must have a matching keyboard listener **unless** it is a
natively interactive element (`<button>`, `<a>`, `<input>`, etc.).

```html
<!-- ✅ Natively interactive — keyboard handled by browser -->
<button type="button" (click)="toggle()">Toggle</button>

<!-- ✅ ARIA role + keyboard listener on non-interactive element -->
<div
  role="button"
  tabindex="0"
  (click)="toggle()"
  (keydown.enter)="toggle()"
  (keydown.space)="toggle()"
>
  Toggle
</div>

<!-- ❌ Forbidden — click without keyboard support on a div -->
<div (click)="toggle()">Toggle</div>
```

### 3.2 All interactive elements must be focusable

Ensure `tabindex="0"` is present on custom interactive elements that lack native focus management.

### 3.3 Images require `alt` text

```html
<!-- ✅ Correct -->
<img [src]="avatar()" [alt]="user().displayName" />

<!-- ✅ Decorative image -->
<img src="decoration.svg" alt="" aria-hidden="true" />

<!-- ❌ Forbidden — missing alt -->
<img [src]="avatar()" />
```

---

## 4. SCSS / BEM Component Styles

- Use `:host` as the BEM **block** root — never add a wrapper element solely to scope styles.
- Follow `block__element--modifier` naming strictly.
- Use `$localize` / `i18n` attributes; never inline display strings.

```scss
// #region Host / Layout
:host {
  display: block;
}
// #endregion Host / Layout

// #region BEM — user-card
.user-card {
  &__avatar {
    border-radius: 50%;
  }
  &__name {
    font-weight: 700;
  }
  &__name--highlighted {
    color: var(--color-accent);
  }
}
// #endregion BEM — user-card
```

---

## 5. Async Data — `resource()`

Use Angular's `resource()` for any async data that maps to a loading / error / value lifecycle.

```ts
// ✅ Correct — resource for async data
export class UserProfileComponent {
  readonly userId = input.required<string>();

  readonly #userService = inject(UserService);

  /** Reactive resource that reloads whenever userId changes. */
  readonly userResource = resource({
    request: () => ({ id: this.userId() }),
    loader: ({ request }) => this.#userService.findById(request.id),
  });
}
```

```html
@if (userResource.isLoading()) {
<app-skeleton />
} @else if (userResource.error()) {
<app-error-banner />
} @else {
<app-user-card [user]="userResource.value()!" />
}
```

---

## 6. i18n \u2014 ngx-translate

This project uses **`ngx-translate`** exclusively. Angular's built-in compiler i18n is **forbidden**.

| Forbidden                                            | Reason                                                           |
| ---------------------------------------------------- | ---------------------------------------------------------------- |
| `i18n="..."` attribute                               | Angular compiler pipeline \u2014 incompatible with ngx-translate |
| `i18n-*` attribute variants (e.g. `i18n-aria-label`) | Same reason                                                      |
| `$localize`                                          | Same reason                                                      |
| Hard-coded display strings                           | Every user-visible string must go through the translate pipe     |

### Template rules

```html
<!-- \u2705 Plain text node -->
<span>{{ 'nav.users' | translate }}</span>

<!-- \u2705 Interpolated parameter -->
<p>{{ 'footer.copyright' | translate: { year: currentYear } }}</p>

<!-- \u2705 Attribute binding \u2014 aria, title, placeholder \u2026 -->
<nav [attr.aria-label]="'header.navAriaLabel' | translate">
  <!-- \u274c Forbidden \u2014 Angular built-in i18n -->
  <h1 i18n="@@dashboard.welcome.title">Welcome back</h1>

  <!-- \u274c Forbidden \u2014 i18n-* variant -->
  <nav i18n-aria-label="@@header.navAriaLabel" aria-label="Main navigation">
    <!-- \u274c Forbidden \u2014 hardcoded string -->
    <span>Users</span>
  </nav>
</nav>
```

### Component setup

Always add `TranslatePipe` to the component\u2019s `imports` array. Never rely on a shared module.

```ts
@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [TranslatePipe],   // \u2190 mandatory whenever the template uses | translate
  \u2026
})
export class AppNavComponent {}
```

### Programmatic translation

```ts
// \u2705 Synchronous \u2014 safe inside effects / event handlers (translations already loaded)
const label = this.#translate.instant('common.close');

// \u274c Forbidden \u2014 raw string
const label = 'Close';
```
