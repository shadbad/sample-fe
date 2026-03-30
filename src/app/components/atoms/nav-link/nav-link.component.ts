// #region Imports
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
// #endregion Imports

/**
 * Single navigation link atom.
 *
 * Renders a styled anchor element bound to an Angular router path. The
 * visible label is projected via `<ng-content>` so the atom stays decoupled
 * from any specific copy or i18n key.
 *
 * An active-route modifier class (`nav-link--active`) is applied automatically
 * by `RouterLinkActive`.
 *
 * @example
 * ```html
 * <app-nav-link href="/users">
 *   <span i18n="@@shared.molecules.appNav.users">Users</span>
 * </app-nav-link>
 * ```
 *
 * Belongs to the **atom** tier of the atomic design hierarchy.
 */
@Component({
  selector: 'app-nav-link',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './nav-link.component.html',
  styleUrl: './nav-link.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavLinkComponent {
  // #region Inputs

  /**
   * The router path to navigate to.
   * Passed directly to Angular's `[routerLink]` binding.
   */
  readonly href = input.required<string>();

  // #endregion Inputs
}
