// #region Imports
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
// #endregion Imports

// #region Types
/**
 * Union of allowed button variant names.
 *
 * - `primary`   — main call-to-action, uses the primary colour.
 * - `secondary` — lower-emphasis action, neutral styling.
 * - `danger`    — destructive / irreversible actions (delete, reset password).
 * - `ghost`     — minimal visual weight; transparent background.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
// #endregion Types

/**
 * Generic button atom.
 *
 * Renders a native `<button>` element with typing, variant styling, disabled
 * state, and an optional loading spinner. Label content is projected via
 * `<ng-content>`.
 *
 * @example
 * ```html
 * <app-button type="submit" variant="primary" [loading]="isLoading()">
 *   {{ 'auth.login.submitButton' | translate }}
 * </app-button>
 * ```
 *
 * Belongs to the **atom** tier of the atomic design hierarchy.
 */
@Component({
  selector: 'app-button',
  standalone: true,
  imports: [],
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonComponent {
  // #region Inputs

  /**
   * Visual variant that controls the button's colour scheme and prominence.
   * Defaults to `'primary'`.
   */
  readonly variant = input<ButtonVariant>('primary');

  /**
   * Native HTML button type attribute.
   * Use `'submit'` inside `<form>` elements.
   * Defaults to `'button'` to prevent accidental form submission.
   */
  readonly type = input<'button' | 'submit' | 'reset'>('button');

  /**
   * When `true`, the button is disabled and cannot be interacted with.
   * Defaults to `false`.
   */
  readonly disabled = input<boolean>(false);

  /**
   * When `true`, a loading indicator is shown and the button is disabled.
   * Defaults to `false`.
   */
  readonly loading = input<boolean>(false);

  // #endregion Inputs
}
