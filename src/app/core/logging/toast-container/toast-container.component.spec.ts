// #region Imports
import { signal } from '@angular/core';
import { provideTranslateService } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import { describe, expect, it, vi } from 'vitest';
import type { ToastEntry } from '../toast/toast.model';
import { ToastStore } from '../toast/toast.store';
import { ToastContainerComponent } from './toast-container.component';
// #endregion Imports

// #region Helpers

/**
 * Builds a fully-typed {@link ToastEntry} fixture.
 *
 * @param id - Unique id for the toast.
 * @param message - Display message for the toast.
 * @returns An immutable `ToastEntry` fixture.
 */
function buildToast(id: string, message: string): ToastEntry {
  return { id, message, level: 'info', durationMs: 5_000 };
}
// #endregion Helpers

// #region Test Suite

describe('ToastContainerComponent', () => {
  describe('rendering', () => {
    it('renders two alerts when the store contains two toasts', async () => {
      /** Pre-seeded signal that simulates an active ToastStore state. */
      const toastsSignal = signal<readonly ToastEntry[]>([
        buildToast('id-1', 'First notification'),
        buildToast('id-2', 'Second notification'),
      ]);

      const mockToastStore = {
        toasts: toastsSignal,
        dismiss: vi.fn<(id: string) => void>(),
      };

      await render(ToastContainerComponent, {
        providers: [{ provide: ToastStore, useValue: mockToastStore }, provideTranslateService({})],
      });

      expect(screen.getAllByRole('alert')).toHaveLength(2);
    });

    it('renders the correct message text for each toast', async () => {
      const toastsSignal = signal<readonly ToastEntry[]>([
        buildToast('id-1', 'First notification'),
        buildToast('id-2', 'Second notification'),
      ]);

      const mockToastStore = {
        toasts: toastsSignal,
        dismiss: vi.fn<(id: string) => void>(),
      };

      await render(ToastContainerComponent, {
        providers: [{ provide: ToastStore, useValue: mockToastStore }, provideTranslateService({})],
      });

      expect(screen.getByText('First notification')).toBeInTheDocument();
      expect(screen.getByText('Second notification')).toBeInTheDocument();
    });

    it('renders an empty container when no toasts are present', async () => {
      const toastsSignal = signal<readonly ToastEntry[]>([]);

      const mockToastStore = {
        toasts: toastsSignal,
        dismiss: vi.fn<(id: string) => void>(),
      };

      await render(ToastContainerComponent, {
        providers: [{ provide: ToastStore, useValue: mockToastStore }, provideTranslateService({})],
      });

      expect(screen.queryAllByRole('alert')).toHaveLength(0);
    });
  });
});
// #endregion Test Suite
