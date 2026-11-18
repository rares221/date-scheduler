import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { MusicService } from '../../services/music.service';
import { VideoBg } from './video-bg';

function setup() {
  const music = {
    unlocked: signal(false),
    musicOn: signal(false),
    vertical: signal(false),
    status: signal('loading'),
    slotRect: signal<DOMRect | null>(null),
    init: vi.fn(),
  };
  TestBed.configureTestingModule({ providers: [{ provide: MusicService, useValue: music }] });
  const f = TestBed.createComponent(VideoBg);
  const el = f.nativeElement as HTMLElement;
  return { f, el, music, wrap: () => el.querySelector('#playerWrap') as HTMLElement };
}

describe('VideoBg', () => {
  it('hosts #ytPlayer and inits the player after render', async () => {
    const { f, el, music } = setup();
    await f.whenStable();
    expect(el.querySelector('#playerWrap #ytPlayer')).not.toBeNull();
    expect(music.init).toHaveBeenCalledWith('ytPlayer');
  });

  it('is positioned over the slot before unlock', async () => {
    const { f, wrap, music } = setup();
    music.slotRect.set({ left: 10, top: 20, width: 300, height: 170 } as DOMRect);
    await f.whenStable();
    expect(wrap().style.left).toBe('10px');
    expect(wrap().style.top).toBe('20px');
    expect(wrap().style.width).toBe('300px');
    expect(wrap().style.height).toBe('170px');
  });

  it('goes bgmode when unlocked with music, vertical optional', async () => {
    const { f, wrap, music } = setup();
    music.unlocked.set(true);
    music.musicOn.set(true);
    await f.whenStable();
    expect(wrap().classList.contains('bgmode')).toBe(true);
    expect(wrap().classList.contains('vertical')).toBe(false);
    music.vertical.set(true);
    await f.whenStable();
    expect(wrap().classList.contains('vertical')).toBe(true);
  });

  it('is hidden when unlocked without music', async () => {
    const { f, wrap, music } = setup();
    music.unlocked.set(true);
    await f.whenStable();
    expect(wrap().classList.contains('bgmode')).toBe(false);
    expect(wrap().classList.contains('off')).toBe(true);
  });
});
