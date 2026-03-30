// #region Imports
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
// #endregion Imports

/**
 * Labelled text-input atom.
 *
 * Renders a `<label>` and an optional inline error message slot around
 * projected native `<input>` content. The parent component binds the actual
 * `<input>` element (including `[formControl]` or any other directive) via
 * `<ng-content>`. This atom only provides the visual chrome (label + error).
 *
 * @example
 * ```html
 * <app-input-field
 *   [label]="'auth.login.emailLabel' | translate"
 *   inputId="login-email"
 *   [errorMessage]="emailError()">
 *   <input id="login-email" type="email" [formControl]="form.controls.email" />
 * </app-input-field>
 * ```
 *
 * Belongs to the **atom** tier of the atomic design hierarchy.
 */
@Component({
  selector: 'app-input-field',
  standalone: true,
  imports: [],
  templateUrl: './input-field.component.html',
  styleUrl: './input-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputFieldComponent {
  // #region Inputs

  /**
   * The visible label text (pre-translated by the parent).
   * Bound to the projected `<input>` via the `inputId` attribute.
   */
  readonly label = input.required<string>();

  /**
   * The `id` value that links this label's `for` attribute to the projected input.
   * The parent must set the same `id` on the native `<input>`.
   */
  readonly inputId = input.required<string>();

  /**
   * Pre-translated error message to display below the input.
   * Pass `null` (the default) to hide the error slot entirely.
   */
  readonly errorMessage = input<string | null>(null);

  // #endregion Inputs
}
