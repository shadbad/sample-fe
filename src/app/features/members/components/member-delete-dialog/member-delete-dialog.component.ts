// #region Imports
import { ChangeDetectionStrategy, Component, computed, input, model, output } from '@angular/core';
import { DialogComponent } from '@components/molecules';
import { TranslatePipe } from '@ngx-translate/core';
import type { MemberModel } from '../../models';
// #endregion Imports

/**
 * Delete-member confirmation dialog.
 *
 * Shows the target member's name inside a warning prompt.
 * The parent listens to `(confirm)` to perform the actual deletion.
 *
 * @example
 * ```html
 * <app-member-delete-dialog
 *   [(open)]="isDeleteOpen"
 *   [member]="selectedMember()"
 *   (confirm)="facade.deleteMember(selectedMember()!.id)"
 * />
 * ```
 */
@Component({
  selector: 'app-member-delete-dialog',
  standalone: true,
  imports: [DialogComponent, TranslatePipe],
  templateUrl: './member-delete-dialog.component.html',
  styleUrl: './member-delete-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MemberDeleteDialogComponent {
  // #region Inputs & Models

  /**
   * Controls dialog visibility. Use `[(open)]` for two-way binding.
   * @default false
   */
  readonly open = model(false);

  /**
   * The member to delete. Must be set before the dialog is opened.
   */
  readonly member = input<MemberModel | null>(null);

  // #endregion Inputs & Models

  // #region Outputs

  /**
   * Emits `void` when the admin confirms the deletion.
   * The host component is responsible for calling the delete method.
   */
  readonly confirm = output<void>();

  // #endregion Outputs

  // #region Derived State

  /** Display name shown in the confirmation prompt. */
  protected readonly memberName = computed(() => this.member()?.fullName ?? '');

  // #endregion Derived State

  // #region Handlers

  /**
   * Emits the `confirm` event and closes the dialog.
   */
  protected onConfirm(): void {
    this.confirm.emit();
    this.open.set(false);
  }

  // #endregion Handlers
}
