import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject } from '@angular/core';
import { AmbientBg } from '../../components/ambient-bg/ambient-bg';
import { FxLayer } from '../../components/fx-layer/fx-layer';
import { Gate } from '../../components/gate/gate';
import { NowPlaying } from '../../components/now-playing/now-playing';
import { VideoBg } from '../../components/video-bg/video-bg';
import { BookingStateService } from '../../services/booking-state.service';
import { MusicService } from '../../services/music.service';

@Component({
  selector: 'app-date-page',
  imports: [AmbientBg, FxLayer, Gate, VideoBg, NowPlaying],
  templateUrl: './date.page.html',
  styleUrl: './date.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatePage {
  protected readonly state = inject(BookingStateService);
  private readonly music = inject(MusicService);

  constructor() {
    const cl = document.body.classList;
    cl.add('locked');
    effect(() => {
      cl.toggle('locked', !this.music.unlocked());
      cl.toggle('vidbg', this.music.unlocked() && this.music.musicOn());
      cl.toggle('playing', this.music.playing());
    });
    inject(DestroyRef).onDestroy(() => cl.remove('locked', 'vidbg', 'playing'));
  }
}
