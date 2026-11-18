# Angular Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the working vanilla date-scheduler (`legacy/index.html` + `legacy/config.js`) as an Angular app with the same architecture as `model/arthareos.github.io-master` (standalone components, signals, services, data, GitHub Actions deploy to Pages), with identical behavior.

**Architecture:** One route renders `DatePage`, which composes standalone OnPush components (gate, video background, now-playing, story, question, the three steps, ambient background, fx layer). State and side effects live in injectable services: music (YouTube IFrame API), booking state, availability, calendar (ICS + Google link), poem, notify (Web3Forms), fx. Content stays in one typed data file `src/app/data/config.ts`.

**Tech Stack:** Angular (latest stable from `@angular/cli@latest`; standalone + signals, zoneless default), TypeScript strict, SCSS, Vitest via `ng test`, `@playwright/test` for E2E, GitHub Actions → GitHub Pages. Node 26 is installed locally.

**Spec:** `CLAUDE.md` (flow, CONFIG, constraints) + `legacy/index.html` (reference behavior; port logic from it, don't reinvent). Model to mirror for structure only: `model/arthareos.github.io-master/` (read-only; never copy code verbatim or any asset from it).

## Global Constraints

- All user-facing text is **Romanian**; copy strings verbatim from `legacy/index.html` / `legacy/config.js`.
- **No emoji anywhere** in the UI, calendar text or emails. Icons are inline SVG. The ♪ ♫ ♬ ♩ background glyphs stay.
- **Never change** `activities[].verse` or `times` phrases. Copy them verbatim.
- **No song lyrics; no Little Mix logos or photos.** Music only plays through the official YouTube embed. Keep the bg-mode `--crop: 110px` overflow that hides YouTube's title, avatar and controls.
- **iOS / CriOS first:**
  - `playerVars.playsinline: 1`.
  - Audio starts only from the tap inside the iframe.
  - Inputs and textareas use `font-size: 16px`.
  - Tap targets are at least 44px.
  - `viewport-fit=cover` plus `env(safe-area-inset-*)`.
  - Respect `prefers-reduced-motion`.
- The only network call besides YouTube and Google Fonts is Web3Forms in `NotifyService`. An empty key sends nothing, and errors are swallowed.
- Calendar times are written in **UTC** (`YYYYMMDDTHHMMSSZ`). Durations come from `CONFIG.durationMinutes`. VALARM is `-PT2H`.
- On iPhone + Chrome (`/CriOS/`), the Google Calendar link is primary and `.ics` is secondary. Safari on iOS gets a `data:text/calendar` URL. Everywhere else gets a Blob download.
- `<meta name="robots" content="noindex, nofollow">` stays. `lang="ro"`. Theme color is `#0a0809`.
- Palette, fonts (Fraunces, DM Sans) and every visual effect match legacy. Port the CSS; don't redesign.
- Test on `localhost`, never on an IP origin: YouTube VEVO embeds fail with error 150 there.
- Commit after every task on branch `angular-migration`, ending each message with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **YouTube embed fails or never becomes ready** (error 150 on an IP origin, or a blocked network). Expected: the gate switches to "Muzica nu se poate încărca aici." within 10 s and "continuă fără muzică" becomes a primary button that unlocks the page. Tested in Task 4 (MusicService timeout and error) and Task 10 (E2E on `127.0.0.1`).
2. **Music off** (she taps "continuă fără muzică"). Expected: `switchSong`, `setSection` and `toggle` are no-ops, there are no console errors, the now-playing pill is hidden and the video wrapper is hidden. Tested in Tasks 4 and 10.
3. **Free text with `\ ; , " „ ”`, newlines or 200+ chars** in the note or the reason. Expected: ICS escaping and 73-byte folding are correct, Google details are plain text, the note is capped at 200 and the reason at 300, and there is no HTML injection. Tested in Tasks 2 and 7.
4. **Double tap on "Gata!" or "Trimite motivul"**. Expected: exactly one Web3Forms POST per distinct submission. Tested in Tasks 7 and 9.
5. **Dates across DST** (e.g. 2027-07-10 20:00 local is `170000Z`, 2026-11-27 20:00 is `180000Z`) and **availability with only past dates**, or an activity whose `times` don't overlap. Expected: correct UTC, a fallback to the native date input, and the Romanian "n-am o zi liberă" message. Tested in Task 2.

---

## File Structure

```
package.json, angular.json, tsconfig*.json      # scaffolded (Task 1)
playwright.config.ts, e2e/flow.spec.ts           # Task 10
scripts/post-build.mjs                           # Task 11: dist/404.html + dist/.nojekyll
.github/workflows/deploy.yml                     # Task 11
public/assets/sheeba.jpg, sheeba-judging.jpg     # moved from assets/
src/index.html, src/main.ts, src/styles.scss     # global tokens + shared primitives (.btn .card .chip .opt .msg .sub .step .dots, inputs)
src/test-setup.ts                                # process.env.TZ = 'Europe/Bucharest'
src/app/app.ts|html|config.ts|routes.ts
src/app/data/config.types.ts                     # AppConfig, Song, SongKind, StoryPanel, Activity, AvailabilityDay
src/app/data/config.ts                           # export const CONFIG: AppConfig (verbatim port of legacy/config.js)
src/app/services/platform.ts                     # isIOS(), isIOSChrome()
src/app/services/calendar.ts                     # pure: utc, icsEsc, fold, startEnd, eventDesc, buildICS, gcalUrl
src/app/services/poem.ts                         # pure: dayWord, verseLines
src/app/services/availability.service.ts
src/app/services/booking-state.service.ts
src/app/services/notify.service.ts
src/app/services/music.service.ts
src/app/services/fx.service.ts
src/app/directives/reveal.directive.ts
src/app/pages/date/date.page.ts|html|scss
src/app/components/{ambient-bg,fx-layer,gate,video-bg,now-playing,story,question,activity-step,when-step,done-step}/*.ts|html|scss
legacy/index.html, legacy/config.js              # reference during migration; deleted in Task 11
```

---

### Task 1: Scaffold Angular, typed config, legacy reference

**Files:**
- Move: `index.html` → `legacy/index.html`, `config.js` → `legacy/config.js`, `assets/*` → `public/assets/*` (use `git mv`)
- Create (scaffold): Angular workspace at repo root
- Create: `src/app/data/config.types.ts`, `src/app/data/config.ts`, `src/app/data/config.spec.ts`, `src/test-setup.ts`
- Modify: `.gitignore` (keep `model/`, add `/node_modules`, `/dist`, `/.angular/cache`, `/test-results`, `/playwright-report`), `src/index.html`

**Interfaces:**
- Produces:
  - `type SongKind = 'intro' | 'question' | 'yes' | 'no'`
  - `interface Song { id: string; start: number; vertical?: boolean }`
  - `interface StoryPanel { title: string; text: string; photo?: 'sheeba'; hint?: boolean }`
  - `interface Activity { id: string; name: string; desc: string; location: string; verse: [string, string]; times?: string[] }`
  - `interface AvailabilityDay { date: string; times: string[] }`
  - `interface AppConfig { to; from; organizerEmail; title; subtitle; durationMinutes; timezone; songs: Record<SongKind, Song>; photos: { sheeba: string; judging: string }; story: StoryPanel[]; noMessages: string[]; noReason: { prompt: string; placeholder: string; sent: string }; notify: { web3formsKey: string }; activities: Activity[]; times: Record<string, string>; signature; eventTitle; minDaysAhead: number; availability: AvailabilityDay[] }`
  - `export const CONFIG: AppConfig`, with photo paths `assets/sheeba.jpg` and `assets/sheeba-judging.jpg`, and all Romanian comments from `legacy/config.js` kept.
  - `export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG', { providedIn: 'root', factory: () => CONFIG })`, also in `config.ts`. Every injectable service reads config through `inject(APP_CONFIG)`, and tests override it.

- [ ] **Step 1: Scaffold** with `npx -y @angular/cli@latest new date-scheduler --directory . --style=scss --ssr=false --skip-git --skip-tests=false --zoneless --ai-config=none` (answer "no" to any extra prompts). Accept the scaffold's test runner if it's Vitest; if it isn't, add `--test-runner=vitest`. Record the Angular version in the commit message. Set `angular.json` build `outputPath` to `{ "base": "dist", "browser": "" }`, `assets` from `public`, and `test.options.setupFiles: ["src/test-setup.ts"]` (or the equivalent key for this Angular version).
- [ ] **Step 2: Port `src/index.html`** `<head>` from `legacy/index.html` lines 1–10: lang, viewport, theme-color, robots, title "Ieși cu mine?", Google Fonts link. Keep `<base href="/">`, which CI overrides.
- [ ] **Step 3: Write the failing test** `src/app/data/config.spec.ts`:
  - `it('keeps every verse and time phrase verbatim')`: assert `CONFIG.activities.map(a => a.verse)` equals the six pairs from `legacy/config.js`, copied literally into the test, and `CONFIG.times` equals the legacy object.
  - `it('has no emoji in any string')`: walk all string values and expect none to match `/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/u`.
  - `it('uses the approved songs')`: `CONFIG.songs.intro` is `{ id:'vFApMni5qIA', start:0, vertical:true }` and `CONFIG.songs.yes.id` is `'1WpoKRnoPRU'`.
- [ ] **Step 4:** Run `npx ng test --watch=false`. Expected: FAIL (CONFIG is missing).
- [ ] **Step 5:** Write `config.types.ts` and `config.ts`, a verbatim port of `legacy/config.js` including the Web3Forms key. Write `src/test-setup.ts` setting `process.env.TZ = 'Europe/Bucharest'`.
- [ ] **Step 6:** Run `npx ng test --watch=false && npx ng build`. Expected: tests PASS, build succeeds.
- [ ] **Step 7: Commit** with `chore: scaffold Angular <version>, typed config, legacy reference`.

### Task 2: Pure domain logic (calendar, poem, availability)

**Files:**
- Create: `src/app/services/calendar.ts`, `src/app/services/calendar.spec.ts`, `src/app/services/poem.ts`, `src/app/services/poem.spec.ts`, `src/app/services/availability.service.ts`, `src/app/services/availability.service.spec.ts`

**Interfaces:**
- Consumes: `CONFIG`, `Activity`, `AvailabilityDay` (Task 1).
- Produces:
  - `interface Booking { activity: Activity; date: string /*YYYY-MM-DD*/; time: string /*HH:MM*/; note: string }`
  - poem.ts:
    - `dayWord(n: number): string`
    - `verseLines(b: Booking, cfg = CONFIG): string[]`, giving four lines. The time line is `cfg.times[time] ?? 'la ora ' + time`, followed by `,`.
  - calendar.ts:
    - `utc(d: Date): string`
    - `icsEsc(s: string): string`
    - `fold(line: string): string`, which breaks at 73 bytes, joins with CRLF and starts continuation lines with a space.
    - `startEnd(b: Booking, cfg = CONFIG): { start: Date; end: Date }`
    - `eventDesc(b: Booking, cfg = CONFIG): string`
    - `buildICS(b: Booking, cfg = CONFIG, now = new Date()): string`
    - `gcalUrl(b: Booking, cfg = CONFIG): string`
  - `AvailabilityService` (providedIn root, config via `inject(APP_CONFIG)`):
    - `minDate(today = new Date()): string`
    - `availDays(today?): AvailabilityDay[]`: valid future dates (date ≥ minDate), merged and sorted.
    - `actAllows(a: Activity | null, t: string): boolean`
    - `dayLabel(iso: string): string` (e.g. `'vin 27 nov'`)
    - `usableDays(a: Activity | null, today?): AvailabilityDay[]`
    - `timesFor(a: Activity | null, date: string, today?): string[]`. In native mode it returns `Object.keys(CONFIG.times)` filtered by the activity.
    - `hasAvailability(today?): boolean`
  - The pure functions in poem.ts and calendar.ts take an optional `cfg` (default `CONFIG`). AvailabilityService tests override `APP_CONFIG` instead.

- [ ] **Step 1: Write failing tests**, porting the expected values from legacy behavior:
  - calendar.spec:
    - `buildICS` for dinner on 2026-11-27 at 20:00 contains `DTSTART:20261127T180000Z` and `DTEND:20261127T203000Z`.
    - On 2027-07-10 at 20:00 it contains `DTSTART:20270710T170000Z`.
    - The SUMMARY is `Strofă nouă`.
    - It contains `TRIGGER:-PT2H` and has no ORGANIZER line when `organizerEmail` is empty.
    - `icsEsc('Hai, te rog; cu \\ desert\nși flori')` equals `'Hai\\, te rog\\; cu \\\\ desert\\nși flori'`.
    - Every physical line of a 300-char note ICS is ≤ 75 bytes.
    - `gcalUrl` has `dates=20261127T180000Z/20261127T203000Z`, `ctz=Europe/Bucharest`, and its details contain `Nota ta: …` only when there is a note.
  - poem.spec:
    - `dayWord(1)` is `'întâi'`, `dayWord(21)` is `'douăzeci și unu'`, `dayWord(27)` is `'douăzeci și șapte'` and `dayWord(31)` is `'treizeci și unu'`.
    - `verseLines` for 2026-11-27 at 20:00 gives line 0 `'vineri, douăzeci și șapte noiembrie,'` and line 1 `'la opt, sub luminile orașului,'`.
    - At time `21:15` line 1 is `'la ora 21:15,'`.
  - availability.spec (today = 2026-11-18), with injected availability `[10 nov past, 27 nov [21:15,18:30,20:00], 29 nov [12:00], 27 nov dup [20:00]]`:
    - `availDays` gives 27 nov `[18:30,20:00,21:15]` and 29 nov `[12:00]`.
    - Past-only availability makes `hasAvailability` false.
    - An activity with `times:['12:00']` makes `usableDays` return only 29 nov.
    - An activity with `times:['09:00']` makes `usableDays` return `[]`.
    - `dayLabel('2026-11-29')` is `'dum 29 nov'`.
- [ ] **Step 2:** Run `npx ng test --watch=false`. Expected: FAIL (modules missing).
- [ ] **Step 3: Implement** the three files by porting from `legacy/index.html` (functions `availDays`, `actAllows`, `dayLabel`, `renderWhen` logic, `startEnd`, `dayWord`, `verseLines`, `utc`, `icsEsc`, `eventDesc`, `fold`, `buildICS`, `gcalUrl`). Keep the PRODID `-//date-scheduler//RO` and the UID format. `eventDesc` is the stanza, a blank line, the signature, a blank line, `<activity> · aprobat de Sheeba`, and then `\n\nNota ta: <note>` when there is a note.
- [ ] **Step 4:** Run `npx ng test --watch=false`. Expected: PASS.
- [ ] **Step 5: Commit** with `feat: port calendar, poem and availability logic with tests`.

### Task 3: Booking state, notify, platform

**Files:**
- Create: `src/app/services/booking-state.service.ts` (+spec), `src/app/services/notify.service.ts` (+spec), `src/app/services/platform.ts` (+spec)

**Interfaces:**
- Consumes: `Booking`, `Activity` (Task 2), `CONFIG`.
- Produces:
  - `BookingStateService`:
    - Signals `screen: WritableSignal<'ask'|'activity'|'when'|'done'>`, `activity: WritableSignal<Activity|null>`, `date`, `time`, `note` (string signals).
    - `noteText = computed(() => note().trim().slice(0, 200))`.
    - `booking = computed<Booking|null>()`, which is null until activity, date and time are all set.
    - `go(screen)` sets the screen and calls `window.scrollTo(0, 0)`.
  - `NotifyService`:
    - `send(subject: string, fields: Record<string,string>): void`.
    - It does nothing when the key is empty.
    - It POSTs JSON `{access_key, subject, from_name:'Ieși cu mine?', ...fields, trimis_la}` to `https://api.web3forms.com/submit` with `keepalive:true`.
    - `trimis_la` is `new Date().toLocaleString('ro-RO',{timeZone})`.
    - It catches all errors and `console.warn`s them.
  - platform.ts: `isIOS(ua = navigator.userAgent, platform = navigator.platform, touch = navigator.maxTouchPoints): boolean`, `isIOSChrome(...)`.

- [ ] **Step 1: Write failing tests:**
  - notify.spec:
    - With the key `''`, `fetch` (a `vi.spyOn(globalThis,'fetch')`) is not called.
    - With the key `'k'`, it is called once with that URL, `method:'POST'`, and a body containing `"motiv":"x"` and `"access_key":"k"`.
    - A rejected fetch doesn't throw.
  - platform.spec:
    - The CriOS UA from CLAUDE.md gives `isIOSChrome` true.
    - A desktop Chrome UA gives false.
    - `MacIntel` with 5 touch points gives `isIOS` true.
  - booking-state.spec:
    - `booking()` is null until all three are set.
    - A 250-char note gives a `noteText()` of length 200.
- [ ] **Step 2:** Run the tests. Expected: FAIL.
- [ ] **Step 3: Implement.** `NotifyService` reads the key through `inject(APP_CONFIG)` (from Task 1). In `platform.ts`, also export `IS_IOS = new InjectionToken<boolean>(..., { providedIn:'root', factory: () => isIOS() })` and an `IS_IOS_CHROME` token defined the same way, so components can be tested with overrides.
- [ ] **Step 4:** Run the tests. Expected: PASS.
- [ ] **Step 5: Commit** with `feat: booking state, notify and platform services`.

### Task 4: MusicService (YouTube)

**Files:**
- Create: `src/app/services/music.service.ts` (+spec)
- Modify: `package.json` (devDependency `@types/youtube`)

**Interfaces:**
- Consumes: `APP_CONFIG`, `Song`, `SongKind`.
- Produces `MusicService`:
  - Signals:
    - `status: Signal<'loading'|'ready'|'playing'|'paused'|'error'>`
    - `unlocked: Signal<boolean>`
    - `musicOn: Signal<boolean>`
    - `title: Signal<string>`
    - `currentSong: Signal<SongKind>`
    - `vertical: Signal<boolean>`
    - `playing = computed(() => status()==='playing')`
    - `slotRect: WritableSignal<DOMRect | null>`, set by the gate and read by video-bg to place the player before unlock.
  - Methods:
    - `init(hostId: string): void`: loads `https://www.youtube.com/iframe_api` once and creates `YT.Player(hostId, { videoId: intro.id, playerVars: { playsinline:1, rel:0, modestbranding:1, start: intro.start, controls:1 } })`. It starts a 10 s not-ready timer that sets `status 'error'`. Script `onerror` also sets `'error'`, and `onError` logs `console.warn('YouTube player error', code)` and sets `'error'` if not unlocked.
    - `unlock(withMusic: boolean): void`. The first transition to PLAYING calls `unlock(true)`.
    - `toggle(): void`
    - `switchSong(kind: SongKind): void`: a no-op if `!musicOn` or `kind===currentSong`. Otherwise it does a 0.8 s volume fade (12 steps of 65 ms) and then either `loadVideoById({videoId, startSeconds})`, updating `vertical`, or pauses if the id is empty.
    - `setSection(kind: 'intro'|'question'): void`: forward-only along `['intro','question']`, skips empty ids, and is ignored after `yes`/`no` or when music is off.
    - The ENDED state loops the current song.
  - Internal seam for tests: `protected createPlayer(hostId, opts): YT.Player` and `protected loadApi(): Promise<void>`. Tests override both with fakes.

- [ ] **Step 1: Write failing tests**, using a fake player that records calls and exposes `fire(state)` and `error(code)`, and fake timers:
  - `PLAYING` → `unlocked()` and `musicOn()` are true, and `title()` comes from `getVideoData().title`.
  - With music off (`unlock(false)`), `switchSong('yes')` makes no player calls.
  - `switchSong('yes')`, after advancing 0.8 s, calls `loadVideoById({videoId:'1WpoKRnoPRU', startSeconds:0})` and sets `vertical()` to false.
  - `switchSong('no')` with an empty id calls `pauseVideo`.
  - `setSection('question')` with an empty id makes no call. With the id `'q'` it loads once. A later `setSection('intro')` makes no call.
  - After `switchSong('no')`, `setSection('question')` makes no call.
  - `error(150)` before unlock sets `status()` to `'error'`.
  - Not ready after 10 s sets `status()` to `'error'`. Ready before then means no error.
- [ ] **Step 2:** Run the tests. Expected: FAIL.
- [ ] **Step 3: Implement**, porting `switchSong`, `songBySection` and the `onStateChange`/`onError`/`ytFail` logic from `legacy/index.html`.
- [ ] **Step 4:** Run the tests. Expected: PASS.
- [ ] **Step 5: Commit** with `feat: MusicService wrapping YouTube IFrame API`.

### Task 5: App shell, global styles, ambient background, fx, reveal

**Files:**
- Create: `src/app/routes.ts` (single route `''` → `DatePage`, title `'Ieși cu mine?'`, `'**'` → `''`), `src/app/pages/date/*`, `src/app/components/ambient-bg/*`, `src/app/components/fx-layer/*`, `src/app/services/fx.service.ts` (+spec), `src/app/directives/reveal.directive.ts`
- Modify: `src/styles.scss`, `src/app/app.ts|html|config.ts`

**Interfaces:**
- Consumes: `BookingStateService.screen`, `MusicService.playing`.
- Produces:
  - `FxService.burst(kind: 'confetti'|'sparkles', n: number): void`, which pushes particles to the signal `particles: Signal<Particle[]>`. They're removed after 6.5 s.
  - `<app-fx-layer>` renders the particles.
  - `<app-ambient-bg>` renders the blobs, embers, notes, sparkles and the eq. The eq animates only while `music.playing()`.
  - `RevealDirective` (`[appReveal]`) adds `.seen` at a 0.3 threshold, once.
  - `DatePage` template: `<app-ambient-bg/> <app-fx-layer/> <app-gate/> <app-video-bg/> <app-now-playing/>` plus `<main class="app">` with `@switch (state.screen())` cases. It also sets `body.locked` until `music.unlocked()`, `body.vidbg` while `musicOn()`, and `body.playing` while playing (via `effect` + `document.body.classList`). Placeholders for components that don't exist yet are fine until Tasks 6–9.

- [ ] **Step 1: Write a failing test** `fx.service.spec`: `burst('confetti', 3)` gives 3 particles. After 6.5 s with fake timers there are 0.
- [ ] **Step 2:** Run the test. Expected: FAIL.
- [ ] **Step 3: Implement.** Port the global CSS from `legacy/index.html` `<style>`:
  - `:root` tokens, base, `body.locked`, `.app`, `.screen`, `.center`, `.card`, `.btn*`, `.row`, `.grid`, `.opt`, `.chip(s)`, inputs/textarea, `label.f`, `.msg`, `.sub`, `.step`, `.dots`, `.grad`, the reduced-motion rule, and `@keyframes`.
  - Component-specific blocks go into each component's scss later.
  - Disable `ViewEncapsulation` nowhere. Shared primitives are global.
- [ ] **Step 4:** Run `npx ng test --watch=false && npx ng build`. Expected: PASS and the build succeeds within budgets. Raise the `anyComponentStyle` warning to 12kB as in the model.
- [ ] **Step 5: Commit** with `feat: app shell, global styles, ambient background, fx`.

### Task 6: Gate, video background, now-playing

**Files:**
- Create: `src/app/components/gate/*`, `src/app/components/video-bg/*`, `src/app/components/now-playing/*` (each with a spec)

**Interfaces:**
- Consumes: `MusicService` (all of it), `FxService.burst`.
- Produces:
  - `<app-gate>` has the heading "Ai un mesaj", the line "Pune-ți căștile și apasă play.", a `#slot` element, "Press play", the error message "Muzica nu se poate încărca aici." when `status()==='error'`, and the skip button "continuă fără muzică".
    - The skip button is visible after 6 s or on error. On error it gets `btn btn-primary`.
    - Skip calls `music.unlock(false)`. Unlocking fades the gate (`.gone`) and bursts 18 sparkles.
    - It exposes the slot rect through `music.slotRect` (a signal set from a `ResizeObserver` and `resize`).
  - `<app-video-bg>` has a fixed `#playerWrap` containing `<div id="ytPlayer">` and calls `music.init('ytPlayer')` in `afterNextRender`.
    - Before unlock it is positioned over `slotRect()`.
    - With `unlocked && musicOn` it gets `.bgmode` (+ `.vertical` from `music.vertical()`), with the cover sizing, `--crop:110px` and the bottom-heavy veil ported from legacy.
    - With `unlocked && !musicOn` it is `display:none`.
  - `<app-now-playing>` is shown only when `musicOn()`. It has the CSS vinyl (spinning while playing), "Acum cântă", `title()`, and a 44px SVG play/pause button calling `toggle()` with `aria-label` "Pauză" / "Pornește muzica".

- [ ] **Step 1: Write failing component tests** (TestBed with a stub MusicService built from writable signals):
  - Gate: `status` set to `'error'` renders `Muzica nu se poate încărca aici.` and the skip button has the class `btn-primary`. Clicking skip calls `unlock(false)`.
  - Now-playing: with `musicOn` false nothing is rendered. With it true, the title text is shown, and clicking calls `toggle`. While paused the `aria-label` is `'Pornește muzica'`.
  - Video-bg: `unlocked` and `musicOn` give `#playerWrap` the class `bgmode`. `vertical` true adds `vertical`.
- [ ] **Step 2:** Run the tests. Expected: FAIL.
- [ ] **Step 3: Implement**, porting markup and CSS from `legacy/index.html` (`.gate`, `#playerWrap*`, `.mini`, `.disc`, `.np`, `.errmsg`, `body.yterr` rules).
- [ ] **Step 4:** Run the tests. Expected: PASS.
- [ ] **Step 5: Commit** with `feat: gate, video background and now-playing components`.

### Task 7: Story and question

**Files:**
- Create: `src/app/components/story/*`, `src/app/components/question/*` (each with a spec)
- Modify: `src/app/pages/date/date.page.ts|html` (section scroll → `music.setSection`)

**Interfaces:**
- Consumes: `APP_CONFIG`, `MusicService.switchSong/setSection`, `NotifyService.send`, `FxService.burst`, `BookingStateService.go`, `RevealDirective`.
- Produces:
  - `<app-story>` renders panels from `CONFIG.story` with `data-song="intro"`: a Sheeba photo when `photo`, `h1` when `hint`, otherwise `h2`, the text, and a "scroll ↓" hint.
  - `<app-question>` (`data-song="question"`) shows the title `` `${to}, ${title lowercased-first}` ``, the subtitle, a big **Da!** and a small underlined **nu** (`.no-link`, ≥44px).
    - Each **nu**: `switchSong('no')`, the Sheeba judging photo pops in, the card shakes, the caption cycles through `noMessages`, the reason form is shown and the card scrolls to center.
    - The reason form has `label = noReason.prompt`, `placeholder`, `maxlength=300`, and "Trimite motivul" disabled while the trimmed length is under 3.
    - Submitting sends `notify.send('Motivul ei pentru „nu”', { motiv })` once per distinct text. The button disables after a send and re-enables on edit. It shows `noReason.sent`.
    - **Da!**: `switchSong('yes')`, hide judge, form and caption, burst 90 confetti, `go('activity')` after 600 ms.
  - `DatePage`: a rAF-throttled passive scroll/resize listener finds the `[data-song]` element crossing 45% of `innerHeight` and calls `music.setSection(kind)`.

- [ ] **Step 1: Write failing tests** (question):
  - Clicking `nu` shows the form and the caption `'Sheeba te privește.'`, and calls `switchSong('no')`.
  - The submit button is disabled for `'ab'` and enabled for `'abc'`.
  - Submitting `'motiv; bun'` twice without editing calls `send` once, with `{motiv:'motiv; bun'}`.
  - Clicking Da calls `switchSong('yes')`, and after 600 ms (fake timers) `go('activity')`.
  - A reason containing `<b>x</b>` renders as text, not HTML.
- [ ] **Step 2:** Run the tests. Expected: FAIL.
- [ ] **Step 3: Implement**, porting CSS for `.panel`, `.photo`, `.reveal`, `.hint`, `.judge`, `.shake`, `.no-link` and `.reason`.
- [ ] **Step 4:** Run the tests. Expected: PASS.
- [ ] **Step 5: Commit** with `feat: story and question components`.

### Task 8: Activity and when steps

**Files:**
- Create: `src/app/components/activity-step/*`, `src/app/components/when-step/*` (each with a spec)

**Interfaces:**
- Consumes: `BookingStateService`, `AvailabilityService` (Task 2), `APP_CONFIG`.
- Produces:
  - `<app-activity-step>`: "Pasul 1 din 2", "Ce facem?", a grid of `.opt` buttons (name + desc, no emoji). Selecting sets `activity`. "Mai departe" is disabled until something is chosen and then calls `go('when')`. "Înapoi" calls `go('ask')`. Progress dots.
  - `<app-when-step>`: "Pasul 2 din 2", "Când?".
    - If `hasAvailability()`: date chips from `usableDays(activity)` labelled `dayLabel`. If there are none, show `Pentru varianta asta n-am o zi liberă încă. Alege altceva?`. Until a day is picked the times area says `Alege întâi ziua.`.
    - Otherwise: a native `<input type="date" [min]="minDate()">` plus time chips from `timesFor`.
    - An invalid date or time is cleared whenever the activity or date changes.
    - Optional note: `label` "Vrei să-mi spui ceva? (opțional)", `placeholder="o dorință, un gând, orice…"`, `maxlength=200`, 16px.
    - "Gata!" is disabled until date and time are set, then calls `go('done')`. "Înapoi" calls `go('activity')`.

- [ ] **Step 1: Write failing tests** (when-step, with `APP_CONFIG` overridden):
  - Empty availability shows `input[type=date]` and 6 time chips.
  - Availability of 27 nov `[18:30,20:00]` with no date chosen shows a chip `'vin 27 nov'` and the text `Alege întâi ziua.`. Clicking it shows 2 time chips.
  - An activity with `times:['09:00']` plus availability shows the "n-am o zi liberă" message.
  - "Gata!" is disabled until a time is clicked.
  - activity-step: clicking "Cină" enables "Mai departe".
- [ ] **Step 2:** Run the tests. Expected: FAIL.
- [ ] **Step 3: Implement** using signals and `computed`, with no FormsModule (bind `(input)`).
- [ ] **Step 4:** Run the tests. Expected: PASS.
- [ ] **Step 5: Commit** with `feat: activity and when steps`.

### Task 9: Done step (poem, calendar, notify)

**Files:**
- Create: `src/app/components/done-step/*` (+spec)

**Interfaces:**
- Consumes: `BookingStateService.booking/noteText/go`, `verseLines`, `buildICS`, `gcalUrl` (Task 2), `NotifyService`, `FxService`, `isIOS/isIOSChrome`, `AvailabilityService.dayLabel`.
- Produces `<app-done-step>`:
  - "Strofă nouă" and "Ai ales cuvintele. Iată ce am scris împreună:".
  - The lined cream `.poem` types `verseLines` at 45 ms per character after 700 ms (shown instantly under reduced motion), with a caret. The signature fades in when it finishes.
  - `Nota ta: „…”` when there is a note. The meta line reads `name · HH:MM · location`.
  - Actions:
    - On iOS Chrome: primary `<a>` "Adaugă în Google Calendar", then ghost "Descarcă invitația (.ics)".
    - Elsewhere: primary "Adaugă în calendar" (.ics) and ghost "Deschide în Google Calendar".
    - Then "Schimbă ceva", which calls `go('activity')` and keeps all state.
  - The .ics download: iOS Safari navigates to `data:text/calendar;charset=utf-8,…`. Everywhere else it downloads a Blob `intalnire.ics`. On failure it shows the message `Nu am putut descărca fișierul. Folosește butonul Google Calendar.`.
  - On entering the step: burst 120 confetti, then 30 sparkles at 500 ms, and `notify.send('A ales: <name>, <dayLabel> la <time>', {activitate, data, ora, locatie, nota: note || '(fără notă)'})`. It sends only once per distinct booking, so re-entering with the same booking doesn't resend.

- [ ] **Step 1: Write failing tests:**
  - The gcal link href equals `gcalUrl(booking)`.
  - The CriOS UA (via a provider override of an `IS_IOS_CHROME` token) puts the Google button first with `btn-primary`.
  - Entering the step twice with the same booking calls `send` once. Changing the time and re-entering calls it a second time.
  - The `.poem` text after completing the typing (fake timers) equals `verseLines(b).join('\n')`.
- [ ] **Step 2:** Run the tests. Expected: FAIL.
- [ ] **Step 3: Implement** (port CSS for `.poem`, `.caret`, `.sig`, `.note-out`, `.meta`, `.actions`).
- [ ] **Step 4:** Run the tests. Expected: PASS.
- [ ] **Step 5: Commit** with `feat: done step with poem, calendar export and notification`.

### Task 10: End-to-end tests (Playwright)

**Files:**
- Create: `playwright.config.ts` (webServer `npx ng serve --port 4200`, baseURL `http://localhost:4200`, project "iphone-chrome": 390×844, `isMobile`, `hasTouch`, UA from CLAUDE.md), `e2e/flow.spec.ts`
- Modify: `package.json` scripts: `"e2e": "playwright test"`, `"check": "ng test --watch=false"`

**Interfaces:**
- Consumes: the whole app.

- [ ] **Step 1: Write the E2E tests.** `page.route('https://api.web3forms.com/**')` records POST bodies and fulfills `{success:true}`.
  - `music path`:
    - Tap the center of `#playerWrap`; expect `body.vidbg`.
    - Click pause; expect the player to be paused and the button `aria-label` to be `Pornește muzica`.
    - Expect the iframe box to extend ≥ 100px above and below the viewport.
    - Scroll to the question and click `nu`. Expect `.judge` visible. Fill the reason and send; expect exactly 1 POST containing `motiv`.
    - Click Da. Within 8 s, `window.ng`/a debug hook reports the video id `1WpoKRnoPRU`. Expose `window.__music = { videoId: () => … }` only when `isDevMode()`.
    - Pick Cină, 2026-11-27, 20:00, note `Vreau desert.`, then Gata. Expect a 2nd POST with `ora:'20:00'` and `nota:'Vreau desert.'`. Expect the `.poem` to contain `vineri, douăzeci și șapte`.
    - Expect no page errors.
  - `no-music path`: wait for skip and click it. Expect `#playerWrap` hidden, the now-playing pill absent, and the full flow to complete with no errors.
  - `embed error`: open `http://127.0.0.1:4200` and expect `Muzica nu se poate încărca aici.` within 12 s and the skip button to have `btn-primary`.
  - `no emoji`: `document.body.innerText` over every screen has no match for `/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/u`.
- [ ] **Step 2:** Run `npm i -D @playwright/test && npx playwright install chromium && npm run e2e`. Expected: all PASS. Fix the app (not the tests) on failure, unless a test contradicts the spec.
- [ ] **Step 3:** Save screenshots of the gate, story, question+reason and done screens to `test-results/` (git-ignored) and check them by eye against the legacy screenshots for visual parity.
- [ ] **Step 4: Commit** with `test: Playwright end-to-end flow on iPhone/CriOS emulation`.

### Task 11: Deploy pipeline, docs, remove legacy

**Files:**
- Create: `.github/workflows/deploy.yml`, `scripts/post-build.mjs`
- Modify: `package.json` (`"postbuild": "node scripts/post-build.mjs"`), `CLAUDE.md`, `README.md`
- Delete: `legacy/`, root `.nojekyll`

**Interfaces:**
- Produces:
  - On push to `main` or a manual dispatch, the workflow runs `actions/checkout@v4`, `actions/setup-node@v4` (node 22, cache npm), `npm ci`, `npm run check`, then `npx ng build --base-href "/${{ github.event.repository.name }}/"`, then `npm run postbuild`, `actions/configure-pages@v5`, `actions/upload-pages-artifact@v3` (path `dist`) and `actions/deploy-pages@v4`.
  - Permissions: `pages: write`, `id-token: write`, `contents: read`. Concurrency group `pages`.
  - post-build copies `dist/index.html` to `dist/404.html` and writes `dist/.nojekyll`.

- [ ] **Step 1:** Run `npm run build && npm run postbuild`. Expected: `dist/index.html`, `dist/404.html`, `dist/.nojekyll` and `dist/assets/sheeba.jpg` exist.
- [ ] **Step 2:** Serve with `npx http-server dist -p 8080`. Run the E2E `music path` against it with `BASE_URL=http://localhost:8080 npm run e2e -- -g "music path"`. Make `playwright.config.ts` honor `BASE_URL`, skipping webServer when set. Expected: PASS.
- [ ] **Step 3:** Rewrite CLAUDE.md:
  - Stack is now Angular, and the file map matches the File Structure above.
  - Commands: `npm start`, `npm run check`, `npm run e2e`, `npm run build`.
  - Content lives in `src/app/data/config.ts`.
  - Deploy goes through GitHub Actions (Settings → Pages → Source: **GitHub Actions**).
  - Keep the flow, the constraints and the TODO list.
  - Update the README with the same commands in Romanian.
- [ ] **Step 4:** Run `git rm -r legacy .nojekyll`, then `npm run check && npm run e2e`. Expected: all PASS.
- [ ] **Step 5: Commit** with `ci: GitHub Pages deploy via Actions; docs; remove legacy`.
