This is Hero Counters, an Expo/React Native app: an unofficial Marvel Rivals ranked companion with tier lists, per-role counters, a draft helper and team comps. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

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
- `src/logic.ts` holds tier, counter and draft logic, shared with the web preview (`scripts/build-preview.mjs`).
- `.web.ts(x)` files are the web versions of platform-specific modules (ads, color scheme).
- Ads: `react-native-google-mobile-ads` is loaded lazily in `src/ads/consent.ts` so the app still opens in Expo Go.
- App settings (name, bundle IDs, AdMob IDs, `DATA_URL`, privacy URL) are in `app.config.ts`. There is no `app.json`.

## Hero data

- `scripts/build-data.mjs` is the curated source. Edit it, bump `REVISION`, then run `npm run data`, which validates everything and writes `src/data/heroes.json`. Never hand-edit `heroes.json`.
- Pushing `src/data/heroes.json` to `main` publishes it: installed apps fetch it from `DATA_URL` (the raw GitHub URL of that file on `main`) and keep it only if it validates and has a higher revision. Don't change `DATA_URL`, rename the branch or move the file.
- Tiers and counters are our own analysis. The app is ad-supported and some stat sites only allow non-commercial use of their numbers, so never copy third-party win, pick or ban rates into the data. Tag each counter honestly: `data`, `kit` or `consensus`.
- Heroes appear by name with initials badges and the project's own role icons. Don't add official portraits, logos or game screenshots, and keep "Marvel" out of the app name.

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `npx eas-cli@latest <command>`; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- `ios/` and `android/` are generated (Continuous Native Generation) and ignored by git. Never create or edit them by hand — configure native behavior in `app.config.ts` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries. Docs: https://docs.expo.dev/versions/latest/index.md
