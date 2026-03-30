// #region Imports
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  effect,
  inject,
  input,
  model,
  output,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogComponent } from '@components/molecules';
import { TranslatePipe } from '@ngx-translate/core';
import { MEMBERS_CONFIG } from '../../members.config';
import type { MemberModel } from '../../models';
// #endregion Imports

// #region Payload Types
/**
 * Data emitted by `MemberFormDialogComponent` when the user submits the form.
 */
export interface MemberFormSavePayload {
  /** Updated or new full name. */
  readonly fullName: string;
  /** Updated or new email address. */
  readonly email: string;
  /** Selected role UUID, or `null` when no role is assigned. */
  readonly roleId: string | null;
}
// #endregion Payload Types

/**
 * Create / edit member form modal.
 *
 * In **create mode** (`member = null`): renders an empty form.
 * In **edit mode** (`member` is set): pre-populates the form with the member's current values.
 *
 * The parent component controls visibility via `[(open)]` and receives the
 * submitted payload via `(save)`.
 *
 * @example
 * ```html
 * <app-member-form-dialog
 *   [(open)]="isFormOpen"
 *   [member]="selectedMember()"
 *   (save)="onSave($event)"
 * />
 * ```
 */
@Component({
  selector: 'app-member-form-dialog',
  standalone: true,
  imports: [DialogComponent, ReactiveFormsModule, TranslatePipe],
  templateUrl: './member-form-dialog.component.html',
  styleUrl: './member-form-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MemberFormDialogComponent implements OnInit {
  // #region Dependencies

  readonly #fb = inject(FormBuilder);
  /** Available role options from host configuration. */
  protected readonly config = inject(MEMBERS_CONFIG);

  // #endregion Dependencies

  // #region Inputs & Models

  /**
   * Controls dialog visibility. Use `[(open)]` for two-way binding.
   * @default false
   */
  readonly open = model(false);

  /**
   * The member to edit, or `null` when creating a new member.
   * Setting this pre-populates the form fields.
   */
  readonly member = input<MemberModel | null>(null);

  // #endregion Inputs & Models

  // #region Outputs

  /**
   * Emits the validated form payload when the user submits.
   */
  readonly save = output<MemberFormSavePayload>();

  // #endregion Outputs

  // #region Derived State

  /** `true` when editing an existing member; `false` for new member creation. */
  protected readonly isEditMode = computed(() => this.member() !== null);

  // #endregion Derived State

  // #region Form

  /**
   * Typed reactive form group for the member details.
   */
  protected readonly form = this.#fb.nonNullable.group({
    /** Member's full display name. */
    fullName: this.#fb.nonNullable.control('', [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(100),
    ]),
    /** Member's email address. */
    email: this.#fb.nonNullable.control('', [Validators.required, Validators.email]),
    /** Optional role UUID. `null` means no role assigned. */
    roleId: this.#fb.control<string | null>(null),
  });

  // #endregion Form

  // #region Lifecycle

  /** Wires the member input → form population effect. */
  ngOnInit(): void {
    // Populate or reset the form whenever the member input changes.
    effect(() => {
      const member = this.member();
      if (member) {
        this.form.setValue({
          fullName: member.fullName,
          email: member.email,
          roleId: member.role?.id ?? null,
        });
      } else {
        this.form.reset({ fullName: '', email: '', roleId: null });
      }
    });
  }

  // #endregion Lifecycle

  // #region Handlers

  /**
   * Handles form submission.
   *
   * Marks all controls as touched to surface validation errors, then emits
   * the save payload if the form is valid.
   */
  protected onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const { fullName, email, roleId } = this.form.getRawValue();
    this.save.emit({ fullName, email, roleId: roleId ?? null });
  }

  // #endregion Handlers

  // #region Error Helpers

  /**
   * Returns the translation key for the `fullName` validation error, or `null`.
   */
  protected get fullNameError(): string | null {
    const ctrl = this.form.controls.fullName;
    if (!ctrl.touched || ctrl.valid) return null;
    if (ctrl.hasError('required')) return 'errors.required';
    if (ctrl.hasError('minlength')) return 'errors.minLength';
    if (ctrl.hasError('maxlength')) return 'errors.maxLength';
    return null;
  }

  /**
   * Returns the translation key for the `email` validation error, or `null`.
   */
  protected get emailError(): string | null {
    const ctrl = this.form.controls.email;
    if (!ctrl.touched || ctrl.valid) return null;
    if (ctrl.hasError('required')) return 'errors.required';
    if (ctrl.hasError('email')) return 'errors.invalidEmail';
    return null;
  }

  // #endregion Error Helpers
}
