import { computed, inject, Injectable, isDevMode, signal } from '@angular/core';
import { APP_CONFIG } from '../data/config';
import { SongKind } from '../data/config.types';

export type MusicStatus = 'loading' | 'ready' | 'playing' | 'paused' | 'error';

const SONG_ORDER: SongKind[] = ['intro', 'question'];
const YT_UNSTARTED = -1, YT_ENDED = 0, YT_PLAYING = 1, YT_PAUSED = 2, YT_CUED = 5;
const FADE_STEPS = 12;
const FADE_MS = 65;
const READY_TIMEOUT_MS = 10000;

let apiPromise: Promise<void> | null = null;

@Injectable({ providedIn: 'root' })
export class MusicService {
  private readonly cfg = inject(APP_CONFIG);

  private readonly _status = signal<MusicStatus>('loading');
  private readonly _unlocked = signal(false);
  private readonly _musicOn = signal(false);
  private readonly _title = signal('');
  private readonly _currentSong = signal<SongKind>('intro');
  private readonly _vertical = signal(false);

  readonly status = this._status.asReadonly();
  readonly unlocked = this._unlocked.asReadonly();
  readonly musicOn = this._musicOn.asReadonly();
  readonly title = this._title.asReadonly();
  readonly currentSong = this._currentSong.asReadonly();
  readonly vertical = this._vertical.asReadonly();
  readonly playing = computed(() => this.status() === 'playing');
  /** Set by the gate; read by video-bg to place the player before unlock. */
  readonly slotRect = signal<DOMRect | null>(null);

  private player: YT.Player | null = null;
  private ready = false;
  private started = false;
  private scrollSongIdx = 0;
  private fadeT: ReturnType<typeof setInterval> | null = null;

  init(hostId: string): void {
    if (this.started) return;
    this.started = true;
    setTimeout(() => {
      if (!this.ready) {
        console.warn('YouTube player not ready after 10s');
        this.fail();
      }
    }, READY_TIMEOUT_MS);

    this.loadApi().then(
      () => this.create(hostId),
      () => {
        console.warn('YouTube iframe_api failed to load');
        this.fail();
      },
    );
  }

  unlock(withMusic: boolean): void {
    if (this._unlocked()) return;
    this._unlocked.set(true);
    this._musicOn.set(!!withMusic);
    if (withMusic) this._vertical.set(!!this.cfg.songs.intro.vertical);
  }

  toggle(): void {
    if (!this._musicOn() || !this.player?.getPlayerState) return;
    if (this.player.getPlayerState() === YT_PLAYING) this.player.pauseVideo();
    else this.player.playVideo();
  }

  switchSong(kind: SongKind): void {
    const p = this.player;
    if (!this._musicOn() || !p || !p.loadVideoById || this._currentSong() === kind) return;
    this._currentSong.set(kind);
    const song = this.cfg.songs[kind];
    this.clearFade();
    let step = 0;
    this.fadeT = setInterval(() => {
      step++;
      try { p.setVolume(Math.max(100 - (100 * step) / FADE_STEPS, 0)); } catch { /* ignore */ }
      if (step < FADE_STEPS) return;
      this.clearFade();
      if (song?.id) {
        this._vertical.set(!!song.vertical);
        p.loadVideoById({ videoId: song.id, startSeconds: song.start || 0 });
      } else {
        p.pauseVideo();
      }
      p.setVolume(100);
    }, FADE_MS);
  }

  setSection(kind: 'intro' | 'question'): void {
    const cur = this._currentSong();
    if (!this._musicOn() || cur === 'yes' || cur === 'no') return;
    const idx = SONG_ORDER.indexOf(kind);
    if (idx <= this.scrollSongIdx) return;
    this.scrollSongIdx = idx;
    if (this.cfg.songs[kind]?.id) this.switchSong(kind);
  }

  /** Test seam: injects the IFrame API script once. */
  protected loadApi(): Promise<void> {
    if (apiPromise) return apiPromise;
    apiPromise = new Promise<void>((resolve, reject) => {
      const w = window as any;
      if (w.YT?.Player) return resolve();
      const prev = w.onYouTubeIframeAPIReady;
      w.onYouTubeIframeAPIReady = () => {
        if (typeof prev === 'function') prev();
        resolve();
      };
      const s = document.createElement('script');
      s.src = 'https://www.youtube.com/iframe_api';
      s.onerror = () => {
        apiPromise = null;
        reject(new Error('iframe_api failed to load'));
      };
      document.head.appendChild(s);
    });
    return apiPromise;
  }

  /** Test seam: constructs the real YT.Player. */
  protected createPlayer(hostId: string, opts: YT.PlayerOptions): YT.Player {
    return new YT.Player(hostId, opts);
  }

  private create(hostId: string): void {
    const intro = this.cfg.songs.intro;
    this.player = this.createPlayer(hostId, {
      videoId: intro.id,
      playerVars: { playsinline: 1, rel: 0, modestbranding: 1, start: intro.start, controls: 1 },
      events: {
        onStateChange: (e) => this.onState(e.data),
        onReady: () => {
          this.ready = true;
          if (this._status() === 'loading') this._status.set('ready');
        },
        onError: (e) => {
          // 2 bad id, 5 HTML5, 100 missing, 101/150 embedding disallowed
          console.warn('YouTube player error', e?.data);
          if (!this._unlocked()) this.fail();
        },
      },
    });
    if (isDevMode()) {
      const p = this.player;
      (window as any).__music = {
        videoId: () => p.getVideoData()?.video_id ?? '',
        state: () => p.getPlayerState?.(),
      };
    }
  }

  private onState(state: number): void {
    // BUFFERING (3) and ENDED (0, loops) leave the status unchanged
    if (state === YT_PLAYING) this._status.set('playing');
    else if (state === YT_PAUSED || state === YT_UNSTARTED || state === YT_CUED) this._status.set('paused');
    this.updateTitle();
    if (state === YT_PLAYING) this.unlock(true);
    if (state === YT_ENDED && this.player) {
      this.player.seekTo(this.cfg.songs[this._currentSong()]?.start || 0, true);
      this.player.playVideo();
    }
  }

  private updateTitle(): void {
    let t = '';
    try { t = this.player?.getVideoData()?.title || ''; } catch { /* ignore */ }
    if (t) this._title.set(t);
  }

  private fail(): void {
    if (this._unlocked()) return;
    this._status.set('error');
  }

  private clearFade(): void {
    if (this.fadeT) clearInterval(this.fadeT);
    this.fadeT = null;
  }
}
