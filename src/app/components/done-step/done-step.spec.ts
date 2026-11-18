import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CONFIG } from '../../data/config';
import { BookingStateService } from '../../services/booking-state.service';
import { gcalUrl } from '../../services/calendar';
import { NotifyService } from '../../services/notify.service';
import { IS_IOS_CHROME } from '../../services/platform';
import { verseLines } from '../../services/poem';
import { DoneStep } from './done-step';

function setup(iosChrome = false) {
  const send = vi.fn();
  TestBed.configureTestingModule({
    providers: [
      { provide: NotifyService, useValue: { send } },
      { provide: IS_IOS_CHROME, useValue: iosChrome },
    ],
  });
  const state = TestBed.inject(BookingStateService);
  state.activity.set(CONFIG.activities[0]);
  state.date.set('2026-11-27');
  state.time.set('20:00');
  const enter = () => {
    const f = TestBed.createComponent(DoneStep);
    f.detectChanges();
    return f;
  };
  return { state, send, enter };
}

describe('DoneStep', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-18T10:00:00'));
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('gcal link href equals gcalUrl(booking)', () => {
    const { state, enter } = setup();
    const a = (enter().nativeElement as HTMLElement).querySelector('a.btn') as HTMLAnchorElement;
    expect(a.getAttribute('href')).toBe(gcalUrl(state.booking()!));
    expect(a.textContent?.trim()).toBe('Deschide în Google Calendar');
  });

  it('on iOS Chrome the Google button is first and primary', () => {
    const { enter } = setup(true);
    const el = enter().nativeElement as HTMLElement;
    const btns = [...el.querySelectorAll<HTMLElement>('.actions .btn')].sort(
      (x, y) => Number(x.style.order) - Number(y.style.order),
    );
    expect(btns[0].tagName).toBe('A');
    expect(btns[0].classList).toContain('btn-primary');
    expect(btns[0].textContent?.trim()).toBe('Adaugă în Google Calendar');
    expect(btns[1].textContent?.trim()).toBe('Descarcă invitația (.ics)');
    expect(btns[1].classList).toContain('btn-ghost');
  });

  it('sends once per distinct booking', () => {
    const { state, send, enter } = setup();
    enter().destroy();
    enter();
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0]).toBe('A ales: ' + CONFIG.activities[0].name + ', vin 27 nov la 20:00');
    expect(send.mock.calls[0][1].nota).toBe('(fără notă)');
    state.time.set('18:30');
    enter();
    expect(send).toHaveBeenCalledTimes(2);
  });

  it('types the poem, then shows the signature', () => {
    const { state, enter } = setup();
    const f = enter();
    const el = f.nativeElement as HTMLElement;
    const poem = el.querySelector('.poem') as HTMLElement;
    const sig = el.querySelector('.sig') as HTMLElement;
    const text = verseLines(state.booking()!).join('\n');
    vi.advanceTimersByTime(699);
    f.detectChanges();
    expect(poem.textContent).toBe('');
    vi.advanceTimersByTime(45 * 3 + 1);
    f.detectChanges();
    expect(poem.textContent).toBe(text.slice(0, 3));
    expect(sig.classList).not.toContain('show');
    vi.advanceTimersByTime(45 * text.length);
    f.detectChanges();
    expect(poem.textContent).toBe(text);
    expect(sig.classList).toContain('show');
    f.destroy();
  });

  it('shows the whole poem at once under reduced motion', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    const { state, enter } = setup();
    const f = enter();
    expect((f.nativeElement as HTMLElement).querySelector('.poem')?.textContent).toBe(
      verseLines(state.booking()!).join('\n'),
    );
  });

  it('renders the note and meta, and Schimbă ceva keeps state', () => {
    const { state, enter } = setup();
    state.note.set('salut');
    const el = enter().nativeElement as HTMLElement;
    expect(el.querySelector('.note-out')?.textContent).toBe('Nota ta: „salut”');
    expect(el.querySelector('.meta')?.textContent).toContain('· 20:00');
    (el.querySelector('.actions .btn:last-child') as HTMLButtonElement).click();
    expect(state.screen()).toBe('activity');
    expect(state.date()).toBe('2026-11-27');
  });

  it('downloads a Blob intalnire.ics and revokes the URL after 1.5 s', () => {
    const create = vi.fn(() => 'blob:x');
    const revoke = vi.fn();
    vi.spyOn(URL, 'createObjectURL').mockImplementation(create);
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(revoke);
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const { enter } = setup();
    const el = enter().nativeElement as HTMLElement;
    (el.querySelector('.actions button') as HTMLButtonElement).click();
    expect(create).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
    expect(revoke).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1500);
    expect(revoke).toHaveBeenCalledWith('blob:x');
  });

  it('shows the failure message when the download throws', () => {
    vi.spyOn(URL, 'createObjectURL').mockImplementation(() => {
      throw new Error('x');
    });
    const { enter } = setup();
    const f = enter();
    const el = f.nativeElement as HTMLElement;
    (el.querySelector('.actions button') as HTMLButtonElement).click();
    f.detectChanges();
    expect(el.querySelector('.msg')?.textContent).toBe(
      'Nu am putut descărca fișierul. Folosește butonul Google Calendar.',
    );
  });
});
