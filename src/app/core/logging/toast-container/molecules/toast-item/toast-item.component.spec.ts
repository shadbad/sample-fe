// #region Imports
import { provideTranslateService } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { ToastEntry } from '../../../toast/toast.model';
import { ToastItemComponent } from './toast-item.component';
// #endregion Imports

// #region Helpers

/**
 * Builds a fully-typed {@link ToastEntry} fixture with sensible defaults.
 *
 * @param overrides - Partial overrides to apply on top of the defaults.
 * @returns A complete, immutable `ToastEntry` fixture.
 */
function buildToast(overrides: Partial<ToastEntry> = {}): ToastEntry {
  return {
    id: 'test-id-1',
    message: 'Test notification',
    level: 'info',
    durationMs: 5_000,
    ...overrides,
  };
}
// #endregion Helpers

// #region Test Suite

describe('ToastItemComponent', () => {
  // #region Rendering

  describe('rendering', () => {
    it('renders a region with role="alert"', async () => {
      await render(ToastItemComponent, {
        componentInputs: { toast: buildToast() },
        providers: [provideTranslateService({})],
      });

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('displays the toast message text', async () => {
      await render(ToastItemComponent, {
        componentInputs: { toast: buildToast({ message: 'You have been logged out.' }) },
        providers: [provideTranslateService({})],
      });

      expect(screen.getByText('You have been logged out.')).toBeInTheDocument();
    });

    it('renders a close button', async () => {
      await render(ToastItemComponent, {
        componentInputs: { toast: buildToast() },
        providers: [provideTranslateService({})],
      });

      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });
  // #endregion Rendering

  // #region Interaction

  describe('interaction', () => {
    it('emits "dismissed" with the toast id when the close button is clicked', async () => {
      const dismissedValues: string[] = [];

      const { fixture } = await render(ToastItemComponent, {
        componentInputs: { toast: buildToast({ id: 'abc-123' }) },
        providers: [provideTranslateService({})],
      });

      fixture.componentInstance.dismissed.subscribe((id: string) => dismissedValues.push(id));

      await userEvent.click(screen.getByRole('button'));

      expect(dismissedValues).toEqual(['abc-123']);
    });
  });
  // #endregion Interaction
});
// #endregion Test Suite
