// #region Imports
import { provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { NavLinkComponent } from './nav-link.component';
// #endregion Imports

describe('NavLinkComponent', () => {
  // #region Helpers

  /**
   * Renders the component via an inline template that projects a label,
   * simulating real usage inside a parent component.
   *
   * @param href - The router path to bind to `[routerLink]`.
   * @param label - The visible text content to project.
   */
  async function setup(href: string, label: string): Promise<void> {
    await render(`<app-nav-link href="${href}">${label}</app-nav-link>`, {
      imports: [NavLinkComponent],
      providers: [provideRouter([])],
    });
  }

  // #endregion Helpers

  // #region Tests

  it('should render an anchor with the projected label', async () => {
    await setup('/users', 'Users');

    const link = screen.getByRole('link', { name: /users/i });

    expect(link).toBeInTheDocument();
  });

  it('should use the provided href as the router link target', async () => {
    await setup('/users', 'Users');

    const link = screen.getByRole('link', { name: /users/i });

    expect(link).toHaveAttribute('href', '/users');
  });

  // #endregion Tests
});
