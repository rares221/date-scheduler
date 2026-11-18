import { buildICS, eventDesc, fold, gcalUrl, icsEsc } from './calendar';
import { Booking } from './poem';
import { CONFIG } from '../data/config';

const dinner = CONFIG.activities.find(a => a.id === 'dinner')!;
const bk = (date: string, time: string, note = ''): Booking => ({ activity: dinner, date, time, note });
const now = new Date('2026-11-18T10:00:00Z');

describe('calendar', () => {
  it('writes UTC across DST', () => {
    const ics = buildICS(bk('2026-11-27', '20:00'), CONFIG, now);
    expect(ics).toContain('DTSTART:20261127T180000Z');
    expect(ics).toContain('DTEND:20261127T203000Z');
    expect(ics).toContain('DTSTAMP:20261118T100000Z');
    expect(buildICS(bk('2027-07-10', '20:00'), CONFIG, now)).toContain('DTSTART:20270710T170000Z');
  });
  it('summary, alarm and no organizer when email empty', () => {
    const ics = buildICS(bk('2026-11-27', '20:00'), { ...CONFIG, organizerEmail: '' }, now);
    expect(ics).toContain('SUMMARY:Strofă nouă');
    expect(ics).toContain('TRIGGER:-PT2H');
    expect(ics).not.toContain('ORGANIZER');
    expect(buildICS(bk('2026-11-27', '20:00'), CONFIG, now)).toContain('ORGANIZER;CN=');
  });
  it('icsEsc escapes', () => {
    expect(icsEsc('Hai, te rog; cu \\ desert\nși flori')).toBe('Hai\\, te rog\\; cu \\\\ desert\\nși flori');
  });
  it('folds lines to <= 75 bytes', () => {
    const ics = buildICS(bk('2026-11-27', '20:00', 'ș,;\\'.repeat(75)), CONFIG, now);
    const enc = new TextEncoder();
    for (const line of ics.split('\r\n')) expect(enc.encode(line).length).toBeLessThanOrEqual(75);
    expect(fold('a'.repeat(100))).toContain('\r\n ');
  });
  it('gcalUrl', () => {
    const u = new URL(gcalUrl(bk('2026-11-27', '20:00')));
    expect(u.searchParams.get('dates')).toBe('20261127T180000Z/20261127T203000Z');
    expect(u.searchParams.get('ctz')).toBe('Europe/Bucharest');
    expect(u.searchParams.get('details')).not.toContain('Nota ta');
    expect(new URL(gcalUrl(bk('2026-11-27', '20:00', 'flori'))).searchParams.get('details')).toContain('Nota ta: flori');
  });
  it('eventDesc includes activity line', () => {
    expect(eventDesc(bk('2026-11-27', '20:00'))).toContain('Cină · aprobat de Sheeba');
  });
});
