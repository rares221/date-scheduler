import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, effect, inject, viewChild } from '@angular/core';
import { MusicService } from '../../services/music.service';

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const GLYPHS = ['♪', '♫', '♬', '♩'];
const range = (n: number) => Array.from({ length: n }, (_, i) => i);

@Component({
  selector: 'app-ambient-bg',
  templateUrl: './ambient-bg.html',
  styleUrl: './ambient-bg.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AmbientBg {
  private readonly music = inject(MusicService);
  private readonly eqEl = viewChild.required<ElementRef<HTMLElement>>('eq');
  private eqTimer: ReturnType<typeof setInterval> | null = null;

  private readonly small = typeof window !== 'undefined' && window.innerWidth < 500;

  protected readonly embers = range(this.small ? 14 : 24).map(() => {
    const s = rand(3, 7);
    return {
      left: rand(0, 100) + 'vw',
      '--dx': rand(-40, 40) + 'px',
      '--r': '0deg',
      'animation-duration': rand(7, 14) + 's',
      'animation-delay': -rand(0, 14) + 's',
      width: s + 'px',
      height: s + 'px',
    };
  });

  protected readonly notes = range(this.small ? 8 : 12).map((i) => ({
    glyph: GLYPHS[i % 4],
    style: {
      left: rand(0, 100) + 'vw',
      'font-size': rand(16, 30) + 'px',
      '--dx': rand(-60, 60) + 'px',
      '--r': rand(-40, 40) + 'deg',
      'animation-duration': rand(12, 22) + 's',
      'animation-delay': -rand(0, 22) + 's',
    },
  }));

  protected readonly sparkles = range(18).map(() => ({
    left: rand(0, 100) + 'vw',
    top: rand(0, 100) + 'vh',
    'animation-delay': -rand(0, 2.4) + 's',
  }));

  protected readonly bars = range(this.small ? 28 : 48);

  constructor() {
    effect(() => this.eqOn(this.music.playing()));
    inject(DestroyRef).onDestroy(() => this.stop());
  }

  private stop(): void {
    if (this.eqTimer !== null) clearInterval(this.eqTimer);
    this.eqTimer = null;
  }

  private eqOn(on: boolean): void {
    this.stop();
    const bars = Array.from(this.eqEl().nativeElement.children) as HTMLElement[];
    if (!on || this.reducedMotion()) {
      bars.forEach((b) => (b.style.height = '6px'));
      return;
    }
    let t = 0;
    this.eqTimer = setInterval(() => {
      // pulse in sync with a ~100 BPM tempo
      t += 0.12;
      const beat = Math.pow(Math.max(0, Math.cos(t * Math.PI * 1.66)), 6);
      bars.forEach((b, i) => {
        const wave = (Math.sin(t * 3 + i * 0.45) + 1) / 2;
        b.style.height = 8 + wave * 40 + beat * 35 * Math.random() + 'px';
      });
    }, 120);
  }

  private reducedMotion(): boolean {
    return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
}
