import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { DatePage } from './date.page';

describe('DatePage', () => {
  it('renders shell, starts locked, shows ask screen', async () => {
    const f = TestBed.createComponent(DatePage);
    await f.whenStable();
    const el = f.nativeElement as HTMLElement;
    expect(el.querySelector('app-ambient-bg .eq')).not.toBeNull();
    expect(el.querySelector('app-fx-layer')).not.toBeNull();
    expect(el.querySelector('main.app section[data-screen="ask"]')).not.toBeNull();
    expect(document.body.classList.contains('locked')).toBe(true);
    expect(document.body.classList.contains('playing')).toBe(false);
  });
});
