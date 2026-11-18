import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RevealDirective } from './reveal.directive';

@Component({ imports: [RevealDirective], template: `<div appReveal id="t"></div>` })
class Host {}

describe('RevealDirective', () => {
  let cb: (e: { isIntersecting: boolean }[]) => void;
  let opts: IntersectionObserverInit | undefined;
  const disconnect = vi.fn();

  beforeEach(() => {
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(c: typeof cb, o?: IntersectionObserverInit) {
          cb = c;
          opts = o;
        }
        observe() {}
        disconnect = disconnect;
      },
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it('adds .seen once intersecting at threshold .3', () => {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    const el = f.nativeElement.querySelector('#t') as HTMLElement;
    expect(el.classList.contains('reveal')).toBe(true);
    expect(opts?.threshold).toBe(0.3);
    cb([{ isIntersecting: false }]);
    expect(el.classList.contains('seen')).toBe(false);
    cb([{ isIntersecting: true }]);
    expect(el.classList.contains('seen')).toBe(true);
    expect(disconnect).toHaveBeenCalled();
  });
});
