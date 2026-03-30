// #region Imports
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainerComponent } from './core/logging';
import { ThemeService } from './core/theme';
// #endregion Imports

/**
 * Root application component.
 *
 * Acts as the top-level shell: renders the app header, the router outlet,
 * and the global toast notification container.
 *
 * Injecting {@link ThemeService} here guarantees that `data-theme` is written
 * to `<html>` before the first render, preventing any flash of unstyled content.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainerComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  // #region Dependencies

  /**
   * Injects {@link ThemeService} to ensure `data-theme` is written to `<html>`
   * before the first render. Exposes the reactive theme signal directly so
   * the template (or child components) can bind to it if needed.
   */
  readonly theme = inject(ThemeService).theme;

  // #endregion Dependencies
}
