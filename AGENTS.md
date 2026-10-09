This is Hard Counter (formerly Hero Counters; the repo keeps the old name), an Expo/React Native app: an unofficial Marvel Rivals ranked companion with tier lists, per-role counters, a draft helper and team comps. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

```bash
npx expo install <package>  # ALWAYS use instead of npm add — resolves SDK-compatible versions
npx expo start --go         # dev server for Expo Go (plain `expo start` targets a development build, because expo-dev-client is installed)
npm run typecheck           # tsc --noEmit
npm run lint                # expo lint
npm run data                # rebuild and validate src/data/heroes.json from scripts/build-data.mjs
npm run preview             # rebuild the single-file web preview
npx expo-doctor             # diagnose dependency and config issues
```

Run lint and typecheck before declaring any code task done.

## Project layout

- No Expo Router. `App.tsx` holds the shell and a four-tab bar (Tiers, Draft, Comps, About); screens live in `src/screens/`.
- `src/logic.ts` holds tier, counter and draft logic, shared with the web preview (`scripts/build-preview.mjs`). The draft helper's role can be Flex (`DraftRole`), starred heroes (My heroes, capped at `MAX_MY_HEROES`) get `COMFORT_BONUS`, heroes marked Not for me lose `NOT_FOR_ME_PENALTY` (never enough to hide a listed counter, and a hero is never in both lists), and `duoSwap` suggests a pair of picks for you and a teammate who'll switch.
- Your role, My heroes and Not for me are remembered on the device (`usePersisted`, `usePersistedList` in `src/usePersisted.ts`). The match itself (map, bans, teams, duo) isn't.
- `preview/template.html` mirrors the app's screens in plain DOM code. Keep it in step when screens change.
- `.web.ts(x)` files are the web versions of platform-specific modules (ads, color scheme).
- Ads: `react-native-google-mobile-ads` is loaded lazily in `src/ads/consent.ts` so the app still opens in Expo Go.
- App settings (name, bundle IDs, AdMob IDs, `DATA_URL`, privacy URL) are in `app.config.ts`. There is no `app.json`.

## Hero data

