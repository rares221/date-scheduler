import {
  ChangeDetectionStrategy, Component, DestroyRef, ElementRef, computed, inject, signal, viewChild,
} from '@angular/core';
import { APP_CONFIG } from '../../data/config';
import { RevealDirective } from '../../directives/reveal.directive';
import { BookingStateService } from '../../services/booking-state.service';
import { FxService } from '../../services/fx.service';
import { MusicService } from '../../services/music.service';
import { NotifyService } from '../../services/notify.service';

@Component({
  selector: 'app-question',
  imports: [RevealDirective],
  templateUrl: './question.html',
  styleUrl: './question.scss',
  host: { 'data-song': 'question' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Question {
  protected readonly cfg = inject(APP_CONFIG);
  private readonly music = inject(MusicService);
  private readonly notify = inject(NotifyService);
  private readonly fx = inject(FxService);
  private readonly state = inject(BookingStateService);
  private readonly card = viewChild.required<ElementRef<HTMLElement>>('card');
  private readonly judgeEl = viewChild.required<ElementRef<HTMLElement>>('judge');

  protected readonly title = this.cfg.to
    ? `${this.cfg.to}, ${this.cfg.title.charAt(0).toLowerCase()}${this.cfg.title.slice(1)}`
    : this.cfg.title;

  protected readonly formShown = signal(false);
  protected readonly caption = signal('');
  protected readonly reason = signal('');
  protected readonly sentMsg = signal('');
  private readonly lastSent = signal<string | null>(null);
  protected readonly canSend = computed(() => {
    const t = this.reason().trim();
    return t.length >= 3 && t !== this.lastSent();
  });

  private noCount = 0;
  private readonly timers = new Set<ReturnType<typeof setTimeout>>();

  constructor() {
    inject(DestroyRef).onDestroy(() => this.timers.forEach(clearTimeout));
  }

  private later(fn: () => void, ms: number): void {
    const t = setTimeout(() => {
      this.timers.delete(t);
      fn();
    }, ms);
    this.timers.add(t);
  }

  private restart(el: HTMLElement, cls: string): void {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }

  protected no(): void {
    this.noCount++;
    this.music.switchSong('no');
    this.restart(this.judgeEl().nativeElement, 'show');
    this.restart(this.card().nativeElement, 'shake');
    this.caption.set(this.cfg.noMessages[(this.noCount - 1) % this.cfg.noMessages.length]);
    this.formShown.set(true);
    this.later(() => {
      const el = this.card().nativeElement;
      if (typeof el.scrollIntoView === 'function') el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 50);
  }

  protected onInput(e: Event): void {
    this.reason.set((e.target as HTMLTextAreaElement).value);
    this.sentMsg.set('');
  }

  protected submit(e: Event): void {
    e.preventDefault();
    const motiv = this.reason().trim().slice(0, 300);
    if (motiv.length < 3 || motiv === this.lastSent()) return;
    this.lastSent.set(motiv);
    this.notify.send('Motivul ei pentru „nu”', { motiv });
    this.sentMsg.set(this.cfg.noReason.sent);
  }

  protected yes(): void {
    this.music.switchSong('yes');
    this.judgeEl().nativeElement.classList.remove('show');
    this.formShown.set(false);
    this.caption.set('');
    this.fx.burst('confetti', 90);
    this.later(() => this.state.go('activity'), 600);
  }
}
