import { TestBed } from '@angular/core/testing';
import { APP_CONFIG, CONFIG } from '../data/config';
import { MusicService } from './music.service';

class FakePlayer {
  calls: [string, ...unknown[]][] = [];
  title = 'Sweet Melody';
  state = -1;
  events: YT.Events = {};
  loadVideoById(arg: unknown) { this.calls.push(['loadVideoById', arg]); }
  pauseVideo() { this.calls.push(['pauseVideo']); this.state = 2; }
  playVideo() { this.calls.push(['playVideo']); this.state = 1; }
  seekTo(s: number, a: boolean) { this.calls.push(['seekTo', s, a]); }
  setVolume(v: number) { this.calls.push(['setVolume', v]); }
  getPlayerState() { return this.state; }
  getVideoData() { return { title: this.title, video_id: 'vid' }; }
  ready() { this.events.onReady?.({} as YT.PlayerEvent); }
  fire(state: number) {
    this.state = state;
    this.events.onStateChange?.({ data: state } as YT.OnStateChangeEvent);
  }
  error(code: number) { this.events.onError?.({ data: code } as YT.OnErrorEvent); }
  named(n: string) { return this.calls.filter((c) => c[0] === n); }
  get nonVolume() { return this.calls.filter((c) => c[0] !== 'setVolume'); }
}

class TestMusic extends MusicService {
  fake = new FakePlayer();
  apiFails = false;
  protected override loadApi(): Promise<void> {
    return this.apiFails ? Promise.reject(new Error('blocked')) : Promise.resolve();
  }
  protected override createPlayer(_host: string, opts: YT.PlayerOptions): YT.Player {
    this.fake.events = opts.events ?? {};
    return this.fake as unknown as YT.Player;
  }
}

const PLAYING = 1, PAUSED = 2, ENDED = 0;

async function setup(songs = CONFIG.songs) {
  TestBed.configureTestingModule({
    providers: [{ provide: APP_CONFIG, useValue: { ...CONFIG, songs } }],
  });
  const m = TestBed.runInInjectionContext(() => new TestMusic());
  m.init('yt');
  await vi.advanceTimersByTimeAsync(0);
  return m;
}

