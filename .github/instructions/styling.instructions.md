---
applyTo: '**/*.scss'
---

# Styling Standards — Sample-FE (SCSS + BEM)

These rules govern every `.scss` file in the project. Violations that cannot be auto-fixed by
Prettier must be resolved manually before the file is committed.

---

## 1. Technology Constraints

| Allowed                                   | Forbidden                                                        |
| ----------------------------------------- | ---------------------------------------------------------------- |
| SCSS (`.scss` files only)                 | Plain CSS (`.css`)                                               |
| BEM naming methodology                    | Utility-class frameworks (Tailwind, UnoCSS, Bootstrap utilities) |
| CSS custom properties (`var(--token)`)    | Inline `style` attributes set from TypeScript                    |
| Angular component encapsulation (`:host`) | Global class overrides that pierce encapsulation                 |

---

## 2. BEM Naming

Use the **Block\_\_Element--Modifier** pattern consistently. Blocks map 1-to-1 to Angular
components; the `:host` selector **is** the block root.

```scss
// ✅ Correct — BEM with :host as block root
:host {
  display: block;
}

.user-card {
  padding: 1rem;

  &__avatar {
    border-radius: 50%;
    width: 3rem;
    height: 3rem;
  }

  &__name {
    font-weight: 700;
    font-size: 1rem;
  }

  &__name--highlighted {
    color: var(--color-accent);
  }

  &__badge {
    display: inline-flex;
    align-items: center;

    &--success {
      background-color: var(--color-success-subtle);
    }
    &--error {
      background-color: var(--color-error-subtle);
    }
  }
}
```

```html
<!-- ✅ Matching template -->
<article class="user-card">
  <img class="user-card__avatar" [src]="avatar()" [alt]="user().displayName" />
  <span class="user-card__name user-card__name--highlighted">{{ user().displayName }}</span>
  <span class="user-card__badge user-card__badge--success">Verified</span>
</article>
```

### BEM rules

| Rule                        | Detail                                                                       |
| --------------------------- | ---------------------------------------------------------------------------- |
| Block = component           | One BEM block per component; name matches the component's default CSS class. |
| Elements separated by `__`  | `.card__title`, `.card__body`                                                |
| Modifiers separated by `--` | `.card__title--truncated`, `.card--loading`                                  |
| No element of element       | `.card__header__title` is **forbidden**; use `.card__title` instead.         |
| No ID selectors             | `#id` selectors are forbidden in component styles.                           |

---

## 3. CSS Custom Properties (Design Tokens)

All design tokens are declared on `:root` in `src/styles/_tokens.scss` and consumed everywhere
via `var(--token-name)`. **Hard-coded colour or spacing values are forbidden** outside the tokens
file itself.

```scss
// src/styles/_tokens.scss
// #region Colour Tokens
:root {
  --color-primary: #1a56db;
  --color-primary-hover: #1648c5;
  --color-accent: #0ea5e9;
  --color-surface: #ffffff;
  --color-surface-subtle: #f8fafc;
  --color-text-primary: #0f172a;
  --color-text-secondary: #64748b;
  --color-error: #dc2626;
  --color-error-subtle: #fee2e2;
  --color-success: #16a34a;
  --color-success-subtle: #dcfce7;
  --color-border: #e2e8f0;
}
// #endregion Colour Tokens

// #region Spacing Tokens
:root {
  --space-1: 0.25rem; /*  4px */
  --space-2: 0.5rem; /*  8px */
  --space-3: 0.75rem; /* 12px */
  --space-4: 1rem; /* 16px */
  --space-6: 1.5rem; /* 24px */
  --space-8: 2rem; /* 32px */
  --space-12: 3rem; /* 48px */
  --space-16: 4rem; /* 64px */
}
// #endregion Spacing Tokens

// #region Typography Tokens
:root {
  --font-family-base: 'Inter', system-ui, sans-serif;
  --font-family-mono: 'JetBrains Mono', 'Fira Code', monospace;

  --font-size-xs: 0.75rem; /* 12px */
  --font-size-sm: 0.875rem; /* 14px */
  --font-size-base: 1rem; /* 16px */
  --font-size-lg: 1.125rem; /* 18px */
  --font-size-xl: 1.25rem; /* 20px */
  --font-size-2xl: 1.5rem; /* 24px */
  --font-size-3xl: 1.875rem; /* 30px */
  --font-size-4xl: 2.25rem; /* 36px */

  --line-height-tight: 1.25;
  --line-height-normal: 1.5;
  --line-height-loose: 1.75;

  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
}
// #endregion Typography Tokens

// #region Radius Tokens
:root {
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-full: 9999rem;
}
// #endregion Radius Tokens

// #region Shadow Tokens
:root {
  --shadow-sm: 0 0.0625rem 0.125rem 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 0.25rem 0.375rem -0.0625rem rgb(0 0 0 / 0.1);
  --shadow-lg: 0 0.625rem 0.9375rem -0.1875rem rgb(0 0 0 / 0.1);
}
// #endregion Shadow Tokens
```

