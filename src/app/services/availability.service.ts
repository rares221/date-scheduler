import { Injectable, inject } from '@angular/core';
import { APP_CONFIG } from '../data/config';
import { Activity, AvailabilityDay } from '../data/config.types';

const WD_SHORT = ['dum', 'lun', 'mar', 'mie', 'joi', 'vin', 'sâm'];
const MO_SHORT = ['ian', 'feb', 'mar', 'apr', 'mai', 'iun', 'iul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const isHHMM = (t: string) => /^\d{2}:\d{2}$/.test(t);
const pad = (n: number) => String(n).padStart(2, '0');

@Injectable({ providedIn: 'root' })
export class AvailabilityService {
  private readonly cfg = inject(APP_CONFIG);

  minDate(today: Date = new Date()): string {
    const d0 = new Date(today.getTime());
    d0.setDate(d0.getDate() + this.cfg.minDaysAhead);
    return `${d0.getFullYear()}-${pad(d0.getMonth() + 1)}-${pad(d0.getDate())}`;
  }

  /** Zilele din config care nu au trecut, îmbinate și sortate. */
  availDays(today?: Date): AvailabilityDay[] {
    const min = this.minDate(today);
    const map: Record<string, Set<string>> = {};
    (this.cfg.availability || []).forEach(x => {
      if (!x || !/^\d{4}-\d{2}-\d{2}$/.test(x.date) || x.date < min) return;
      (map[x.date] = map[x.date] || new Set());
      (x.times || []).filter(isHHMM).forEach(t => map[x.date].add(t));
    });
    return Object.keys(map).sort().map(date => ({ date, times: [...map[date]].sort() }));
  }

  actAllows(a: Activity | null, t: string): boolean {
    return !(a && Array.isArray(a.times) && a.times.length) || a.times.includes(t);
  }

  dayLabel(iso: string): string {
    const [y, m, d] = iso.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    return `${WD_SHORT[dt.getDay()]} ${d} ${MO_SHORT[m - 1]}`;
  }

  usableDays(a: Activity | null, today?: Date): AvailabilityDay[] {
    return this.availDays(today)
      .map(d => ({ date: d.date, times: d.times.filter(t => this.actAllows(a, t)) }))
      .filter(d => d.times.length);
  }

  timesFor(a: Activity | null, date: string, today?: Date): string[] {
    if (this.hasAvailability(today)) {
      return this.usableDays(a, today).find(d => d.date === date)?.times ?? [];
    }
    return Object.keys(this.cfg.times).filter(t => this.actAllows(a, t));
  }

  hasAvailability(today?: Date): boolean {
    return this.availDays(today).length > 0;
  }
}
