# CLAUDE.md — date-scheduler

Context for Claude Code. Read this whole file before changing anything.

## What this is
A small personal web app that the author built for his wife: a "date scheduler" that **asks her out**.
She picks the activity, day and time, and the app produces a calendar invite.
It is an **Angular 22** single-page app (standalone components, signals, SCSS), built to static files and hosted on **GitHub Pages** at https://rares221.github.io/date-scheduler/. There is no backend. The UI is in **Romanian**, and all user-facing text stays in Romanian.

**Primary target device: iPhone, Chrome browser (CriOS).** Every change must work there first.

## Commands
- `npm start`: dev server on `http://localhost:4200`.
- `npm run check`: unit tests (Vitest via `ng test --watch=false`). Must pass before every commit. CI runs this too.
- `npm run e2e`: Playwright (iPhone + Chrome UA, 390x844). Starts `ng serve` on 127.0.0.1:4200 itself. Set `BASE_URL=http://localhost:8080` to run against a served `dist` instead (webServer is skipped; the dev-only `window.__music` hook is absent there).
- `npm run build`: production build into `dist/`; `postbuild` then writes `dist/404.html` and `dist/.nojekyll`.

## Files
```
package.json, angular.json, tsconfig*.json
playwright.config.ts, e2e/flow.spec.ts          # E2E: music path + no-music path
scripts/post-build.mjs                          # dist/404.html + dist/.nojekyll
.github/workflows/deploy.yml                    # GitHub Pages deploy
public/assets/sheeba.jpg, sheeba-judging.jpg    # her cat Sheeba (story panel / "nu" reaction)
src/index.html, src/main.ts, src/styles.scss    # global tokens + shared primitives (.btn .card .chip .opt .msg .sub .step .dots, inputs)
src/test-setup.ts                               # TZ = Europe/Bucharest for unit tests
src/app/app.ts|html|config.ts|routes.ts
src/app/data/config.types.ts                    # AppConfig, Song, SongKind, StoryPanel, Activity, AvailabilityDay
src/app/data/config.ts                          # CONFIG: ALL personalization + Web3Forms key
src/app/services/                               # platform, calendar (pure: ICS/gcal), poem (pure), availability, booking-state, notify, music, fx
src/app/directives/reveal.directive.ts
src/app/pages/date/                             # the page that composes the flow
src/app/components/                             # ambient-bg, fx-layer, gate, video-bg, now-playing, story, question, activity-step, when-step, done-step
model/                                          # LOCAL ONLY reference repo (someone else's Angular invite page + commercial audio). Git-ignored. Never publish, never copy code/assets from it.
CLAUDE.md, README.md
```
Content lives in `src/app/data/config.ts` (the author asked for a separate config file on 2026-11-18). Change content there, not in templates.

## The flow
1. **"Press play" gate**: a full-screen overlay, "Ai un mesaj / Pune-ți căștile și apasă play", with an embedded YouTube player. The page is scroll-locked (`body.locked`) until the player reports `PLAYING`. Then the gate fades and the player becomes a **full-screen background** (`#playerWrap.bgmode`, `body.vidbg`):
   - Cover-sized behind the page using the song's `vertical` flag (9:16 vs 16:9), plus `--crop` (110px) of overflow above and below. That pushes YouTube's own title, channel avatar and controls off-screen. Keep the crop: the avatar is an artist photo.
   - A bottom-heavy dark veil (`::after`), `pointer-events:none`, blobs hidden, embers/eq above it.
   - "Acum cântă" pill bottom-left (`#mini`): CSS vinyl, title from `player.getVideoData().title`, SVG play/pause.
   - **Embed error fallback** (`ytFail()`): on `onError`, or if the player isn't ready after 10 s, it hides the player and shows "Muzica nu se poate încărca aici." The "continuă fără muzică" button becomes a primary button. That button otherwise appears after 6 s.
2. **Scroll story**: full-height panels from `CONFIG.story` that reveal on scroll (IntersectionObserver). Each has a title and text, and the Sheeba panel has a photo.
   **Music per section**: elements with `data-song` (story = `intro`, ask panel = `question`) switch songs when they cross 45% of the viewport. Switching only goes forward and skips empty ids. It stops once Da/Nu have chosen `yes`/`no`.
3. **Question card**: "Iubito, ieși cu mine?" with a big **Da!** and a small underlined **nu** link that is always available.
   - **nu**: Sheeba's judging photo pops in, the card shakes, the caption cycles through `CONFIG.noMessages`, and it switches to `songs.no` (empty id means the music pauses). A form "un motiv bun" (`CONFIG.noReason`) appears. Submitting it emails the reason to the author via `notify()` and shows `noReason.sent`. The Da button stays.
   - **Da**: confetti, then `songs.yes` (Love Me Like You), then step 1.
4. **Step 1/2**: pick the activity (`CONFIG.activities`; an optional `times:[...]` limits it to those hours).
5. **Step 2/2**: date and time, plus an optional note ("Vrei să-mi spui ceva?", max 200 characters).
   - If `CONFIG.availability` has future dates, the dates show as chips (e.g. "vin 27 nov") and the times come from that day.
   - Otherwise there's a native date input plus chips from the keys of `CONFIG.times`.
