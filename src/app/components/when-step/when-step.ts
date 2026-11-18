import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { AvailabilityService } from '../../services/availability.service';
import { BookingStateService } from '../../services/booking-state.service';

@Component({
  selector: 'app-when-step',
  templateUrl: './when-step.html',
  styleUrl: './when-step.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WhenStep {
  protected readonly state = inject(BookingStateService);
  protected readonly av = inject(AvailabilityService);

  protected readonly avail = computed(() => this.av.hasAvailability());
  protected readonly minDate = computed(() => this.av.minDate());
  protected readonly usable = computed(() => this.av.usableDays(this.state.activity()));
  protected readonly times = computed(() => this.av.timesFor(this.state.activity(), this.state.date()));

  constructor() {
    // an invalid date or time is cleared whenever the activity or date changes
    effect(() => {
      if (this.avail() && !this.usable().some((d) => d.date === this.state.date())) {
        this.state.date.set('');
      }
      if (!this.times().includes(this.state.time())) this.state.time.set('');
    });
  }

  protected onDate(e: Event): void {
    this.state.date.set((e.target as HTMLInputElement).value);
  }
  protected onNote(e: Event): void {
    this.state.note.set((e.target as HTMLTextAreaElement).value);
  }
}
