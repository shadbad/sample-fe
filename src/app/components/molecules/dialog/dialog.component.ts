// #region Imports
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  input,
  model,
  viewChild,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
// #endregion Imports

/**
 * A generic, accessible modal dialog molecule built on the native HTML
 * `<dialog>` element.
 *
 * The host component controls visibility through the two-way-bindable `open`
 * signal model. The dialog adapts to any content via three named
 * `<ng-content>` slots: `[dialog-header]`, `[dialog-body]`, and
 * `[dialog-footer]`.
 *
 * ### Features
 * - Native `<dialog>` — built-in focus-trap, `Escape` key, and `::backdrop`.
 * - Two-way `open` binding via `model<boolean>`.
 * - Optional backdrop-click-to-close via `closeOnBackdrop` input.
 * - Locks `document.body` scroll while open; restores it on close or destroy.
 * - Zoneless and `OnPush`-safe; change detection driven exclusively by Signals.
 *
 * @example
 * ```html
 * <app-dialog [(open)]="isDialogOpen" [closeOnBackdrop]="true">
 *   <h2 dialog-header>Confirm action</h2>
 *   <p dialog-body>Are you sure you want to proceed?</p>
 *   <footer dialog-footer>
 *     <button (click)="isDialogOpen.set(false)">Cancel</button>
 *     <button (click)="confirm()">OK</button>
 *   </footer>
 * </app-dialog>
 * ```
 */
@Component({
  selector: 'app-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe],
  templateUrl: './dialog.component.html',
  styleUrl: './dialog.component.scss',
})
export class DialogComponent {
  // #region Inputs & Models

  /**
   * Controls whether the dialog is currently visible.
   * Use two-way binding `[(open)]` to keep the host in sync when the dialog
   * is closed via the Escape key or backdrop click.
   *
   * @default false
   */
  readonly open = model(false);

  /**
   * When `true`, clicking the backdrop (the area outside the dialog panel)
   * closes the dialog and sets `open` to `false`.
   *
   * @default false
   */
  readonly closeOnBackdrop = input(false);

  // #endregion Inputs & Models

  // #region View Queries

  /**
   * Reference to the native `<dialog>` element.
   *
   * Uses TypeScript `private` (not the ES `#` syntax) because Angular's
   * template compiler must be able to reference signal-based view queries
   * internally; ES private fields are inaccessible to the generated code.
   */
  private readonly dialogEl = viewChild.required<ElementRef<HTMLDialogElement>>('dialogRef');

  // #endregion View Queries

  // #region Dependencies

  /** Used to restore body scroll if the component is destroyed while open. */
  private readonly destroyRef = inject(DestroyRef);

  // #endregion Dependencies

  // #region Constructor

  constructor() {
    /**
     * Synchronises the `open` signal with the native `<dialog>` open/close
     * API and locks / restores body scroll accordingly.
     *
     * The effect is automatically destroyed with the component and does not
     * need to be stored — calling `effect()` in the constructor is sufficient
     * to register it in the component's injection context.
     */
    effect(() => {
      const isOpen = this.open();
      const el = this.dialogEl().nativeElement;

      if (isOpen) {
        if (!el.open) {
          el.showModal();
        }
        document.body.style.overflow = 'hidden';
      } else {
        if (el.open) {
          el.close();
        }
        document.body.style.overflow = '';
      }
    });

    // Guarantee the body style is cleaned up even if the component is
    // destroyed while the dialog is still open (e.g. route navigation).
    this.destroyRef.onDestroy(() => {
      document.body.style.overflow = '';
    });
  }

  // #endregion Constructor

  // #region Event Handlers

  /**
   * Handles the native `cancel` event dispatched by the browser when the
   * user presses the Escape key.
   *
   * Prevents the default browser close behaviour so that the `open` signal
   * remains the single source of truth, then updates it to `false`.
   *
   * @param event - The native cancel event.
   */
  onNativeCancel(event: Event): void {
    event.preventDefault();
    this.open.set(false);
  }

  /**
   * Handles click events on the `<dialog>` element. When `closeOnBackdrop`
   * is enabled and the click target is the `<dialog>` itself (i.e. the
   * backdrop area outside the panel), the dialog is closed.
   *
   * @param event - The native mouse-click event.
   */
  onDialogClick(event: MouseEvent): void {
    if (!this.closeOnBackdrop()) {
      return;
    }

    if (event.target === this.dialogEl().nativeElement) {
      this.open.set(false);
    }
  }

  /**
   * Closes the dialog when the user clicks the close (×) button in the
   * dialog header.
   */
  onCloseClick(): void {
    this.open.set(false);
  }

  // #endregion Event Handlers
}
