import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { FxService } from '../../services/fx.service';
import { MusicService } from '../../services/music.service';
import { Gate } from './gate';

function setup() {
  const status = signal('loading');
  const unlocked = signal(false);
  const music = { status, unlocked, slotRect: signal(null), unlock: vi.fn() };
  const fx = { burst: vi.fn() };
  TestBed.configureTestingModule({
    providers: [
      { provide: MusicService, useValue: music },
      { provide: FxService, useValue: fx },
    ],
  });
  const f = TestBed.createComponent(Gate);
  return { f, el: f.nativeElement as HTMLElement, status, unlocked, music, fx };
}

describe('Gate', () => {
  it('renders copy and slot', async () => {
    const { f, el } = setup();
    await f.whenStable();
    expect(el.textContent).toContain('Ai un mesaj');
    expect(el.textContent).toContain('Pune-ți căștile și apasă play.');
    expect(el.textContent).toContain('Press play');
    expect(el.querySelector('#slot')).not.toBeNull();
  });

  it('shows error message and primary skip on error; skip unlocks without music', async () => {
    const { f, el, status, music } = setup();
    status.set('error');
    await f.whenStable();
    expect(el.textContent).toContain('Muzica nu se poate încărca aici.');
    const skip = el.querySelector('button') as HTMLButtonElement;
    expect(skip.classList.contains('btn-primary')).toBe(true);
    skip.click();
    expect(music.unlock).toHaveBeenCalledWith(false);
  });

  it('skip appears after 6s', async () => {
    vi.useFakeTimers();
    try {
      const { f, el } = setup();
      f.detectChanges();
      const skip = el.querySelector('button') as HTMLButtonElement;
      expect(skip.classList.contains('show')).toBe(false);
      vi.advanceTimersByTime(6001);
      f.detectChanges();
      expect(skip.classList.contains('show')).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('fades and bursts sparkles exactly once on unlock', async () => {
    const { f, el, unlocked, fx } = setup();
    await f.whenStable();
    expect((el.querySelector('.gate') as HTMLElement).classList.contains('gone')).toBe(false);
    expect(fx.burst).not.toHaveBeenCalled();
    unlocked.set(true);
    await f.whenStable();
    expect((el.querySelector('.gate') as HTMLElement).classList.contains('gone')).toBe(true);
    expect(fx.burst).toHaveBeenCalledTimes(1);
    expect(fx.burst).toHaveBeenCalledWith('sparkles', 18);
  });
});
