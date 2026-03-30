// #region Imports
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { AppNavComponent } from './app-nav.component';
// #endregion Imports

// #region Test Helpers

/** Minimal English translations required by this component. */
const EN_TRANSLATIONS = {
  header: { navAriaLabel: 'Main navigation' },
  nav: { users: 'Users', logout: 'Log out' },
};

// #endregion Test Helpers

describe('AppNavComponent', () => {
  // #region Helpers

  /**
   * Renders the component, then loads translations synchronously so
   * impure {@link TranslatePipe} instances pick them up after one
   * extra change-detection cycle.
   */
  async function setup(): Promise<void> {
    const { fixture } = await render(AppNavComponent, {
      providers: [provideRouter([]), provideTranslateService()],
    });

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', EN_TRANSLATIONS);
    translate.use('en');
    fixture.detectChanges();
    await fixture.whenStable();
  }

  // #endregion Helpers

  // #region Tests

  it('should render the main navigation landmark', async () => {
    await setup();

    const nav = screen.getByRole('navigation', { name: /main navigation/i });

    expect(nav).toBeInTheDocument();
  });

  it('should render the Users link', async () => {
    await setup();

    const usersLink = screen.getByRole('link', { name: /users/i });

    expect(usersLink).toBeInTheDocument();
    expect(usersLink).toHaveAttribute('href', '/users');
  });

  it('should render the Logout link', async () => {
    await setup();

    const logoutLink = screen.getByRole('link', { name: /log out/i });

    expect(logoutLink).toBeInTheDocument();
    expect(logoutLink).toHaveAttribute('href', '/logout');
  });

  // #endregion Tests
});
