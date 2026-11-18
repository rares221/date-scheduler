import { ChangeDetectionStrategy, Component, afterNextRender, computed, inject } from '@angular/core';
import { MusicService } from '../../services/music.service';

@Component({
  selector: 'app-video-bg',
  template: `
    <div
      id="playerWrap"
      [class.bgmode]="bg()"
      [class.vertical]="bg() && music.vertical()"
      [class.off]="off()"
      [style.left.px]="pos()?.left"
      [style.top.px]="pos()?.top"
      [style.width.px]="pos()?.width"
      [style.height.px]="pos()?.height"
    >
      <div id="ytPlayer"></div>
    </div>
  `,
  styleUrl: './video-bg.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VideoBg {
  protected readonly music = inject(MusicService);

  protected readonly bg = computed(() => this.music.unlocked() && this.music.musicOn());
  protected readonly off = computed(
    () => (this.music.unlocked() && !this.music.musicOn()) || (!this.music.unlocked() && this.music.status() === 'error'),
  );
  protected readonly pos = computed(() => (this.music.unlocked() ? null : this.music.slotRect()));

  constructor() {
    afterNextRender(() => this.music.init('ytPlayer'));
  }
}
