// #region Imports
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import type { ToastEntry, ToastLevel } from './toast.model';
// #endregion Imports

// #region State Shape

/** Internal state shape for {@link ToastStore}. */
interface ToastState {
  /** Ordered list of active toast notifications. Newest entries are appended. */
  readonly toasts: readonly ToastEntry[];
}

/** Default empty state for {@link ToastStore}. */
const initialState: ToastState = { toasts: [] };
// #endregion State Shape

// #region Duration Defaults

/**
 * Default auto-dismiss durations (ms) per severity level.
 * `warning` and `error` are sticky (`0`) so the user must explicitly dismiss them.
 */
const DEFAULT_DURATION: Readonly<Record<ToastLevel, number>> = {
  subtle: 5_000,
  info: 5_000,
  warning: 0,
  error: 0,
};
// #endregion Duration Defaults

/**
 * Signal Store that manages the lifecycle of toast notifications.
 *
 * **Producer:** {@link LogService} calls `push()` whenever a log entry includes a `toastKey`.
 * **Consumer:** `ToastContainerComponent` reads `toasts` to render the active list.
 *
 * @example
 * const store = inject(ToastStore);
 * store.push({ message: 'Saved!', level: 'info' });
 * store.dismiss(id);
 */
export const ToastStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),

  // #region Methods
  withMethods((store) => ({
    /**
     * Appends a new toast to the queue and, when `durationMs > 0`,
     * schedules its automatic removal.
     *
     * `setTimeout` is used intentionally here: it does not require Zone.js
     * integration because the resulting state mutation is a Signal update
     * that drives `OnPush` change detection directly.
     *
     * @param payload - Message, level, and an optional custom duration override.
     */
    push(payload: Pick<ToastEntry, 'message' | 'level'> & { readonly durationMs?: number }): void {
      const id = crypto.randomUUID();
      const durationMs = payload.durationMs ?? DEFAULT_DURATION[payload.level];
      const entry: ToastEntry = { id, message: payload.message, level: payload.level, durationMs };

      patchState(store, (s) => ({ toasts: [...s.toasts, entry] }));

      if (durationMs > 0) {
        setTimeout(() => {
          patchState(store, (s) => ({
            toasts: s.toasts.filter((t) => t.id !== id),
          }));
        }, durationMs);
      }
    },

    /**
     * Removes a toast from the queue by its unique identifier.
     * Called both by the auto-dismiss timer and by user interaction (close button).
     *
     * @param id - UUID of the toast to remove.
     */
    dismiss(id: string): void {
      patchState(store, (s) => ({
        toasts: s.toasts.filter((t) => t.id !== id),
      }));
    },
  })),
  // #endregion Methods
);
