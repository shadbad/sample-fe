// #region Imports
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AppLogoLinkComponent } from '@components/atoms';
import { AppNavComponent } from '@components/molecules';
// #endregion Imports

/**
 * Application header organism.
 *
 * Renders a fixed top bar (`position: fixed; top: 0`) that is always visible
 * above the page content. Its inner content is constrained to the standard
 * page width via the `%wrapper` / `wrapper` mixin.
 *
 * Layout:
 * - **Left** — {@link AppLogoLinkComponent}: brand link pointing to `/`.
 * - **Right** — {@link AppNavComponent}: primary navigation (Users, Logout).
 *
 * Belongs to the **organism** tier of the atomic design hierarchy.
 */
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [AppLogoLinkComponent, AppNavComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {}
