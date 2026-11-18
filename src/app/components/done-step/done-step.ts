import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { APP_CONFIG } from '../../data/config';
import { AvailabilityService } from '../../services/availability.service';
import { BookingStateService } from '../../services/booking-state.service';
import { buildICS, gcalUrl } from '../../services/calendar';
import { FxService } from '../../services/fx.service';
import { NotifyService } from '../../services/notify.service';
import { IS_IOS, IS_IOS_CHROME } from '../../services/platform';
import { verseLines } from '../../services/poem';

@Component({
  selector: 'app-done-step',
  templateUrl: './done-step.html',
  styleUrl: './done-step.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DoneStep {
  protected readonly state = inject(BookingStateService);
  private readonly config = inject(APP_CONFIG);
  private readonly fx = inject(FxService);
  private readonly notify = inject(NotifyService);
  private readonly av = inject(AvailabilityService);
  private readonly ios = inject(IS_IOS);
  protected readonly iosChrome = inject(IS_IOS_CHROME);

  protected readonly signature = this.config.signature;
  protected readonly b = this.state.booking;
  protected readonly typed = signal('');
  protected readonly finished = signal(false);
  protected readonly msg = signal('');

  private readonly timers = new Set<ReturnType<typeof setTimeout>>();
  private interval: ReturnType<typeof setInterval> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.timers.forEach((t) => clearTimeout(t));
      this.timers.clear();
      clearInterval(this.interval);
    });
    const b = this.b();
    if (!b) return;
    this.startTyping(verseLines(b, this.config).join('\n'));
    this.fx.burst('confetti', 120);
    this.later(() => this.fx.burst('sparkles', 30), 500);
    this.notifyOnce();
  }

  protected gcal(): string {
    const b = this.b();
    return b ? gcalUrl(b, this.config) : '';
  }

  protected downloadIcs(): void {
    const b = this.b();
    if (!b) return;
    this.msg.set('');
    const data = buildICS(b, this.config);
    try {
      if (this.ios && !this.iosChrome) {
        location.href = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(data);
        return;
      }
      const url = URL.createObjectURL(new Blob([data], { type: 'text/calendar;charset=utf-8' }));
      const a = Object.assign(document.createElement('a'), { href: url, download: 'intalnire.ics' });
      document.body.appendChild(a);
      a.click();
      a.remove();
      // not tracked in this.timers: the revoke must still run if the step is left within 1.5 s
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    } catch {
      this.msg.set('Nu am putut descărca fișierul. Folosește butonul Google Calendar.');
    }
  }

  private later(fn: () => void, ms: number): void {
    const t = setTimeout(() => {
      this.timers.delete(t);
      fn();
    }, ms);
    this.timers.add(t);
  }

  private startTyping(text: string): void {
    const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      this.typed.set(text);
      this.finished.set(true);
      return;
    }
    let i = 0;
    this.later(() => {
      this.interval = setInterval(() => {
        i++;
        this.typed.set(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(this.interval);
          this.finished.set(true);
        }
      }, 45);
    }, 700);
  }

  private notifyOnce(): void {
    const b = this.b()!;
    const key = [b.activity.id, b.date, b.time, b.note].join('|');
    if (this.state.lastNotified === key) return;
    this.state.lastNotified = key;
    this.notify.send(`A ales: ${b.activity.name}, ${this.av.dayLabel(b.date)} la ${b.time}`, {
      activitate: b.activity.name,
      data: b.date,
      ora: b.time,
      locatie: b.activity.location,
      nota: b.note || '(fără notă)',
    });
  }
}
