// #region Imports
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RegisterFormComponent } from '../../components/register-form/register-form.component';
// #endregion Imports

/**
 * Registration page for the auth feature.
 *
 * A centred page-level shell that renders the {@link RegisterFormComponent}.
 * Protected by {@link guestGuard} — authenticated users are redirected to `/users`.
 */
@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [RegisterFormComponent],
  templateUrl: './register.page.html',
  styleUrl: './register.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterPage {}
