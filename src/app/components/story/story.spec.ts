import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { APP_CONFIG } from '../../data/config';
import { Story } from './story';

describe('Story', () => {
  it('renders panels from config', async () => {
    const cfg = TestBed.inject(APP_CONFIG);
    const f = TestBed.createComponent(Story);
    await f.whenStable();
    const el = f.nativeElement as HTMLElement;
    expect(el.querySelectorAll('.panel[data-song="intro"]').length).toBe(cfg.story.length);
    expect(el.querySelectorAll('h1').length).toBe(cfg.story.filter((p) => p.hint).length);
    expect(el.querySelectorAll('h2').length).toBe(cfg.story.filter((p) => !p.hint).length);
    expect(el.querySelectorAll('.photo img').length).toBe(cfg.story.filter((p) => p.photo).length);
    expect(el.querySelectorAll('.hint').length).toBe(1);
    expect(el.textContent).toContain(cfg.story[0].text);
  });
});
