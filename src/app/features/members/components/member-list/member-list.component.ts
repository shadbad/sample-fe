// #region Imports
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { BadgeComponent } from '@components/atoms';
import { SearchBarComponent } from '@components/molecules';
import { PaginateColumn, PaginateComponent } from '@components/organisms';
import { TranslatePipe } from '@ngx-translate/core';
import { MembersFacade } from '../../members.facade';
import type { MemberModel } from '../../models';
// #endregion Imports

// #region Constants

/**
 * Column definitions for the read-only member list.
 * No columns are sortable — this is the regular-user view.
 */
const MEMBER_LIST_COLUMNS: readonly PaginateColumn[] = [
  { key: 'avatar', labelKey: '' },
  { key: 'fullName', labelKey: 'members.table.columns.fullName' },
  { key: 'email', labelKey: 'members.table.columns.email' },
  { key: 'role', labelKey: 'members.table.columns.role' },
] as const;

// #endregion Constants

/**
 * Read-only paginated member list for regular (non-admin) users.
 *
 * Renders a table with an initials avatar, full name, email, and role badge
 * for each member. Search and pagination are delegated to {@link MembersFacade}.
 *
 * Reuses the {@link PaginateComponent} organism for the table header and
 * pagination controls.
 */
@Component({
  selector: 'app-member-list',
  standalone: true,
  imports: [PaginateComponent, SearchBarComponent, BadgeComponent, TranslatePipe],
  templateUrl: './member-list.component.html',
  styleUrl: './member-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MemberListComponent implements OnInit {
  // #region Dependencies

  /** Members feature store — provides member data and search/pagination state. */
  protected readonly facade = inject(MembersFacade);

  // #endregion Dependencies

  // #region State

  /** Static column definitions passed to `PaginateComponent`. */
  protected readonly columns = MEMBER_LIST_COLUMNS;

  // #endregion State

  // #region Lifecycle

  /** Loads the first page of members on component init. */
  ngOnInit(): void {
    this.facade.load().catch(() => undefined);
  }

  // #endregion Lifecycle

  // #region Helpers

  /**
   * Computes the two-letter initials from a member's full name.
   *
   * Returns up to two uppercase characters: the first letter of the first word
   * and the first letter of the last word (when present).
   *
   * @param member - The member whose initials to compute.
   * @returns A 1–2 character string (e.g., `'JD'` for `'Jane Doe'`).
   */
  protected getInitials(member: MemberModel): string {
    const parts = member.fullName.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? '';
    const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
    return (first + last).toUpperCase();
  }

  /**
   * Returns the badge variant for a member's role name.
   *
   * - `'admin'`  → `'danger'` (red).
   * - any other → `'info'` (blue).
   * - `null`     → `'neutral'` (grey).
   *
   * @param role - The member's role, or `null` when unassigned.
   */
  protected getRoleVariant(role: MemberModel['role']): 'danger' | 'info' | 'neutral' {
    if (!role) return 'neutral';
    return role.name === 'admin' ? 'danger' : 'info';
  }

  // #endregion Helpers
}