---

## 4. Units — `rem` Exclusively

All length values **must** use `rem`. Pixel (`px`) values are forbidden in component and feature
styles. Convert using the formula: $rem = px \div 16$.

| `px` value | `rem` equivalent |
| ---------- | ---------------- |
| `1px`      | `0.0625rem`      |
| `2px`      | `0.125rem`       |
| `4px`      | `0.25rem`        |
| `8px`      | `0.5rem`         |
| `16px`     | `1rem`           |
| `24px`     | `1.5rem`         |
| `48px`     | `3rem`           |

```scss
// ✅ Correct
.card__border {
  border-width: 0.0625rem;
  border-radius: var(--radius-md);
}

// ❌ Forbidden — px units
.card__border {
  border-width: 1px;
  border-radius: 8px;
}
```

> **Exception:** `border: 0` (unitless zero) is permitted. Media query breakpoints use `em`
> because zooming behaviour differs from `rem` in some browsers.

---

## 5. Mobile-First Responsive Design

Base styles target the smallest (mobile) viewport. Larger viewports are enhanced with
`min-width` breakpoints. Breakpoint tokens are defined in `src/styles/_breakpoints.scss`.

```scss
// src/styles/_breakpoints.scss
// #region Breakpoint Tokens
:root {
  --bp-sm: 36em; /*  576px */
  --bp-md: 48em; /*  768px */
  --bp-lg: 64em; /* 1024px */
  --bp-xl: 80em; /* 1280px */
  --bp-2xl: 96em; /* 1536px */
}

// SCSS variables for use in @media queries
$bp-sm: 36em;
$bp-md: 48em;
$bp-lg: 64em;
$bp-xl: 80em;
$bp-2xl: 96em;
// #endregion Breakpoint Tokens
```

```scss
// ✅ Correct — mobile-first
.nav {
  flex-direction: column; // mobile default

  @media (min-width: $bp-md) {
    flex-direction: row; // tablet and above
  }
}

// ❌ Forbidden — desktop-first (max-width)
.nav {
  flex-direction: row;

  @media (max-width: $bp-md) {
    flex-direction: column;
  }
}
```

---

## 6. File Structure & Regions

Every `.scss` file **must** use `// #region` / `// #endregion` markers.

### Component file template

```scss
// #region Host / Layout
:host {
  display: block;
}
// #endregion Host / Layout

// #region BEM — <block-name>
.block {
  // ...

  &__element { ... }
  &__element--modifier { ... }
}
// #endregion BEM — <block-name>

// #region Responsive
@media (min-width: $bp-md) {
  .block { ... }
}
// #endregion Responsive

// #region Animations
@keyframes fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
// #endregion Animations
```

### Global / shared file template

```scss
// src/styles/_buttons.scss

// #region Base Button
.btn { ... }
// #endregion Base Button

// #region Variants
.btn--primary { background-color: var(--color-primary); }
.btn--ghost   { background-color: transparent; }
// #endregion Variants

// #region Sizes
.btn--sm { padding: var(--space-1) var(--space-2); font-size: var(--font-size-sm); }
.btn--lg { padding: var(--space-3) var(--space-6); font-size: var(--font-size-lg); }
// #endregion Sizes
```

---

## 7. Global Style Architecture

```
src/styles/
├── _tokens.scss        # CSS custom properties (:root) — colours, spacing, type, radius, shadow
├── _breakpoints.scss   # Breakpoint SCSS variables + :root tokens
├── _reset.scss         # Minimal CSS reset / normalize
├── _typography.scss    # Body, heading, and utility text styles
├── _buttons.scss       # Global button base styles (no component-specific overrides)
├── _forms.scss         # Global form element base styles
├── _animations.scss    # Shared @keyframes
└── _index.scss         # Forwards all partials (used by angular.json stylePreprocessorOptions)
```

`src/styles.scss` (root) imports `_index.scss` and declares no styles of its own.

```scss
// src/styles.scss
@use 'styles/index' as *;
```
