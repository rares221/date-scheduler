import { isIOS, isIOSChrome } from './platform';

const CRIOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0 Mobile/15E148 Safari/604.1';
const DESKTOP = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36';

describe('platform', () => {
  it('detects iOS Chrome from CriOS UA', () => {
    expect(isIOSChrome(CRIOS, 'iPhone', 5)).toBe(true);
  });
  it('is false on desktop Chrome', () => {
    expect(isIOS(DESKTOP, 'Win32', 0)).toBe(false);
    expect(isIOSChrome(DESKTOP, 'Win32', 0)).toBe(false);
  });
  it('detects iPadOS as MacIntel with touch points', () => {
    expect(isIOS(DESKTOP, 'MacIntel', 5)).toBe(true);
  });
});
