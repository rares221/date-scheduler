# Ieși cu mine?

O pagină personală (Angular) care o invită pe soția mea la o întâlnire: press play, scroll, „Da”, alege activitatea, ziua și ora, iar la final strofa noastră se scrie singură și ajunge în calendar.

Live: https://rares221.github.io/date-scheduler/

## Personalizare
Tot conținutul e în `src/app/data/config.ts`: melodii, texte, activități, versuri, ore, semnătură și șablonul strofei (`stanza`: `lines` cu `{zi} {data} {ora} {vers1} {vers2}` și `timeFallback` cu `{hh}`).

## Comenzi
- `npm start` — server local la `http://localhost:4200`
- `npm run check` — teste unitare
- `npm run e2e` — teste end-to-end (Playwright)
- `npm run build` — build de producție în `dist/`

## Publicare
La fiecare push pe `main`, GitHub Actions rulează testele, face build-ul și publică pe GitHub Pages (Settings → Pages → Source: **GitHub Actions**).

Pentru Claude Code: vezi `CLAUDE.md`.
