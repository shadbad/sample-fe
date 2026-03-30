// #region Imports
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
// #endregion Imports

/**
 * Application footer organism.
 *
 * Renders a fixed bottom bar (`position: fixed; bottom: 0`) that is always
 * visible below the page content. Its inner content is constrained to the
 * standard page width via the `wrapper` mixin, mirroring the header layout.
 *
 * Currently displays a copyright notice. Additional footer content can be
 * added here as the application grows.
 *
 * Belongs to the **organism** tier of the atomic design hierarchy.
 */
@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {
  // #region State

  /** The current year used in the copyright notice. */
  readonly currentYear = new Date().getFullYear();

  // #endregion State
}
