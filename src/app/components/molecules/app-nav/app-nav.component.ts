// #region Imports
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NavLinkComponent } from '@components/atoms';
import { TranslatePipe } from '@ngx-translate/core';
// #endregion Imports

/**
 * Application primary navigation molecule.
 *
 * Renders the main `<nav>` element containing the **Users** and **Logout**
 * links. Composed exclusively from {@link NavLinkComponent} atoms.
 *
 * Belongs to the **molecule** tier of the atomic design hierarchy.
 */
@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [NavLinkComponent, TranslatePipe],
  templateUrl: './app-nav.component.html',
  styleUrl: './app-nav.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppNavComponent {}
