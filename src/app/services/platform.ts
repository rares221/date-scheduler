import { InjectionToken } from '@angular/core';

export function isIOS(
  ua: string = navigator.userAgent,
  platform: string = navigator.platform,
  touch: number = navigator.maxTouchPoints,
): boolean {
  return /iP(hone|ad|od)/.test(ua) || (platform === 'MacIntel' && touch > 1);
}

export function isIOSChrome(
  ua: string = navigator.userAgent,
  platform: string = navigator.platform,
  touch: number = navigator.maxTouchPoints,
): boolean {
  return isIOS(ua, platform, touch) && /CriOS/.test(ua);
}

export const IS_IOS = new InjectionToken<boolean>('IS_IOS', {
  providedIn: 'root',
  factory: () => isIOS(),
});

export const IS_IOS_CHROME = new InjectionToken<boolean>('IS_IOS_CHROME', {
  providedIn: 'root',
  factory: () => isIOSChrome(),
});
