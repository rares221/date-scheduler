import { TestBed } from '@angular/core/testing';
import { AvailabilityService } from './availability.service';
import { APP_CONFIG, CONFIG } from '../data/config';
import { Activity, AvailabilityDay } from '../data/config.types';

const today = new Date(2026, 10, 18);
const mk = (availability: AvailabilityDay[]) => {
  TestBed.configureTestingModule({ providers: [{ provide: APP_CONFIG, useValue: { ...CONFIG, availability } }] });
  return TestBed.inject(AvailabilityService);
};
const act = (times?: string[]): Activity => ({ ...CONFIG.activities[0], times });
const avail: AvailabilityDay[] = [
  { date: '2026-11-10', times: ['20:00'] },
  { date: '2026-11-27', times: ['21:15', '18:30', '20:00'] },
  { date: '2026-11-29', times: ['12:00'] },
  { date: '2026-11-27', times: ['20:00'] },
];

describe('AvailabilityService', () => {
  it('merges, sorts and drops past days', () => {
    expect(mk(avail).availDays(today)).toEqual([
      { date: '2026-11-27', times: ['18:30', '20:00', '21:15'] },
      { date: '2026-11-29', times: ['12:00'] },
    ]);
  });
  it('past-only availability is none', () => {
    const s = mk([{ date: '2026-11-10', times: ['20:00'] }]);
    expect(s.hasAvailability(today)).toBe(false);
    expect(s.timesFor(null, '', today)).toEqual(Object.keys(CONFIG.times));
  });
  it('filters by activity times', () => {
    const s = mk(avail);
    expect(s.usableDays(act(['12:00']), today)).toEqual([{ date: '2026-11-29', times: ['12:00'] }]);
    expect(s.usableDays(act(['09:00']), today)).toEqual([]);
    expect(s.timesFor(act(['12:00']), '2026-11-29', today)).toEqual(['12:00']);
    expect(s.timesFor(null, '2026-11-27', today)).toEqual(['18:30', '20:00', '21:15']);
  });
  it('dayLabel', () => {
    const s = mk([]);
    expect(s.dayLabel('2026-11-29')).toBe('dum 29 nov');
    expect(s.dayLabel('2026-11-27')).toBe('vin 27 nov');
  });
  it('native mode times filtered by activity', () => {
    expect(mk([]).timesFor(act(['12:00']), '', today)).toEqual(['12:00']);
  });
});
