import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BookingStateService } from '../../services/booking-state.service';
import { FxService } from '../../services/fx.service';
import { MusicService } from '../../services/music.service';
import { NotifyService } from '../../services/notify.service';
import { Question } from './question';

function setup() {
  const music = { switchSong: vi.fn() };
  const notify = { send: vi.fn() };
  const fx = { burst: vi.fn() };
  const state = { go: vi.fn() };
  TestBed.configureTestingModule({
    providers: [
      { provide: MusicService, useValue: music },
      { provide: NotifyService, useValue: notify },
      { provide: FxService, useValue: fx },
      { provide: BookingStateService, useValue: state },
    ],
  });
  const f = TestBed.createComponent(Question);
  const el = f.nativeElement as HTMLElement;
  const q = <T extends HTMLElement>(s: string) => el.querySelector(s) as T;
  const type = async (v: string) => {
    const ta = q<HTMLTextAreaElement>('textarea');
    ta.value = v;
    ta.dispatchEvent(new Event('input'));
    await f.whenStable();
  };
  return { f, el, q, type, music, notify, fx, state };
}

describe('Question', () => {
  afterEach(() => vi.useRealTimers());

  it('shows title and subtitle', async () => {
    const { f, el } = setup();
    await f.whenStable();
    expect(el.querySelector('h1')?.textContent).toBe('Iubito, ieși cu mine?');
    expect(el.querySelector('.no-link')?.textContent?.trim()).toBe('nu');
  });

  it('nu shows form and caption and switches to the no song', async () => {
    const { f, q, music } = setup();
    await f.whenStable();
    expect(q('form').hidden).toBe(true);
    q<HTMLButtonElement>('.no-link').click();
    await f.whenStable();
    expect(music.switchSong).toHaveBeenCalledWith('no');
    expect(q('form').hidden).toBe(false);
    expect(q('.msg').textContent).toBe('Sheeba te privește.');
    expect(q('label').textContent).toContain('Sheeba vrea un motiv bun');
  });

  it('disables submit under 3 chars', async () => {
    const { f, q, type } = setup();
    q<HTMLButtonElement>('.no-link').click();
    await type('ab');
    expect(q<HTMLButtonElement>('form button').disabled).toBe(true);
    await type('abc');
    expect(q<HTMLButtonElement>('form button').disabled).toBe(false);
    expect(f).toBeTruthy();
  });

  it('sends once per distinct text, re-enabling on edit', async () => {
    const { f, q, type, notify } = setup();
    q<HTMLButtonElement>('.no-link').click();
    await type('motiv; bun');
    const form = q<HTMLFormElement>('form');
    form.dispatchEvent(new Event('submit'));
    form.dispatchEvent(new Event('submit'));
    await f.whenStable();
    expect(notify.send).toHaveBeenCalledTimes(1);
    expect(notify.send).toHaveBeenCalledWith('Motivul ei pentru „nu”', { motiv: 'motiv; bun' });
    expect(q<HTMLButtonElement>('form button').disabled).toBe(true);
    expect(q('form .msg').textContent).toContain('Sheeba a primit motivul');
    await type('motiv; bun!');
    expect(q<HTMLButtonElement>('form button').disabled).toBe(false);
    form.dispatchEvent(new Event('submit'));
    expect(notify.send).toHaveBeenCalledTimes(2);
  });

  it('Da switches song, bursts, and goes to activity after 600ms', async () => {
    vi.useFakeTimers();
    const { q, music, fx, state } = setup();
    q<HTMLButtonElement>('.btn-primary').click();
    expect(music.switchSong).toHaveBeenCalledWith('yes');
    expect(fx.burst).toHaveBeenCalledWith('confetti', 90);
    expect(state.go).not.toHaveBeenCalled();
    vi.advanceTimersByTime(600);
    expect(state.go).toHaveBeenCalledWith('activity');
  });

  it('renders a reason with markup as text', async () => {
    const { f, el, q, type, notify } = setup();
    q<HTMLButtonElement>('.no-link').click();
    await type('<b>x</b>');
    q<HTMLFormElement>('form').dispatchEvent(new Event('submit'));
    await f.whenStable();
    expect(el.querySelector('b')).toBeNull();
    expect(q<HTMLTextAreaElement>('textarea').value).toBe('<b>x</b>');
    expect(notify.send).toHaveBeenCalledWith(expect.any(String), { motiv: '<b>x</b>' });
  });
});
