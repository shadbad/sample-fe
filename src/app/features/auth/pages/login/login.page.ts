// #region Imports
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LoginFormComponent } from '../../components/login-form/login-form.component';
// #endregion Imports

/**
 * Login page for the auth feature.
 *
 * A centred page-level shell that renders the {@link LoginFormComponent}.
 * Protected by {@link guestGuard} — authenticated users are redirected to `/users`.
 */
@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [LoginFormComponent],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {}
