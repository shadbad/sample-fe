// #region Imports
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainerComponent } from './core/logging';
// #endregion Imports

/**
 * Root application component.
 *
 * Acts as the top-level shell: renders the app header, the router outlet,
 * and the global toast notification container.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainerComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
