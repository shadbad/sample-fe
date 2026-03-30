// #region Imports
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NavLinkComponent } from '@components/atoms';
import { AuthFacade } from '@features/auth';
import { TranslatePipe } from '@ngx-translate/core';
// #endregion Imports

/**
 * Application primary navigation molecule.
 *
 * Renders the main `<nav>` element containing the **Users** route link and
 * a **Logout** button. The logout action delegates to {@link AuthFacade.logout}
 * and then navigates to `/login`.
 *
 * Belongs to the **molecule** tier of the atomic design hierarchy.
 */
@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [NavLinkComponent, TranslatePipe],
  templateUrl: './app-nav.component.html',
  styleUrl: './app-nav.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppNavComponent {
  // #region Dependencies

  /** Auth store — used to clear session state on logout. */
  readonly #authFacade = inject(AuthFacade);

  /** Router — used to navigate to `/login` after logout completes. */
  readonly #router = inject(Router);

  // #endregion Dependencies

  // #region Actions

  /**
   * Logs the current user out and redirects to the login page.
   *
   * Calls {@link AuthFacade.logout} which clears the in-memory token and
   * invalidates the server-side `HttpOnly` refresh-token cookie, then
   * navigates to `/login`.
   */
  async onLogout(): Promise<void> {
    await this.#authFacade.logout();
    await this.#router.navigateByUrl('/login');
  }

  // #endregion Actions
}
