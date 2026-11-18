import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FxService } from './fx.service';

describe('FxService', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('burst adds n particles and removes them after 6.5 s', () => {
    const fx = TestBed.inject(FxService);
    fx.burst('confetti', 3);
    expect(fx.particles().length).toBe(3);
    expect(fx.particles().every((p) => p.kind === 'confetti')).toBe(true);
    vi.advanceTimersByTime(6499);
    expect(fx.particles().length).toBe(3);
    vi.advanceTimersByTime(1);
    expect(fx.particles().length).toBe(0);
  });

  it('sparkles are gold dots with sizes 4-10px', () => {
    const fx = TestBed.inject(FxService);
    fx.burst('sparkles', 20);
    for (const p of fx.particles()) {
      expect(p.kind).toBe('sparkles');
      const size = parseFloat(p.style['width']);
      expect(size).toBeGreaterThanOrEqual(4);
      expect(size).toBeLessThanOrEqual(10);
    }
  });

  it('separate bursts expire independently', () => {
    const fx = TestBed.inject(FxService);
    fx.burst('confetti', 2);
    vi.advanceTimersByTime(3000);
    fx.burst('sparkles', 2);
    vi.advanceTimersByTime(3500);
    expect(fx.particles().length).toBe(2);
  });
});
