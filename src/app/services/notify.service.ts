import { Injectable, inject } from '@angular/core';
import { APP_CONFIG } from '../data/config';

@Injectable({ providedIn: 'root' })
export class NotifyService {
  private readonly config = inject(APP_CONFIG);

  /** Emails the owner via Web3Forms; no-op without a key; errors are swallowed. */
  send(subject: string, fields: Record<string, string>): void {
    const key = (this.config.notify?.web3formsKey ?? '').trim();
    if (!key) return;
    try {
      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: key,
          subject,
          from_name: 'Ieși cu mine?',
          ...fields,
          trimis_la: new Date().toLocaleString('ro-RO', { timeZone: this.config.timezone }),
        }),
      }).catch((err) => console.warn('notify failed', err));
    } catch (err) {
      console.warn('notify failed', err);
    }
  }
}
