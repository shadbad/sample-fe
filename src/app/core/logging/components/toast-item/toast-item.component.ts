// #region Imports
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import type { ToastEntry } from '../../toast/toast.model';
// #endregion Imports

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
