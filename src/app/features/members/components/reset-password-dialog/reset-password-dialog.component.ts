// #region Imports
import { ChangeDetectionStrategy, Component, model } from '@angular/core';
import { DialogComponent } from '@components/molecules';
import { TranslatePipe } from '@ngx-translate/core';
// #endregion Imports

/**
 * Reset-password placeholder dialog.
 *
 * The backend does not yet expose a `POST /auth/reset-password` endpoint.
 * This dialog informs the admin that the action is not currently available.
 *
 * The component architecture includes the full shell so that wiring a real
 * endpoint later only requires adding the service call in the parent.
 *
 * @example
 * ```html
 * <app-reset-password-dialog [(open)]="isResetPasswordOpen" />
 * ```
 */
@Component({
  selector: 'app-reset-password-dialog',
  standalone: true,
  imports: [DialogComponent, TranslatePipe],
  templateUrl: './reset-password-dialog.component.html',
  styleUrl: './reset-password-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordDialogComponent {
  // #region Inputs & Models

  /**
   * Controls dialog visibility. Use `[(open)]` for two-way binding.
   * @default false
   */
  readonly open = model(false);

  // #endregion Inputs & Models
}
