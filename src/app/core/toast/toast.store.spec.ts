// #region Imports
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastStore } from './toast.store';
// #endregion Imports

// #region Test Suite

describe('ToastStore', () => {
  // #region Setup / Teardown
  beforeEach(() => {
    vi.useFakeTimers();

    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    vi.useRealTimers();
  });
  // #endregion Setup / Teardown

  // #region Push

  describe('push', () => {
    it('adds a toast entry to the state', () => {
      const store = TestBed.inject(ToastStore);

      store.push({ message: 'Hello', level: 'info' });

      expect(store.toasts()).toHaveLength(1);
      expect(store.toasts()[0].message).toBe('Hello');
      expect(store.toasts()[0].level).toBe('info');
    });

    it('assigns a unique id to each toast', () => {
      const store = TestBed.inject(ToastStore);

      store.push({ message: 'A', level: 'info' });
      store.push({ message: 'B', level: 'info' });

      const ids = store.toasts().map((t) => t.id);
      expect(new Set(ids).size).toBe(2);
    });

    it('sets durationMs to 5000 for "subtle" level', () => {
      const store = TestBed.inject(ToastStore);

      store.push({ message: 'msg', level: 'subtle' });

      expect(store.toasts()[0].durationMs).toBe(5_000);
    });

    it('sets durationMs to 5000 for "info" level', () => {
      const store = TestBed.inject(ToastStore);

      store.push({ message: 'msg', level: 'info' });

      expect(store.toasts()[0].durationMs).toBe(5_000);
    });

    it('sets durationMs to 0 (sticky) for "warning" level', () => {
      const store = TestBed.inject(ToastStore);

      store.push({ message: 'msg', level: 'warning' });

      expect(store.toasts()[0].durationMs).toBe(0);
    });

    it('sets durationMs to 0 (sticky) for "error" level', () => {
      const store = TestBed.inject(ToastStore);

      store.push({ message: 'msg', level: 'error' });

      expect(store.toasts()[0].durationMs).toBe(0);
    });

    it('auto-dismisses a "subtle" toast after 5000 ms', () => {
      const store = TestBed.inject(ToastStore);

      store.push({ message: 'auto', level: 'subtle' });
      expect(store.toasts()).toHaveLength(1);

      vi.advanceTimersByTime(5_000);

      expect(store.toasts()).toHaveLength(0);
    });

    it('auto-dismisses an "info" toast after 5000 ms', () => {
      const store = TestBed.inject(ToastStore);

      store.push({ message: 'auto', level: 'info' });
      vi.advanceTimersByTime(5_000);

      expect(store.toasts()).toHaveLength(0);
    });

    it('does NOT auto-dismiss a "warning" toast after 5000 ms', () => {
      const store = TestBed.inject(ToastStore);

      store.push({ message: 'sticky', level: 'warning' });
      vi.advanceTimersByTime(10_000);

      expect(store.toasts()).toHaveLength(1);
    });

    it('does NOT auto-dismiss an "error" toast after 5000 ms', () => {
      const store = TestBed.inject(ToastStore);

      store.push({ message: 'sticky', level: 'error' });
      vi.advanceTimersByTime(10_000);

      expect(store.toasts()).toHaveLength(1);
    });

    it('respects a custom durationMs override', () => {
      const store = TestBed.inject(ToastStore);

      store.push({ message: 'custom', level: 'info', durationMs: 1_000 });
      vi.advanceTimersByTime(1_000);

      expect(store.toasts()).toHaveLength(0);
    });
  });
  // #endregion Push

  // #region Dismiss

  describe('dismiss', () => {
    it('removes a toast by id', () => {
      const store = TestBed.inject(ToastStore);

      store.push({ message: 'to remove', level: 'error' });
      const id = store.toasts()[0].id;

      store.dismiss(id);

      expect(store.toasts()).toHaveLength(0);
    });

    it('leaves other toasts intact when dismissing by id', () => {
      const store = TestBed.inject(ToastStore);

      store.push({ message: 'A', level: 'error' });
      store.push({ message: 'B', level: 'info' });
      const idA = store.toasts()[0].id;

      store.dismiss(idA);

      expect(store.toasts()).toHaveLength(1);
      expect(store.toasts()[0].message).toBe('B');
    });

    it('is a no-op for an unknown id', () => {
      const store = TestBed.inject(ToastStore);

      store.push({ message: 'keep', level: 'info' });
      store.dismiss('non-existent-id');

      expect(store.toasts()).toHaveLength(1);
    });
  });
  // #endregion Dismiss
});
// #endregion Test Suite
