// #region Imports
import { provideTranslateService } from '@ngx-translate/core';
import { fireEvent, render, screen } from '@testing-library/angular';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DialogComponent } from './dialog.component';
// #endregion Imports

// #region Helpers

/**
 * Stubs `showModal` and `close` on the appropriate prototype before each test.
 * The implementations mirror the real browser behaviour:
 *  - `showModal` adds the `open` attribute so jsdom exposes the content in the
 *    accessibility tree.
 *  - `close` removes the `open` attribute.
 *
 * Returns the spy references so individual tests can assert on call counts.
 */
function stubDialogApi(): {
  readonly showModal: ReturnType<typeof vi.fn<() => void>>;
  readonly close: ReturnType<typeof vi.fn<() => void>>;
} {
  const showModal = vi.fn<() => void>().mockImplementation(function (this: HTMLElement) {
    this.setAttribute('open', '');
  });

  const close = vi.fn<() => void>().mockImplementation(function (this: HTMLElement) {
    this.removeAttribute('open');
  });

  // `HTMLDialogElement` may be absent in older jsdom builds bundled with the
  // Angular test runner. Fall back to `HTMLElement.prototype` so that the
  // stub is reachable from any `<dialog>` DOM node.
  const target =
    typeof HTMLDialogElement !== 'undefined'
      ? (HTMLDialogElement.prototype as unknown as Record<string, unknown>)
      : (HTMLElement.prototype as unknown as Record<string, unknown>);

  Object.defineProperty(target, 'showModal', { configurable: true, value: showModal });
  Object.defineProperty(target, 'close', { configurable: true, value: close });

  return { showModal, close };
}

// #endregion Helpers

// #region Tests
describe('DialogComponent', () => {
  let showModal: ReturnType<typeof vi.fn>;
  let close: ReturnType<typeof vi.fn<() => void>>;

  beforeEach(() => {
    vi.clearAllMocks();
    ({ showModal, close } = stubDialogApi());
  });

  // #region Visibility

  describe('open model', () => {
    it('calls showModal when open is set to true', async () => {
      // Arrange + Act
      await render(DialogComponent, {
        componentInputs: { open: true },
        providers: [provideTranslateService()],
      });

      // Assert
      expect(showModal).toHaveBeenCalledOnce();
    });

    it('does not call showModal when open is false initially', async () => {
      // Arrange + Act
      await render(DialogComponent, {
        componentInputs: { open: false },
        providers: [provideTranslateService()],
      });

      // Assert
      expect(showModal).not.toHaveBeenCalled();
    });
  });

  // #endregion Visibility

  // #region Body Scroll Lock

  describe('body scroll lock', () => {
    afterEach(() => {
      // Ensure the body style is always cleaned up between tests regardless
      // of test outcome so subsequent tests start with a clean state.
      document.body.style.overflow = '';
    });

    it('sets overflow hidden on body when dialog opens', async () => {
      // Arrange + Act
      await render(DialogComponent, {
        componentInputs: { open: true },
        providers: [provideTranslateService()],
      });

      // Assert
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('restores body overflow when dialog closes', async () => {
      // Arrange
      const { fixture } = await render(DialogComponent, {
        componentInputs: { open: true },
        providers: [provideTranslateService()],
      });

      // Act
      fixture.componentInstance.open.set(false);
      fixture.detectChanges();

      // Assert
      expect(document.body.style.overflow).toBe('');
    });
  });

  // #endregion Body Scroll Lock

  // #region Content Projection

  describe('content projection', () => {
    it('renders projected header content', async () => {
      // Arrange + Act
      await render(
        `<app-dialog [open]="true">
           <h2 dialog-header>My Title</h2>
         </app-dialog>`,
        { imports: [DialogComponent], providers: [provideTranslateService()] },
      );

      // Assert
      expect(screen.getByRole('heading', { name: /my title/i })).toBeVisible();
    });

    it('renders projected body content', async () => {
      // Arrange + Act
      await render(
        `<app-dialog [open]="true">
           <p dialog-body>Dialog body text</p>
         </app-dialog>`,
        { imports: [DialogComponent], providers: [provideTranslateService()] },
      );

      // Assert
      expect(screen.getByText(/dialog body text/i)).toBeVisible();
    });

    it('renders projected footer buttons', async () => {
      // Arrange + Act
      await render(
        `<app-dialog [open]="true">
           <footer dialog-footer>
             <button>Cancel</button>
             <button>Confirm</button>
           </footer>
         </app-dialog>`,
        { imports: [DialogComponent], providers: [provideTranslateService()] },
      );

      // Assert
      expect(screen.getByRole('button', { name: /cancel/i })).toBeVisible();
      expect(screen.getByRole('button', { name: /confirm/i })).toBeVisible();
    });
  });

  // #endregion Content Projection

  // #region Close Button

  describe('close button', () => {
    it('is always rendered inside the dialog header', async () => {
      // Arrange + Act
      await render(DialogComponent, {
        componentInputs: { open: true },
        providers: [provideTranslateService()],
      });

      // Assert — ATL resolves the button by its accessible role.
      expect(screen.getByRole('button', { name: /close/i })).toBeVisible();
    });

    it('sets open to false when the close button is clicked', async () => {
      // Arrange
      const { fixture } = await render(DialogComponent, {
        componentInputs: { open: true },
        providers: [provideTranslateService()],
      });

      // Act
      fireEvent.click(screen.getByRole('button', { name: /close/i }));
      fixture.detectChanges();

      // Assert
      expect(fixture.componentInstance.open()).toBe(false);
    });
  });

  // #endregion Close Button

  // #region Backdrop Click

  describe('backdrop click', () => {
    it('does not call close when closeOnBackdrop is false and backdrop is clicked', async () => {
      // Arrange
      const { detectChanges } = await render(DialogComponent, {
        componentInputs: { open: true, closeOnBackdrop: false },
        providers: [provideTranslateService()],
      });

      const dialogEl = document.querySelector('dialog')!;

      // Act — fire click on the <dialog> element itself (backdrop area) via
      // ATL's fireEvent so Angular change detection runs after the event.
      fireEvent.click(dialogEl);
      detectChanges();

      // Assert — close() must NOT have been called; dialog stays open.
      expect(close).not.toHaveBeenCalled();
    });

    it('calls close when closeOnBackdrop is true and backdrop is clicked', async () => {
      // Arrange
      const { detectChanges } = await render(DialogComponent, {
        componentInputs: { open: true, closeOnBackdrop: true },
        providers: [provideTranslateService()],
      });

      const dialogEl = document.querySelector('dialog')!;

      // Act — fire click on the <dialog> element / backdrop area.
      fireEvent.click(dialogEl);
      detectChanges();

      // Assert — open signal was set to false → effect ran → close() called.
      expect(close).toHaveBeenCalledOnce();
    });
  });

  // #endregion Backdrop Click
});
// #endregion Tests
