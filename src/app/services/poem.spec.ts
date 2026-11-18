import { dayWord, verseLines, Booking } from './poem';
import { CONFIG } from '../data/config';

const dinner = CONFIG.activities.find(a => a.id === 'dinner')!;
const bk = (date: string, time: string): Booking => ({ activity: dinner, date, time, note: '' });

describe('poem', () => {
  it('dayWord', () => {
    expect(dayWord(1)).toBe('întâi');
    expect(dayWord(21)).toBe('douăzeci și unu');
    expect(dayWord(27)).toBe('douăzeci și șapte');
    expect(dayWord(31)).toBe('treizeci și unu');
  });
  it('verseLines uses date and time phrase', () => {
    const l = verseLines(bk('2026-11-27', '20:00'));
    expect(l.length).toBe(4);
    expect(l[0]).toBe('vineri, douăzeci și șapte noiembrie,');
    expect(l[1]).toBe('la opt, sub luminile orașului,');
  });
  it('falls back for unknown time', () => {
    expect(verseLines(bk('2026-11-27', '21:15'))[1]).toBe('la ora 21:15,');
  });
  it('renders a custom stanza template', () => {
    const cfg = { ...CONFIG, stanza: { ...CONFIG.stanza, lines: ['{vers1}', '— {zi} {data}, {ora}', '{nope}'] } };
    expect(verseLines(bk('2026-11-27', '20:00'), cfg)).toEqual([
      dinner.verse[0], '— vineri douăzeci și șapte noiembrie, la opt, sub luminile orașului', '{nope}',
    ]);
  });
  it('uses timeFallback for times missing from config', () => {
    const cfg = { ...CONFIG, stanza: { lines: ['{ora}'], timeFallback: 'pe la {hh}' } };
    expect(verseLines(bk('2026-11-27', '21:15'), cfg)).toEqual(['pe la 21:15']);
  });
});
