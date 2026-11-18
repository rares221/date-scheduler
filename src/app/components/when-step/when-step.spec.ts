import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { APP_CONFIG, CONFIG } from '../../data/config';
import { BookingStateService } from '../../services/booking-state.service';
import { WhenStep } from './when-step';

function setup(availability: { date: string; times: string[] }[], activity?: unknown) {
  TestBed.configureTestingModule({ providers: [{ provide: APP_CONFIG, useValue: { ...CONFIG, availability } }] });
  const state = TestBed.inject(BookingStateService);
  if (activity) state.activity.set(activity as never);
  const f = TestBed.createComponent(WhenStep);
  const el = f.nativeElement as HTMLElement;
  return { f, el, state };
}
const chips = (el: HTMLElement, sel: string) => [...el.querySelectorAll<HTMLButtonElement>(sel)];

describe('WhenStep', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-18T10:00:00'));
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('falls back to native date input with 6 time chips', async () => {
    const { f, el } = setup([]);
    await f.whenStable();
    expect(el.querySelector('input[type=date]')).not.toBeNull();
    expect(chips(el, '.times .chip').length).toBe(6);
  });

  it('shows day chips, then times after picking a day', async () => {
    const { f, el } = setup([{ date: '2026-11-27', times: ['18:30', '20:00'] }]);
    await f.whenStable();
    expect(el.querySelector('input[type=date]')).toBeNull();
    const day = chips(el, '.dates .chip');
    expect(day.map((c) => c.textContent?.trim())).toEqual(['vin 27 nov']);
    expect(el.querySelector('.times')?.textContent).toContain('Alege întâi ziua.');
    day[0].click();
    await f.whenStable();
    expect(chips(el, '.times .chip').length).toBe(2);
  });

  it('shows the no-free-day message when the activity does not overlap', async () => {
    const { f, el } = setup([{ date: '2026-11-27', times: ['18:30'] }], { ...CONFIG.activities[0], times: ['09:00'] });
    await f.whenStable();
    expect(el.textContent).toContain('Pentru varianta asta n-am o zi liberă încă. Alege altceva?');
  });

  it('Gata! is disabled until a time is clicked', async () => {
    const { f, el, state } = setup([]);
    await f.whenStable();
    const done = el.querySelector('.btn-primary') as HTMLButtonElement;
    const d = el.querySelector('input[type=date]') as HTMLInputElement;
    d.value = '2030-01-05';
    d.dispatchEvent(new Event('input'));
    await f.whenStable();
    expect(done.disabled).toBe(true);
    chips(el, '.times .chip')[0].click();
    await f.whenStable();
    expect(done.disabled).toBe(false);
    done.click();
    expect(state.screen()).toBe('done');
  });

  it('clears date and time when a new activity makes the day unusable', async () => {
    const { f, el, state } = setup([{ date: '2026-11-27', times: ['18:30', '20:00'] }]);
    await f.whenStable();
    chips(el, '.dates .chip')[0].click();
    await f.whenStable();
    chips(el, '.times .chip')[0].click();
    await f.whenStable();
    expect(state.date()).toBe('2026-11-27');
    expect(state.time()).toBe('18:30');
    state.activity.set({ ...CONFIG.activities[0], times: ['12:00'] } as never);
    await f.whenStable();
    expect(state.date()).toBe('');
    expect(state.time()).toBe('');
  });

  it('clears a time not offered on the newly selected day', async () => {
    const { f, el, state } = setup([
      { date: '2026-11-27', times: ['18:30', '20:00'] },
      { date: '2026-11-28', times: ['20:00'] },
    ]);
    await f.whenStable();
    chips(el, '.dates .chip')[0].click();
    await f.whenStable();
    chips(el, '.times .chip')[0].click();
    await f.whenStable();
    expect(state.time()).toBe('18:30');
    chips(el, '.dates .chip')[1].click();
    await f.whenStable();
    expect(state.date()).toBe('2026-11-28');
    expect(state.time()).toBe('');
  });

  it('native mode: clears a time the new activity excludes', async () => {
    const { f, el, state } = setup([]);
    await f.whenStable();
    const all = chips(el, '.times .chip');
    const first = all[0].textContent!.trim();
    const last = all[all.length - 1].textContent!.trim();
    all[0].click();
    await f.whenStable();
    expect(state.time()).toBe(first);
    state.activity.set({ ...CONFIG.activities[0], times: [last] } as never);
    await f.whenStable();
    expect(state.time()).toBe('');
  });
});
