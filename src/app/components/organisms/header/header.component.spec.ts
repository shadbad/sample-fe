// #region Imports
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthFacade } from '@features/auth';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import { describe, expect, it, vi } from 'vitest';
import { HeaderComponent } from './header.component';
// #endregion Imports

// #region Mocks

/** Minimal {@link AuthFacade} stub — only the `logout` method is exercised here. */
const mockAuthFacade = {
  /** Resolves immediately without contacting the server. */
  logout: vi.fn().mockResolvedValue(undefined),
};

// #endregion Mocks

// #region Test Helpers

/** Minimal English translations required by this component tree. */
const EN_TRANSLATIONS = {
  header: { logoAriaLabel: 'Go to home page', navAriaLabel: 'Main navigation' },
  common: { appName: 'Sample App' },
  nav: { users: 'Users', logout: 'Log out' },
};

// #endregion Test Helpers

describe('HeaderComponent', () => {
  // #region Helpers

  /**
   * Renders the component, then loads translations synchronously so
   * impure {@link TranslatePipe} instances pick them up after one
   * extra change-detection cycle.
   */
  async function setup(): Promise<void> {
    const { fixture } = await render(HeaderComponent, {
      providers: [
        provideRouter([]),
        provideTranslateService(),
        // AuthFacade (via AppNavComponent) needs AUTH_CONFIG — stub it out so
        // this organism-level test stays isolated from the auth DI graph.
        { provide: AuthFacade, useValue: mockAuthFacade },
      ],
    });

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', EN_TRANSLATIONS);
    translate.use('en');
    fixture.detectChanges();
    await fixture.whenStable();
  }

  // #endregion Helpers

  // #region Tests

  it('should render the banner landmark', async () => {
    await setup();

    const banner = screen.getByRole('banner');

    expect(banner).toBeInTheDocument();
  });

  it('should render the home page brand link', async () => {
    await setup();

    const homeLink = screen.getByRole('link', { name: /go to home page/i });

    expect(homeLink).toBeInTheDocument();
  });

  it('should render the main navigation', async () => {
    await setup();

    const nav = screen.getByRole('navigation', { name: /main navigation/i });

    expect(nav).toBeInTheDocument();
  });

  it('should render Users and Logout links', async () => {
    await setup();

    expect(screen.getByRole('link', { name: /users/i })).toBeInTheDocument();
    // Logout is rendered as a <button>, not an anchor link.
    expect(screen.getByRole('button', { name: /log out/i })).toBeInTheDocument();
  });

  // #endregion Tests
});
