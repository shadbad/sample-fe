// #region Imports
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { AppLogoLinkComponent } from './app-logo-link.component';
// #endregion Imports

// #region Test Helpers

/** Minimal English translations required by this component. */
const EN_TRANSLATIONS = {
  header: { logoAriaLabel: 'Go to home page' },
  common: { appName: 'Sample App' },
};

// #endregion Test Helpers

describe('AppLogoLinkComponent', () => {
  // #region Helpers

  /**
   * Renders the component, then loads translations synchronously so
   * impure {@link TranslatePipe} instances pick them up after one
   * extra change-detection cycle.
   */
  async function setup(): Promise<void> {
    const { fixture } = await render(AppLogoLinkComponent, {
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

  it('should render a link pointing to the home page', async () => {
    await setup();

    const link = screen.getByRole('link', { name: /go to home page/i });

    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/');
  });

  it('should display the application name', async () => {
    await setup();

    const name = screen.getByText(/sample app/i);

    expect(name).toBeVisible();
  });

  // #endregion Tests
});
