import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MusicService } from '../../services/music.service';

@Component({
  selector: 'app-now-playing',
  templateUrl: './now-playing.html',
  styleUrl: './now-playing.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NowPlaying {
  protected readonly music = inject(MusicService);
}
