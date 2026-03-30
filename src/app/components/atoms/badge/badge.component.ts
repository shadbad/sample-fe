// #region Imports
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
// #endregion Imports

// #region Types
/**
 * Union of allowed badge colour variants.
 *
 * - `neutral`  — default, no semantic colour.
 * - `info`     — informational; blue palette.
 * - `success`  — positive / confirmed state; green palette.
 * - `warning`  — caution state; amber palette.
 * - `danger`   — critical / destructive state; red palette.
 */
export type BadgeVariant = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
// #endregion Types

/**
 * Status / role badge atom.
 *
 * Renders an inline pill with coloured background derived from the `variant`
 * input. When `text` is `null` a neutral "—" placeholder is shown so the
 * component always occupies space in table cells.
 *
 * @example
 * ```html
 * <!-- Admin role → danger variant -->
 * <app-badge [text]="user().role?.name ?? null" variant="danger" />
 * ```
 *
 * Belongs to the **atom** tier of the atomic design hierarchy.
 */
@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [],
  templateUrl: './badge.component.html',
  styleUrl: './badge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeComponent {
  // #region Inputs

  /**
   * The text label to display inside the badge.
   * Pass `null` to render the neutral "No role" placeholder.
   */
  readonly text = input<string | null>(null);

  /**
   * Colour variant that controls the badge's background and text colour.
   * Defaults to `'neutral'`.
   */
  readonly variant = input<BadgeVariant>('neutral');

  // #endregion Inputs
}
