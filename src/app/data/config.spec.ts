import { CONFIG } from './config';

function strings(v: unknown, out: string[] = []): string[] {
  if (typeof v === 'string') out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => strings(x, out));
  else if (v && typeof v === 'object') Object.values(v).forEach((x) => strings(x, out));
  return out;
}

describe('CONFIG', () => {
  it('keeps every verse and time phrase verbatim', () => {
    expect(CONFIG.activities.map((a) => a.verse)).toEqual([
      ['o masă pentru doi într-un colț de oraș', 'și noi, care nu ne grăbim nicăieri.'],
      ['două cafele, un desert de împărțit', 'și noi doi, vorbind până se răcesc.'],
      ['o sală pe întuneric, popcorn pe genunchi', 'și mâna ta găsind-o pe a mea.'],
      ['un apus care nu se grăbește', 'și noi doi, pe drumul cel lung spre casă.'],
      ['o cafenea plină de pisici', 'care nu se compară cu Sheeba (să nu-i spui).'],
      ['un loc pe care încă nu ți-l spun', 'și noi doi, pe pagina următoare.'],
    ]);
    expect(CONFIG.times).toEqual({
      '12:00': 'la prânz',
      '15:00': 'la trei, după-amiaza',
      '17:00': 'la cinci, când se lasă seara',
      '18:30': 'la șase și jumătate',
      '19:00': 'la ora șapte seara',
      '20:00': 'la opt, sub luminile orașului',
    });
  });

  it('has no emoji in any string', () => {
    const all = strings(CONFIG);
    expect(all.length).toBeGreaterThan(20);
    for (const s of all) expect(s).not.toMatch(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/u);
  });

  it('uses the approved songs', () => {
    expect(CONFIG.songs.intro).toEqual({ id: 'vFApMni5qIA', start: 0, vertical: true });
    expect(CONFIG.songs.yes.id).toBe('1WpoKRnoPRU');
  });
});
