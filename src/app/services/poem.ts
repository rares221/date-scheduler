import { CONFIG } from '../data/config';
import { AppConfig, Activity } from '../data/config.types';

export interface Booking {
  activity: Activity;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  note: string;
}

const DAYS = ['întâi', 'doi', 'trei', 'patru', 'cinci', 'șase', 'șapte', 'opt', 'nouă', 'zece', 'unsprezece', 'doisprezece',
  'treisprezece', 'paisprezece', 'cincisprezece', 'șaisprezece', 'șaptesprezece', 'optsprezece', 'nouăsprezece', 'douăzeci'];

export const dayWord = (n: number): string =>
  n <= 20 ? DAYS[n - 1]
    : n < 30 ? 'douăzeci și ' + (n === 21 ? 'unu' : DAYS[n - 21])
    : n === 30 ? 'treizeci' : 'treizeci și unu';

export function verseLines(b: Booking, cfg: AppConfig = CONFIG): string[] {
  const [y, m, d] = b.date.split('-').map(Number);
  const [hh, mm] = b.time.split(':').map(Number);
  const start = new Date(y, m - 1, d, hh, mm);
  const wd = start.toLocaleDateString('ro-RO', { weekday: 'long' });
  const mo = start.toLocaleDateString('ro-RO', { month: 'long' });
  const vars: Record<string, string> = {
    zi: wd,
    data: `${dayWord(start.getDate())} ${mo}`,
    ora: cfg.times[b.time] ?? cfg.stanza.timeFallback.replace(/\{hh\}/g, b.time),
    vers1: b.activity.verse[0],
    vers2: b.activity.verse[1],
  };
  return cfg.stanza.lines.map(line => line.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? vars[k] : m)));
}
