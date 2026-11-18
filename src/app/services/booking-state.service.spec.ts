import { TestBed } from '@angular/core/testing';
import { CONFIG } from '../data/config';
import { BookingStateService } from './booking-state.service';

describe('BookingStateService', () => {
  let s: BookingStateService;
  beforeEach(() => {
    window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
    s = TestBed.inject(BookingStateService);
  });

  it('booking is null until activity, date and time are set', () => {
    expect(s.booking()).toBeNull();
    s.activity.set(CONFIG.activities[0]);
    expect(s.booking()).toBeNull();
    s.date.set('2026-12-01');
    expect(s.booking()).toBeNull();
    s.time.set('19:00');
    expect(s.booking()).toEqual({ activity: CONFIG.activities[0], date: '2026-12-01', time: '19:00', note: '' });
  });

  it('noteText trims and caps at 200', () => {
    s.note.set('  ' + 'a'.repeat(250));
    expect(s.noteText().length).toBe(200);
  });

  it('go sets screen and scrolls to top', () => {
    s.go('when');
    expect(s.screen()).toBe('when');
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
  });
});
