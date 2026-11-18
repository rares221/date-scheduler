import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { BookingStateService } from '../../services/booking-state.service';
import { ActivityStep } from './activity-step';

describe('ActivityStep', () => {
  it('enables Mai departe after choosing Cină', async () => {
    const f = TestBed.createComponent(ActivityStep);
    await f.whenStable();
    const el = f.nativeElement as HTMLElement;
    const next = el.querySelector('.btn-primary') as HTMLButtonElement;
    expect(next.disabled).toBe(true);
    expect(el.querySelector('.step')?.textContent).toBe('Pasul 1 din 2');
    const opt = [...el.querySelectorAll<HTMLButtonElement>('.opt')].find((b) => b.textContent?.includes('Cină'))!;
    opt.click();
    await f.whenStable();
    expect(opt.classList.contains('sel')).toBe(true);
    expect(next.disabled).toBe(false);
    next.click();
    expect(TestBed.inject(BookingStateService).screen()).toBe('when');
  });
});