- `scripts/build-data.mjs` is the curated source. Edit it, bump `REVISION`, then run `npm run data`, which validates everything and writes `src/data/heroes.json`. Never hand-edit `heroes.json`.
- Pushing `src/data/heroes.json` to `main` publishes it: installed apps fetch it from `DATA_URL` (the raw GitHub URL of that file on `main`) and keep it only if it validates and has a higher revision. Don't change `DATA_URL`, rename the branch or move the file.
- Scheduled data refreshes push to a `claude/data-revision-<N>` branch, never to `main`. `.github/workflows/publish-data.yml` checks that branch (data files only, `heroes.json` matches the script, revision raised, based on current `main`) and then fast-forwards `main`.
- Commits in this repo use the project identity `Hard Counter <hard-counter@noreply.invalid>`, set in the repo's local git config.
- `MAPS` in the data script is the ranked map pool: each map has a mode (`domination`, `convoy`, `convergence`) and layout traits. Keep it in step with the season's ranked rotation. `STYLES` gives heroes their play styles; a new hero without an entry simply isn't nudged by maps. The map nudge is capped in `src/logic.ts` (`MAP_FIT_MIN`/`MAP_FIT_MAX`) so it never outweighs a counter.
- `TIPS` holds per-hero tips: `against` and `as` (short advice, shown on the Against and Play as tabs), `quirks` (each with an `asOf` date it was last checked against the patch notes) and `focus` (target priority when the hero is on the enemy team). Write them in our own words from official patch notes and current guides, never paste guide text, keep each under 260 characters, and only include what the sources support. When a patch changes a hero with tips, re-check their tips and bump `asOf`; remove a quirk once a patch fixes it. The user reviews new batches of tips before more are added.
- `TEAMUPS` follows the Season 9 system: every hero picks one of two team-up abilities, which works alone and gets stronger when its partner is on the team. Each entry is `[name, [hero who uses it, partner], effect, bonus]`, and `'deadpool'` stands for all three Deadpool versions. The build checks that every hero has exactly two. Re-check entries whenever a balance post or patch note mentions a team-up, and add both team-ups of every new hero. The draft helper gives a small nudge to picks that power one up, and hero pages list partners and effects.
- `HISTORY` in the data script is the patch history: every hero change since launch, one line each, `[date, hero, kind, ability, change]`. `hero` is a hero id, `'deadpool'` for all three Deadpools (an ability that starts with `Vanguard: `, `Duelist: ` or `Strategist: ` goes to that version only), or ids joined with `+` for a team-up change. `kind` is `buff`, `nerf`, `mixed`, `change` or `fix`. Write the change in our own words, under 200 characters, with numbers as `old → new`, dated by the post. For every balance post, patch note and hotfix, add a line per hero change. `SEASONS` in the data script lists season and half-season start dates; add the new one when it starts, and add a joining date to `HERO_ADDED` for each new hero. The app shows the history on each hero's History tab and marks heroes buffed or nerfed this season on the tier list.
- `DIFFICULTY` is the game's own difficulty rating, 1 to 5 stars, as the game shows it (the wiki's hero pages copy it in their "Difficulty" field). Never adjust it to our own taste: change it only when the game does, and add it for every new hero. Where the game's rating isn't usable (it gives Deadpool zero stars), our estimate goes in `DIFFICULTY_ESTIMATE` with a note starting "Our estimate", which the app shows under the stars. `SHINES` (one sentence starting "Shines", under 150 characters) is our own read of the maps, teams and enemy picks where a hero beats their tier. Both show under "When to pick" on the Play as tab. Re-check a hero's Shines line when a patch changes them. The user reviews new or changed Shines lines before they go out, so scheduled refreshes, which publish unattended, never publish one: when a patch makes a hero's line wrong (it names an ability that was removed or now works differently, say), delete that hero's entry so the app shows none and put a proposed replacement in the run's summary under "For your review". For a new hero, propose a line there instead of adding one.
- `PC_KEYS` maps each hero's ability names to their default PC keys (`lmb`, `rmb`, `shift`, `e`, `f`, `q`, `c`, `v`, `space`), shown as key caps on the Abilities tab when PC is selected. Leave out abilities with no key of their own, use the same key for abilities that share it across forms, and re-check a hero's keys when a patch reworks them. Keys name abilities, so when an ability in `ABILITIES` is renamed, added or removed, update its keys too (the build fails if a key names an ability that doesn't exist), and give a new hero PC keys. `CONSOLE_KEYS` does the same for controller buttons (Xbox names: `rt`, `lt`, `rb`, `lb`, `a`, `b`, `x`, `y`, `ls`, `rs`, `ls+rs`; PlayStation buttons sit in the same spots). Layouts differ per hero and don't follow from the PC keys, so take them from the wiki's PC/Xbox/PS5 ability tabs or in-game screenshots. A hero is listed whole or not at all: the build fails if a listed hero has an ability with a PC key but no button, so add a new hero to `CONSOLE_KEYS` only once their whole layout is known.
- `ABILITIES` holds each hero's ability breakdown: `[checked date, [[name, kind, text]]]` with kind `attack`, `ability`, `ultimate` or `passive`. Explain what abilities do and how they work in our own words (no inputs, few numbers, under 240 characters each), from the current in-game kit and the official patch notes. When a patch changes a hero's kit, fix the text and bump the date. Mechanics belong here; keep `TIPS` for advice so the hero page tabs don't repeat each other.
- Tiers and counters are our own analysis. The app is ad-supported and some stat sites only allow non-commercial use of their numbers, so never copy third-party win, pick or ban rates into the data. Tag each counter honestly: `data`, `kit` or `consensus`.
- Heroes appear by name with initials badges and the project's own role icons. Don't add official portraits, logos or game screenshots, and keep "Marvel" out of the app name.

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `npx eas-cli@latest <command>`; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- `ios/` and `android/` are generated (Continuous Native Generation) and ignored by git. Never create or edit them by hand — configure native behavior in `app.config.ts` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries. Docs: https://docs.expo.dev/versions/latest/index.md