describe('MusicService', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    delete (window as any).__music;
  });

  it('PLAYING unlocks with music on and reads the title', async () => {
    const m = await setup();
    m.fake.ready();
    expect(m.status()).toBe('ready');
    m.fake.fire(PLAYING);
    expect(m.unlocked()).toBe(true);
    expect(m.musicOn()).toBe(true);
    expect(m.status()).toBe('playing');
    expect(m.playing()).toBe(true);
    expect(m.title()).toBe('Sweet Melody');
    expect(m.vertical()).toBe(true);
    m.fake.fire(PAUSED);
    expect(m.status()).toBe('paused');
  });

  it('unstarted (-1) and cued (5) map to paused; buffering (3) leaves status unchanged', async () => {
    const m = await setup();
    m.fake.ready();
    m.fake.fire(PLAYING);
    m.fake.fire(3);
    expect(m.status()).toBe('playing');
    m.fake.fire(-1);
    expect(m.status()).toBe('paused');
    m.fake.fire(PLAYING);
    m.fake.fire(5);
    expect(m.status()).toBe('paused');
    m.fake.fire(3);
    expect(m.status()).toBe('paused');
  });

  it('creates the player with the intro song and exposes the dev hook', async () => {
    const m = await setup();
    expect((window as any).__music.videoId()).toBe('vid');
    expect((window as any).__music.state()).toBe(m.fake.state);
  });

  it('with music off, switchSong makes no player calls', async () => {
    const m = await setup();
    m.unlock(false);
    m.switchSong('yes');
    await vi.advanceTimersByTimeAsync(2000);
    expect(m.fake.calls).toEqual([]);
    expect(m.musicOn()).toBe(false);
  });

  it('switchSong(yes) fades then loads the new video', async () => {
    const m = await setup();
    m.fake.fire(PLAYING);
    m.switchSong('yes');
    expect(m.currentSong()).toBe('yes');
    expect(m.fake.named('loadVideoById')).toEqual([]);
    await vi.advanceTimersByTimeAsync(800);
    expect(m.fake.named('loadVideoById')).toEqual([['loadVideoById', { videoId: '1WpoKRnoPRU', startSeconds: 0 }]]);
    expect(m.vertical()).toBe(false);
  });

  it('switchSong to the same song is a no-op', async () => {
    const m = await setup();
    m.fake.fire(PLAYING);
    m.switchSong('intro');
    await vi.advanceTimersByTimeAsync(1000);
    expect(m.fake.calls).toEqual([]);
  });

  it('switchSong(no) with an empty id pauses', async () => {
    const m = await setup();
    m.fake.fire(PLAYING);
    m.switchSong('no');
    await vi.advanceTimersByTimeAsync(800);
    expect(m.fake.named('pauseVideo').length).toBe(1);
    expect(m.fake.named('loadVideoById')).toEqual([]);
  });

  it('setSection(question) skips an empty id', async () => {
    const m = await setup();
    m.fake.fire(PLAYING);
    m.setSection('question');
    await vi.advanceTimersByTimeAsync(1000);
    expect(m.fake.calls).toEqual([]);
  });

  it('setSection is forward-only and loads a non-empty id once', async () => {
    const m = await setup({ ...CONFIG.songs, question: { id: 'q', start: 5 } });
    m.fake.fire(PLAYING);
    m.setSection('question');
    await vi.advanceTimersByTimeAsync(1000);
    expect(m.fake.named('loadVideoById')).toEqual([['loadVideoById', { videoId: 'q', startSeconds: 5 }]]);
    m.setSection('intro');
    m.setSection('question');
    await vi.advanceTimersByTimeAsync(1000);
    expect(m.fake.named('loadVideoById').length).toBe(1);
  });

  it('setSection is ignored after yes/no', async () => {
    const m = await setup({ ...CONFIG.songs, question: { id: 'q', start: 0 } });
    m.fake.fire(PLAYING);
    m.switchSong('no');
    await vi.advanceTimersByTimeAsync(800);
    const before = m.fake.calls.length;
    m.setSection('question');
    await vi.advanceTimersByTimeAsync(1000);
    expect(m.fake.calls.length).toBe(before);
  });

  it('ENDED loops the current song', async () => {
    const m = await setup({ ...CONFIG.songs, intro: { id: 'i', start: 7 } });
    m.fake.fire(PLAYING);
    m.fake.fire(ENDED);
    expect(m.fake.named('seekTo')).toEqual([['seekTo', 7, true]]);
    expect(m.fake.named('playVideo').length).toBe(1);
  });

  it('toggle pauses when playing and plays otherwise', async () => {
    const m = await setup();
    m.fake.fire(PLAYING);
    m.toggle();
    expect(m.fake.named('pauseVideo').length).toBe(1);
    m.toggle();
    expect(m.fake.named('playVideo').length).toBe(1);
  });

  it('toggle is a no-op with music off', async () => {
    const m = await setup();
    m.unlock(false);
    m.toggle();
    expect(m.fake.calls).toEqual([]);
  });

  it('error(150) before unlock sets status error and warns', async () => {
    const w = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const m = await setup();
    m.fake.error(150);
    expect(m.status()).toBe('error');
    expect(w).toHaveBeenCalledWith('YouTube player error', 150);
  });

  it('error after unlock does not set status error', async () => {
    const w = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const m = await setup();
    m.fake.fire(PLAYING);
    m.fake.error(150);
    expect(m.status()).toBe('playing');
    expect(w).toHaveBeenCalled();
  });

  it('not ready after 10s sets status error', async () => {
    const w = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const m = await setup();
    await vi.advanceTimersByTimeAsync(10000);
    expect(m.status()).toBe('error');
    expect(w).toHaveBeenCalled();
  });

  it('ready before 10s means no error', async () => {
    const w = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const m = await setup();
    m.fake.ready();
    await vi.advanceTimersByTimeAsync(10000);
    expect(m.status()).toBe('ready');
    expect(w).not.toHaveBeenCalled();
  });

  it('a failed API load sets status error', async () => {
    const w = vi.spyOn(console, 'warn').mockImplementation(() => {});
    TestBed.configureTestingModule({ providers: [{ provide: APP_CONFIG, useValue: CONFIG }] });
    const m = TestBed.runInInjectionContext(() => new TestMusic());
    m.apiFails = true;
    m.init('yt');
    await vi.advanceTimersByTimeAsync(0);
    expect(m.status()).toBe('error');
    expect(w).toHaveBeenCalled();
  });
});
