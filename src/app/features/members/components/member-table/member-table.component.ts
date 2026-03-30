// #region Imports
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { BadgeComponent } from '@components/atoms';
import { SearchBarComponent } from '@components/molecules';
import { PaginateColumn, PaginateComponent, PaginateSort } from '@components/organisms';
import { TranslatePipe } from '@ngx-translate/core';
import { MembersFacade } from '../../members.facade';
import type { MemberModel } from '../../models';
import { MemberDeleteDialogComponent } from '../member-delete-dialog/member-delete-dialog.component';
import {
  MemberFormDialogComponent,
  type MemberFormSavePayload,
} from '../member-form-dialog/member-form-dialog.component';
import { ResetPasswordDialogComponent } from '../reset-password-dialog/reset-password-dialog.component';
// #endregion Imports

// #region Constants

/**
 * Column definitions for the admin member table.
 * `fullName`, `email`, and `createdAt` are sortable.
 */
const MEMBER_TABLE_COLUMNS: readonly PaginateColumn[] = [
  { key: 'fullName', labelKey: 'members.table.columns.fullName', sortable: true },
  { key: 'email', labelKey: 'members.table.columns.email', sortable: true },
  { key: 'role', labelKey: 'members.table.columns.role' },
  { key: 'createdAt', labelKey: 'members.table.columns.createdAt', sortable: true },
  { key: 'actions', labelKey: 'members.table.columns.actions' },
] as const;

/** Available page-size options shown in the page-size selector. */
const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

// #endregion Constants

/**
 * Admin member management table.
 *
 * Renders a sortable, paginated, searchable table of all members.
 * Provides per-row actions:  Edit · Reset Password · Delete.
 * A global "Add Member" button opens the create form.
 *
 * All data fetching and mutation is delegated to {@link MembersFacade}.
 * Reuses the {@link PaginateComponent} organism for column headers and
 * pagination controls.
 */
@Component({
  selector: 'app-member-table',
  standalone: true,
  imports: [
    PaginateComponent,
    SearchBarComponent,
    BadgeComponent,
    TranslatePipe,
    MemberFormDialogComponent,
    MemberDeleteDialogComponent,
    ResetPasswordDialogComponent,
  ],
  templateUrl: './member-table.component.html',
  styleUrl: './member-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MemberTableComponent implements OnInit {
  // #region Dependencies

  /** Members feature store — provides member data and CRUD operations. */
  protected readonly facade = inject(MembersFacade);

  // #endregion Dependencies

  // #region State

  /** Static column definitions passed to `PaginateComponent`. */
  protected readonly columns = MEMBER_TABLE_COLUMNS;

  /** Available page-size options for the selector. */
  protected readonly pageSizeOptions = PAGE_SIZE_OPTIONS;

  // --- Dialog open flags ---

  /** Controls the create/edit form dialog visibility. */
  protected readonly isFormOpen = signal(false);

  /** Controls the delete confirmation dialog visibility. */
  protected readonly isDeleteOpen = signal(false);

  /** Controls the reset-password placeholder dialog visibility. */
  protected readonly isResetPasswordOpen = signal(false);

  // --- Selected member for contextual actions ---

  /**
   * The member currently targeted by an action (edit / delete / reset password).
   * `null` when no action is in progress (i.e., opening the create form).
   */
  protected readonly selectedMember = signal<MemberModel | null>(null);

  // #endregion State

  // #region Lifecycle

  /** Loads the first page of members on component init. */
  ngOnInit(): void {
    this.facade.load().catch(() => undefined);
  }

  // #endregion Lifecycle

  // #region Action Handlers

  /**
   * Opens the create-member form with no pre-selected member.
   */
  protected onAddMember(): void {
    this.selectedMember.set(null);
    this.isFormOpen.set(true);
  }

  /**
   * Opens the edit form pre-populated with the given member.
   *
   * @param member - The member to edit.
   */
  protected onEdit(member: MemberModel): void {
    this.selectedMember.set(member);
    this.isFormOpen.set(true);
  }

  /**
   * Opens the delete confirmation dialog for the given member.
   *
   * @param member - The member to delete.
   */
  protected onDelete(member: MemberModel): void {
    this.selectedMember.set(member);
    this.isDeleteOpen.set(true);
  }

  /**
   * Opens the reset-password placeholder dialog for the given member.
   *
   * @param member - The member whose password the admin wants to reset.
   */
  protected onResetPassword(member: MemberModel): void {
    this.selectedMember.set(member);
    this.isResetPasswordOpen.set(true);
  }

  /**
   * Handles the form dialog's `(save)` event.
   *
   * Routes to create or update based on whether a member is pre-selected.
   * Closes the dialog on success.
   *
   * @param payload - The validated form data.
   */
  protected onFormSave(payload: MemberFormSavePayload): void {
    const member = this.selectedMember();
    const action = member
      ? this.facade.updateMember(member.id, {
          fullName: payload.fullName,
          email: payload.email,
          roleId: payload.roleId ?? undefined,
        })
      : this.facade.createMember({
          fullName: payload.fullName,
          email: payload.email,
          roleId: payload.roleId ?? undefined,
        });

    action.then(() => this.isFormOpen.set(false)).catch(() => undefined);
  }

  /**
   * Handles the delete dialog's `(confirm)` event.
   *
   * Calls `MembersFacade.deleteMember()` for the selected member.
   */
  protected onDeleteConfirm(): void {
    const member = this.selectedMember();
    if (!member) return;
    this.facade.deleteMember(member.id).catch(() => undefined);
  }

  /**
   * Handles page-size selection changes.
   *
   * @param event - The native `<select>` change event.
   */
  protected onPageSizeChange(event: Event): void {
    const size = Number((event.target as HTMLSelectElement).value);
    if (Number.isFinite(size) && size > 0) {
      this.facade.setPageSize(size);
    }
  }

  /**
   * Handles sort changes emitted by `PaginateComponent`.
   *
   * Maps the column key to the `MembersState.sortField` union type accepted
   * by `MembersFacade.setSort()`, ignoring unknown keys.
   *
   * @param sort - The new sort state, or `null` to clear sorting.
   */
  protected onSortChange(sort: PaginateSort | null): void {
    if (!sort) {
      this.facade.setSort(null, 'desc');
      return;
    }

    const validFields = ['fullName', 'email', 'createdAt'] as const;
    type ValidField = (typeof validFields)[number];

    const field = validFields.includes(sort.column as ValidField)
      ? (sort.column as ValidField)
      : null;

    this.facade.setSort(field, sort.direction);
  }

  // #endregion Action Handlers

  // #region Helpers

  /**
   * Returns the badge variant for a member's role name.
   *
   * @param role - The member's role, or `null` when unassigned.
   */
  protected getRoleVariant(role: MemberModel['role']): 'danger' | 'info' | 'neutral' {
    if (!role) return 'neutral';
    return role.name === 'admin' ? 'danger' : 'info';
  }

  /**
   * Formats a `Date` object as a locale-aware short date string.
   *
   * @param date - The date to format.
   * @returns A formatted date string (e.g., `'29 Mar 2026'`).
   */
  protected formatDate(date: Date): string {
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  // #endregion Helpers
}
