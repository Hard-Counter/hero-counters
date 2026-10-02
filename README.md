# Hard Counter

Formerly Hero Counters. The repository keeps its old name because the data URL built into the app points at it.

An unofficial ranked companion for Marvel Rivals players: tier lists by rank and platform, the best counter to every hero overall and in each role, a draft helper, and the top team comps. Built with Expo (SDK 57), so one codebase covers iPhone and Android.

Data: curated tiers and counters, reviewed weekly and after major patches. The current revision and review dates are in `src/data/heroes.json` and on the app's About tab.

## What's in this folder

| Path | What it is |
| --- | --- |
| `App.tsx` | App shell: header, rank strip, tabs, ad slot |
| `app.config.ts` | App name, bundle IDs, AdMob IDs, data URL (already set), privacy URL. **Edit before release.** |
| `src/screens/` | Tier list, draft helper, comps, about, hero detail, hero and map pickers |
| `src/components/` | Shared UI: hero chips, tags, the glossary, pop-up cards, the ad banner |
| `src/logic.ts` | Tier, counter and draft logic (shared with the web preview) |
| `src/data/heroes.json` | The hero data the app ships with (generated, don't hand-edit) |
| `src/ads/`, `src/components/AdBanner.tsx` | AdMob banner, Google consent form, Apple tracking prompt |
| `scripts/build-data.mjs` | **The curated data source.** Edit this, then run it |
| `scripts/build-preview.mjs` | Rebuilds the single-file web preview |
| `assets/` | Original app icon and Android adaptive icon |
| `PRIVACY.md` | Privacy policy draft |
| `AGENTS.md` | Project notes for AI coding agents working in this repo |

## 1. Run it on your phone (about 10 minutes)

You need [Node.js](https://nodejs.org) (the LTS version) on your computer and the **Expo Go** app on your phone.

```bash
git clone https://github.com/Nemesis-Counter/hero-counters.git
cd hero-counters
npm install
npx expo start --go
```

Scan the QR code with Expo Go (Android) or the Camera app (iPhone). Everything works in Expo Go except ads, which need a development build. Keep the `--go`: the project includes `expo-dev-client`, so a plain `npx expo start` serves a development build, which Expo Go can't open.

Add dependencies with `npx expo install <package>` rather than `npm install`, so versions match the Expo SDK.

## 2. Test ads in a development build

```bash
npm install -g eas-cli
eas login                      # free Expo account
eas build:configure
eas build --profile development --platform android
```

Install the build it gives you, then run `npx expo start --dev-client`. Development builds show Google's test ads. An iPhone development build needs an Apple Developer account.

## 3. Before you publish

- [x] **Name it.** The app is *Hard Counter* (`APP.name` in `app.config.ts`). Keep "Marvel" and "Marvel Rivals" out of the app name, icon and keywords (Apple guidelines 4.1(c) and 2.3.7, Google Play's impersonation policy). Mention the game only factually in the description.
- [x] **Bundle IDs.** `com.hardcounter.app` on both stores. It can't change once the app is in a store, and it has no personal name in it, so the app can move to a company account later.
- [ ] **Accounts.** Apple Developer Program (annual fee), Google Play Console (one-time fee), AdMob (free), Expo (free tier is enough).
- [ ] **AdMob.** Add an iOS app and an Android app in AdMob, create a banner ad unit for each, and put all four IDs in `ADMOB` in `app.config.ts`. Under *Privacy & messaging*, publish a GDPR consent message and an IDFA explainer; the app shows them automatically. AdMob also asks you to publish an `app-ads.txt` file on the website listed in your store listings.
- [ ] **Privacy policy.** Fill in `PRIVACY.md`, host it anywhere public, and set `PRIVACY_URL`. Both stores require the link.
- [ ] **Store privacy forms.** Apple *App Privacy* and Google Play *Data safety*: declare the data AdMob collects for advertising (device identifiers, approximate location from IP, usage and diagnostics). On Google Play, answer yes to "contains ads."
- [ ] **Audience.** Target ages 13 and up. Don't mark the app as designed for children.
- [ ] **Disclaimer.** Put this in both store descriptions: *"Unofficial fan-made tool. Not affiliated with or endorsed by NetEase Games or Marvel."*
- [ ] **Art.** Keep to the original icons in this project. Don't add official hero portraits, logos or screenshots of the game's UI without permission.
- [ ] **Build and submit.**

```bash
eas build --profile production --platform all
eas submit --platform ios
eas submit --platform android
```

## 4. Update the data

1. Edit `scripts/build-data.mjs` (tiers, counters, comps, notes, the ranked map list in `MAPS`, hero play styles in `STYLES`, hero tips in `TIPS`, every hero's team-up abilities in `TEAMUPS`, ability breakdowns in `ABILITIES`) and bump `REVISION`.
2. Run `npm run data` (or `node scripts/build-data.mjs`). It checks every hero, role and counter and refuses to write a broken file.
3. Commit and push to `main`. That publishes the data: `DATA_URL` in `app.config.ts` points installed apps at the raw copy of the file on `main`, <https://raw.githubusercontent.com/Nemesis-Counter/hero-counters/main/src/data/heroes.json>. On launch the app downloads it and keeps it only if it passes validation and has a higher revision than the data it already has. GitHub caches the file for about five minutes, so allow that long before checking.
4. Optional: `npm run preview` rebuilds the web preview at `preview/dist/hero-counters.html`.

The scheduled data refreshes don't push to `main` themselves. They push a `claude/data-revision-<N>` branch, and `.github/workflows/publish-data.yml` checks it: only the data files changed, `heroes.json` matches what the script builds, the revision goes up, and the branch builds on the current `main`. If it passes, the workflow moves `main` forward and deletes the branch. A branch that fails a check stays put, and the reason shows under the repo's **Actions** tab.

The data URL is built into every copy of the app, so keep this repository public and keep the file at `src/data/heroes.json` on `main`. Renaming the repo or branch, moving the file or making the repo private would cut installed apps off from updates until they get a store update.

Keep the tiers and counters as your own analysis. The app is ad-supported, and some stat sites (Counterwatch, for one) only allow personal, non-commercial use of their numbers, so don't copy win, pick or ban rates into the data file.

## Checks

Run these before committing code changes:

```bash
npm run typecheck
npm run lint
npm run data        # after data edits
```

## How the app decides

- **Tiers** are curated letter grades per rank bracket, PC first. Console tiers equal PC tiers except where official data shows a clear platform gap (Black Widow, Hawkeye and Psylocke one tier lower; Namor and The Thing one tier higher).
- **Counters** list the best answer overall plus the best answer in each role, each tagged *Data-backed*, *Kit-based* or *Consensus*.
- **Draft helper** ranks the heroes in your role: each is scored on its tier at your rank, plus points for every enemy it is the listed counter to (full weight for data-backed picks, less for kit-based ones and for weak edges). Banned heroes and heroes your teammates picked are left out. A pick that powers up a team-up with your teammates gets a small nudge (since Season 9 team-up abilities work alone and a partner only makes them stronger, so the nudge is a tie-breaker). You get the top three, a counter for each enemy (with a stand-in when the listed counter is banned), and the enemies in the order to focus them.
- **Quick lookup** at the top of the Draft tab opens any hero's counters and tips in two taps, for the hero who's giving you trouble mid-match.
- **Protect your pick** suggests bans: the strongest available counters to the hero you want to play.
- **Hero pages** have three tabs. *Against* shows focus priority, the best counters and tips for facing the hero. *Play as* shows play style, tips, team-up partners and who the hero beats. *Abilities* explains what each ability does, the hero's two team-up abilities, and quirks. Picks, counters and comps open on Play as; the tier list and enemies open on Against, and each page in the back stack remembers its tab.
- **Ability breakdowns** are written in our own words from the current in-game kits and checked against every balance post and patch note since launch. Each hero shows the date their kit was last checked.
- **Hero tips** are short advice for playing against and as each hero, plus quirks the in-game text doesn't explain. They're our own words, written from official patch notes and current guides, and each quirk shows the date it was last checked.
- **Maps** are optional. Each ranked map is tagged with its mode and layout (long sightlines, tight spaces, high ground, chokepoints, flank routes), and each hero with a play style (long range, brawler, dive, flyer, area control). Picking a map, and your side on Convoy and Convergence, adds a small nudge of at most one and a half tier steps toward heroes whose style suits it, so a real counter still outweighs the map. Heroes without a style tag are unaffected.
