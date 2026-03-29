---
applyTo: '**/*.ts'
---

# State & Observability — Sample-FE

These rules govern how application state is modelled, mutated, and observed, and how errors and
telemetry are routed across the entire codebase.

---

## 1. State Management — NgRx Signal Store

### 1.1 When to use `signalStore`

Use `@ngrx/signals` `signalStore` for **any feature state** that:

- is shared across more than one component, or
- involves async loading / mutation with distinct `isLoading` / `error` lifecycle states, or
- needs to be reset, replayed, or persisted independently of a component tree.

For **purely local** UI state (e.g. a popover's open/close flag within a single component), a
plain `signal()` is preferred.

### 1.2 Standard store scaffold

```ts
// #region Imports
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { computed } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { OrderDto } from '@models';
import { OrderService } from './order.service';
import { ObservabilityService } from '@core/observability.service';
// #endregion Imports

// #region State Shape
/**
 * Internal state for the Order feature store.
 */
interface OrderState {
  /** All loaded orders, keyed by ID. */
  readonly entities: ReadonlyArray<OrderDto>;
  /** Whether an async operation is in progress. */
  readonly isLoading: boolean;
  /** The most recent error message, or null. */
  readonly error: string | null;
}

/** Default initial values for {@link OrderState}. */
const initialState: OrderState = {
  entities: [],
  isLoading: false,
  error: null,
};
// #endregion State Shape

// #region Store
/**
 * NgRx Signal Store (Facade) for the Order feature.
 * Exposes read-only signals and async mutation methods.
 */
export const OrderStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),

  // #region Computed
  withComputed(({ entities, isLoading, error }) => ({
    /** True when there are no orders and the store is not loading. */
    isEmpty: computed(() => !isLoading() && entities().length === 0),
    /** True when an error is present. */
    hasError: computed(() => error() !== null),
  })),
  // #endregion Computed

  // #region Methods
  withMethods((store) => {
    const service = inject(OrderService);
    const observability = inject(ObservabilityService);

    return {
      /**
       * Loads all orders for the authenticated user.
       * Routes errors through {@link ObservabilityService}.
       */
      async loadAll(): Promise<void> {
        patchState(store, { isLoading: true, error: null });
        try {
          const entities = await firstValueFrom(service.getAll());
          patchState(store, { entities, isLoading: false });
        } catch (err) {
          const message = observability.handleError(err, 'OrderStore.loadAll');
          patchState(store, { error: message, isLoading: false });
        }
      },

      /** Resets the store to its initial state. */
      reset(): void {
        patchState(store, initialState);
      },
    };
  }),
  // #endregion Methods
);
// #endregion Store
```

### 1.3 Store rules

| Rule                     | Detail                                                                                                         |
| ------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `patchState` only        | Never mutate state directly or assign to signals outside `patchState`.                                         |
| Read-only public surface | Expose computed / state signals as-is; never expose the store's `update` internals to consumers.               |
| One store per feature    | A feature owns exactly one store. Shared cross-feature data lives in a root-level store under `src/app/core/`. |
| `providedIn: 'root'`     | All stores are tree-shakeable singletons unless a feature explicitly requires a scoped instance (rare).        |

---

## 2. Async Strategy — `firstValueFrom` over `toPromise`

When you must bridge an `HttpClient` `Observable` to a `Promise`, use **`firstValueFrom`** from
`rxjs`. Never use the deprecated `.toPromise()`.

```ts
// ✅ Correct
import { firstValueFrom } from 'rxjs';

async findById(id: string): Promise<OrderDto> {
  return await firstValueFrom(this.http.get<OrderDto>(`/api/orders/${id}`));
}

// ❌ Deprecated
async findById(id: string): Promise<OrderDto> {
  return await this.http.get<OrderDto>(`/api/orders/${id}`).toPromise() as OrderDto;
}
```

> `firstValueFrom` throws `EmptyError` when the source completes without emitting. Wrap with
> `try/catch` and route to `ObservabilityService` accordingly.

---

## 3. RxJS Restriction

RxJS is a **last resort**. It is permitted **only** when Signals or `resource()` cannot model
the problem — for example:

- Merging multiple DOM-event streams (`fromEvent`, `merge`)
- `WebSocket` message streams
- Complex retry/backoff pipelines with `retryWhen` or `timer`

Every RxJS usage **must** be preceded by a comment explaining why Signals/Promises were
insufficient:

```ts
// RxJS JUSTIFIED: WebSocket frames emit continuously; resource() covers only request-response.
this.#ws$ = webSocket<PriceTickDto>(WS_URL).pipe(
  retry({ count: 5, delay: 2_000 }),
  takeUntilDestroyed(this.#destroyRef),
);
```

If RxJS is used inside a component, it **must** be subscribed with `takeUntilDestroyed()`
or managed by `toSignal()` to prevent memory leaks.

---

## 4. Error Handling — `ObservabilityService`

**All** errors must be routed through `ObservabilityService`. Never `console.error` or swallow
errors silently.

### 4.1 Service contract

```ts
// src/app/core/observability.service.ts

// #region Imports
import { Injectable, inject } from '@angular/core';
import { ErrorLoggingAdapter } from './adapters/error-logging.adapter';
// #endregion Imports

/**
 * Central error-handling and observability gateway.
 * All application errors MUST pass through this service.
 */
@Injectable({ providedIn: 'root' })
export class ObservabilityService {
  readonly #logger = inject(ErrorLoggingAdapter);

  /**
   * Records an error and returns a user-safe message string.
   *
   * @param err - The raw caught value (may be `unknown`).
   * @param context - A dot-separated identifier for where the error occurred (e.g. `'OrderStore.loadAll'`).
   * @returns A user-safe error message suitable for display in the UI.
   */
  handleError(err: unknown, context: string): string {
    const message = err instanceof Error ? err.message : String(err);
    this.#logger.log({ message, context, timestamp: Date.now() });
    return message;
  }
}
```

### 4.2 Usage in stores and services

```ts
// ✅ Correct — routed through ObservabilityService
try {
  const data = await firstValueFrom(this.http.get<OrderDto[]>('/api/orders'));
  patchState(store, { entities: data });
} catch (err) {
  const message = this.#observability.handleError(err, 'OrderStore.loadAll');
  patchState(store, { error: message });
}

// ❌ Forbidden — silent swallow
try {
  ...
} catch {
  // ignored
}

// ❌ Forbidden — raw console
} catch (err) {
  console.error(err);
}
```

---

## 5. Observability Scopes

When integrating structured logging or tracing, use `createScope` to define a **single, typed
scope constant per class field**. Call `createScope` exactly once per field — never inline it
inside methods.

```ts
// #region Scopes
/** Observability scope for the OrderStore. */
const SCOPE = createScope('OrderStore');
// #endregion Scopes

export const OrderStore = signalStore(
  withMethods((store) => {
    const observability = inject(ObservabilityService);

    return {
      async loadAll(): Promise<void> {
        // SCOPE is referenced, never redefined here
        observability.trace(SCOPE, 'loadAll.start');
        ...
        observability.trace(SCOPE, 'loadAll.complete');
      },
    };
  }),
);
```

### Scope rules

| Rule                                   | Detail                                                                                           |
| -------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **One `createScope` per logical unit** | One constant per store / service / component — not one per method.                               |
| **Module-level constant**              | Declare outside the `signalStore(...)` call, in the `// #region Scopes` block.                   |
| **Naming**                             | Match the class / store name exactly: `createScope('OrderStore')`, `createScope('AuthService')`. |
