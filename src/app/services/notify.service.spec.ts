import { TestBed } from '@angular/core/testing';
import { APP_CONFIG, CONFIG } from '../data/config';
import { NotifyService } from './notify.service';

function setup(key: string): NotifyService {
  TestBed.configureTestingModule({
    providers: [{ provide: APP_CONFIG, useValue: { ...CONFIG, notify: { web3formsKey: key } } }],
  });
  return TestBed.inject(NotifyService);
}

describe('NotifyService', () => {
  afterEach(() => vi.restoreAllMocks());

  it('does nothing when the key is empty', () => {
    const f = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}'));
    setup('').send('s', { motiv: 'x' });
    expect(f).not.toHaveBeenCalled();
  });

  it('posts JSON to web3forms when key is set', () => {
    const f = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}'));
    setup('k').send('s', { motiv: 'x' });
    expect(f).toHaveBeenCalledTimes(1);
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.web3forms.com/submit');
    expect(init.method).toBe('POST');
    expect(init.keepalive).toBe(true);
    expect(init.body).toContain('"motiv":"x"');
    expect(init.body).toContain('"access_key":"k"');
  });

  it('swallows a rejected fetch', async () => {
    const w = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('net'));
    expect(() => setup('k').send('s', {})).not.toThrow();
    await new Promise((r) => setTimeout(r));
    expect(w).toHaveBeenCalled();
  });
});
