// #region Imports
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonComponent, InputFieldComponent } from '@components/atoms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { merge } from 'rxjs';
import { startWith } from 'rxjs/operators';
import { AuthFacade } from '../../auth.facade';
// #endregion Imports

// #region Constants
/** Minimum character length for a full name. */
const FULL_NAME_MIN_LENGTH = 2;
/** Maximum character length for a full name. */
const FULL_NAME_MAX_LENGTH = 100;
/** Minimum character length for a password. */
const PASSWORD_MIN_LENGTH = 8;
// #endregion Constants

// #region Component

/**
 * Registration form component for the auth feature.
 *
 * Renders a full-name, email, and password form. Delegates submission to
 * {@link AuthFacade.register} and navigates to `/users` on success.
 * Self-registered users always have `role = null` until an admin assigns one.
 *
 * Feature-private — not exported from `auth/index.ts`.
 */
@Component({
  selector: 'app-register-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, ButtonComponent, InputFieldComponent],
  templateUrl: './register-form.component.html',
  styleUrl: './register-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterFormComponent {
  // #region Dependencies
  readonly #authFacade = inject(AuthFacade);
  readonly #router = inject(Router);
  readonly #translate = inject(TranslateService);
  // #endregion Dependencies

  // #region Form Definition
  /**
   * Typed reactive form for the registration flow.
   * `nonNullable: true` ensures all controls always return `string`, never `null`.
   */
  readonly form = new FormGroup({
    fullName: new FormControl('', {
      validators: [
        Validators.required,
        Validators.minLength(FULL_NAME_MIN_LENGTH),
        Validators.maxLength(FULL_NAME_MAX_LENGTH),
      ],
      nonNullable: true,
    }),
    email: new FormControl('', {
      validators: [Validators.required, Validators.email],
      nonNullable: true,
    }),
    password: new FormControl('', {
      validators: [Validators.required, Validators.minLength(PASSWORD_MIN_LENGTH)],
      nonNullable: true,
    }),
  });
  // #endregion Form Definition

  // #region Reactive Form Bridge
  /**
   * Emits whenever any form control changes, bridging Angular's Observable-based
   * form API into a Signal-compatible reactive trigger.
   *
   * RxJS JUSTIFIED: `AbstractControl.statusChanges` and `valueChanges` are
   * Observables with no Signal-native equivalent. `toSignal` is used solely as
   * an interop bridge; no RxJS logic is applied beyond `startWith`.
   */
  readonly #formChanges = toSignal(
    merge(this.form.statusChanges, this.form.valueChanges).pipe(startWith(null)),
  );
  // #endregion Reactive Form Bridge

  // #region State
  /** Tracks whether the user has attempted to submit (to reveal all field errors). */
  readonly _submitAttempted = signal(false);
  // #endregion State

  // #region Facade Signals
  /** `true` while an async registration request is in flight. */
  readonly isLoading = this.#authFacade.isLoading;

  /** Last server-side error message, or `null` when no error has occurred. */
  readonly serverError = this.#authFacade.error;
  // #endregion Facade Signals

  // #region Computed Error Messages
  /**
   * Validation error message for the full-name field, or `null` when valid / untouched.
   */
  readonly fullNameError = computed<string | null>(() => {
    this.#formChanges(); // reactive dependency trigger
    const ctrl = this.form.controls.fullName;
    if (!ctrl.touched && !this._submitAttempted()) return null;
    if (ctrl.errors?.['required']) return this.#translate.instant('errors.required');
    if (ctrl.errors?.['minlength'])
      return this.#translate.instant('errors.minLength', { value: FULL_NAME_MIN_LENGTH });
    if (ctrl.errors?.['maxlength'])
      return this.#translate.instant('errors.maxLength', { value: FULL_NAME_MAX_LENGTH });
    return null;
  });

  /**
   * Validation error message for the email field, or `null` when valid / untouched.
   */
  readonly emailError = computed<string | null>(() => {
    this.#formChanges(); // reactive dependency trigger
    const ctrl = this.form.controls.email;
    if (!ctrl.touched && !this._submitAttempted()) return null;
    if (ctrl.errors?.['required']) return this.#translate.instant('errors.required');
    if (ctrl.errors?.['email']) return this.#translate.instant('errors.invalidEmail');
    return null;
  });

  /**
   * Validation error message for the password field, or `null` when valid / untouched.
   */
  readonly passwordError = computed<string | null>(() => {
    this.#formChanges(); // reactive dependency trigger
    const ctrl = this.form.controls.password;
    if (!ctrl.touched && !this._submitAttempted()) return null;
    if (ctrl.errors?.['required']) return this.#translate.instant('errors.required');
    if (ctrl.errors?.['minlength'])
      return this.#translate.instant('errors.minLength', { value: PASSWORD_MIN_LENGTH });
    return null;
  });
  // #endregion Computed Error Messages

  // #region Methods
  /**
   * Handles the form submission event.
   *
   * Marks all controls as touched so validation errors become visible,
   * then delegates to {@link AuthFacade.register}. On success, navigates to `/users`.
   * On failure, the `serverError` signal is populated by the facade.
   */
  async onSubmit(): Promise<void> {
    this._submitAttempted.set(true);
    this.form.markAllAsTouched();

    if (this.form.invalid) return;

    try {
      await this.#authFacade.register(
        this.form.controls.fullName.value,
        this.form.controls.email.value,
        this.form.controls.password.value,
      );
      await this.#router.navigate(['/users']);
    } catch {
      // Error is stored in authFacade.error() and displayed via serverError signal
    }
  }
  // #endregion Methods
}
// #endregion Component
