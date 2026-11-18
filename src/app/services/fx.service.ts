import { DestroyRef, Injectable, inject, signal } from '@angular/core';

export type FxKind = 'confetti' | 'sparkles';

export interface Particle {
  id: number;
  kind: FxKind;
  style: Record<string, string>;
}

const COLORS = ['#f8e3a3', '#d9b25a', '#a8792a', '#e7a3b5', '#fff6d8', '#c8962e'];
const LIFETIME_MS = 6500;
const rand = (a: number, b: number) => a + Math.random() * (b - a);

@Injectable({ providedIn: 'root' })
export class FxService {
  private readonly _particles = signal<Particle[]>([]);
  readonly particles = this._particles.asReadonly();

  private nextId = 0;
  private readonly timers = new Set<ReturnType<typeof setTimeout>>();

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.timers.forEach((t) => clearTimeout(t));
      this.timers.clear();
    });
  }

  burst(kind: FxKind, n: number): void {
    const batch: Particle[] = [];
    for (let i = 0; i < n; i++) {
      batch.push({ id: this.nextId++, kind, style: kind === 'confetti' ? this.confetti(i) : this.sparkle(i) });
    }
    this._particles.update((p) => [...p, ...batch]);
    const ids = new Set(batch.map((p) => p.id));
    const timer = setTimeout(() => {
      this.timers.delete(timer);
      this._particles.update((p) => p.filter((x) => !ids.has(x.id)));
    }, LIFETIME_MS);
    this.timers.add(timer);
  }

  private confetti(i: number): Record<string, string> {
    return {
      background: COLORS[i % COLORS.length],
      left: rand(0, 100) + 'vw',
      '--dx': rand(-80, 80) + 'px',
      '--r': rand(-720, 720) + 'deg',
      'animation-duration': rand(2.2, 4) + 's',
      'animation-delay': rand(0, 0.5) + 's',
      ...(Math.random() < 0.3 ? { 'border-radius': '50%' } : {}),
      'box-shadow': '0 0 6px rgba(243,213,138,.6)',
    };
  }

  private sparkle(i: number): Record<string, string> {
    const s = rand(4, 10) + 'px';
    return {
      background: COLORS[i % COLORS.length],
      width: s,
      height: s,
      left: rand(0, 100) + 'vw',
      '--r': rand(-40, 40) + 'deg',
      'animation-duration': rand(2.5, 5) + 's',
      'animation-delay': rand(0, 0.6) + 's',
    };
  }
}
