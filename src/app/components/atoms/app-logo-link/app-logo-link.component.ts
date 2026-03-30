// #region Imports
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
// #endregion Imports

/**
 * Brand logo-link atom.
 *
 * Renders the application name as a navigable anchor pointing to the root
 * route (`/`). This is a static, self-contained atom with no inputs or
 * outputs — it never depends on any child component.
 *
 * Belongs to the **atom** tier of the atomic design hierarchy.
 */
@Component({
  selector: 'app-logo-link',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  templateUrl: './app-logo-link.component.html',
  styleUrl: './app-logo-link.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppLogoLinkComponent {}
