// #region Imports
import { TestBed } from '@angular/core/testing';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PaginateColumn, PaginateSort } from './paginate.component';
import { PaginateComponent } from './paginate.component';
// #endregion Imports

// #region Test Fixtures

/** Minimal English translation strings used by this component. */
const EN_TRANSLATIONS = {
  paginate: {
    previous: 'Previous',
    next: 'Next',
    navAriaLabel: 'Pagination navigation',
    pageAriaLabel: 'Page {{page}}',
    currentPageAriaLabel: 'Page {{page}}, current',
    sortAscAriaLabel: 'Sort {{column}} ascending',
    sortDescAriaLabel: 'Sort {{column}} descending',
    resultsCount: '{{total}} results',
  },
  'col.name': 'Name',
  'col.email': 'Email',
  'col.role': 'Role',
};

/** Default column set used across most tests. */
const DEFAULT_COLUMNS: readonly PaginateColumn[] = [
  { key: 'name', labelKey: 'col.name', sortable: true },
  { key: 'email', labelKey: 'col.email', sortable: true },
  { key: 'role', labelKey: 'col.role', sortable: false },
];

// #endregion Test Fixtures

describe('PaginateComponent', () => {
  // #region Setup Helper

  /**
   * Renders the component with the given overrides, then synchronously loads
   * translations so impure TranslatePipe instances resolve before assertions.
   * Returns the component instance so callers can spy on outputs after mount.
   *
   * @param overrides - Partial inputs to merge with sensible defaults.
   */
  async function setup(
    overrides: {
      readonly columns?: readonly PaginateColumn[];
      readonly totalCount?: number;
      readonly page?: number;
      readonly pageSize?: number;
      readonly sort?: PaginateSort | null;
    } = {},
  ): Promise<{ readonly component: PaginateComponent }> {
    const { fixture } = await render(PaginateComponent, {
      providers: [provideTranslateService()],
      componentInputs: {
        columns: overrides.columns ?? DEFAULT_COLUMNS,
        totalCount: overrides.totalCount ?? 30,
        page: overrides.page ?? 1,
        pageSize: overrides.pageSize ?? 10,
        sort: overrides.sort ?? null,
      },
    });

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', EN_TRANSLATIONS);
    translate.use('en');
    fixture.detectChanges();
    await fixture.whenStable();

    return { component: fixture.componentInstance };
  }

  // #endregion Setup Helper

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // #region Column Header Rendering

  describe('column header rendering', () => {
    it('renders all column labels', async () => {
      await setup();

      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Role')).toBeInTheDocument();
    });

    it('renders sortable columns as buttons', async () => {
      await setup();

      expect(screen.getByRole('button', { name: /sort name ascending/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sort email ascending/i })).toBeInTheDocument();
    });

    it('does not render non-sortable columns as buttons', async () => {
      await setup();

      const buttons = screen.getAllByRole('button');
      const roleButton = buttons.find((b) => b.textContent?.trim() === 'Role');

      expect(roleButton).toBeUndefined();
    });
  });

  // #endregion Column Header Rendering

  // #region Sorting

  describe('sorting', () => {
    it('sets sort to asc on the first click of a sortable column', async () => {
      const { component } = await setup();

      // Act
      await userEvent.click(screen.getByRole('button', { name: /sort name ascending/i }));

      // Assert
      expect(component.sort()).toEqual<PaginateSort>({ column: 'name', direction: 'asc' });
    });

    it('toggles sort to desc on second click of the same column', async () => {
      const { component } = await setup({ sort: { column: 'name', direction: 'asc' } });

      // Act
      await userEvent.click(screen.getByRole('button', { name: /sort name descending/i }));

      // Assert
      expect(component.sort()).toEqual<PaginateSort>({ column: 'name', direction: 'desc' });
    });

    it('resets to asc when clicking a different column', async () => {
      const { component } = await setup({ sort: { column: 'name', direction: 'desc' } });

      // Act
      await userEvent.click(screen.getByRole('button', { name: /sort email ascending/i }));

      // Assert
      expect(component.sort()).toEqual<PaginateSort>({ column: 'email', direction: 'asc' });
    });

    it('reflects aria-sort ascending on the active sorted column', async () => {
      await setup({ sort: { column: 'name', direction: 'asc' } });

      const btn = screen.getByRole('button', { name: /sort name descending/i });

      expect(btn).toHaveAttribute('aria-sort', 'ascending');
    });

    it('reflects aria-sort descending on the active sorted column', async () => {
      await setup({ sort: { column: 'name', direction: 'desc' } });

      const btn = screen.getByRole('button', { name: /sort name ascending/i });

      expect(btn).toHaveAttribute('aria-sort', 'descending');
    });
  });

  // #endregion Sorting

  // #region Pagination Controls

  describe('pagination controls', () => {
    it('disables Previous on the first page', async () => {
      await setup({ page: 1 });

      expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled();
    });

    it('disables Next on the last page', async () => {
      await setup({ totalCount: 30, page: 3, pageSize: 10 });

      expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
    });

    it('emits pageChange page-1 when Previous is clicked', async () => {
      const { component } = await setup({ page: 2 });
      const spy = vi.spyOn(component.pageChange, 'emit');

      await userEvent.click(screen.getByRole('button', { name: /previous/i }));

      expect(spy).toHaveBeenCalledOnce();
      expect(spy).toHaveBeenCalledWith(1);
    });

    it('emits pageChange page+1 when Next is clicked', async () => {
      const { component } = await setup({ page: 1, totalCount: 30, pageSize: 10 });
      const spy = vi.spyOn(component.pageChange, 'emit');

      await userEvent.click(screen.getByRole('button', { name: /next/i }));

      expect(spy).toHaveBeenCalledOnce();
      expect(spy).toHaveBeenCalledWith(2);
    });

    it('marks the active page button with aria-current page', async () => {
      await setup({ page: 2, totalCount: 30, pageSize: 10 });

      const btn = screen.getByRole('button', { name: /page 2, current/i });

      expect(btn).toHaveAttribute('aria-current', 'page');
    });

    it('emits pageChange with the correct page when a page button is clicked', async () => {
      const { component } = await setup({ page: 1, totalCount: 30, pageSize: 10 });
      const spy = vi.spyOn(component.pageChange, 'emit');

      await userEvent.click(screen.getByRole('button', { name: /^page 3$/i }));

      expect(spy).toHaveBeenCalledOnce();
      expect(spy).toHaveBeenCalledWith(3);
    });

    it('renders the total results count', async () => {
      await setup({ totalCount: 42 });

      expect(screen.getByText('42 results')).toBeInTheDocument();
    });
  });

  // #endregion Pagination Controls

  // #region Accessibility

  describe('accessibility', () => {
    it('renders a pagination navigation landmark', async () => {
      await setup();

      const nav = screen.getByRole('navigation', { name: /pagination navigation/i });

      expect(nav).toBeInTheDocument();
    });
  });

  // #endregion Accessibility
});
