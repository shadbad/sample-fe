import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { App } from './app';
import { ThemeService } from './core/theme/theme.service';

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