6. **"Strofă nouă"**: a typewriter animation writes a stanza built from her choices on lined cream paper. The stanza template is `CONFIG.stanza` (`lines` with the placeholders `{zi} {data} {ora} {vers1} {vers2}`, and `timeFallback` with `{hh}` for times not in `CONFIG.times`). By default: `weekday, <day in Romanian words> <month>,` / `<CONFIG.times[time]>` (or "la ora HH:MM") `,` / `activity.verse[0]` / `activity.verse[1]`, plus `CONFIG.signature`. Her note is shown below.
   Concept: *the author writes her poems; this one they "write together", and she picks the words.*
   When she presses Gata, `notify()` emails the author the activity, date, time and note.
7. **Calendar**:
   - On iPhone + Chrome, the **Google Calendar link** is the primary button and the `.ics` download is secondary. Elsewhere `.ics` is primary. Safari on iOS gets a `data:text/calendar` URL.
   - Event title: `CONFIG.eventTitle` ("Strofă nouă"). The description has the stanza, signature, activity and note (escaped and folded for ICS). There's a 2 h VALARM. Times are in UTC.

## CONFIG (`src/app/data/config.ts`)
All personalization lives here:
`to, from, organizerEmail, title, subtitle, durationMinutes, timezone`, `songs{intro,question,yes,no}` (each `{id,start,vertical?}`), `photos, story[{title,text,photo?,hint?}], noMessages[], noReason{prompt,placeholder,sent}, notify{web3formsKey}, activities[{id,name,desc,location,verse[2],times?}], times{ "HH:MM": "phrase" }, stanza{lines[], timeFallback}, signature, eventTitle, minDaysAhead, availability[{date,times[]}]`.
Types are in `config.types.ts`.

## Visual design
- Palette: **black, gold, champagne, with dusty rose as the extra accent**. The CSS variables are in `:root`.
- Fonts: Fraunces (headings and the italic poem) and DM Sans (UI), from Google Fonts.
- **No emoji anywhere** in the UI, the calendar text or the emails (the author asked for a clean look). Icons are inline SVG. The floating ♪ ♫ glyphs in the background are fine.
- Background effects: embers, music notes, twinkles, and an equalizer strip that pulses while music plays. `burst()` makes gold confetti and rising gold sparkles.
- Respect `prefers-reduced-motion` (already handled).

## Hard constraints (don't break these)
- **No song lyrics anywhere** on the page, and **no Little Mix logos or photos**. The music only plays through the official YouTube embed (official littlemixVEVO videos only; not lyric videos).
- **The poems are the author's creative work.** Don't paste his poems into the site. The current `verse` lines are placeholder starters that he may rewrite himself, so don't overwrite his edits.
- **iOS rules:**
  - Keep `playsinline:1`.
  - Audio only starts from a user tap.
  - `setVolume` is ignored on iOS.
  - Inputs and textareas need `font-size:16px`.
  - Keep the safe-area insets.
  - Tap targets are at least 44 px.
- **No backend, no secrets.** The only outside call is `notify()` → Web3Forms, which the author approved on 2026-11-18. Its access key is public by design: it can only send mail to the author's own address. Spam is the only risk. An empty key means nothing is sent. The repo is public and the page has `noindex`.
- **YouTube embeds fail on IP-address origins** (VEVO error 150: "Video unavailable"). Test on `localhost` or a hostname (e.g. `http://192-168-1-14.nip.io:8000` from a phone), never `http://192.168.x.x`.
- `model/` stays local-only and git-ignored. Never commit `.superpowers/` (SDD scratch, git-ignored).

## Open TODOs (from the author)
- [x] Song for "Da": Love Me Like You (`1WpoKRnoPRU`). Optional: `songs.no` and `songs.question` ids, plus `start` seconds for the chorus.
- [x] Intro video `vFApMni5qIA` plays embedded (on a hostname origin).
- [x] Web3Forms key set in `config.ts`; a test email sent from localhost ARRIVED (2026-11-18).
- [ ] Change the Web3Forms form's website URL in the dashboard to `rares221.github.io`.
- [ ] Test on a real iPhone in Chrome **and** Safari on the live URL.
- [ ] Fill `CONFIG.availability` with the days and times he's free (optional).
- [ ] the author may rewrite `activities[].verse` and `times` phrases in his own voice.
- [ ] Optional: set `organizerEmail` so the Google Calendar link adds him as a guest.
- [ ] Possibly more personal items, added as story panels or activities via CONFIG.
- [ ] Optional: `songs.no` / `songs.question` ids.

## Deploy (GitHub Pages via Actions)
- Repo `rares221/date-scheduler`, default branch `main`. Settings → Pages → Source: **GitHub Actions** (already set).
- Pushing to `main` (or a manual workflow dispatch) runs `.github/workflows/deploy.yml`: `npm ci`, `npm run check`, `ng build --base-href "/<repo>/"`, `npm run postbuild`, then upload `dist` and deploy. E2E is not run in CI.
- Live at https://rares221.github.io/date-scheduler/ within a minute or two. Check that `model/` and `.superpowers/` are not committed.

## How to test locally
- `npm start`, then open `http://localhost:4200` (or `127.0.0.1`). Never use a LAN IP origin (YouTube error 150).
- `npm run check` for units, `npm run e2e` for the full flow: it taps `#playerWrap` to start music, goes through "nu" → reason → Da → activity → date/time/note → Gata, mocks `https://api.web3forms.com/**` with `page.route`, and verifies the posts and that there are no page errors.
- Production check: `npm run build`, `npx http-server dist -p 8080`, then `BASE_URL=http://localhost:8080 npm run e2e`.
- From a phone use a hostname origin (e.g. `http://192-168-1-14.nip.io:4200` with `ng serve --host 0.0.0.0`), or the live site.
