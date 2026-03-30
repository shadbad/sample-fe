// #region Imports
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import type { ToastEntry, ToastLevel } from '../../../toast/toast.model';
// #endregion Imports

// #region Constants

/**
 * Maps each {@link ToastLevel} to the corresponding icomoon icon class.
 * `subtle` shares the `info` icon since there is no dedicated neutral icon.
 */
const LEVEL_ICON_MAP: Readonly<Record<ToastLevel, string>> = {
  subtle: 'icon-info',
  info: 'icon-info',
  warning: 'icon-warning',
  error: 'icon-error',
} as const;
// #endregion Constants

/**
 * Molecule component that renders a single toast notification.
 *
 * Displays the translated message, a level-specific border colour, and a
 * dismiss button. The parent organism is responsible for wiring the
 * `dismissed` output to {@link ToastStore}.
 *
 * @example
 * ```html
 * <app-toast-item [toast]="entry" (dismissed)="onDismiss($event)" />
 * ```
 */
@Component({
  selector: 'app-toast-item',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe],
  templateUrl: './toast-item.component.html',
  styleUrl: './toast-item.component.scss',
})
export class ToastItemComponent {
  // #region Inputs

  /** The toast entry to render. */
  readonly toast = input.required<ToastEntry>();
  // #endregion Inputs

  // #region Outputs

  /** Emitted with the toast `id` when the user clicks the dismiss button. */
  readonly dismissed = output<string>();
  // #endregion Outputs

  // #region State

  /**
   * Derived CSS class string for the icon element.
   * Combines the BEM element class with the appropriate icomoon icon class
   * for the current toast level.
   */
  readonly iconClass = computed(() => `toast-item__icon ${LEVEL_ICON_MAP[this.toast().level]}`);
  // #endregion State

  // #region Methods

  /**
   * Handles the close-button click event.
   * Emits the toast `id` up to the container for store removal.
   */
  onDismiss(): void {
    this.dismissed.emit(this.toast().id);
  }
  // #endregion Methods
}
