import { Injectable, computed, signal } from '@angular/core';
import { Activity } from '../data/config.types';
import { Booking } from './poem';

export type Screen = 'ask' | 'activity' | 'when' | 'done';

@Injectable({ providedIn: 'root' })
export class BookingStateService {
  readonly screen = signal<Screen>('ask');
  readonly activity = signal<Activity | null>(null);
  readonly date = signal('');
  readonly time = signal('');
  readonly note = signal('');

  readonly noteText = computed(() => this.note().trim().slice(0, 200));

  readonly booking = computed<Booking | null>(() => {
    const activity = this.activity();
    const date = this.date();
    const time = this.time();
    if (!activity || !date || !time) return null;
    return { activity, date, time, note: this.noteText() };
  });

  go(screen: Screen): void {
    this.screen.set(screen);
    window.scrollTo(0, 0);
  }
}
