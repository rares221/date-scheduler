import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { MusicService } from '../../services/music.service';
import { NowPlaying } from './now-playing';

function setup() {
  const musicOn = signal(false);
  const status = signal('paused');
  const title = signal('Titlu piesa');
  const music = { musicOn, status, title, playing: () => status() === 'playing', toggle: vi.fn() };
  TestBed.configureTestingModule({ providers: [{ provide: MusicService, useValue: music }] });
  const f = TestBed.createComponent(NowPlaying);
  return { f, el: f.nativeElement as HTMLElement, musicOn, status, music };
}

describe('NowPlaying', () => {
  it('renders nothing when music is off', async () => {
    const { f, el } = setup();
    await f.whenStable();
    expect(el.querySelector('button')).toBeNull();
    expect(el.textContent?.trim()).toBe('');
  });

  it('shows title, toggles, and labels by state', async () => {
    const { f, el, musicOn, status, music } = setup();
    musicOn.set(true);
    await f.whenStable();
    expect(el.textContent).toContain('Acum cântă');
    expect(el.textContent).toContain('Titlu piesa');
    const btn = el.querySelector('button') as HTMLButtonElement;
    expect(btn.getAttribute('aria-label')).toBe('Pornește muzica');
    btn.click();
    expect(music.toggle).toHaveBeenCalled();
    status.set('playing');
    await f.whenStable();
    expect(btn.getAttribute('aria-label')).toBe('Pauză');
  });
});
