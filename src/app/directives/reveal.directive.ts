import { DestroyRef, Directive, ElementRef, inject } from '@angular/core';

@Directive({
  selector: '[appReveal]',
  host: { class: 'reveal' },
})
export class RevealDirective {
  constructor() {
    const el: HTMLElement = inject(ElementRef).nativeElement;
    if (typeof IntersectionObserver === 'undefined') {
      el.classList.add('seen');
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          el.classList.add('seen');
          io.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    inject(DestroyRef).onDestroy(() => io.disconnect());
  }
}
