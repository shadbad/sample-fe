// #region Imports
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ToastStore } from '../../../core/toast/toast.store';
import { ToastItemComponent } from './molecules/toast-item/toast-item.component';
// #endregion Imports

/**
 * Organism component that hosts the live region for all active toast notifications.
 *
 * Reads the `toasts` signal from {@link ToastStore} and renders each entry via
 * {@link ToastItemComponent}. Mounted **once** as the last child of the root template
 * (`app.html`) so it overlays the entire application.
 *
 * @example
 * ```html
 * <!-- app.html -->
 * <router-outlet />
 * <app-toast-container />
 * ```
 */
@Component({
  selector: 'app-toast-container',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ToastItemComponent, TranslatePipe],
  templateUrl: './toast-container.component.html',
  styleUrl: './toast-container.component.scss',
})
export class ToastContainerComponent {
  // #region Dependencies
  readonly #toastStore = inject(ToastStore);
  // #endregion Dependencies

  // #region State

  /** Live signal of active toasts — drives the `@for` loop in the template. */
  readonly toasts = this.#toastStore.toasts;
  // #endregion State

  // #region Methods

  /**
   * Forwards a dismiss request to {@link ToastStore} when the user
   * clicks a toast's close button.
   *
   * @param id - UUID of the toast to remove.
   */
  onDismiss(id: string): void {
    this.#toastStore.dismiss(id);
  }
  // #endregion Methods
}
