// #region Imports
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthFacade } from '@features/auth';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import { describe, expect, it, vi } from 'vitest';
import { AppNavComponent } from './app-nav.component';
// #endregion Imports

// #region Mocks

/**
 * Builds a minimal {@link AuthFacade} stub with a configurable `isAuthenticated` signal.
 *
 * @param authenticated - Whether the stub should report the user as logged in.
 * @returns A partial facade mock suitable for use with `useValue`.
 */
function buildMockAuthFacade(authenticated: boolean) {
  return {
    /** Signal-backed authentication flag. */
    isAuthenticated: signal(authenticated),
    /** Resolves immediately without contacting the server. */
    logout: vi.fn().mockResolvedValue(undefined),
  };
}

// #endregion Mocks

// #region Test Helpers

/** Minimal English translations required by this component. */
const EN_TRANSLATIONS = {
  header: { navAriaLabel: 'Main navigation' },
  nav: { users: 'Users', logout: 'Log out' },
};

/**
 * Renders the component with the given auth state, then loads translations
 * synchronously so impure {@link TranslatePipe} instances pick them up after
 * one extra change-detection cycle.
 *
 * @param authenticated - Whether to simulate an authenticated session.
 */
async function setup(authenticated: boolean): Promise<void> {
  const { fixture } = await render(AppNavComponent, {
    providers: [
      provideRouter([]),
      provideTranslateService(),
      { provide: AuthFacade, useValue: buildMockAuthFacade(authenticated) },
    ],
  });

  const translate = TestBed.inject(TranslateService);
  translate.setTranslation('en', EN_TRANSLATIONS);
  translate.use('en');
  fixture.detectChanges();
  await fixture.whenStable();
}

// #endregion Test Helpers

describe('AppNavComponent', () => {
  // #region Tests — always visible

  it('should render the main navigation landmark', async () => {
    await setup(true);

    const nav = screen.getByRole('navigation', { name: /main navigation/i });

    expect(nav).toBeInTheDocument();
  });

  // #endregion Tests — always visible

  // #region Tests — authenticated

  it('should render the Users link when authenticated', async () => {
    await setup(true);

    const usersLink = screen.getByRole('link', { name: /users/i });

    expect(usersLink).toBeInTheDocument();
    expect(usersLink).toHaveAttribute('href', '/users');
  });

  it('should render the Logout button when authenticated', async () => {
    await setup(true);

    const logoutBtn = screen.getByRole('button', { name: /log out/i });

    expect(logoutBtn).toBeInTheDocument();
  });

  // #endregion Tests — authenticated

  // #region Tests — unauthenticated

  it('should not render the Users link when not authenticated', async () => {
    await setup(false);

    expect(screen.queryByRole('link', { name: /users/i })).not.toBeInTheDocument();
  });

  it('should not render the Logout button when not authenticated', async () => {
    await setup(false);

    expect(screen.queryByRole('button', { name: /log out/i })).not.toBeInTheDocument();
  });

  // #endregion Tests — unauthenticated
});
