// #region Imports
import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastStore } from '../toast/toast.store';
import { LOG_CONFIG } from './log-config.token';
import { LogLevel } from './log.model';
import { LogService } from './log.service';
// #endregion Imports

// #region Test Suite

describe('LogService', () => {
  // #region Mocks
  /**
   * Console spy references, refreshed in `beforeEach` before each test so that
   * `vi.restoreAllMocks()` in `afterEach` does not orphan them.
   */
  let consoleMocks: {
    readonly debug: ReturnType<typeof vi.spyOn>;
    readonly info: ReturnType<typeof vi.spyOn>;
    readonly warn: ReturnType<typeof vi.spyOn>;
    readonly error: ReturnType<typeof vi.spyOn>;
  };

  /** Mock `TranslateService` — returns the key as-is for predictable assertions. */
  const mockTranslate = {
    instant: vi.fn((key: string): string => key),
  };

  /** Mock `ToastStore` with a typed push spy. */
  const mockToastStore = {
    push: vi.fn<(payload: { readonly message: string; readonly level: string }) => void>(),
  };
  // #endregion Mocks

  // #region Setup / Teardown
  beforeEach(() => {
    // Re-create console spies each time so restoreAllMocks() in afterEach
    // does not orphan the references used in assertions.
    consoleMocks = {
      debug: vi.spyOn(console, 'debug').mockImplementation(() => undefined),
      info: vi.spyOn(console, 'info').mockImplementation(() => undefined),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => undefined),
      error: vi.spyOn(console, 'error').mockImplementation(() => undefined),
    };

    vi.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [
        LogService,
        { provide: LOG_CONFIG, useValue: { minLevel: LogLevel.Debug } },
        { provide: TranslateService, useValue: mockTranslate },
        { provide: ToastStore, useValue: mockToastStore },
      ],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
  // #endregion Setup / Teardown

  // #region Console output

  describe('console output', () => {
    it('calls console.debug for debug entries', () => {
      const service = TestBed.inject(LogService);

      service.debug({ message: 'debug msg' });

      expect(consoleMocks.debug).toHaveBeenCalledWith('[DEBUG]', 'debug msg');
    });

    it('calls console.info for info entries', () => {
      const service = TestBed.inject(LogService);

      service.info({ message: 'info msg' });

      expect(consoleMocks.info).toHaveBeenCalledWith('[INFO]', 'info msg');
    });

    it('calls console.warn for warn entries', () => {
      const service = TestBed.inject(LogService);

      service.warn({ message: 'warn msg' });

      expect(consoleMocks.warn).toHaveBeenCalledWith('[WARN]', 'warn msg');
    });

    it('calls console.error for error entries', () => {
      const service = TestBed.inject(LogService);

      service.error({ message: 'error msg' });

      expect(consoleMocks.error).toHaveBeenCalledWith('[ERROR]', 'error msg');
    });

    it('appends structured data as a third argument when data is present', () => {
      const service = TestBed.inject(LogService);
      const data = { userId: '123' };

      service.info({ message: 'with data', data });

      expect(consoleMocks.info).toHaveBeenCalledWith('[INFO]', 'with data', data);
    });
  });
  // #endregion Console output

  // #region Level filtering

  describe('level filtering', () => {
    it('drops debug and info calls when minLevel is Error', () => {
      TestBed.overrideProvider(LOG_CONFIG, { useValue: { minLevel: LogLevel.Error } });

      const service = TestBed.inject(LogService);
      service.debug({ message: 'debug' });
      service.info({ message: 'info' });
      service.warn({ message: 'warn' });

      expect(consoleMocks.debug).not.toHaveBeenCalled();
      expect(consoleMocks.info).not.toHaveBeenCalled();
      expect(consoleMocks.warn).not.toHaveBeenCalled();
    });

    it('still emits error when minLevel is Error', () => {
      TestBed.overrideProvider(LOG_CONFIG, { useValue: { minLevel: LogLevel.Error } });

      const service = TestBed.inject(LogService);
      service.error({ message: 'error' });

      expect(consoleMocks.error).toHaveBeenCalledOnce();
    });
  });
  // #endregion Level filtering

  // #region Toast integration

  describe('toast integration', () => {
    it('calls ToastStore.push with correct level when toastKey is present (info)', () => {
      const service = TestBed.inject(LogService);

      service.info({ message: 'logged', toastKey: 'auth.logoutSuccess' });

      expect(mockToastStore.push).toHaveBeenCalledWith({
        message: 'auth.logoutSuccess',
        level: 'info',
      });
    });

    it('calls ToastStore.push with "warning" for warn level', () => {
      const service = TestBed.inject(LogService);

      service.warn({ message: 'stale cache', toastKey: 'log.staleCache' });

      expect(mockToastStore.push).toHaveBeenCalledWith({
        message: 'log.staleCache',
        level: 'warning',
      });
    });

    it('calls ToastStore.push with "error" for error level', () => {
      const service = TestBed.inject(LogService);

      service.error({ message: 'server error', toastKey: 'errors.serverError' });

      expect(mockToastStore.push).toHaveBeenCalledWith({
        message: 'errors.serverError',
        level: 'error',
      });
    });

    it('calls ToastStore.push with "subtle" for debug level', () => {
      const service = TestBed.inject(LogService);

      service.debug({ message: 'debug toast', toastKey: 'log.genericError' });

      expect(mockToastStore.push).toHaveBeenCalledWith({
        message: 'log.genericError',
        level: 'subtle',
      });
    });

    it('does NOT call ToastStore.push when toastKey is absent', () => {
      const service = TestBed.inject(LogService);

      service.info({ message: 'no toast' });

      expect(mockToastStore.push).not.toHaveBeenCalled();
    });

    it('forwards toastParams to TranslateService.instant', () => {
      const service = TestBed.inject(LogService);

      service.warn({
        message: 'too short',
        toastKey: 'errors.minLength',
        toastParams: { value: 8 },
      });

      expect(mockTranslate.instant).toHaveBeenCalledWith('errors.minLength', { value: 8 });
    });
  });
  // #endregion Toast integration
});
// #endregion Test Suite
