import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject } from '@angular/core';
import { AmbientBg } from '../../components/ambient-bg/ambient-bg';
import { FxLayer } from '../../components/fx-layer/fx-layer';
import { Gate } from '../../components/gate/gate';
import { Question } from '../../components/question/question';
import { Story } from '../../components/story/story';
import { NowPlaying } from '../../components/now-playing/now-playing';
import { VideoBg } from '../../components/video-bg/video-bg';
import { BookingStateService } from '../../services/booking-state.service';
import { MusicService } from '../../services/music.service';

@Component({
  selector: 'app-date-page',
  imports: [AmbientBg, FxLayer, Gate, VideoBg, NowPlaying, Story, Question],
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

    let raf = 0;
    const check = () => {
      raf = 0;
      const line = innerHeight * 0.45;
      let kind: string | null = null;
      document.querySelectorAll<HTMLElement>('[data-song]').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < line && r.bottom > line) kind = el.dataset['song'] ?? null;
      });
      if (kind === 'intro' || kind === 'question') this.music.setSection(kind);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll, { passive: true });

    inject(DestroyRef).onDestroy(() => {
      cl.remove('locked', 'vidbg', 'playing');
      removeEventListener('scroll', onScroll);
      removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    });
  }
}
