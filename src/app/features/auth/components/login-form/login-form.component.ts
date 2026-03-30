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

// #region Component

/**
 * Login form component for the auth feature.
 *
 * Renders an email + password form, delegates submission to {@link AuthFacade},
 * and navigates to `/users` on success. Inline validation errors are derived
 * as computed signals for reactive template binding.
 *
 * Feature-private — not exported from `auth/index.ts`.
 */
@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, ButtonComponent, InputFieldComponent],
  templateUrl: './login-form.component.html',
  styleUrl: './login-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginFormComponent {
  // #region Dependencies
  readonly #authFacade = inject(AuthFacade);
  readonly #router = inject(Router);
  readonly #translate = inject(TranslateService);
  // #endregion Dependencies

  // #region Form Definition
  /**
   * Typed reactive form for the login flow.
   * `nonNullable: true` ensures controls always return `string`, never `null`.
   */
  readonly form = new FormGroup({
    email: new FormControl('', {
      validators: [Validators.required, Validators.email],
      nonNullable: true,
    }),
    password: new FormControl('', {
      validators: [Validators.required, Validators.minLength(8)],
      nonNullable: true,
    }),
  });
  // #endregion Form Definition

  // #region Reactive Form Bridge
  /**
   * Emits whenever any form control changes status or value, bridging Angular's
   * Observable-based form API into a Signal-compatible reactive trigger.
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
  /** `true` while an async login request is in flight. */
  readonly isLoading = this.#authFacade.isLoading;

  /** Last server-side error message, or `null` when no error has occurred. */
  readonly serverError = this.#authFacade.error;
  // #endregion Facade Signals

  // #region Computed Error Messages
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
      return this.#translate.instant('errors.minLength', { value: 8 });
    return null;
  });
  // #endregion Computed Error Messages

  // #region Methods
  /**
   * Handles the form submission event.
   *
   * Marks all controls as touched so validation errors become visible,
   * then delegates to {@link AuthFacade.login}. On success, navigates to `/users`.
   * On failure, the `serverError` signal is populated by the facade.
   */
  async onSubmit(): Promise<void> {
    this._submitAttempted.set(true);
    this.form.markAllAsTouched();

    if (this.form.invalid) return;

    try {
      await this.#authFacade.login(
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
