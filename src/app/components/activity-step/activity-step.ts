import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { APP_CONFIG } from '../../data/config';
import { BookingStateService } from '../../services/booking-state.service';

@Component({
  selector: 'app-activity-step',
  templateUrl: './activity-step.html',
  styleUrl: './activity-step.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityStep {
  protected readonly state = inject(BookingStateService);
  protected readonly activities = inject(APP_CONFIG).activities;
}
