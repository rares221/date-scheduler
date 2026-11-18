import { CONFIG } from '../data/config';
import { AppConfig } from '../data/config.types';
import { Booking, verseLines } from './poem';

export const utc = (d: Date): string => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

export const icsEsc = (s: string): string =>
  String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r\n|\r|\n/g, '\\n');

export function fold(line: string): string {
  const out: string[] = [];
  let cur = '';
  let bytes = 0;
  const enc = new TextEncoder();
  for (const ch of line) {
    const b = enc.encode(ch).length;
    if (bytes + b > 73) { out.push(cur); cur = ' '; bytes = 1; }
    cur += ch; bytes += b;
  }
  out.push(cur);
  return out.join('\r\n');
}

export function startEnd(b: Booking, cfg: AppConfig = CONFIG): { start: Date; end: Date } {
  const [y, m, d] = b.date.split('-').map(Number);
  const [hh, mm] = b.time.split(':').map(Number);
  const start = new Date(y, m - 1, d, hh, mm);
  return { start, end: new Date(start.getTime() + cfg.durationMinutes * 60000) };
}

const noteText = (b: Booking): string => (b.note || '').trim().slice(0, 200);

export function eventDesc(b: Booking, cfg: AppConfig = CONFIG): string {
  const note = noteText(b);
  return verseLines(b, cfg).join('\n') + '\n\n' + cfg.signature +
    `\n\n${b.activity.name} · aprobat de Sheeba` +
    (note ? `\n\nNota ta: ${note}` : '');
}

export function buildICS(b: Booking, cfg: AppConfig = CONFIG, now: Date = new Date()): string {
  const { start, end } = startEnd(b, cfg);
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//date-scheduler//RO', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${Date.now()}-${Math.random().toString(36).slice(2)}@date-scheduler`,
    `DTSTAMP:${utc(now)}`, `DTSTART:${utc(start)}`, `DTEND:${utc(end)}`,
    `SUMMARY:${icsEsc(cfg.eventTitle)}`, `DESCRIPTION:${icsEsc(eventDesc(b, cfg))}`, `LOCATION:${icsEsc(b.activity.location)}`,
    ...(cfg.organizerEmail ? [`ORGANIZER;CN=${icsEsc(cfg.from)}:mailto:${cfg.organizerEmail}`] : []),
    'BEGIN:VALARM', 'TRIGGER:-PT2H', 'ACTION:DISPLAY', 'DESCRIPTION:Ne vedem curând', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ].map(fold).join('\r\n') + '\r\n';
}

export function gcalUrl(b: Booking, cfg: AppConfig = CONFIG): string {
  const { start, end } = startEnd(b, cfg);
  const p = new URLSearchParams({
    action: 'TEMPLATE', text: cfg.eventTitle, dates: `${utc(start)}/${utc(end)}`,
    details: eventDesc(b, cfg), location: b.activity.location, ctz: cfg.timezone,
  });
  if (cfg.organizerEmail) p.set('add', cfg.organizerEmail);
  return 'https://calendar.google.com/calendar/render?' + p.toString();
}
