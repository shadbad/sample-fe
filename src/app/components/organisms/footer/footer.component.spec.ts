// #region Imports
import { TestBed } from '@angular/core/testing';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { FooterComponent } from './footer.component';
// #endregion Imports

// #region Test Helpers

/** Minimal English translations required by this component. */
const EN_TRANSLATIONS = {
  footer: { copyright: '\u00a9 {{year}} Sample App. All rights reserved.' },
};

// #endregion Test Helpers

describe('FooterComponent', () => {
  // #region Helpers

  /**
   * Renders the component, then loads translations synchronously so
   * impure {@link TranslatePipe} instances pick them up after one
   * extra change-detection cycle.
   */
  async function setup(): Promise<void> {
    const { fixture } = await render(FooterComponent, {
      providers: [provideTranslateService()],
    });

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', EN_TRANSLATIONS);
    translate.use('en');
    fixture.detectChanges();
    await fixture.whenStable();
  }

  // #endregion Helpers

  // #region Tests

  it('should render the contentinfo landmark', async () => {
    await setup();

    const footer = screen.getByRole('contentinfo');

    expect(footer).toBeInTheDocument();
  });

  it('should display a copyright notice containing the current year', async () => {
    await setup();

    const currentYear = new Date().getFullYear().toString();
    const copyright = screen.getByText(new RegExp(currentYear));

    expect(copyright).toBeVisible();
  });

  // #endregion Tests
});
