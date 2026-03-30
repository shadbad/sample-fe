// #region Imports
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AuthFacade } from '@features/auth';
import { TranslatePipe } from '@ngx-translate/core';
import { MemberListComponent } from '../../components/member-list/member-list.component';
import { MemberTableComponent } from '../../components/member-table/member-table.component';
// #endregion Imports

/**
 * Users page — the main authenticated landing page.
 *
 * Renders different views depending on the current user's role:
 *
 * - **Admin** (`isAdmin() === true`): renders `MemberTableComponent` — full CRUD
 *   management table with search, sort, pagination, and per-row actions.
 * - **Regular user** (`isAdmin() === false`): renders `MemberListComponent` —
 *   a read-only, paginated member list with search.
 *
 * The role check is derived from `AuthFacade.isAdmin`, which reads the
 * `currentUser.role.name` signal. Self-registered users with `role = null` fall
 * into the regular-user path.
 *
 * @example Route registration (in `members.routes.ts`):
 * ```ts
 * { path: 'users', canActivate: [authGuard], loadComponent: () => import(...).then(m => m.UsersPage) }
 * ```
 */
@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [MemberListComponent, MemberTableComponent, TranslatePipe],
  templateUrl: './users.page.html',
  styleUrl: './users.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersPage {
  // #region Dependencies

  readonly #authFacade = inject(AuthFacade);

  // #endregion Dependencies

  // #region Computed State

  /**
   * `true` when the authenticated user has the `'admin'` role.
   * Drives the conditional template that switches between the admin table
   * and the regular-user list.
   */
  protected readonly isAdmin = this.#authFacade.isAdmin;

  // #endregion Computed State
}
