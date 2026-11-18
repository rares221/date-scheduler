import {
  ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, effect, inject, signal, viewChild,
} from '@angular/core';
import { FxService } from '../../services/fx.service';
import { MusicService } from '../../services/music.service';

const SKIP_DELAY_MS = 6000;

@Component({
  selector: 'app-gate',
  templateUrl: './gate.html',
  styleUrl: './gate.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Gate {
  protected readonly music = inject(MusicService);
  private readonly fx = inject(FxService);
  private readonly slot = viewChild.required<ElementRef<HTMLElement>>('slot');

  protected readonly skipShown = signal(false);
  private burst = false;

  constructor() {
    const destroyRef = inject(DestroyRef);

    effect(() => {
      if (this.music.unlocked() && !this.burst) {
        this.burst = true;
        this.fx.burst('sparkles', 18);
      }
    });

    const t = setTimeout(() => this.skipShown.set(true), SKIP_DELAY_MS);
    destroyRef.onDestroy(() => clearTimeout(t));

    afterNextRender(() => {
      const el = this.slot().nativeElement;
      const measure = () => this.music.slotRect.set(el.getBoundingClientRect());
      measure();
      window.addEventListener('resize', measure);
      const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
      ro?.observe(el);
      destroyRef.onDestroy(() => {
        window.removeEventListener('resize', measure);
        ro?.disconnect();
      });
    });
  }

  protected skip(): void {
    this.music.unlock(false);
  }
}
