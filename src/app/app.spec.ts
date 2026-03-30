import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { vi } from 'vitest';
import { App } from './app';
import { ThemeService } from './core/theme/theme.service';
import { AuthFacade } from './features/auth';

/** Minimal {@link AuthFacade} stub — only the `logout` method is exercised here. */
const mockAuthFacade = {
  /** Resolves immediately without contacting the server. */
  logout: vi.fn().mockResolvedValue(undefined),
};

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        provideTranslateService({}),
        // ThemeService calls window.matchMedia at construction time.
        // The global polyfill in test-setup.ts handles the default case;
        // this override ensures any future direct ThemeService tests stay isolated.
        {
          provide: ThemeService,
          useValue: { theme: () => 'light', setTheme: () => void 0, toggleTheme: () => void 0 },
        },
        // AuthFacade is provided at root level but requires AUTH_CONFIG; replace it
        // with a lightweight stub so this shell-level test remains isolated from
        // the auth feature's DI graph.
        { provide: AuthFacade, useValue: mockAuthFacade },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the main content landmark', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('main')).toBeTruthy();
  });
});
