// #region Imports
import { ChangeDetectionStrategy, Component, computed, input, model, output } from '@angular/core';
import { ButtonComponent } from '@components/atoms';
import { TranslatePipe } from '@ngx-translate/core';
// #endregion Imports

// #region Types

/**
 * Defines a single column rendered by the paginate component.
 *
 * @property key       - Unique identifier for the column, used as the sort key.
 * @property labelKey  - ngx-translate key resolved to a visible header label.
 * @property sortable  - When `true` the header is rendered as a clickable sort button.
 */
export interface PaginateColumn {
  readonly key: string;
  readonly labelKey: string;
  readonly sortable?: boolean;
}

/**
 * Sort direction options for a column.
 *
 * - `'asc'`  - Ascending (A → Z, 0 → 9).
 * - `'desc'` - Descending (Z → A, 9 → 0).
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Describes the current sort state emitted to the host.
 *
 * @property column    - The {@link PaginateColumn.key} that is being sorted.
 * @property direction - The direction of the sort.
 */
export interface PaginateSort {
  readonly column: string;
  readonly direction: SortDirection;
}

/**
 * A single item in the rendered page-number sequence.
 *
 * - `'page'`     - A concrete page number button.
 * - `'ellipsis'` - A non-interactive gap indicator.
 */
export type PageItem =
  | { readonly type: 'page'; readonly page: number }
  | { readonly type: 'ellipsis'; readonly id: number };

// #endregion Types

/**
 * Paginate organism.
 *
 * Renders a sortable column-header row, an `<ng-content>` slot for the host to
 * project its own row markup, and a pagination control bar. All data fetching
 * and row rendering remain the responsibility of the host; this component only
 * manages UI state (current sort, active page).
 *
 * ### Inputs
 * | Input       | Type                            | Required | Default |
 * |-------------|---------------------------------|----------|---------|
 * | `columns`   | `ReadonlyArray<PaginateColumn>` | ✅       | —       |
 * | `totalCount`| `number`                        | ✅       | —       |
 * | `page`      | `number`                        | ✅       | —       |
 * | `pageSize`  | `number`                        | ❌       | `10`    |
 * | `sort`      | `PaginateSort \| null`          | ❌       | `null`  |
 *
 * ### Outputs
 * | Output       | Payload  | Description                              |
 * |--------------|----------|------------------------------------------|
 * | `pageChange` | `number` | New 1-based page number requested.       |
 * | `sortChange` | `PaginateSort \| null` | Two-way sort model change. |
 *
 * @example
 * ```html
 * <app-paginate
 *   [columns]="columns"
 *   [totalCount]="total()"
 *   [page]="currentPage()"
 *   [(sort)]="activeSort"
 *   (pageChange)="onPageChange($event)"
 * >
 *   @for (user of users(); track user.id) {
 *     <tr><td>{{ user.name }}</td></tr>
 *   }
 * </app-paginate>
 * ```
 *
 * Belongs to the **organism** tier of the atomic design hierarchy.
 */
@Component({
  selector: 'app-paginate',
  standalone: true,
  imports: [TranslatePipe, ButtonComponent],
  templateUrl: './paginate.component.html',
  styleUrl: './paginate.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginateComponent {
  // #region Inputs

  /** Column definitions: key, translation key for the label, and optional sortable flag. */
  readonly columns = input.required<readonly PaginateColumn[]>();

  /** Total number of records across all pages (used to compute page count). */
  readonly totalCount = input.required<number>();

  /** Currently active 1-based page number. */
  readonly page = input.required<number>();

  /** Number of rows displayed per page. Defaults to `10`. */
  readonly pageSize = input<number>(10);

  /** Two-way sortable state. Bind with `[(sort)]` or listen to `(sortChange)`. */
  readonly sort = model<PaginateSort | null>(null);

  // #endregion Inputs

  // #region Outputs

  /** Emits the new 1-based page number when the user navigates. */
  readonly pageChange = output<number>();

  // #endregion Outputs

  // #region Derived State

  /** Total number of pages derived from `totalCount` and `pageSize`. */
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.totalCount() / this.pageSize())));

  /**
   * Condensed sequence of page items to render in the pagination bar.
   *
   * Shows at most 7 items (pages + ellipsis) using a sliding-window algorithm:
   * first page, up to two neighbours of the current page, last page, and
   * ellipsis tokens where gaps exist.
   */
  readonly pageItems = computed<readonly PageItem[]>(() => {
    const total = this.totalPages();
    const current = this.page();

    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => ({
        type: 'page' as const,
        page: i + 1,
      }));
    }

    const items: PageItem[] = [{ type: 'page', page: 1 }];

    if (current > 4) {
      items.push({ type: 'ellipsis', id: 0 });
    }

    const start = Math.max(2, current - 2);
    const end = Math.min(total - 1, current + 2);

    for (let p = start; p <= end; p++) {
      items.push({ type: 'page', page: p });
    }

    if (current < total - 3) {
      items.push({ type: 'ellipsis', id: 1 });
    }

    items.push({ type: 'page', page: total });

    return items;
  });

  /** `true` when the previous-page button should be disabled. */
  readonly isPrevDisabled = computed(() => this.page() <= 1);

  /** `true` when the next-page button should be disabled. */
  readonly isNextDisabled = computed(() => this.page() >= this.totalPages());

  // #endregion Derived State

  // #region Handlers

  /**
   * Navigates to the previous page when not already on the first page.
   */
  onPrevPage(): void {
    if (this.isPrevDisabled()) return;
    this.pageChange.emit(this.page() - 1);
  }

  /**
   * Navigates to the next page when not already on the last page.
   */
  onNextPage(): void {
    if (this.isNextDisabled()) return;
    this.pageChange.emit(this.page() + 1);
  }

  /**
   * Navigates to the specified page number.
   *
   * @param page - Target 1-based page number.
   */
  onGoToPage(page: number): void {
    if (page === this.page()) return;
    this.pageChange.emit(page);
  }

  /**
   * Handles a click on a sortable column header.
   *
   * Behaviour:
   * - First click on a column → sort `asc`.
   * - Second click on the same column → sort `desc`.
   * - Third click (or click on a different column) → sort `asc` on new column.
   *
   * @param key - The {@link PaginateColumn.key} of the clicked column.
   */
  onSortClick(key: string): void {
    const current = this.sort();
    const next: PaginateSort =
      current?.column === key
        ? { column: key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
        : { column: key, direction: 'asc' };

    this.sort.set(next);
  }

  // #endregion Handlers
}
