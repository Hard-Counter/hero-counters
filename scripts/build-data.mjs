#!/usr/bin/env node
// Curated source for the app's hero data.
//
// To update after a patch or weekly review:
//   1. Edit the tables below and bump REVISION.
//   2. Run: node scripts/build-data.mjs
// The script checks every hero, counter and comp, then writes src/data/heroes.json.
// Tiers and counters are our own analysis. Do not paste third-party win/pick/ban
// numbers into this file: the app is ad-supported, and several stat sites only
// allow personal, non-commercial use of their data.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REVISION = 7;

const META = {
  season: "Season 10: Butcher's Blasphemy",
  seasonShort: 'Season 10',
  patch: 'Sept 11 balance patch, plus small fixes on Sept 17, Sept 24 and Oct 1',
  updated: '2026-10-01',
  nextReview: '2026-10-03',
};

const BRACKETS = [
  { id: 'bronze_gold', label: 'Bronze–Gold', short: 'Bronze–Gold' },
  { id: 'plat_diamond', label: 'Platinum–Diamond', short: 'Plat–Diamond' },
  { id: 'gm_celestial', label: 'Grandmaster–Celestial', short: 'GM–Celestial' },
  { id: 'eternity_oaa', label: 'Eternity–One Above All', short: 'Eternity+' },
];

const METHODOLOGY = [
  'Tiers are curated estimates for each rank bracket, built from public win, pick and ban data after the latest balance patch. PC is the baseline.',
  'Console tiers match PC except where official data shows a clear platform gap. Those heroes move one tier.',
  'Each hero lists the best counter overall and the best counter in every role, so you can answer a threat without leaving your role.',
  'Data-backed counters are supported by public matchup data. Kit-based counters come from how the heroes’ abilities interact. Consensus picks come from community play.',
  'Bans happen at Gold III and above: each team bans three heroes, and a banned hero can’t be picked by either team. Heroes marked as often banned may not be available.',
  'The draft helper leaves out banned heroes and heroes your teammates already picked. Since Season 9 each hero picks one of two team-up abilities that works alone and gets stronger with a named partner, so the helper only gives a small nudge to picks that power up a team-up with your team.',
  'Picking a map in the draft helper nudges close calls toward heroes whose play style suits its layout, mode and side. A real counter always outweighs the map.',
  'Hero tips are our own advice, written from official patch notes and current guides. Each quirk shows the date it was last checked.',
  'Ability breakdowns are written in our own words from the current in-game kits and checked against every balance post and patch note since launch. Each hero shows when their kit was last checked.',
  'The meta shifts with every patch. The data is reviewed weekly and after each balance update.',
];

const SEASON_NOTES = [
  'Gorr the God Butcher (Duelist) is new this season.',
  'Every Strategist now charges their ultimate more slowly.',
  'Ranked bans at Gold III and above alternate 1-2-2-1, removing six heroes per match.',
  'God Quarry, a new Domination map, appeared in a limited Quick Match event that ran through Sept 29. It is not yet confirmed for the ranked map pool.',
  'Season 10.5 arrives October 9.',
];

const CHANGELOG = [
  'Hero pages now have Against, Play as and Abilities tabs. Abilities explain what every hero’s moves do, checked against all patches since launch. Team-ups follow the Season 9 system (two per hero, stronger with a partner). Fixed Peni Parker’s snare and Magneto’s shield tips.',
  'Tips for 12 heroes: how to play against them, how to play them, and quirks the game doesn’t explain. Plus a glossary, and a draft helper that tracks bans and both teams.',
  'Weekly review, Sep 26: no tier or counter changes. The Sept 24 update was cosmetic only (new God Quarry map in Quick Match, a Devil Dinosaur KO-feed fix); no ranked map pool change yet.',
  'Draft helper: pick a map (and your side) to nudge suggestions by layout. Covers the 17 ranked maps.',
  'Season 10 launch data: Gorr added, Sept 11 balance patch and Sept 17 Scarlet Witch fix reflected.',
];

// ---------------------------------------------------------------------------
// Heroes: [id, name, role V/D/S, tiers (Bronze–Gold, Plat–Diamond, GM–Celestial,
// Eternity+) for PC, ban risk h/m/l, extras]
// consoleShift: +1 = one tier better on console, -1 = one tier worse.
// ---------------------------------------------------------------------------
const HEROES = [
  // Vanguards
  ['peni-parker', 'Peni Parker', 'V', 'SSSA', 'h', { patchNote: 'Buffed this season: faster fire rate.' }],
  ['devil-dinosaur', 'Devil Dinosaur', 'V', 'ASSS', 'h', { patchNote: 'Buffed this season: more bleed damage. The most-banned hero at Gold III and above.' }],
  ['the-hood', 'The Hood', 'V', 'AABB', 'l', { patchNote: 'Nerfed this season.' }],
  ['hulk', 'Hulk', 'V', 'BAAA', 'l'],
  ['thor', 'Thor', 'V', 'BBAA', 'l', { patchNote: 'Buffed this season.' }],
  ['captain-america', 'Captain America', 'V', 'CBAA', 'l', { patchNote: 'Buffed this season: more health.' }],
  ['rogue', 'Rogue', 'V', 'BBBB', 'l', { patchNote: 'Buffed this season.' }],
  ['doctor-strange', 'Doctor Strange', 'V', 'BBBB', 'l', { patchNote: 'Buffed this season.' }],
  ['magneto', 'Magneto', 'V', 'BBBB', 'l', { patchNote: 'Nerfed this season: less health and a smaller shield. Still the most-played Vanguard.' }],
  ['venom', 'Venom', 'V', 'BBBB', 'l'],
  ['angela', 'Angela', 'V', 'BBCC', 'l', { patchNote: 'Nerfed this season.' }],
  ['the-thing', 'The Thing', 'V', 'BBCC', 'm', { consoleShift: 1, platformNote: 'Official data shows him stronger on console.', patchNote: 'Nerfed this season: less health and a longer charge cooldown. Stat sites disagree on him, so treat this tier as shaky.' }],
  ['emma-frost', 'Emma Frost', 'V', 'CCBB', 'm', { patchNote: 'Buffed this season.' }],
  ['groot', 'Groot', 'V', 'CCCB', 'l'],
  ['deadpool-vanguard', 'Deadpool', 'V', 'DDDD', 'l', { variant: true, patchNote: 'Buffed in all three roles this season.' }],

  // Duelists
  ['magik', 'Magik', 'D', 'SSSS', 'm', { patchNote: 'Only her team-up with The Hood was nerfed this season.' }],
  ['gorr', 'Gorr the God Butcher', 'D', 'SSSA', 'h', { isNew: true, patchNote: 'New this season. Each kill spawns a Berserker minion where the enemy fell.' }],
  ['storm', 'Storm', 'D', 'AASA', 'l'],
  ['scarlet-witch', 'Scarlet Witch', 'D', 'AAAA', 'm', { patchNote: 'Reworked this season. A Sept 17 fix made her ultimate’s wind-up far less likely to block damage.' }],
  ['hela', 'Hela', 'D', 'AAAS', 'm'],
  ['daredevil', 'Daredevil', 'D', 'AAAB', 'l'],
  ['iron-fist', 'Iron Fist', 'D', 'AABB', 'l', { patchNote: 'Buffed this season.' }],
  ['mister-fantastic', 'Mister Fantastic', 'D', 'ABBB', 'l'],
  ['psylocke', 'Psylocke', 'D', 'BBAA', 'm', { consoleShift: -1, platformNote: 'Official data shows her weaker on console.', patchNote: 'Buffed this season.' }],
  ['spider-man', 'Spider-Man', 'D', 'CBAS', 'h', { patchNote: 'Buffed this season: shorter combo cooldown.' }],
  ['black-panther', 'Black Panther', 'D', 'CBAA', 'm'],
  ['blade', 'Blade', 'D', 'BBBB', 'l'],
  ['iron-man', 'Iron Man', 'D', 'ABCC', 'l'],
  ['human-torch', 'Human Torch', 'D', 'BBCC', 'l'],
  ['wolverine', 'Wolverine', 'D', 'CBBB', 'm', { patchNote: 'Buffed this season.' }],
  ['elsa-bloodstone', 'Elsa Bloodstone', 'D', 'CBBB', 'h', { patchNote: 'Nerfed this season.' }],
  ['winter-soldier', 'Winter Soldier', 'D', 'BCCB', 'm', { patchNote: 'Nerfed this season.' }],
  ['black-cat', 'Black Cat', 'D', 'BCCC', 'l', { patchNote: 'Nerfed this season: her dash lost its invincibility and her stealth leaves a trail.' }],
  ['star-lord', 'Star-Lord', 'D', 'CCCC', 'l', { patchNote: 'Buffed this season.' }],
  ['black-widow', 'Black Widow', 'D', 'DCCB', 'l', { consoleShift: -1, platformNote: 'Aim-heavy rifle: noticeably weaker on controller.', patchNote: 'Nerfed this season.' }],
  ['hawkeye', 'Hawkeye', 'D', 'DDCC', 'l', { consoleShift: -1, platformNote: 'Precision aim: weaker on controller.' }],
  ['namor', 'Namor', 'D', 'CCDD', 'm', { consoleShift: 1, platformNote: 'His turrets don’t need aim, so he does better on console.', patchNote: 'Buffed this season.' }],
  ['moon-knight', 'Moon Knight', 'D', 'CDDD', 'l'],
  ['the-punisher', 'The Punisher', 'D', 'CDDD', 'l'],
  ['deadpool-duelist', 'Deadpool', 'D', 'DDDD', 'l', { variant: true, patchNote: 'Buffed in all three roles this season.' }],
  ['cyclops', 'Cyclops', 'D', 'DDDD', 'l'],
  ['squirrel-girl', 'Squirrel Girl', 'D', 'FFFF', 'l'],
  ['phoenix', 'Phoenix', 'D', 'FFFF', 'l'],

  // Strategists
  ['mantis', 'Mantis', 'S', 'SSSS', 'l', { patchNote: 'Nerfed slightly this season.' }],
  ['ultron', 'Ultron', 'S', 'SSSS', 'l'],
  ['rocket-raccoon', 'Rocket Raccoon', 'S', 'SSAA', 'l'],
  ['jubilee', 'Jubilee', 'S', 'BBAA', 'l'],
  ['gambit', 'Gambit', 'S', 'BBAA', 'h', { patchNote: 'His team-up with Magneto was nerfed this season.' }],
  ['loki', 'Loki', 'S', 'CBAA', 'l', { patchNote: 'Buffed this season.' }],
  ['cloak-and-dagger', 'Cloak & Dagger', 'S', 'BBBB', 'm', { patchNote: 'Nerfed this season.' }],
  ['adam-warlock', 'Adam Warlock', 'S', 'CCBB', 'l'],
  ['invisible-woman', 'Invisible Woman', 'S', 'CCBB', 'l', { patchNote: 'Nerfed this season.' }],
  ['white-fox', 'White Fox', 'S', 'CCCC', 'l', { patchNote: 'Buffed this season.' }],
  ['luna-snow', 'Luna Snow', 'S', 'CCCC', 'l'],
  ['deadpool-strategist', 'Deadpool', 'S', 'DDDD', 'l', { variant: true, patchNote: 'Buffed in all three roles this season.' }],
  ['jeff-the-land-shark', 'Jeff the Land Shark', 'S', 'DDDD', 'l', { patchNote: 'Buffed this season.' }],
];

// ---------------------------------------------------------------------------
// Counters. Each pick: [hero, confidence, reason, extras]
// confidence: d = data-backed, k = kit-based, c = consensus
// overall: a role key ('vanguard' | 'duelist' | 'strategist') to reuse that pick,
// or { from: role, note } to reuse it with an extra note, or a full pick.
// ---------------------------------------------------------------------------
const R = {
  bleed: 'Bleed damage wins drawn-out close-range fights.',
  wolvTank: 'Rage-fueled claws shred big health pools.',
  sleepDive: 'Sleep shuts down the dive.',
  sleepStrat: 'Sleep takes them out of the fight at key moments.',
  diveBackline: 'Dive tank that reaches the backline.',
  bpBackline: 'Dash combo deletes backliners before they can react.',
  ultronAir: 'Flies out of reach and out-pokes them.',
  capChase: 'Fast dive tank that chases down slippery targets.',
  rocketSustain: 'Mobile healer who keeps your team up through the pressure.',
  dataWin: 'Wins this matchup consistently in public data.',
  flyerChase: 'Lightning Realm grounds flyers who try to leave it, and his dash chases them.',
  spideyFlyer: 'Swings up to reach airborne heroes.',
  diveSniper: 'Dives the sniper before they can line up shots.',
  shieldShots: 'Shield blocks the shots.',
  iwRanged: 'Shields block the shots; knockback breaks the angle.',
  iwDive: 'Shields and knockback peel the dive off your team.',
  thingBrawl: 'Tough brawler whose CC punishes divers.',
  mfSoak: 'Tough, elastic body soaks the burst.',
  helaRange: 'Out-ranges them with precise long-range damage.',
};

const COUNTERS = {
  // Vanguards
  angela: {
    overall: 'vanguard',
    vanguard: ['devil-dinosaur', 'd', 'Bleed damage out-brawls a close-range diver.'],
    duelist: ['hela', 'k', 'Precise long-range damage punishes a flying diver.'],
    strategist: ['mantis', 'k', R.sleepDive],
  },
  hulk: {
    overall: 'vanguard',
    vanguard: ['devil-dinosaur', 'd', R.bleed],
    duelist: ['wolverine', 'k', R.wolvTank],
    strategist: ['invisible-woman', 'k', 'Knockback and shields peel a big diver off your team.'],
  },
  'captain-america': {
    overall: 'vanguard',
    vanguard: ['devil-dinosaur', 'd', R.bleed],
    duelist: ['wolverine', 'k', R.wolvTank],
    strategist: ['mantis', 'k', 'Sleep stops a shield-up dive.'],
  },
  'deadpool-vanguard': {
    overall: 'strategist',
    vanguard: ['the-thing', 'k', 'Out-trades him at close range.'],
    duelist: ['magik', 'k', 'Bursts him down quickly at close range.'],
    strategist: ['jubilee', 'd', R.dataWin],
  },
  'devil-dinosaur': {
    overall: { from: 'duelist', note: 'Phoenix wins the duel but is weak overall. Peni is the safer pick.' },
    vanguard: ['peni-parker', 'k', 'Mines, drones and snares punish a big melee body.'],
    duelist: ['phoenix', 'd', R.dataWin, { note: 'Niche pick: Phoenix is weak overall.' }],
    strategist: ['rocket-raccoon', 'k', 'Heals through the pressure while kiting away.'],
  },
  'doctor-strange': {
    overall: 'duelist',
    vanguard: ['devil-dinosaur', 'k', R.bleed],
    duelist: ['wolverine', 'd', 'Gets past the shield to the tank.'],
    strategist: ['rocket-raccoon', 'k', 'Damage-boost ultimate helps your team break the shield.'],
  },
  'emma-frost': {
    overall: 'duelist',
    vanguard: ['devil-dinosaur', 'k', R.bleed],
    duelist: ['wolverine', 'd', R.wolvTank],
    strategist: ['rocket-raccoon', 'k', R.rocketSustain],
  },
  groot: {
    overall: 'duelist',
    vanguard: ['devil-dinosaur', 'k', R.bleed],
    duelist: ['wolverine', 'd', R.wolvTank],
    strategist: ['cloak-and-dagger', 'k', 'Terror Cape’s vulnerability helps your team burn him down.'],
  },
  magneto: {
    overall: 'duelist',
    vanguard: ['devil-dinosaur', 'k', R.bleed],
    duelist: ['wolverine', 'd', 'Rage scaling beats his smaller Season 10 shield.'],
    strategist: ['cloak-and-dagger', 'k', 'Vulnerability helps burn through his shields.'],
  },
  'peni-parker': {
    overall: 'strategist',
    vanguard: ['the-hood', 'd', R.dataWin],
    duelist: ['the-punisher', 'd', 'Out-ranges her nest and mines.'],
    strategist: ['rocket-raccoon', 'd', 'Mobile and hard to trap in her web zone.', { alt: ['jubilee'] }],
  },
  rogue: {
    overall: 'vanguard',
    vanguard: ['devil-dinosaur', 'd', R.bleed, { alt: ['peni-parker', 'the-thing'] }],
    duelist: ['wolverine', 'k', R.wolvTank],
    strategist: ['mantis', 'k', R.sleepDive],
  },
  'the-hood': {
    overall: 'duelist',
    vanguard: ['devil-dinosaur', 'k', R.bleed],
    duelist: ['wolverine', 'd', R.wolvTank],
    strategist: ['rocket-raccoon', 'k', R.rocketSustain],
  },
  'the-thing': {
    overall: 'duelist',
    vanguard: ['peni-parker', 'd', 'Snares, drones and mines slow him before he reaches you.'],
    duelist: ['the-punisher', 'd', 'Sustained damage from range, outside his reach.'],
    strategist: ['rocket-raccoon', 'k', 'Keeps your team healed while staying out of his reach.'],
  },
  thor: {
    overall: 'vanguard',
    vanguard: ['devil-dinosaur', 'd', R.bleed],
    duelist: ['wolverine', 'k', R.wolvTank],
    strategist: ['mantis', 'k', R.sleepDive],
  },
  venom: {
    overall: 'duelist',
    vanguard: ['devil-dinosaur', 'k', R.bleed],
    duelist: ['wolverine', 'd', R.wolvTank],
    strategist: ['mantis', 'k', 'Sleep catches him mid-dive.'],
  },

  // Duelists
  'black-cat': {
    overall: 'vanguard',
    vanguard: ['the-thing', 'd', 'CC and durability beat a dive that lost its invincibility.'],
    duelist: ['hela', 'k', 'Her stealth trail now gives her away to precise aim.'],
    strategist: ['invisible-woman', 'k', R.iwDive],
  },
  'black-panther': {
    overall: 'vanguard',
    vanguard: ['the-thing', 'd', R.thingBrawl],
    duelist: ['namor', 'c', 'Turrets punish divers.', { note: 'Namor is weak overall.' }],
    strategist: ['mantis', 'k', 'Sleep ends the dive.'],
  },
  'black-widow': {
    overall: 'strategist',
    vanguard: ['magneto', 'k', 'Shield blocks her sightlines.'],
    duelist: ['spider-man', 'k', 'Gets on top of her before her rifle can wear your team down.'],
    strategist: ['invisible-woman', 'd', R.iwRanged],
  },
  blade: {
    overall: 'duelist',
    vanguard: ['magneto', 'k', 'Shields absorb his burst.'],
    duelist: ['human-torch', 'd', 'Area denial and flight keep him at range.'],
    strategist: ['invisible-woman', 'k', R.iwDive],
  },
  cyclops: {
    overall: 'strategist',
    vanguard: ['magneto', 'k', 'Shield blocks his beams.'],
    duelist: ['spider-man', 'k', 'Dives him before he can line up shots.'],
    strategist: ['rocket-raccoon', 'd', R.dataWin],
  },
  daredevil: {
    overall: 'vanguard',
    vanguard: ['devil-dinosaur', 'd', R.bleed],
    duelist: ['hela', 'k', 'Precise burst punishes his approach.'],
    strategist: ['mantis', 'k', R.sleepDive],
  },
  'deadpool-duelist': {
    overall: 'vanguard',
    vanguard: ['the-thing', 'd', 'Out-brawls him up close.', { alt: ['venom'] }],
    duelist: ['mister-fantastic', 'd', R.mfSoak],
    strategist: ['rocket-raccoon', 'k', R.rocketSustain],
  },
  'elsa-bloodstone': {
    overall: 'strategist',
    vanguard: ['magneto', 'k', R.shieldShots],
    duelist: ['hela', 'k', R.helaRange],
    strategist: ['cloak-and-dagger', 'd', R.dataWin],
  },
  gorr: {
    overall: 'vanguard',
    vanguard: ['peni-parker', 'd', 'Snares, drones and mines stall his melee push.', { alt: ['devil-dinosaur'] }],
    duelist: ['scarlet-witch', 'd', R.dataWin],
    strategist: ['ultron', 'd', 'Kites from the air, out of melee reach.'],
  },
  hawkeye: {
    overall: 'duelist',
    vanguard: ['magneto', 'k', 'Shield blocks his arrows.'],
    duelist: ['black-panther', 'd', R.diveSniper],
    strategist: ['invisible-woman', 'k', 'Shields block his arrows.'],
  },
  hela: {
    overall: 'strategist',
    vanguard: ['magneto', 'd', 'Shield blocks her sightlines.'],
    duelist: ['black-panther', 'd', R.diveSniper],
    strategist: ['invisible-woman', 'd', R.iwRanged, { alt: ['cloak-and-dagger'] }],
  },
  'human-torch': {
    overall: 'duelist',
    vanguard: ['thor', 'k', R.flyerChase],
    duelist: ['spider-man', 'd', R.spideyFlyer],
    strategist: ['rocket-raccoon', 'k', R.rocketSustain],
  },
  'iron-fist': {
    overall: 'vanguard',
    vanguard: ['peni-parker', 'd', 'Snares and mines stall his combos.'],
    duelist: ['mister-fantastic', 'k', R.mfSoak],
    strategist: ['invisible-woman', 'k', 'Knockback breaks up his combos.'],
  },
  'iron-man': {
    overall: 'duelist',
    vanguard: ['deadpool-vanguard', 'd', R.dataWin],
    duelist: ['spider-man', 'd', R.spideyFlyer],
    strategist: ['rocket-raccoon', 'd', R.dataWin],
  },
  magik: {
    overall: 'vanguard',
    vanguard: ['peni-parker', 'd', 'Snares and mines stall her dives.', { alt: ['the-thing'] }],
    duelist: ['mister-fantastic', 'd', R.mfSoak],
    strategist: ['ultron', 'd', 'Flies above her melee range.'],
  },
  'mister-fantastic': {
    overall: 'vanguard',
    vanguard: ['devil-dinosaur', 'd', R.bleed],
    duelist: ['scarlet-witch', 'k', 'Sustained damage gets through his stretch.'],
    strategist: ['mantis', 'k', 'Sleep takes him out of the fight.'],
  },
  'moon-knight': {
    overall: 'strategist',
    vanguard: ['venom', 'k', 'Dives the poke.'],
    duelist: ['spider-man', 'k', 'Dives him before his bounces add up.'],
    strategist: ['ultron', 'd', R.dataWin],
  },
  namor: {
    overall: 'strategist',
    vanguard: ['captain-america', 'k', 'Dives past the turrets.'],
    duelist: ['black-panther', 'k', 'Dives in before the turrets add up.'],
    strategist: ['rocket-raccoon', 'd', R.dataWin],
  },
  phoenix: {
    overall: 'strategist',
    vanguard: ['peni-parker', 'k', 'Mines and drones hold space against her pressure.'],
    duelist: ['spider-man', 'k', 'Dives her before she can set up.'],
    strategist: ['cloak-and-dagger', 'd', R.dataWin],
  },
  psylocke: {
    overall: 'duelist',
    vanguard: ['the-thing', 'k', 'CC catches her through her mobility.'],
    duelist: ['daredevil', 'd', 'Tracks her through stealth.'],
    strategist: ['mantis', 'k', 'Sleep takes her out of the fight.'],
  },
  'scarlet-witch': {
    overall: { from: 'duelist', note: 'Squirrel Girl wins the duel but is weak overall. Consider Doctor Strange’s shield instead.' },
    vanguard: ['doctor-strange', 'k', 'His big shield soaks her damage while your team closes in.'],
    duelist: ['squirrel-girl', 'd', R.dataWin, { note: 'Niche pick: Squirrel Girl is weak overall.' }],
    strategist: ['invisible-woman', 'k', 'Shields soak her damage.'],
  },
  'spider-man': {
    overall: 'vanguard',
    vanguard: ['the-thing', 'd', R.thingBrawl, { alt: ['angela', 'doctor-strange'] }],
    duelist: ['mister-fantastic', 'd', 'Tough, elastic body survives his burst.'],
    strategist: ['white-fox', 'd', 'Only a slight edge.', { weak: true, note: 'No Strategist counters him well. Lean on your Vanguards.' }],
  },
  'squirrel-girl': {
    overall: 'strategist',
    vanguard: ['peni-parker', 'k', 'Holds space against her poke.'],
    duelist: ['hela', 'k', R.helaRange],
    strategist: ['ultron', 'd', 'Airborne and hard to hit with her bouncing shots.'],
  },
  'star-lord': {
    overall: 'strategist',
    vanguard: ['peni-parker', 'k', 'Mines and drones stall his flanks.'],
    duelist: ['hela', 'k', 'Precise burst punishes his low health.'],
    strategist: ['jubilee', 'd', R.dataWin],
  },
  storm: {
    overall: 'duelist',
    vanguard: ['thor', 'k', R.flyerChase],
    duelist: ['black-widow', 'd', 'Her rifle punishes a flyer. Less reliable on controller.'],
    strategist: ['ultron', 'k', 'Fights her in the air.'],
  },
  'the-punisher': {
    overall: 'strategist',
    vanguard: ['magneto', 'k', 'Shield blocks his sustained fire.'],
    duelist: ['black-panther', 'k', 'Dives in before he can settle.'],
    strategist: ['invisible-woman', 'd', R.iwRanged],
  },
  'winter-soldier': {
    overall: 'strategist',
    vanguard: ['magneto', 'k', R.shieldShots],
    duelist: ['magik', 'k', 'Closes the gap fast and bursts him down.'],
    strategist: ['invisible-woman', 'd', R.iwRanged],
  },
  wolverine: {
    overall: 'duelist',
    vanguard: ['peni-parker', 'k', 'Snares and drones slow him so you can kite the melee.'],
    duelist: ['iron-man', 'd', 'Stays airborne, out of claw range.'],
    strategist: ['mantis', 'k', 'Sleep stops the leap.'],
  },

  // Strategists
  'adam-warlock': {
    overall: 'duelist',
    vanguard: ['venom', 'k', R.diveBackline],
    duelist: ['black-panther', 'd', R.bpBackline],
    strategist: ['ultron', 'k', R.ultronAir],
  },
  'cloak-and-dagger': {
    overall: 'duelist',
    vanguard: ['venom', 'k', R.diveBackline],
    duelist: ['black-panther', 'd', R.bpBackline],
    strategist: ['mantis', 'k', R.sleepStrat],
  },
  'deadpool-strategist': {
    overall: 'duelist',
    vanguard: ['venom', 'k', R.diveBackline],
    duelist: ['blade', 'd', 'Anti-heal cuts through his sustain.'],
    strategist: ['mantis', 'k', R.sleepStrat],
  },
  gambit: {
    overall: 'duelist',
    vanguard: ['venom', 'k', R.diveBackline],
    duelist: ['black-panther', 'd', R.bpBackline],
    strategist: ['ultron', 'k', R.ultronAir],
  },
  'invisible-woman': {
    overall: 'duelist',
    vanguard: ['venom', 'k', R.diveBackline],
    duelist: ['daredevil', 'd', 'Tracks her through invisibility.'],
    strategist: ['ultron', 'k', R.ultronAir],
  },
  'jeff-the-land-shark': {
    overall: 'duelist',
    vanguard: ['captain-america', 'k', R.capChase],
    duelist: ['black-panther', 'd', 'Dash combo deletes him. The most lopsided matchup in the game.'],
    strategist: ['mantis', 'k', R.sleepStrat],
  },
  jubilee: {
    overall: 'duelist',
    vanguard: ['venom', 'k', R.diveBackline],
    duelist: ['black-panther', 'd', R.bpBackline],
    strategist: ['ultron', 'k', R.ultronAir],
  },
  loki: {
    overall: 'duelist',
    vanguard: ['venom', 'k', R.diveBackline],
    duelist: ['spider-man', 'd', 'Diving exposes the real Loki among the clones.'],
    strategist: ['mantis', 'k', R.sleepStrat],
  },
  'luna-snow': {
    overall: 'duelist',
    vanguard: ['venom', 'k', R.diveBackline],
    duelist: ['black-panther', 'd', R.bpBackline],
    strategist: ['ultron', 'k', R.ultronAir],
  },
  mantis: {
    overall: 'duelist',
    vanguard: ['venom', 'k', R.diveBackline],
    duelist: ['black-panther', 'd', R.bpBackline],
    strategist: ['ultron', 'k', R.ultronAir],
  },
  'rocket-raccoon': {
    overall: 'duelist',
    vanguard: ['captain-america', 'k', R.capChase],
    duelist: ['black-panther', 'd', R.bpBackline],
    strategist: ['ultron', 'k', R.ultronAir],
  },
  ultron: {
    overall: 'duelist',
    vanguard: ['thor', 'k', R.flyerChase],
    duelist: ['spider-man', 'd', R.spideyFlyer],
    strategist: ['rocket-raccoon', 'k', 'Keeps your team healed through his poke.'],
  },
  'white-fox': {
    overall: { from: 'duelist', note: 'Squirrel Girl wins the duel but is weak overall. Venom’s dive is the practical answer.' },
    vanguard: ['venom', 'k', R.diveBackline],
    duelist: ['squirrel-girl', 'd', R.dataWin, { note: 'Niche pick: Squirrel Girl is weak overall.' }],
    strategist: ['ultron', 'k', R.ultronAir],
  },
};

// ---------------------------------------------------------------------------
// Team comps. Slots: [role, options]; empty options = any hero of that role.
// ---------------------------------------------------------------------------
const COMPS = [
  {
    id: 'chaos-brawl',
    name: 'Chaos brawl',
    style: 'Brawl',
    split: '2-2-2',
    summary: 'Magneto and The Hood walk the team in while Scarlet Witch and Gorr melt anything close. Jubilee pairs with Scarlet Witch. The top comp in public comp models this season.',
    slots: [['V', ['the-hood']], ['V', ['magneto']], ['D', ['gorr']], ['D', ['scarlet-witch']], ['S', ['cloak-and-dagger']], ['S', ['jubilee']]],
    teamUps: [
      { name: 'Metallic Chaos', heroes: ['magneto', 'scarlet-witch'], note: 'Cooldown raised to 18s this season.' },
      { name: 'Void Pentagram', heroes: ['magik', 'the-hood'], note: 'If you swap Magik in.' },
    ],
    bestBrackets: ['plat_diamond', 'gm_celestial'],
    evidence: 'Tops a public six-hero comp model. Part of its measured win rate comes from coordinated premade teams.',
    counter: {
      name: 'Poke and peel',
      heroes: ['hela', 'storm', 'ultron', 'invisible-woman'],
      why: 'Brawl has to walk in. Long-range damage from high ground punishes the approach, shields stall the push, and Magneto’s smaller shield breaks faster this season.',
    },
  },
  {
    id: 'shield-brawl',
    name: 'Shield brawl',
    style: 'Brawl',
    split: '2-2-2',
    summary: 'Doctor Strange’s shield anchors the same brawl core. The most-played lineup this season, though it wins on comfort more than on draft strength.',
    slots: [['V', ['doctor-strange']], ['V', ['the-hood']], ['D', ['gorr']], ['D', ['scarlet-witch']], ['S', ['cloak-and-dagger']], ['S', ['jubilee']]],
    teamUps: [{ name: 'Gamma Maelstrom', heroes: ['doctor-strange', 'hulk'], note: 'If you run Hulk instead of The Hood.' }],
    bestBrackets: ['bronze_gold', 'plat_diamond'],
    evidence: 'The most-played brawl in public comp data. A comp model rates the draft itself as weak.',
    counter: {
      name: 'Anti-tank dive',
      heroes: ['wolverine', 'devil-dinosaur'],
      why: 'Wolverine is Doctor Strange’s hardest counter. Take out the shield holder and the brawl falls apart.',
    },
  },
  {
    id: 'peni-dive',
    name: 'Peni dive',
    style: 'Dive',
    split: '2-2-2',
    summary: 'Peni holds space with webs and mines while Magik or Gorr and a mobile diver pick off the backline. Built from this season’s highest-rated heroes, and it needs voice comms.',
    slots: [['V', ['peni-parker']], ['V', ['devil-dinosaur', 'thor']], ['D', ['magik', 'gorr']], ['D', ['spider-man', 'black-panther']], ['S', ['mantis']], ['S', ['ultron', 'rocket-raccoon']]],
    teamUps: [
      { name: 'Parker Power-Up', heroes: ['spider-man', 'peni-parker'], note: 'Cooldown cut to 10s this season.' },
      { name: 'SP//DR Sync', heroes: ['ultron', 'peni-parker'] },
      { name: 'Vibranium Mech', heroes: ['peni-parker', 'black-panther'] },
    ],
    bestBrackets: ['plat_diamond', 'gm_celestial', 'eternity_oaa'],
    evidence: 'Peni, Magik, Gorr, Mantis and Ultron are the five highest win-rate heroes on a major stat tracker.',
    counter: {
      name: 'Anti-dive brawl',
      heroes: ['the-thing', 'rocket-raccoon', 'jubilee', 'the-punisher'],
      why: 'The Thing punishes Spider-Man and Black Panther, Rocket and Jubilee are Peni’s hardest counters, and Punisher out-ranges her nest. Or ban Peni or Devil Dinosaur, which high ranks already do.',
    },
  },
  {
    id: 'flyer-poke',
    name: 'Flyer poke',
    style: 'Poke',
    split: '2-2-2',
    summary: 'Storm and Hela deal damage from the air and long range while Ultron heals from above. Strongest on open maps at high ranks, and better on PC.',
    slots: [['V', ['thor', 'hulk']], ['V', ['magneto']], ['D', ['storm']], ['D', ['hela']], ['S', ['ultron']], ['S', ['rocket-raccoon']]],
    teamUps: [{ name: 'Ragnarök', heroes: ['gorr', 'hela'], note: 'New this season, if you swap Gorr in for Storm.' }],
    bestBrackets: ['gm_celestial', 'eternity_oaa'],
    evidence: 'Storm wins well above average but is rarely picked. Aim-heavy poke performs better on PC.',
    counter: {
      name: 'Hitscan and vertical dive',
      heroes: ['black-widow', 'spider-man'],
      why: 'Black Widow’s rifle punishes flyers (less reliable on controller), and Spider-Man swings up to reach Ultron and other airborne heroes.',
    },
  },
  {
    id: 'triple-strategist',
    name: 'Triple-Strategist sustain',
    style: 'Sustain',
    split: '2-1-3',
    summary: 'Three Strategists out-heal the enemy while two Vanguards hold the line. It ruled last season but is weaker now that every Strategist charges their ultimate more slowly.',
    slots: [['V', ['emma-frost']], ['V', []], ['D', []], ['S', ['mantis']], ['S', ['rocket-raccoon']], ['S', ['ultron']]],
    teamUps: [{ name: 'Spirit Breaker', heroes: ['emma-frost', 'mantis'] }],
    bestBrackets: ['bronze_gold', 'plat_diamond'],
    evidence: 'Dominant in Season 9. Not yet re-measured after this season’s ultimate-charge nerf.',
    counter: {
      name: 'Burst dive with anti-heal',
      heroes: ['black-panther', 'blade', 'magik', 'gorr'],
      why: 'Black Panther is the top counter to most Strategists, Blade’s anti-heal cuts through the healing, and Magik or Gorr burst targets before heals land.',
    },
  },
];

// ---------------------------------------------------------------------------
// Play styles, for matching heroes to map layouts in the draft helper.
// long-range: precise damage from distance · brawl: wins close fights and holds space
// dive: reaches the backline or flanks · flyer: fights from the air · area: zones and chokes
// Leave a hero out when unsure of their kit: no styles means no map nudge either way.
// Healers mostly stay neutral; map layout matters less for them.
// ---------------------------------------------------------------------------
const STYLES = {
  // Vanguards
  'peni-parker': ['area'],
  'devil-dinosaur': ['brawl'],
  'the-hood': ['brawl'],
  hulk: ['brawl', 'dive'],
  thor: ['brawl'],
  'captain-america': ['dive', 'brawl'],
  rogue: ['brawl'],
  'doctor-strange': ['area'],
  magneto: ['area'],
  venom: ['dive'],
  angela: ['dive', 'flyer'],
  'the-thing': ['brawl'],
  'emma-frost': ['brawl'],
  groot: ['area'],
  // Duelists
  magik: ['dive', 'brawl'],
  gorr: ['brawl'],
  storm: ['flyer', 'long-range'],
  'scarlet-witch': ['brawl'],
  hela: ['long-range'],
  daredevil: ['dive', 'brawl'],
  'iron-fist': ['dive'],
  'mister-fantastic': ['brawl'],
  psylocke: ['dive'],
  'spider-man': ['dive'],
  'black-panther': ['dive'],
  blade: ['brawl'],
  'iron-man': ['flyer', 'long-range'],
  'human-torch': ['flyer', 'area'],
  wolverine: ['brawl', 'dive'],
  'winter-soldier': ['brawl'],
  'black-cat': ['dive'],
  'star-lord': ['dive'],
  'black-widow': ['long-range'],
  hawkeye: ['long-range'],
  namor: ['area'],
  'moon-knight': ['area'],
  'the-punisher': ['long-range'],
  cyclops: ['long-range'],
  'squirrel-girl': ['area'],
  // Strategists
  ultron: ['flyer'],
};

// ---------------------------------------------------------------------------
// Hero tips: our own short advice, written from official patch notes and current guides.
// Never paste guide text; keep each tip to a sentence or two, and only include what the
// sources support. A hero without an entry simply shows no tips.
//   focus: [h/m/l, why] how high a priority this hero is when they're on the enemy team
//   against: playing against the hero · as: playing as the hero
//   quirks: [text, asOf] mechanics the in-game text doesn't explain, known bugs, and advice
//     that went out of date. asOf is the date it was last checked against the patch notes.
//     Remove a quirk once a patch fixes it.
// ---------------------------------------------------------------------------
const TIPS = {
  'peni-parker': {
    focus: ['m', 'Tough and heals on her own webs. Break her nest, then catch her off her webs.'],
    against: [
      'Break her Spider-Nest first. It spreads the webs that heal her team, speed them up and hide her mines.',
      'Treat webbed ground as mined. Mines placed on her webs are invisible to you.',
      'Her snare’s first hit only slows and marks you. Back off or break line of sight before a second hit roots you in place.',
      'During her mech ultimate she is much tougher and faster. Spread out and kite until it ends instead of trading with her.',
      'Since Season 10 she no longer slows down while firing, so expect her to keep moving while she shoots.',
    ],
    as: [
      'Place the nest where it covers the objective or a choke but sits out of long sightlines, then fight on your webs for healing and speed.',
      'Drop mines on your webs so enemies can’t see them.',
      'Since Season 10 you move at full speed while firing. Strafe and use cover instead of standing still.',
      'Fire both snare charges at one diver: the first hit slows and marks, the second roots.',
      'Keep Cyber-Bond and wall climbing for escaping or taking high ground.',
    ],
    quirks: [
      ['Guides from before August 2026 say her snare roots on the first hit. Now the first hit slows and marks, and only a second hit while marked roots.', '2026-10-01'],
      ['Her snare’s cooldown used to start the moment it was cast, so it came back early. The Sept 11 patch fixed that, so it now takes its full cooldown.', '2026-10-01'],
      ['Webs laid during her mech ultimate disappear when it ends.', '2026-10-01'],
    ],
  },
  'devil-dinosaur': {
    focus: ['l', 'Very tough, and gains bonus health from his bleeds and bites. Pressure his backline, and burst him only after his barrier and Frenzied Feast are used.'],
    against: [
      'His grab only works on targets that are already bleeding. If his bite or beam has bled you, stay close to your team.',
      'His bleed is percentage-based, so it hurts high-health heroes most. Each beam hit adds more bleed time since Season 10, so step out of the beam instead of standing in it.',
      'Knockbacks don’t move him, so don’t plan on pushing him off your team.',
      'Don’t brawl him while Frenzied Feast is active. It turns his damage into bonus health.',
      'During his ultimate, spread out and kite. His stomps launch you and apply bleed.',
    ],
    as: [
      'Bleed a target with your bite or beam, then pounce to grab and throw them toward your team.',
      'Keep the beam on targets. Since Season 10 each hit adds a full second of bleed, and bleed hits harder.',
      'Pull enemies back to your team rather than diving their backline alone.',
      'Save Buddy Barrier for enemy ultimates and burst.',
      'You gain less ultimate charge from taking damage than most tanks, so build it by dealing damage.',
      'Team up with The Punisher. Season 10 gave that team-up faster projectiles.',
    ],
    quirks: [['He takes reduced damage from critical hits, so headshots do less to him than usual.', '2026-10-01']],
  },
  magneto: {
    focus: ['m', 'Hard to hurt through his curtain and shields, but since Season 10 he drops fast once his shield is on cooldown.'],
    against: [
      'His Metallic Curtain only blocks projectiles. Use beams, hitscan or melee, walk around it, or wait for its energy to run out.',
      'His self shield and ally shield have separate cooldowns, so shielding a teammate doesn’t leave him open. Burst him right after his own shield breaks.',
      'Season 10 cut his health and shield strength, so focused burst takes him down much faster than before.',
      'When he charges his meteor ultimate, leave the impact area or break line of sight. Projectiles fired into it make it hit harder.',
      'Watch the rings floating behind him. At three, his cannon hits hardest and knocks you back.',
    ],
    as: [
      'Save your shield for an ally who is being dived rather than for chip damage. Damage it absorbs builds rings for your cannon.',
      'Build three rings before firing Mag-Cannon for the extra damage and knockback.',
      'Raise the curtain against projectile-heavy heroes and ultimates, and keep an eye on its energy.',
      'With less health since Season 10, play near cover and your second tank instead of holding the front alone.',
      'Metallic Chaos with Scarlet Witch has a longer cooldown since Season 10, so don’t build your fights around it.',
    ],
    quirks: [
      ['His meteor can overload and cancel if it absorbs too many projectiles.', '2026-10-01'],
      ['Guides that say his two shields share a cooldown are out of date. They have been separate since late 2025.', '2026-10-01'],
    ],
  },
  'the-hood': {
    focus: ['h', 'Low health for a Vanguard after Season 10 and no hard crowd control. He goes down fast once his parry is used.'],
    against: [
      'Bait out Mantle of Oblivion, his short parry, before you commit burst or an ultimate. Season 10 gave it a longer cooldown.',
      'His veil only weakens projectiles that pass through it, and less so since Season 10. Walk around it or use damage that isn’t a projectile.',
      'His ultimate fires piercing shots and turns damage into bonus health. Don’t line up, and break line of sight so he can’t farm health.',
      'He plays more like a Duelist than a tank, so focusing him pays off more than focusing most Vanguards.',
    ],
    as: [
      'Demonic Energy comes from dealing damage, blocking with Mantle and using Void Walk. At half full, your pistols fire faster.',
      'Save Mantle of Oblivion for a big ability or an ultimate. It’s on a longer cooldown since Season 10.',
      'Open fights with Void Walk. It damages enemies where you land and builds energy.',
      'Fight up close. Your pistols lose damage with distance.',
      'Pair him with a real main tank. He can’t hold a point alone, especially with less health since Season 10.',
    ],
  },
  gorr: {
    focus: ['h', 'Snowballs off kills, since each one spawns a Berserker that heals him and gives him an escape. Clear his Berserkers, then catch him after his surge.'],
    against: [
      'Kill his Berserkers on sight. They heal him, give him an escape route and add damage, and they don’t have much health.',
      'He can’t be hurt during Living Abyss, his forward surge. Hold stuns and burst until it ends.',
      'He escapes by teleporting to a Berserker. Look for the one he leaves behind cover before a dive. Kill it and he’s stuck.',
      'Stay at range or in the air. Zone tools like Peni Parker’s nest and mines give him trouble.',
      'Don’t feed him kills. Every kill spawns a new Berserker where your teammate fell.',
      'Against his ultimate, spread out. It spawns a Berserker next to every enemy in range.',
    ],
    as: [
      'Plant a Berserker somewhere safe before you dive. Shadow Harvest to it is your real escape.',
      'Engage with Living Abyss, which makes you invincible and frenzies your Berserkers. Slow your target with Necro-Power, combo, then Shadow Harvest out.',
      'Keep Living Abyss for engaging. Shadow Harvest has the short cooldown, so use it to escape again and again.',
      'After a kill, harvest the new Berserker for bonus health or a quick exit.',
      'Harvest healthy Berserkers. The bonus health you get depends on how much health they have left.',
    ],
    quirks: [
      ['Kills don’t turn enemies into copies of themselves. Each kill spawns an ordinary Berserker where the enemy fell.', '2026-10-01'],
      ['Berserkers shoot from range, but fight in melee when you pull them in with Necro-Power.', '2026-10-01'],
    ],
  },
  magik: {
    focus: ['h', 'Deletes isolated backliners and is hard to pin down while she has portals. Punish her once her portals and dash are spent.'],
    against: [
      'Her usual engage is a portal to get close, then Umbral Incursion to launch you into the air. With her portals and dash spent, she has little mobility left.',
      'She can’t be hurt while passing through a portal. Hold damage and stuns until she comes out.',
      'Stay grouped near your Vanguards. She wins isolated duels and wants to reach your healers.',
      'Crowd control and zoning hurt her. Peni Parker’s nest and mines, Mantis’s sleep and Luna Snow’s freeze are all good answers.',
      'Her ultimate, Darkchild, gives her more reach and damage for several seconds. Peel for each other instead of dueling her.',
      'If she summons the Void Pentagram demon with The Hood, kill it. It’s much weaker since Season 10.',
    ],
    as: [
      'Open with a portal while you’re immune, then Umbral Incursion into your target to launch them and follow up in the air.',
      'Keep a portal charge for escaping.',
      'Right after a portal you have a few seconds to use Eldritch Whirl or Demon’s Rage.',
      'Ult when you can reach several targets. Darkchild’s longer dash doubles as a gap closer.',
      'Treat the Void Pentagram demon as a short distraction, not a tank, since its Season 10 nerf.',
    ],
    quirks: [
      ['Each enemy hit by Magik Slash takes a second off your portal cooldown.', '2026-10-01'],
      ['Eldritch Whirl and Demon’s Rage can only be used for a short time after a portal.', '2026-10-01'],
    ],
  },
  'spider-man': {
    focus: ['h', 'Fragile but deadly to backliners. Focus him the moment he commits, and don’t chase when he swings away.'],
    against: [
      'A web tag means a dive is coming: tag, pull, launch, then melee. If you’re tagged, move back toward your team or a Vanguard.',
      'His launching uppercut comes back faster since Season 10, so expect more launches.',
      'Once he has used his pull and his swings, he has no way out and dies fast to focused hitscan or crowd control.',
      'His ultimate is short, close-range and gives him bonus health. Get out of melee range or use a defensive ability instead of trying to out-damage it.',
      'Flanking him is hard. His Spider-Sense warns him about unseen enemies nearby.',
    ],
    as: [
      'Tag before you commit. Get Over Here! locks on to tagged enemies.',
      'Loop tag, pull, uppercut, air melee, then tag again. The Season 10 cooldown cut lets you uppercut again much sooner.',
      'Keep a web-swing charge to get out instead of spending them all to get in.',
      'Ult in melee range of several enemies. The bonus health covers your dive.',
      'Throw Parker Power-Up’s spider-bomb often; Season 10 cut its cooldown. With Peni Parker on your team, its tracers also give you bonus health.',
    ],
  },
  'scarlet-witch': {
    focus: ['m', 'Squishy, and her escape is slower since her rework. Raise her priority when several of your team are marked or her ultimate is ready.'],
    against: [
      'Her Chaos Marks are the key. Scarlet Hex (a long line in front of her) and Dark Seal mark you, and her beam then hits every marked enemy at once. Don’t line up, and break line of sight once marked.',
      'Fight her from beyond about 20 meters, the reach of her marks and of Chaos Control.',
      'Dark Seal now stuns only once, briefly, when it goes off. Walk out of the field instead of waiting in it.',
      'Burst her instead of trading slowly. Her only sustain is bonus health from hitting marked targets, and her escape is slower since Season 10.',
      'During her ultimate wind-up, get more than 15 meters away or kill her. Keep shooting, since Sept 17 she rarely becomes immune during it.',
    ],
    as: [
      'Mark, then beam. Open with Scarlet Hex down a corridor or Dark Seal on a group, then hold Chaos Control to hit every marked enemy in front of you.',
      'Keep marked enemies within about 20 meters and in front of you. The beam covers a wide cone but has a range limit.',
      'Your bonus health only comes from hitting marked targets, so keep marks up.',
      'Use Dark Seal to mark and slow, not to hold a diver. Its stun is very short now.',
      'Don’t count on ultimate immunity. Ult from cover or after the enemy has committed.',
    ],
    quirks: [
      ['Her ultimate wind-up can still randomly make her immune to damage, but since the Sept 17 patch it rarely happens. The odds were never published.', '2026-10-01'],
      ['Advice about Dark Seal stunning over and over is out of date. Since the Season 10 rework it stuns once.', '2026-10-01'],
    ],
  },
  hela: {
    focus: ['h', 'Picks off your healers from long range. Pressure her position and make her use her crow escape before you commit.'],
    against: [
      'She wins long-range duels. Cross open lanes behind cover or shields, and come at her from corners and flanks.',
      'Her crow form, Astral Flock, is her escape, but it doesn’t make her invulnerable. Keep shooting the flock, and commit fully once it’s used.',
      'Her other defense is Soul Drainer, a lobbed orb with a short stun. Dodge or bait it, then commit.',
      'When she gets a kill, move away from the body. A crow explodes there a moment later.',
      'During her ultimate she hovers in the open for a long time. Spread out, use overhead cover, and shoot her down with hitscan or flyers.',
    ],
    as: [
      'Hold long sightlines and high ground and aim for heads. Your damage holds up well at long range.',
      'Save Astral Flock for escaping. You can fly in any direction in crow form, including straight up.',
      'When a diver lands on you, hit them with Soul Drainer and follow up during the stun.',
      'Stick Piercing Night daggers on tanks or groups right before your team engages.',
      'Ult from a safe angle onto grouped enemies. You’re exposed to hitscan the whole time.',
    ],
    quirks: [['Guides from before Season 9 are out of date. Her damage, range falloff and crow-form flight all changed then.', '2026-10-01']],
  },
  'black-panther': {
    focus: ['h', 'The biggest threat to your healers. Track him all fight and punish him when his dash resets fail.'],
    against: [
      'His attack runs on marks. A spear or spinning kick marks you, then dashing through a marked target resets his dash and gives him bonus health. A mark on your backline means he’s coming.',
      'When a dash doesn’t reset, it’s on a long cooldown and he has little way out. Turn on him and burst him.',
      'Crowd control breaks the chain: Mantis’s sleep, Hela’s stun, or a Vanguard peeling. Healers should stay near their tanks.',
      'Part of his health is a shield that refills if he goes a few seconds without taking damage. Keep hitting him as he backs off.',
      'His ultimate marks everyone it hits, which sets up a chain of resets. Spread out when it’s ready and save crowd control for his follow-up.',
    ],
    as: [
      'Mark a target before you dash so Spirit Rend resets and heals you. Dash unmarked targets only to finish a kill.',
      'Hunt healers who stray from their team. Wall-running gives you flank and high-ground angles.',
      'Keep a way out before you commit, and leave as soon as your resets stop landing.',
      'Hit, back off until your shield refills, then go again.',
      'Use your ultimate to mark several enemies, then chain dashes through them.',
    ],
    quirks: [['Guides that list his health as a flat 275 are out of date. Since Season 9 part of it is a shield that refills when he avoids damage for a few seconds.', '2026-10-01']],
  },
  mantis: {
    focus: ['h', 'A top healer who also boosts her team’s damage. Easy to kill once her sleep is baited out.'],
    against: [
      'Bait out her sleep, Spore Slumber, before you dive her. It’s her only self-defense.',
      'If a teammate gets slept, shoot the Mantis illusion that appears near them to wake them early.',
      'Keep up steady pressure. Her heals and buffs spend Life Orbs, which refill more slowly since Season 10.',
      'During her ultimate, back off and re-engage when it ends, or take out Mantis herself.',
      'If she runs her Vitality Pact team-up, a kill may not stick: she lingers as a soul that heals her team and can reform her body.',
    ],
    as: [
      'Land critical hits for extra Life Orbs. It matters more now that orbs refill more slowly.',
      'Before fights, put Healing Flower on your frontline and Allied Inspiration on your best damage dealer.',
      'Save your sleep for divers like Black Panther. Any damage wakes them, so reposition or line up one big hit.',
      'Stay behind your tanks. Apart from your speed boost, you have no escape.',
      'Adam Warlock is your better team-up partner now. Star Blossom, the Star-Lord team-up, lost healing in Season 10.',
    ],
    quirks: [['Guides that say she makes a Life Orb every 3 seconds are out of date. Since Season 10 it’s every 4.', '2026-10-01']],
  },
  ultron: {
    focus: ['h', 'Top-tier healing from the air. Hitscan and flyers should focus him, and everyone else should pressure whoever he’s healing.'],
    against: [
      'He’s a fragile flyer. Long-range hitscan and flying heroes are the reliable answers. Melee divers struggle unless he comes down low.',
      'Firewall is how he survives burst. Since Season 10 it gives less bonus health but also heals him for a few seconds, so burst him before he casts it.',
      'Punish him while his dash, Dynamic Flight, is on cooldown.',
      'His drone heals everyone around its target, so focus enemies away from it.',
    ],
    as: [
      'Keep your Patch drone on the ally under the most pressure, or on one standing in a group.',
      'Use Firewall against enemy burst and ultimates. Since Season 10 it also heals you.',
      'Use height and cover, and don’t hover in open sightlines. Save your dash for escaping divers.',
      'Add beam damage when nobody needs healing.',
      'Use your ultimate to answer an enemy engage.',
    ],
    quirks: [['Older guides say he can’t heal himself. Since Season 10, Firewall also heals him for a few seconds.', '2026-10-01']],
  },
};

// ---------------------------------------------------------------------------
// Ranked map pool: [id, name, world ('' if unsure), mode, traits, note]
// mode: convergence | convoy | domination
// traits: long-sightlines, close-quarters, high-ground, chokepoints, flank-routes
// Keep it to maps in ranked. Traits are our own read of each layout.
// ---------------------------------------------------------------------------
const MAPS = [
  // Convergence: capture a point, then escort
  ['central-park', 'Central Park', 'Empire of Eternal Night', 'convergence', ['long-sightlines'], 'An open clearing at the point, then a narrow wooded escort with little cover to hop between.'],
  ['hall-of-djalia', 'Hall of Djalia', 'Intergalactic Empire of Wakanda', 'convergence', ['high-ground', 'chokepoints'], 'Raised platforms around a crowded middle that rewards holding a spot.'],
  ['heart-of-heaven', 'Heart of Heaven', "K'un-Lun", 'convergence', ['close-quarters', 'high-ground'], 'A winding climb through narrow paths, with the height on the defenders’ side.'],
  ['lower-manhattan', 'Lower Manhattan', '', 'convergence', ['long-sightlines', 'flank-routes'], 'Long street sightlines broken up by corners that mobile heroes use to reset.'],
  ['shin-shibuya', 'Shin-Shibuya', 'Tokyo 2099', 'convergence', ['chokepoints', 'high-ground', 'flank-routes'], 'Three lanes under raised walkways that create chokepoints.'],
  ['symbiotic-surface', 'Symbiotic Surface', 'Klyntar', 'convergence', ['close-quarters'], 'Curved walls and pillars make short, messy fights with odd angles.'],
  // Convoy: escort the payload
  ['arakko', 'Arakko', 'Hellfire Gala', 'convoy', ['long-sightlines', 'high-ground', 'flank-routes'], 'An open festival ground mid-route, with raised gardens that give defenders height.'],
  ['midtown', 'Midtown', 'Empire of Eternal Night', 'convoy', ['close-quarters', 'chokepoints'], 'Tight night-time streets where defenders stack overlapping angles.'],
  ['museum-of-contemplation', 'Museum of Contemplation', '', 'convoy', ['close-quarters', 'flank-routes'], 'Mostly indoor galleries: close fights and hidden flanks, little room for snipers.'],
  ['spider-islands', 'Spider-Islands', 'Tokyo 2099', 'convoy', ['high-ground', 'flank-routes'], 'Web-covered platforms over the sea with lots of vertical ambush spots.'],
  ['thebes', 'Thebes', '', 'convoy', ['high-ground'], 'Stepped temple levels with high perches along the route. Newer, so still being figured out.'],
  ['yggdrasill-path', 'Yggdrasill Path', 'Yggsgard', 'convoy', ['chokepoints'], 'A long route through roots and branches with several defensive holds and a narrow final stretch.'],
  // Domination: hold the point
  ['birnin-tchalla', 'Birnin T’Challa', 'Intergalactic Empire of Wakanda', 'domination', ['high-ground', 'flank-routes'], 'A raised point you can approach from several angles below.'],
  ['celestial-husk', 'Celestial Husk', 'Klyntar', 'domination', ['flank-routes'], 'A round arena with curved walls and no single safe angle, good for dives.'],
  ['hells-heaven', 'Hell’s Heaven', 'Hydra Charteris Base', 'domination', ['close-quarters'], 'A factory floor full of hard cover and short sightlines.'],
  ['krakoa', 'Krakoa', 'Hellfire Gala', 'domination', ['chokepoints'], 'A small point where area denial forces attackers to commit to one angle.'],
  ['royal-palace', 'Royal Palace', 'Yggsgard', 'domination', ['flank-routes'], 'A throne-room point with narrow side corridors for flanks.'],
];

// ---------------------------------------------------------------------------
// Team-ups (Season 9 system): every hero picks one of two team-up abilities before
// the match. It works on its own and gets stronger when its partner is on the team.
//   [name, [hero who uses it, partner], what it does, what the partner adds]
// 'deadpool' stands for all three Deadpool role versions. Keep each text short and in
// our own words. Team-ups change with balance posts and new heroes: re-check them
// whenever a post mentions one, and add both team-ups of every new hero.
// ---------------------------------------------------------------------------
const TEAMUPS = [
  ['Vibranium Mech', ['peni-parker', 'black-panther'], 'Puts a vibranium shield in front of her mech and speeds up Cyber-Web Cluster.', 'The shield is bigger and lasts longer.'],
  ['Rocket Network', ['peni-parker', 'rocket-raccoon'], 'Places an armored nest that drops spider-drones and armor packs that give bonus health.', 'The nest repairs itself, and Rocket’s B.R.B. also spreads webs, drones and mines.'],
  ['Primal Punishment', ['devil-dinosaur', 'the-punisher'], 'Primal Bite becomes two magnetic cannons firing cannonballs that explode and cause bleeding.', 'The Punisher can ride on his back, sharing the damage.'],
  ['Surf & Turf', ['devil-dinosaur', 'jeff-the-land-shark'], 'Impact Beam becomes a water spray that damages enemies and heals allies.', 'Jeff can ride on his head; both take less damage and heal over time.'],
  ['Chaos Collision', ['the-hood', 'scarlet-witch'], 'Creates an arcane zone that damages enemies and stacks up damage and healing reduction on them. Use it again to teleport to its center.', 'Teleporting sets off a shockwave that pulls nearby enemies toward him.'],
  ['New Moon’s Shadow', ['the-hood', 'moon-knight'], 'Abyssal Veil becomes a barrier that blocks projectiles and explodes when broken, cutting enemy damage and healing.', 'The barrier is tougher, and his shots through it bounce to more enemies.'],
  ['Savage Slam', ['hulk', 'captain-america'], 'Leaps and smashes the ground. The lower his health, the more it cuts his cooldowns.', 'The slam also makes enemies take extra damage.'],
  ['Gamma Fastball', ['hulk', 'wolverine'], 'Enters a furious state with faster movement and attacks, and can turn unstoppable at low health.', 'Hulk can throw Wolverine at enemies (Fastball Special).'],
  ['Ragnarok Rebirth', ['thor', 'hela'], 'Fatal damage gives him a draining pool of bonus health instead. Taking part in a knockout during it brings him back.', 'A knockout by Thor or Hela revives him at once, with healing over time.'],
  ['Divine Armory', ['thor', 'angela'], 'Throws a thunder spear that gives Thorforce for each enemy hit, then lets him leap to where it exploded for a second blast.', 'The leap also gives him bonus health.'],
  ['Stars Aligned', ['captain-america', 'winter-soldier'], 'Leaps to an ally, giving them bonus health and taking some of the damage aimed at them.', 'He and Winter Soldier can charge into each other, giving nearby allies bonus health and speed.'],
  ['Voltaic Union', ['captain-america', 'thor'], 'Sentinel Strike’s shield throws become lightning shields.', 'Each lightning shield hit also bursts, damaging enemies around the target.'],
  ['Explosive Entanglement', ['rogue', 'magneto'], 'Defensive Stance gets a bigger magnetic field and more damage reduction, and absorbed damage powers Southern Brawl.', 'Southern Brawl knocks enemies back, with extra damage if they hit a wall.'],
  ['Mr. & Mrs. X', ['rogue', 'gambit'], 'Enters a state where every attack sets off a kinetic explosion that damages enemies and heals nearby allies.', 'The state never ends.'],
  ['Gamma Maelstrom', ['doctor-strange', 'hulk'], 'Maelstrom of Madness becomes Gamma Maelstrom: it builds energy much faster and removes the can’t-be-healed curse.', 'He keeps some energy after releasing it, and stored energy no longer fades.'],
  ['Psionic Vortex', ['doctor-strange', 'invisible-woman'], 'Maelstrom of Madness becomes a vortex that pulls enemies toward him and strengthens his shield.', 'Its damage also gives him bonus health.'],
  ['Metallic Chaos', ['magneto', 'scarlet-witch'], 'Swings a giant Chaos Greatsword that damages enemies in front of him.', 'Mag-Cannon becomes a charged attack that fires greatswords and launches enemies.'],
  ['Magnetic Resonance', ['magneto', 'emma-frost'], 'Creates a magnetic copy of himself that mimics his moves and abilities.', 'The copy gets much more health and lasts until destroyed.'],
  ['Blood Leech', ['venom', 'blade'], 'Tethers to enemies and drains their health over time.', 'Some of his abilities also give him a burst of healing.'],
  ['Abyssal Flames', ['venom', 'phoenix'], 'Dark Predation becomes a sweeping flame slash.', 'Hits stack sparks on enemies, and three stacks detonate.'],
  ['Asgardians of the Galaxy', ['angela', 'star-lord'], 'Reveals enemies in an area, then slams down, grounding the enemies hit.', 'Gains bonus health for each enemy hit.'],
  ['Odin’s Unacknowledged', ['angela', 'loki'], 'Sends an illusion of herself out with Assassin’s Charge, carrying enemies it hits.', 'The ability gets two charges.'],
  ['Two-In-One', ['the-thing', 'human-torch'], 'Flaming fists: Rocky Jab splashes damage and Stone Haymaker explodes.', 'Human Torch can lift him and slam him down, stunning enemies.'],
  ['Unbreakable Forces', ['the-thing', 'invisible-woman'], 'Psionic armor gives him bonus health based on how much health he is missing.', 'The armor also pulses healing when he takes damage.'],
  ['Iced Out Diamond', ['emma-frost', 'luna-snow'], 'Releases icy energy that damages and slows enemies.', 'Diamond Form moves and Telepathic Pulse also slow enemies.'],
  ['Spirit Breaker', ['emma-frost', 'mantis'], 'Damage dealt to a Psychic Spear crystal gives her bonus health.', 'Shattering a crystal gives bonus health and shortens Psychic Spear’s cooldown.'],
  ['Wild Wall', ['groot', 'mantis'], 'Grows a wall that heals nearby allies and gives them bonus health.', 'After healing enough, the wall evolves and heals more.'],
  ['Bubble Buddies', ['groot', 'jeff-the-land-shark'], 'Hides in an invincible bubble shield and heals himself.', 'Heals more, and extra healing becomes bonus health.'],
  ['Gumbo Chimichangas', ['deadpool', 'gambit'], 'A kinetic leap forward that scatters charged chimichangas.', 'The chimichangas also stun.'],
  ['Hel-Yeah, Honey', ['deadpool', 'hela'], 'Gives an extra upgrade to his guns or his katanas.', 'Both weapon sets get the extra upgrade.'],
  ['Chain of Cyttorak', ['magik', 'doctor-strange'], 'Tethers two enemies and drags them together.', 'Can tether more enemies and pull the whole group to one spot.'],
  ['Void Pentagram', ['magik', 'the-hood'], 'Creates a magic circle where Stepping Discs refund energy and summon Limbo demons.', 'The demons get more health and reach.'],
  ['Ragnarök', ['gorr', 'hela'], 'Turns All-Black into a scythe for a sweeping strike that grounds enemies.', 'Shadow Scythe reaches further, and its hits give Gorr and nearby allies bonus health.'],
  ['Hive Mind', ['gorr', 'venom'], 'Fires a piercing symbiote claw that pulls enemies toward him as it retracts.', 'His Berserkers deal more damage and slow enemies.'],
  ['Gods of Thunder', ['storm', 'thor'], 'Wind Blade becomes a lightning beam that hits instantly and bursts on impact.', 'Bolt Rush becomes chain lightning that jumps between enemies.'],
  ['Jaws of Fate', ['storm', 'jeff-the-land-shark'], 'Calls a downpour that heals her and nearby allies.', 'During Omega Hurricane, Jeff can swim in it to form a Jeff-nado.'],
  ['Sorcerers Supreme', ['scarlet-witch', 'doctor-strange'], 'Chthonian Burst becomes Mystic Burst for a while: rapid magic missiles that cost no energy.', 'Mystic Burst becomes a toggle she can switch on and off.'],
  ['Hex Fireworks', ['scarlet-witch', 'jubilee'], 'Dark Seal becomes a Plasmoid Seal with a second explosion that makes enemies take more damage.', 'She heals steadily during Mystic Projection.'],
  ['Hel Tendrils', ['hela', 'venom'], 'Soul Drainer becomes tendrils that pull and link enemies, slowing their escape.', 'Piercing Night fires symbiote thorns, and direct hits heal her.'],
  ['Deep Wrath', ['hela', 'namor'], 'Knockouts she takes part in raise an undead Monstro that her Piercing Night directs.', 'Hits during Goddess of Death also spawn Monstros.'],
  ['Comprehensive Defense', ['daredevil', 'iron-fist'], 'Objection! blocks projectiles from every direction and damages enemies; deflecting builds Fury.', 'He also heals while it lasts.'],
  ['Devilish Affair', ['daredevil', 'black-widow'], 'Devil’s Chain swings in a criss-cross, damaging and slowing enemies.', 'Wider area, and hits restore Fury.'],
  ['Kumiho Palm', ['iron-fist', 'white-fox'], 'Yat Jee Chung Kuen hits heal nearby allies.', 'Yat Jee Chung Kuen can lock on from much further away.'],
  ['Iron & Stone', ['iron-fist', 'the-thing'], 'A powerful uppercut that launches enemies and chains into a sweeping kick.', 'The kick follow-up deals more damage.'],
  ['Fantastic Amplifier', ['mister-fantastic', 'rocket-raccoon'], 'An amplifier raises his max Elasticity and lets him inflate when he chooses.', 'Brainiac Bounce launches the enemies it hits.'],
  ['Clobberin’ Research Dept.', ['mister-fantastic', 'the-thing'], 'A brawler stance he can switch on and off: Stretch Punch becomes a charged punch that gives bonus health.', 'Distended Grip becomes a charged hammer that launches enemies at full charge.'],
  ['Light & Dark Darts', ['psylocke', 'cloak-and-dagger'], 'Releases a ring of light darts that heal allies and leaves a shadow zone that lets her re-enter stealth.', 'Bigger shadow zone, and re-entering stealth fires the darts again.'],
  ['Mental Projection', ['psylocke', 'emma-frost'], 'Sends an illusion of herself dashing forward while she turns invisible.', 'She can swap places with the illusion.'],
  ['Symbiote Bond', ['spider-man', 'venom'], 'Turns symbiote matter into exploding spikes that damage and push enemies back.', 'Extra tendrils tether and damage enemies.'],
  ['Parker Power-Up', ['spider-man', 'peni-parker'], 'Throws a sticky spider-bomb that damages enemies and tags them with Spider-Tracers.', 'Detonating tracers gives him bonus health.'],
  ['Damisa-Yao', ['black-panther', 'storm'], 'Calls on elemental power to damage, slow and mark enemies around him.', 'Enemies in range are launched toward him.'],
  ['Dimensional Shortcut', ['black-panther', 'magik'], 'Teleports back to where he was a few seconds ago, gaining bonus health. The portal damages nearby enemies when it closes.', 'He can cancel the teleport midway.'],
  ['Blade of Khonshu', ['blade', 'moon-knight'], 'A heavy dashing cleave, then fast slashes that send Darkmoon blades bouncing between enemies.', 'Whirlwind Slash throws an extra Darkmoon blade.'],
  ['Bleed for Battle', ['blade', 'captain-america'], 'Damage he takes builds Bloodline Awakening stacks, and he can hold more of them.', 'Taking a critical hit triggers Bloodline Awakening at once.'],
  ['Gamma Charge', ['iron-man', 'hulk'], 'Armor Overdrive becomes Gamma Overdrive, adding a gamma shield and stronger blasts.', 'His ultimate also gives a gamma shield and hits harder.'],
  ['Thunder Overdrive', ['iron-man', 'thor'], 'Unibeam gains a lightning ring that deals extra damage near its edge.', 'Armor Overdrive’s cooldown is much shorter.'],
  ['Fiery Sparks', ['human-torch', 'jubilee'], 'Automatically launches tracking firework sparks at nearby enemies.', 'Landing a spark gives him bonus health.'],
  ['Storming Ignition', ['human-torch', 'storm'], 'Creates a lasting fire vortex that damages and pulls in enemies.', 'Storm’s ultimate becomes a burning hurricane that turns his Flame Fields into new Flame Tornadoes.'],
  ['Pair of Threes', ['wolverine', 'gambit'], 'A kinetic boost to speed and jumping, and his attacks plant particles that explode.', 'He heals steadily while it lasts.'],
  ['Blast Slash', ['wolverine', 'cyclops'], 'His claws reach further, and Vicious Rampage becomes a flurry of slashes.', 'It stays on permanently.'],
  ['Prehistoric Trap', ['elsa-bloodstone', 'devil-dinosaur'], 'Smoky Snare’s monster holds and damages enemies, then releases a damaging gas.', 'She can store and place two snares.'],
  ['Loudmouth Mercs', ['elsa-bloodstone', 'deadpool'], 'Living Bullet becomes special rounds that taunt, slow and damage enemies over time, then return to heal her.', 'She builds Instinct much faster.'],
  ['Timeless Veterans', ['winter-soldier', 'the-punisher'], 'His bionic arm releases electricity that damages and knocks back enemies.', 'It also grounds enemies, with a stronger knockback.'],
  ['Expert Instinct', ['winter-soldier', 'elsa-bloodstone'], 'Knockouts he takes part in give stacks that shorten his cooldowns.', 'Ceaseless Charge gives more bonus health.'],
  ['Feline Alliance', ['black-cat', 'black-panther'], 'Taking damage builds vibranium energy she can release as an explosion that damages and knocks back enemies, stealing Fortune.', 'She can release it at any time.'],
  ['Binding Ties', ['black-cat', 'spider-man'], 'Turn of Fortune becomes a two-charge web grapple that steals Fortune and tags enemies with Spider-Tracers.', 'Hitting a tagged enemy holds them in place briefly.'],
  ['Flora Munitions', ['star-lord', 'groot'], 'Tosses thorn seeds that sprout into snares, damaging and rooting enemies who step on them.', 'More snares, and they hit harder.'],
  ['Star-Soul', ['star-lord', 'adam-warlock'], 'Places a beacon he can teleport to from anywhere, and he can respawn at it.', 'Knockouts he takes part in shorten the beacon’s cooldown.'],
  ['Moonlit Slash', ['hawkeye', 'cloak-and-dagger'], 'Crescent Slash sends out a radiant wave that heals allies and makes enemies take more damage.', 'It becomes a three-hit combo of light blades.'],
  ['Senbonzakura Strike', ['hawkeye', 'psylocke'], 'Blast Arrow becomes psionic arrows he can stockpile and fire together.', 'Faster nocking, and the arrows explode on impact.'],
  ['Chilling Charisma', ['namor', 'luna-snow'], 'Sends a frost tide that damages, pushes back and slows enemies, and his Monstro Spawns become Frozen Spawns that slow.', 'The tide can be charged to crash for area damage at max range.'],
  ['Gamma Monstro', ['namor', 'hulk'], 'Summons an extra Gamma Monstro that keeps damaging the nearest enemy.', 'Blessing of the Deep’s barrier fills with gamma energy, speeding up his cooldowns and boosting damage.'],
  ['Luminous Moon', ['moon-knight', 'cloak-and-dagger'], 'A phased dash that sends out a healing wave for him and nearby allies.', 'Longer dash and wider healing, and he heals over time afterwards.'],
  ['Blood Moon', ['moon-knight', 'elsa-bloodstone'], 'Places an Ankh trap that summons a talon, launching enemies toward its center.', 'Several talons strike the area.'],
  ['Ammo Overload', ['the-punisher', 'rocket-raccoon'], 'Throws a device that makes him fire faster.', 'It also gives unlimited ammo.'],
  ['Bestial Hunt', ['the-punisher', 'daredevil'], 'Fires piercing bullets with a damage boost.', 'The bullets break barriers and shields faster.'],
  ['Slim and Red', ['cyclops', 'phoenix'], 'Ricochet Force sets enemies on fire, and hitting burning targets with his blasts sets off extra damage.', 'Spark explosions shorten Ricochet Force’s cooldown.'],
  ['Kinetic Kin', ['cyclops', 'gambit'], 'Releases kinetic energy for a burst of movement speed and jump height.', 'Optic Blast and Concussive Beam also fire faster.'],
  ['Squirrel Missile', ['squirrel-girl', 'iron-man'], 'Sends a squirrel riding a homing missile that explodes on hit.', 'Squirrel Blockade fires a Squirrel Missile at the same time.'],
  ['ESU Alumnus', ['squirrel-girl', 'spider-man'], 'Launches a web bomb that explodes, damaging, slowing and grounding enemies.', 'It coats the ground in sticky web that slows, grounds and can stun.'],
  ['Circle of Life', ['phoenix', 'hela'], 'Psionic Detonation becomes Phoenix Netherfire: a stun, then two blasts that reduce enemy healing.', 'Each blast adds extra Sparks.'],
  ['Telekinetic Beatdown', ['phoenix', 'rogue'], 'Fires a telekinetic shockwave. On a hit she rushes in and strikes nearby enemies, adding Sparks and healing herself.', 'More Sparks, more healing and more strikes.'],
  ['Vitality Pact', ['mantis', 'adam-warlock'], 'When knocked out, she lingers as a soul that heals allies and can reform her body.', 'As a soul she can bond with allies to share the damage they take.'],
  ['Star Blossom', ['mantis', 'star-lord'], 'Recasting Healing Flower on an ally strengthens it and spreads the healing around them.', 'Healing Flower triggers the stronger, spreading version right away.'],
  ['Stark Protocol', ['ultron', 'iron-man'], 'Encephalo-Ray becomes Nano-Ray, firing projectiles that damage enemies and heal allies.', 'Imperative: Firewall also fires homing missiles at nearby enemies.'],
  ['SP//DR Sync', ['ultron', 'peni-parker'], 'Imperative: Patch covers all allies at once.', 'Imperative: Firewall triggers through every drone at once.'],
  ['Planet X Pals', ['rocket-raccoon', 'groot'], 'Bombard Mode launches thorny spores that damage enemies and heal allies.', 'He can ride on Groot, and the spore field lasts longer.'],
  ['Mammalian Bond', ['rocket-raccoon', 'squirrel-girl'], 'Tosses vitality acorns that heal allies and shorten their cooldowns.', 'More acorn charges.'],
  ['Vampiric Kin', ['jubilee', 'blade'], 'Places a vampiric field where allies’ attacks steal health.', 'Allies inside also heal over time.'],
  ['Hellfire Sparks', ['jubilee', 'the-hood'], 'While her attack speed is boosted, her plasmoids become instant-hit shots that can crit and heal her.', 'She can keep that form indefinitely.'],
  ['Sparkling Staff', ['gambit', 'jubilee'], 'Twirls a firework-charged staff that heals allies, damages close enemies and blocks projectiles.', 'Bayou Bash and Big Easy Impact also leave a healing aura.'],
  ['Favorable Odds', ['gambit', 'magneto'], 'Throws two magnetic cards that spin in place, healing allies and damaging enemies, and launch enemies when they detonate.', 'The cards slam together and explode for extra healing and damage.'],
  ['Vibrant Vitality', ['loki', 'mantis'], 'Regeneration Domain also boosts allies’ damage, and its radius can expand.', 'Placing it sends out a shockwave that damages and launches nearby enemies.'],
  ['Villain’s Illusion', ['loki', 'hela'], 'Takes the form of a knocked-out hero for a while, without their ultimate.', 'The disguise lasts longer, and lethal damage turns him back into Loki instead of knocking him out.'],
  ['Frozen Haven', ['cloak-and-dagger', 'luna-snow'], 'Encases them in protective ice with a weak healing aura for allies.', 'The healing aura is much stronger.'],
  ['Oblivion Shroud', ['cloak-and-dagger', 'the-hood'], 'Their veils stop in place: enemies lose damage through the light veil and healing through the dark one.', 'Wider veils, and allies passing through get a damage boost.'],
  ['Cosmic Cyclone', ['adam-warlock', 'storm'], 'Allies in his Soul Bond get a speed boost.', 'They also get a damage boost.'],
  ['Flawless Design', ['adam-warlock', 'ultron'], 'Cosmic Cluster heals allies.', 'The cluster explodes on impact.'],
  ['United Siblings', ['invisible-woman', 'human-torch'], 'Creates a flame shield that blocks damage, heals allies nearby and slows enemies.', 'A bigger shield with much more health.'],
  ['First Family', ['invisible-woman', 'mister-fantastic'], 'Allies near her turn invisible, heal and move faster.', 'Stronger healing and speed, and longer invisibility.'],
  ['Lucky Loan', ['white-fox', 'black-cat'], 'An Orb of Life turns her Spirit Tail energy into an aura that seeks out allies to help and enemies to weaken.', 'Spirit Tail energy isn’t used up while it lasts.'],
  ['Psionic Fox', ['white-fox', 'psylocke'], 'Fox Form Awakening uses no Spirit Tail energy and lasts its full time.', 'Fox Form Awakening’s cooldown is much shorter.'],
  ['Atlas Bond', ['luna-snow', 'white-fox'], 'Sends a spirit fox forward that charms enemies and heals allies in its path.', 'The fox comes back after reaching its max distance.'],
  ['Duality Dance', ['luna-snow', 'adam-warlock'], 'Tethers everyone nearby with a soul bond. Attacking tethered enemies or healing linked allies heals her.', 'Critical hits shorten Absolute Zero’s and Ice Arts’ cooldowns.'],
  ['Guardian of the Deep', ['jeff-the-land-shark', 'venom'], 'Shoots healing tendrils that heal allies over time; extra healing becomes bonus health.', 'The tendrils also lash enemies for damage over time.'],
  ['Mr. Pool’s Interdimensional Toy Box', ['jeff-the-land-shark', 'deadpool'], 'Spits out a Deadpool plushie that taunts enemies and heals allies near it.', 'The taunt deals more damage.'],
  ['Burning Bullets', ['black-widow', 'phoenix'], 'Her rifle fires faster, and Electro-Plasma Blast becomes an instant laser with no charge-up.', 'Electro-Plasma Blast gets a second charge.'],
  ['Allied Agents', ['black-widow', 'hawkeye'], 'Rifle hits build Focus. At three stacks she enters a Focused state with stronger shots.', 'Critical hits keep her Focused until she misses one.'],
];

// ---------------------------------------------------------------------------
// Ability breakdowns: what each hero's moves do, in our own words. No inputs and only
// the numbers that matter. kind: attack, ability, ultimate or passive.
//   hero id: [date the kit was last checked against the patch notes, [[name, kind, text]]]
// When a patch changes a hero's kit, fix the text and bump the date. Explain mechanics
// here; keep TIPS for advice.
// ---------------------------------------------------------------------------
const ABILITIES = {
  'peni-parker': ['2026-10-01', [
    ['Cyber-Web Cluster', 'attack', 'Rapid web shots with a short travel time. Her main damage, and it can land critical hits.'],
    ['Cyber-Web Snare', 'attack', 'A web shot that slows and marks an enemy. A second hit while the mark lasts (about 5 seconds) immobilizes them briefly. Holds two charges. Shots that hit a surface leave a Cyber-Web.'],
    ['Cyber-Webs', 'passive', 'Her webs heal Peni and her allies over time and speed them up. Healing past full health turns into a little bonus health.'],
    ['Bionic Spider-Nest', 'ability', 'Places a nest that spreads webs and keeps sending out spider-drones that chase enemies, explode and slow them. Destroy the nest to stop the drones.'],
    ['Arachno-Mine', 'ability', 'Lays mines that blow up when enemies get close. Several charges. Mines sitting on a web are invisible to enemies.'],
    ['Cyber-Bond', 'ability', 'Attaches a web line to a spot or web. Moving away stretches it until it slings her back toward the anchor. Her way to reposition or escape.'],
    ['Wall Crawl', 'passive', 'Climbs walls.'],
    ['Spider-Sweeper', 'ultimate', 'Her mech becomes much faster and gains a large pool of bonus health. Enemies it runs into are launched up, and it scatters mines, drones and webs as it goes.'],
  ]],
  'devil-dinosaur': ['2026-10-01', [
    ['Primal Bite', 'attack', 'A close-range bite that makes the target bleed: damage over time based on their max health.'],
    ['Impact Beam', 'attack', 'An energy beam that makes enemies bleed and slows them.'],
    ['Buddy Barrier', 'ability', 'A heart-shaped generator raises a dome shield around him that blocks damage. Enemies inside the dome are slowed.'],
    ['Savage Predation', 'ability', 'A pouncing bite that makes the target bleed. If they were already bleeding, he clamps down and hurls them away.'],
    ['Frenzied Feast', 'ability', 'A flurry of bites that turns damage dealt into bonus health. Bleeding targets take extra damage.'],
    ['Apex Advantage', 'passive', 'Gains bonus health whenever he makes enemies bleed.'],
    ['Prehistoric Plating', 'passive', 'Takes less damage from critical hits and can’t be launched, knocked back or moved. Damaging or healing him builds less ultimate charge than usual.'],
    ['Devil-Beast Rampage', 'ultimate', 'Charges around at high speed. His stomps launch enemies and make them bleed, and his roars slow them.'],
  ]],
  'the-hood': ['2026-10-01', [
    ['Accursed Pistols', 'attack', 'Dual pistols that lose damage at range. Hits build Demonic Energy, and above half energy he fires faster.'],
    ['Mantle of Oblivion', 'ability', 'Wraps his cloak into a barrier around himself that blocks incoming attacks for about a second. Blocked damage builds Demonic Energy, and the barrier grows above half energy.'],
    ['Abyssal Veil', 'ability', 'Throws a sphere that raises a dark veil. His shots through it build extra energy, enemy shots through it lose damage and healing, and enemies who walk through take damage and are blinded.'],
    ['Void Walk', 'ability', 'Vanishes into the Void and flies freely for a moment, then reappears with a fading speed boost, damaging enemies nearby.'],
    ['Ruinous Pact', 'passive', 'At full Demonic Energy he automatically enters Half-Demon State (Leaded Transformation).'],
    ['Leaded Transformation', 'ability', 'In Half-Demon State his arms become rifles that fire very fast without reloading, and hits heal him.'],
    ['Demon of the End', 'ultimate', 'Becomes a full demon with a large health pool and fires up to six shots that pierce enemies and barriers. Hits give him and nearby allies bonus health. The last shot hits hardest.'],
  ]],
  hulk: ['2026-10-01', [
    ['Gamma Ray Gun', 'attack', 'Bruce Banner’s gun. He is fragile in this form and meant to transform quickly.'],
    ['Gamma Grenade', 'ability', 'Banner throws a grenade that damages and launches up enemies.'],
    ['Puny Banner', 'ability', 'Banner turns into Hero Hulk once his gamma meter is full.'],
    ['Heavy Blow', 'attack', 'Hero Hulk’s punches. As Monster Hulk they also launch enemies up.'],
    ['Gamma Burst', 'attack', 'A short-range gamma blast with two charges. Hits shorten Indestructible Guard’s cooldown.'],
    ['Incredible Leap', 'ability', 'A charged leap. Landing near flying enemies knocks them down.'],
    ['Indestructible Guard', 'ability', 'Gives Hulk and nearby allies gamma shields. Damage they absorb charges Hulk Smash!'],
    ['Radioactive Lockdown', 'ability', 'Locks nearby enemies in place and makes them immune to all abilities until it ends, so nobody can hurt them. His own punches or Gamma Burst end it early.'],
    ['Hulk Smash!', 'ultimate', 'Turns Hero Hulk into Monster Hulk for a while: more health, punches that launch, and immunity to being launched or knocked back.'],
    ['World Breaker', 'ability', 'Monster Hulk grabs an enemy and slams them into the ground.'],
  ]],
  thor: ['2026-10-01', [
    ['Mjölnir Bash', 'attack', 'Hammer swings. While awakened, each swing also sends out a wave of lightning.'],
    ['Hammer Throw', 'ability', 'Throws Mjölnir, which flies back to him. Each enemy hit gives Thorforce, and landing it gives him some bonus health.'],
    ['Storm Surge', 'ability', 'Spins Mjölnir, then dashes forward, knocking back enemies he runs into. He can steer the dash.'],
    ['Lightning Realm', 'ability', 'Calls lightning around him that damages enemies and gives Thorforce for each one hit. Enemies who leave it are slowed and grounded (can’t fly) for a short time.'],
    ['Awakening Rune', 'ability', 'Spends Thorforce to enter an awakened state with bonus health and stronger swings.'],
    ['Thorforce', 'passive', 'His resource. Hitting enemies builds it, and his awakened state spends it.'],
    ['God of Thunder', 'ultimate', 'Rises, charges up, then slams down, damaging and stunning enemies in a wide area. He can’t be crowd-controlled while it is active.'],
  ]],
  'captain-america': ['2026-10-01', [
    ['Sentinel Strike', 'attack', 'A melee combo: two strikes, then four shield throws that ricochet between enemies.'],
    ['Living Legend', 'ability', 'Raises his shield to block attacks. Projectiles that hit it bounce away in random directions.'],
    ['Leading Dash', 'ability', 'Sprints faster and lets him make a high Fearless Leap.'],
    ['Super-Soldier Slam', 'ability', 'Slams down from the air onto a spot, launching up enemies there.'],
    ['Vibranium Energy Saw', 'ability', 'Hurls his charged shield. It cuts through enemies in its path and bounces between targets without losing damage.'],
    ['Liberty Rush', 'ability', 'Charges forward with his shield raised, slamming into enemies in the way.'],
    ['Freedom Charge', 'ultimate', 'Carves a path forward with his shield held high. He and allies along it get bonus health, a speed boost and faster ultimate charge.'],
  ]],
  rogue: ['2026-10-01', [
    ['Power Surge Punch', 'attack', 'Close-range punches.'],
    ['Defensive Stance', 'ability', 'Braces to absorb nearby projectiles and take less damage. What she absorbs powers up her next Southern Brawl.'],
    ['Southern Brawl', 'ability', 'From Defensive Stance, dashes in and slams the ground, damaging enemies around her. Hits harder after absorbing damage.'],
    ['Ability Absorption', 'ability', 'Dashes into an enemy, knocks them down and steals one of their abilities for a while (or refreshes Fatal Attraction). She also gains health and a boost based on the victim’s role.'],
    ['Chrono Kick Combo', 'ability', 'A kick that launches an enemy up; use it again to knock down enemies nearby. Her next two punches then reach further, pierce and give bonus health.'],
    ['Fatal Attraction', 'ability', 'Dashes in and releases a burst of energy that damages over time, then pulls every enemy caught in it toward her after a short delay.'],
    ['Heartbreaker', 'ultimate', 'Drains ultimate charge from nearby enemies and steals a boost based on each one’s role.'],
  ]],
  'doctor-strange': ['2026-10-01', [
    ['Daggers of Denak', 'attack', 'Throws a spread of magic daggers. Hits build Dark Magic.'],
    ['Shield of the Seraphim', 'ability', 'Raises a large barrier in front of him that blocks damage.'],
    ['Maelstrom of Madness', 'ability', 'Releases his stored Dark Magic as a burst that damages every enemy around him. The more he has stored, the harder it hits.'],
    ['Pentagram of Farallah', 'ability', 'Opens a pair of portals between where he stands and a far spot. Anyone can walk through, enemies included.'],
    ['Cloak of Levitation', 'ability', 'Rises and then flies for a short time. Using it again ends the flight early and keeps his momentum.'],
    ['Price of Magic', 'passive', 'Hits build Dark Magic. If it stays full for too long he is cursed and can’t be healed, so he needs to spend it.'],
    ['Eye of Agamotto', 'ultimate', 'Pulls the souls out of nearby enemies. Damage dealt to a soul passes to its body, so hitting the clustered souls hurts the whole group.'],
  ]],
  magneto: ['2026-10-01', [
    ['Iron Volley', 'attack', 'Fires magnetic orbs that explode. The explosion grows the further they fly.'],
    ['Mag-Cannon', 'attack', 'Launches a heavy metal mass. Rings gathered from his shields add damage, and at full rings it also knocks enemies back.'],
    ['Metallic Curtain', 'ability', 'Raises a magnetic curtain that blocks incoming enemy projectiles.'],
    ['Iron Bulwark', 'ability', 'Shields himself. Damage the shield takes becomes rings for Mag-Cannon.'],
    ['Metal Bulwark', 'ability', 'Shields an ally. Damage the shield takes becomes rings for Mag-Cannon. Has its own cooldown, separate from Iron Bulwark.'],
    ['Magnetic Descent', 'passive', 'Can fall slowly.'],
    ['Meteor M', 'ultimate', 'Gathers metal into a meteor and hurls it for huge damage where it lands. Absorbing enemy projectiles while forming it makes it stronger.'],
  ]],
  venom: ['2026-10-01', [
    ['Dark Predation', 'attack', 'Close-range tendril strikes.'],
    ['Cellular Corrosion', 'ability', 'Grabs nearby enemies with tendrils and slows them. Anyone who doesn’t get out of reach in time takes damage.'],
    ['Venom Swing', 'ability', 'Swings on a web line in the direction he aims.'],
    ['Symbiotic Resilience', 'ability', 'Gains bonus health. The lower his health, the more he gets.'],
    ['Frenzied Arrival', 'ability', 'From high up, dives onto a spot, damaging enemies where he lands and knocking them up.'],
    ['Alien Biology', 'passive', 'Climbs walls and can sprint along them.'],
    ['Feast of the Abyss', 'ultimate', 'Burrows underground and moves freely, then bursts up to devour enemies. Damage is based on their current health, he gains it as bonus health, and their healing is reduced.'],
  ]],
  angela: ['2026-10-01', [
    ['Spear of Ichors', 'attack', 'A spear lunge that gets stronger with her attack charge. Fully charged, it launches enemies.'],
    ['Axes of Ichors', 'attack', 'Twin-axe strikes. Damage grows with her charge, and every fourth strike dashes forward.'],
    ['Shielded Stance', 'ability', 'Turns her weapon into a shield. Damage it absorbs builds her attack charge.'],
    ['Assassin’s Charge', 'ability', 'A fast flying dash. Enemies hit head-on are carried along with her.'],
    ['Divine Judgement', 'ability', 'Dives to the ground, switches to axes and creates a zone where she gets speed and bonus health.'],
    ['Wingblade Ascent', 'ability', 'Takes back to the sky and switches back to the spear.'],
    ['Seraphic Soar', 'passive', 'Flies freely. Time in the air builds her attack charge.'],
    ['Heven’s Retribution', 'ultimate', 'Hurls her spear, binding enemies near the impact with ribbons. She then leaps to it, damaging enemies and creating a Divine Judgement zone.'],
  ]],
  'the-thing': ['2026-10-01', [
    ['Rocky Jab', 'attack', 'Fast punches.'],
    ['Stone Haymaker', 'ability', 'A heavy punch that deals extra damage based on the target’s max health and gives him bonus health. Knocks flying enemies to the ground.'],
    ['Yancy Street Charge', 'ability', 'Charges forward, knocking enemies up, and leaves a zone where enemies can’t use movement abilities.'],
    ['Embattled Leap', 'ability', 'Leaps to an ally. He and allies near the landing spot take less damage for a while.'],
    ['Battle Blitz', 'ability', 'Leaps at enemies. Enemies near the landing spot take extra damage for a while.'],
    ['Unyielding Will', 'passive', 'Can’t be launched, knocked back or moved by enemy abilities.'],
    ['Clobberin’ Time', 'ultimate', 'A huge strike that launches every enemy in front of him into the air.'],
  ]],
  'emma-frost': ['2026-10-01', [
    ['Telepathic Pulse', 'attack', 'A psionic beam whose damage ramps up the longer it stays on one target.'],
    ['Mind’s Aegis', 'ability', 'Places a floating barrier wherever she aims. It recovers when it isn’t taking damage.'],
    ['Psychic Spear', 'ability', 'Pulls a crystal copy of an enemy’s mind out of them. Damage to the crystal passes to their body, and shattering it deals extra damage.'],
    ['Diamond Form', 'ability', 'Turns to diamond for a while: she takes less damage, can’t be crowd-controlled and switches to heavy melee moves.'],
    ['Faceted Fury', 'attack', 'Diamond Form’s double-fisted punches.'],
    ['Crystal Kick', 'ability', 'Diamond Form’s flying kick. Knocks enemies back, with extra damage if they hit a wall.'],
    ['Carbon Crush', 'ability', 'Diamond Form’s grab: lunges, seizes an enemy and slams them down behind her.'],
    ['Psionic Seduction', 'ultimate', 'Sends out psychic waves. Enemies caught are stunned and can’t use ultimates, and those who stay in them are drawn toward her.'],
  ]],
  groot: ['2026-10-01', [
    ['Vine Strike', 'attack', 'Lashes vines at enemies at mid range.'],
    ['Spore Bomb', 'ability', 'Throws a bomb that splits into smaller exploding spores.'],
    ['Furious Flora', 'ability', 'A three-hit arm combo. The third hit lightly knocks enemies up.'],
    ['Thornlash Wall', 'ability', 'Grows a wall. Once awakened, it lashes at nearby enemies that Groot or his allies attack.'],
    ['Ironwood Wall', 'ability', 'Grows a sturdy wall. Once awakened, damage it takes gives Groot bonus health, and he can’t be crowd-controlled near it.'],
    ['Flora Colossus', 'passive', 'His walls awaken with extra effects when he is near them, and he can add extra segments while building one.'],
    ['Strangling Prison', 'ultimate', 'Fires a giant vine cluster that pulls nearby enemies to its center and traps them.'],
  ]],
  'deadpool-vanguard': ['2026-10-01', [
    ['Dual Desert Eagles', 'attack', 'Rapid pistol fire that loses damage at range.'],
    ['Kick@$$ Katana', 'attack', 'A three-hit sword combo at close range. He swaps between guns and katanas, and each set changes his other moves.'],
    ['Magical Unicorn Shield!', 'ability', 'With guns: summons a plush unicorn barrier that blocks attacks for a few seconds.'],
    ['Hazardous Hijinks', 'ability', 'With katanas: a dashing slash that knocks enemies down. Hitting someone refreshes it, up to three dashes in a row.'],
    ['Deadpool In Your Area', 'ability', 'Taunts nearby enemies so they have to attack him, blurs their vision and burns them, while he attacks faster.'],
    ['Bunny Bounce', 'ability', 'A midair double jump. Stomping on an enemy’s head or jumping off a wall resets it.'],
    ['Upgrade!', 'ability', 'Earns XP in combat. When the bar fills, he picks one ability to upgrade into a stronger version.'],
    ['Healing Factor', 'passive', 'Regenerates health after a few seconds out of combat. A burst of heavy damage triggers a stronger emergency regeneration, which then has a long cooldown.'],
    ['Maximum Flair', 'passive', 'Instead of charging normally, landing abilities raises his Style Rating; at S rank he can use his ultimate. Being knocked out resets it.'],
    ['The Ban Hammer', 'ultimate', 'With guns: taunts one chosen enemy. He gains bonus health and healing, and every ability that enemy misses hurts them and gives him more bonus health.'],
    ['The Big Test', 'ultimate', 'With katanas: starts a timed challenge that gives him speed, healing, extra dashes and extra health for nearby allies. Completing it strengthens the buffs.'],
  ]],
  'deadpool-duelist': ['2026-10-01', [
    ['Dual Desert Eagles', 'attack', 'Rapid pistol fire, stronger than his other versions, that loses damage at range.'],
    ['Kick@$$ Katana', 'attack', 'A three-hit sword combo with high damage per hit. He swaps between guns and katanas, and each set changes his other moves.'],
    ['Headshot!', 'ability', 'With guns: throws his own head like a boomerang, hitting enemies on the way out and back and leaving a small damaging zone.'],
    ['Hazardous Hijinks', 'ability', 'With katanas: a dashing slash that can be repeated when it hits an enemy.'],
    ['Deadpool In Your Area', 'ability', 'Taunts nearby enemies so they have to attack him, blurs their vision and damages them over time, while he takes less damage.'],
    ['Bunny Hop', 'ability', 'A midair double jump. Landing on an enemy damages them and gives him bonus health; head stomps and wall jumps reset it.'],
    ['Upgrade!', 'ability', 'Earns XP in combat. When the bar fills, he picks one ability to upgrade into a stronger version.'],
    ['Healing Factor', 'passive', 'Regenerates health after a few seconds out of combat. A burst of heavy damage triggers a stronger emergency regeneration, which then has a long cooldown.'],
    ['Maximum Flair', 'passive', 'Instead of charging normally, landing abilities raises his Style Rating; at S rank he can use his ultimate. Being knocked out resets it.'],
    ['Skill Issue', 'ultimate', 'With guns: taunts one chosen enemy. Every ability they miss while it lasts damages them.'],
    ['Pop Quiz!', 'ultimate', 'With katanas: a timed challenge that gives him speed and self-healing right away, roughly doubled if he completes it.'],
  ]],
  'deadpool-strategist': ['2026-10-01', [
    ['Dual Desert Eagles', 'attack', 'Pistol shots that damage enemies and heal allies they hit.'],
    ['Kick@$$ Katana', 'attack', 'A three-hit sword combo whose hits also heal allies in a small area. He swaps between guns and katanas, and each set changes his other moves.'],
    ['Bouncing Bobblehead', 'ability', 'With guns: throws a bobblehead that damages enemies and heals allies on the way out and back, leaving a healing field.'],
    ['Healing Hijinks', 'ability', 'With katanas: a dashing slash with two charges that damages enemies and heals allies along the way.'],
    ['Deadpool In Your Area', 'ability', 'Taunts nearby enemies so they have to attack him, blurs their vision and burns them, while healing allies nearby and powering up his weapons.'],
    ['Healing Hop', 'ability', 'A midair double jump. Stomping enemies damages them and heals allies, and hits reset it.'],
    ['Upgrade!', 'ability', 'Earns XP in combat. When the bar fills, he picks one ability to upgrade into a stronger version.'],
    ['Healing Factor', 'passive', 'Regenerates health after a few seconds out of combat. A burst of heavy damage triggers a stronger emergency regeneration, which then has a long cooldown.'],
    ['Maximum Flair', 'passive', 'Instead of charging normally, landing abilities raises his Style Rating; at S rank he can use his ultimate. Being knocked out resets it.'],
    ['Pwnage Pound', 'ultimate', 'With guns: taunts one chosen enemy and heals allies around him. Each ability the target misses damages them and heals his team more.'],
    ['Final Exam', 'ultimate', 'With katanas: a timed challenge that heals allies around him. Completing it raises the healing.'],
  ]],
  magik: ['2026-10-01', [
    ['Soulsword', 'attack', 'Close-range sword slashes.'],
    ['Magik Slash', 'ability', 'Sends a piercing slash through the air. Each enemy it hits shortens Stepping Discs’ cooldown.'],
    ['Stepping Discs', 'ability', 'Teleports a short way in the direction she is moving and can’t be hurt while traveling. Right after, her attack becomes Eldritch Whirl and her slash becomes Demon’s Rage.'],
    ['Eldritch Whirl', 'attack', 'After Stepping Discs: a spinning sword attack.'],
    ['Demon’s Rage', 'ability', 'After Stepping Discs: summons a Limbo demon that attacks nearby enemies.'],
    ['Umbral Incursion', 'ability', 'Dashes forward and knocks enemies up.'],
    ['Limbo’s Might', 'passive', 'Damage she deals becomes bonus health.'],
    ['Darkchild', 'ultimate', 'Transforms into Darkchild for a while, strengthening all of her abilities.'],
  ]],
  gorr: ['2026-10-01', [
    ['All-Black', 'attack', 'A four-hit Necrosword combo with long reach.'],
    ['Necro-Power', 'ability', 'Throws a symbiote mass that slows the target and brings a Black Berserker to them, moving a nearby one or creating one. Arriving Berserkers strike twice in melee.'],
    ['Black Berserker', 'ability', 'Lobs a symbiote that becomes a Black Berserker for a few seconds, shooting the nearest enemy. Two charges.'],
    ['Shadow Harvest', 'ability', 'Warps to one of his Berserkers and sacrifices it for bonus health and an explosion, unlocking Shadow Scythe strikes that can fire a piercing shockwave.'],
    ['Living Abyss', 'ability', 'Surges forward and can’t be hurt while doing it, leaving a Berserker behind and sending his Berserkers into a faster frenzy. Creates a damaging zone whose damage becomes bonus health.'],
    ['Berserker Swarm', 'passive', 'Damage from his Berserkers gives him bonus health, and every enemy he kills leaves a new Berserker behind.'],
    ['Twilight of the Gods', 'ultimate', 'All-Black becomes the Annihilablade for a while: huge, long-reach slashes, plus a spreading zone that spawns a Berserker next to each enemy caught in it.'],
  ]],
  storm: ['2026-10-01', [
    ['Wind Blade', 'attack', 'Throws piercing wind blades. She flies freely.'],
    ['Bolt Rush', 'ability', 'Fires a lightning bolt that explodes on impact.'],
    ['Weather Control', 'ability', 'Switches between Tornado (allies near her move faster) and Thunder (allies near her deal more damage). Under Tornado her hits give her bonus health; under Thunder, Wind Blade hits shorten Bolt Rush’s cooldown.'],
    ['Goddess Boost', 'ability', 'Empowers herself with the current weather: Tornado speeds her up and slows enemies, Thunder boosts her damage and calls lightning on enemies.'],
    ['Omega Hurricane', 'ultimate', 'Becomes a hurricane that pulls in nearby enemies and damages them, with bonus health that drains after it ends.'],
  ]],
  'scarlet-witch': ['2026-10-01', [
    ['Chaos Control', 'attack', 'Chaos magic that damages every Chaos-Marked enemy in a wide cone in front of her at once, and restores her Chaos Energy. She needs to mark enemies first.'],
    ['Chthonian Burst', 'attack', 'Spends Chaos Energy to fire explosive magic missiles.'],
    ['Scarlet Hex', 'ability', 'A shockwave in a long strip in front of her that damages and Chaos-Marks every enemy it hits.'],
    ['Dark Seal', 'ability', 'Throws a seal that stuns enemies briefly when it lands, then leaves a field that damages, slows and keeps marking enemies inside. Can be cast during Mystic Projection.'],
    ['Mystic Projection', 'ability', 'Becomes a phased projection that flies freely with a speed boost. She can end it early.'],
    ['Telekinesis', 'passive', 'Can fall slowly.'],
    ['Chaos Mark', 'passive', 'Part of the damage she deals to marked enemies becomes bonus health for her.'],
    ['Reality Erasure', 'ultimate', 'Rises with bonus health and channels chaos energy that pulls in and damages enemies near her, then releases a huge blast.'],
  ]],
  hela: ['2026-10-01', [
    ['Nightsword Thorn', 'attack', 'Long-range thorn shots that reward critical hits.'],
    ['Piercing Night', 'ability', 'Fires a spread of thorns that stick and detonate after a short delay.'],
    ['Soul Drainer', 'ability', 'Throws an explosive sphere that stuns nearby enemies and pulls them into the blast.'],
    ['Astral Flock', 'ability', 'Turns into a flock of crows and flies freely in any direction, gaining bonus health when it ends.'],
    ['Nastrond Crowstorm', 'passive', 'Enemies she knocks out leave a crow behind that explodes after a short time.'],
    ['Hel’s Descent', 'passive', 'Can fall slowly.'],
    ['Goddess of Death', 'ultimate', 'Rises into the sky and fires exploding crows from both hands at will.'],
  ]],
  daredevil: ['2026-10-01', [
    ['Justice Jab', 'attack', 'Billy-club swings. Hits build Fury.'],
    ['Righteous Cross', 'attack', 'Briefly unlocked after Devil’s Latch or Infernal Fury: a lunging cross strike that builds Fury.'],
    ['Objection!', 'ability', 'A short guard that blocks damage from the front, reflects projectiles and builds Fury from what it blocks.'],
    ['Devil’s Latch', 'ability', 'A grappling line that pulls him and his target together. Builds Fury.'],
    ['Infernal Fury', 'ability', 'Spends Fury on Devil’s Chain (a strike whose damage becomes bonus health) or Devil’s Throw (a bouncing club that slows enemies).'],
    ['Sonic Pursuit', 'ability', 'Locks onto an enemy, gaining speed and taking less damage, then dashes to them to blind them and restore Fury.'],
    ['Blind Ascent', 'passive', 'Runs along walls and springs off them.'],
    ['Radar Sense', 'passive', 'Senses enemy movement around him.'],
    ['Let the Devil Out', 'ultimate', 'Enemies in his line of sight take growing damage and a growing blind. He keeps gaining Fury while it lasts.'],
  ]],
  'iron-fist': ['2026-10-01', [
    ['Jeet Kune Do', 'attack', 'A punch combo whose last strike knocks enemies up. Every hit shortens Dragon’s Defense’s cooldown.'],
    ['Yat Jee Chung Kuen', 'ability', 'Dashes after an enemy and unleashes a flurry of punches that also deal damage based on the target’s max health.'],
    ['Dragon’s Defense', 'ability', 'A blocking stance that cuts incoming damage. Leaving it gives bonus health and lets him strike back with Yat Jee Chung Kuen.'],
    ['K’un-Lun Kick', 'ability', 'A dashing flying kick. It deals more damage the lower the enemy’s health.'],
    ['Harmony Recovery', 'ability', 'Channels chi to heal himself. Extra healing becomes bonus health that drains away afterwards.'],
    ['Crane Leap', 'ability', 'Up to three jumps in a row in midair.'],
    ['Wall Runner', 'passive', 'Runs along walls.'],
    ['Chi Absorption', 'passive', 'Gains bonus health from enemies he defeats.'],
    ['Living Chi', 'ultimate', 'For a while he moves faster, hits harder and reaches further, and Dragon’s Defense recharges faster.'],
  ]],
  'mister-fantastic': ['2026-10-01', [
    ['Stretch Punch', 'attack', 'Long-reach stretching punches.'],
    ['Distended Grip', 'ability', 'Grabs an enemy with stretched arms and drags them toward him, then holds them in place for a moment.'],
    ['Reflexive Rubber', 'ability', 'Stretches his body to soak up incoming damage, then fires it back in the direction he aims.'],
    ['Flexible Elongation', 'ability', 'Gains a shield and stretches to a target. Where he lands, enemies take damage and are knocked back, and allies get a shield.'],
    ['Elastic Strength', 'passive', 'Using abilities builds Elasticity. When it is full he inflates for a while: more max health (with a heal) and more damage.'],
    ['Brainiac Bounce', 'ultimate', 'Leaps up and smashes down, damaging and slowing enemies. Landing a hit lets him bounce again.'],
  ]],
  psylocke: ['2026-10-01', [
    ['Psionic Crossbow', 'attack', 'Rapid crossbow bolts. Hits shorten all of her cooldowns.'],
    ['Wing Shurikens', 'ability', 'Throws shurikens that stick in enemies and give her bonus health. She can recall them for more damage.'],
    ['Psi-Blade Dash', 'ability', 'Dashes forward, slicing every enemy in her path.'],
    ['Psychic Stealth', 'ability', 'Turns invisible and moves faster for a few seconds.'],
    ['Dance of the Butterfly', 'ultimate', 'Slashes every nearby enemy over and over with a psionic katana for heavy damage. Shields and barriers on enemies can absorb it.'],
  ]],
  'spider-man': ['2026-10-01', [
    ['Spider-Power', 'attack', 'Punches. Extra damage to enemies carrying a Spider-Tracer.'],
    ['Web-Cluster', 'ability', 'A web shot that damages and tags the enemy with a Spider-Tracer.'],
    ['Web-Swing', 'ability', 'Swings on a web line to move quickly.'],
    ['Get Over Here!', 'ability', 'A web line that pulls an enemy to him, or pulls him to an enemy tagged with a Spider-Tracer.'],
    ['Amazing Combo', 'ability', 'Knocks an enemy up into the air. Extra damage against tagged enemies.'],
    ['Wall Crawl', 'passive', 'Climbs walls and can run along them.'],
    ['Thwip and Flip', 'passive', 'Double jump.'],
    ['Spider-Sense', 'passive', 'Warns him about enemies near him.'],
    ['Spectacular Spin', 'ultimate', 'Fires webs all around him, damaging and stunning enemies in range.'],
  ]],
  'black-panther': ['2026-10-01', [
    ['Vibranium Claws', 'attack', 'Close-range claw swipes.'],
    ['Spinning Kick', 'ability', 'A spinning kick that travels in any direction and puts Vibranium Marks on enemies it hits.'],
    ['Spirit Rend', 'ability', 'Lunges at an enemy. Hitting a marked enemy gives him bonus health and refreshes the lunge, so he can chain it.'],
    ['Spear Toss', 'ability', 'Throws a vibranium spear that creates a field marking every enemy in it.'],
    ['Subtle Step', 'passive', 'Runs on walls and jumps off them.'],
    ['Panther’s Cunning', 'passive', 'Deals more damage when his health is low.'],
    ['Bast’s Descent', 'ultimate', 'Summons Bast, who pounces forward, damaging and marking enemies and refreshing Spirit Rend. He takes less damage while it starts.'],
  ]],
  blade: ['2026-10-01', [
    ['Ancestral Sword', 'attack', 'Close-range sword slashes.'],
    ['Hunter’s Shotgun', 'attack', 'A shotgun for mid range. He swaps between it and the sword.'],
    ['Scarlet Shroud', 'ability', 'A parry: for a moment he can’t be crowd-controlled, takes less damage from the front, and Daywalker Dash recharges faster.'],
    ['Daywalker Dash', 'ability', 'Dashes forward. With the shotgun it slows enemies hit; with the sword it cuts through them and reduces their healing.'],
    ['Bloodline Awakening', 'ability', 'Speeds up his slashes, adds a Whirlwind Slash and gives him lifesteal (extra becomes bonus health). He receives less healing while it is active.'],
    ['Thousand-Fold Slash', 'ultimate', 'Charges and dashes with the Sword of Dracula for one big strike, then leaves a zone that keeps slashing enemies and cuts their healing. He lifesteals during it.'],
  ]],
  'iron-man': ['2026-10-01', [
    ['Repulsor Blast', 'attack', 'Pulse cannon shots. He can fly.'],
    ['Unibeam', 'attack', 'A continuous beam from his chest.'],
    ['Hyper-Velocity', 'ability', 'Flies forward at high speed.'],
    ['Armor Overdrive', 'ability', 'Boosts Repulsor Blast and Unibeam damage and gives bonus health. Knockouts extend it.'],
    ['Micro-Missile Barrage', 'ability', 'During Hyper-Velocity or Armor Overdrive, rains a missile barrage on an area.'],
    ['Invincible Pulse Cannon', 'ultimate', 'Fires a huge pulse cannon blast that deals heavy damage where it lands.'],
  ]],
  'human-torch': ['2026-10-01', [
    ['Fire Cluster', 'attack', 'Fireballs that split apart as they fly.'],
    ['Blazing Blast', 'ability', 'A fireball that damages on a direct hit or, aimed at the ground, leaves a Flame Field that burns enemies inside.'],
    ['Pyro-Prison', 'ability', 'Links two or more Flame Fields into walls of fire that hurt enemies passing through and keep burning anyone trapped inside.'],
    ['Plasma Body', 'ability', 'Dashes forward, then rises quickly into flight. Two charges.'],
    ['Flaming Meteor', 'ability', 'Dives down, damaging enemies and setting off any Flame Fields it hits. Gives him bonus health.'],
    ['Supernova', 'ultimate', 'Explodes around him, then for a while Blazing Blast becomes a Flame Tornado and Plasma Body recharges.'],
  ]],
  wolverine: ['2026-10-01', [
    ['Savage Claw', 'attack', 'Claw slashes. After Feral Leap they become stronger Berserk Claw Strikes.'],
    ['Vicious Rampage', 'ability', 'Dashes forward into a claw strike.'],
    ['Feral Leap', 'ability', 'Leaps and grabs the first enemy he hits, smashing them to the ground. Strengthens his next attacks.'],
    ['Undying Animal', 'ability', 'A howl that briefly cuts the damage he takes.'],
    ['Berserker Rage', 'passive', 'Attacking and taking hits builds Rage, which makes his claw strikes hit harder.'],
    ['Regenerative Healing Factor', 'passive', 'Heals him, gives bonus health and shakes off debuffs. Bonus health left at the end turns into a heal, and his Rage resets. Assists shorten its cooldown.'],
    ['Last Stand', 'ultimate', 'Launches enemies ahead into the air, then spirals through them for a devastating impact. Hits harder with more Rage.'],
  ]],
  'elsa-bloodstone': ['2026-10-01', [
    ['Double-Barrel Blaster', 'attack', 'A shotgun that can land critical hits and loses damage at range.'],
    ['Monster-Piercer', 'attack', 'After a dash, her next shot becomes piercing elephant-gun rounds that add damage based on the target’s max health.'],
    ['Living Bullet', 'ability', 'A round that splits into seeking bullets on impact and marks targets. Hitting marked targets speeds her up. Extra damage to shields and bonus health.'],
    ['Ruthless Pursuit', 'ability', 'Dashes forward, launching enemies it hits, then fires a blast that pushes her back and slows enemies. Gives bonus health and empowers her next shot.'],
    ['Helix Advance', 'ability', 'A short dash that gives bonus health and empowers her next shot.'],
    ['Smoky Snare', 'ability', 'Throws a hidden trap. An enemy who triggers it is held in place and damaged until they destroy it, and she can dash straight to a triggered trap.'],
    ['Inherited Instinct', 'passive', 'Dealing damage and knocking enemies out builds Instinct, which shortens Helix Advance’s cooldown. She loses some when knocked out.'],
    ['Apex Predator', 'ultimate', 'Summons the monster Glartrox, which charges forward and seizes enemies so they can’t use abilities. She can recall it for a heavy bite.'],
  ]],
  'winter-soldier': ['2026-10-01', [
    ['Roterstern', 'attack', 'Explosive rounds that also hit enemies behind the target.'],
    ['Bionic Hook', 'ability', 'A charged hook that reels in the first enemy hit and those behind them.'],
    ['Trooper’s Fist', 'ability', 'Dashes forward grabbing enemies and launches them up at the end of the dash.'],
    ['Tainted Voltage', 'ability', 'A charged electric punch that damages and slows enemies and knocks flying heroes down. Two charges.'],
    ['Ceaseless Charge', 'passive', 'His bionic-arm abilities reload his gun and give him bonus health.'],
    ['Kraken Impact', 'ultimate', 'Leaps and slams down, instantly finishing enemies below a health threshold. A knockout lets him use it again for a short time.'],
  ]],
  'black-cat': ['2026-10-01', [
    ['Feline Fury', 'attack', 'Close-range claw swipes.'],
    ['Claw Whip', 'attack', 'Whips tethered claws in a wide arc, hitting every enemy in range and giving her bonus health per hit.'],
    ['Fortune’s Favor', 'ability', 'Spends Fortune on either Claw Whip or Phantom Pursuit.'],
    ['Turn of Fortune', 'ability', 'A grappling hook that damages the first enemy hit and steals Fortune.'],
    ['Phantom Pursuit', 'ability', 'Dashes to an enemy, claws them in a quick flurry and flashes back to where she started. She takes much less damage and can’t be crowd-controlled during it.'],
    ['Cat’s Cradle', 'ability', 'A lunging dash that slices enemies in her path.'],
    ['Gilded Deal', 'ability', 'Spends Fortune on stolen relics, such as a gamble for more Fortune, a few seconds of invisibility with a speed boost (enemies can still spot her trail) or a cleanse of crowd control.'],
    ['Sticky Paws', 'passive', 'Her hits steal Fortune. She loses half of it when knocked out.'],
    ['Malkin Misfortune', 'passive', 'Her hits jinx enemies. Jinxed enemies sometimes lose the bonus damage of their critical hits on her.'],
    ['Thieving Grace', 'passive', 'Double jump, and she can climb walls.'],
    ['Calling Card', 'ultimate', 'Marks every enemy, then for a while dashes to any enemy in sight and range to claw them. Knockouts extend it.'],
  ]],
  'star-lord': ['2026-10-01', [
    ['Element Guns', 'attack', 'Fast-firing twin pistols that lose damage at range.'],
    ['Stellar Shift', 'ability', 'A quick dodge that reloads his guns. He can’t be hurt or crowd-controlled during it.'],
    ['Rocket Propulsion', 'ability', 'Jet boots: flies forward with a speed boost.'],
    ['Blaster Barrage', 'ability', 'Fires a frenzy of shots at every enemy around him. Best up close.'],
    ['Galactic Legend', 'ultimate', 'Flies freely while his guns lock onto enemies in sight automatically.'],
  ]],
  hawkeye: ['2026-10-01', [
    ['Piercing Arrow', 'attack', 'Charged bow shots with a long range.'],
    ['Blast Arrow', 'ability', 'Fires three explosive arrows at once.'],
    ['Hypersonic Arrow', 'ability', 'An arrow that hits enemies in its path twice and slows them. Knocks flying heroes down.'],
    ['Crescent Slash', 'ability', 'A katana slash that launches enemies up.'],
    ['Ronin Slash', 'ability', 'A sword swing that deflects incoming projectiles from the front while it lasts.'],
    ['Skyward Leap', 'ability', 'A double jump in the direction he is moving.'],
    ['Archer’s Focus', 'passive', 'Keeping his aim on enemies builds focus, which makes Piercing Arrow hit harder.'],
    ['Hunter’s Sight', 'ultimate', 'Captures afterimages of the enemies in view. Damage dealt to an afterimage passes to that enemy.'],
  ]],
  namor: ['2026-10-01', [
    ['Trident of Neptune', 'attack', 'Throws his trident. Hits shorten Aquatic Dominion’s cooldown, and critical hits send his Monstro Spawns into a faster frenzy.'],
    ['Wrath of the Seven Seas', 'ability', 'Hurls the trident to damage enemies around the impact and sends all his Monstro Spawns after the enemy it hit.'],
    ['Aquatic Dominion', 'ability', 'Places a Monstro Spawn, a small turret that attacks enemies on its own.'],
    ['Blessing of the Deep', 'ability', 'Rises into the air inside a protective water barrier.'],
    ['Tide Fall', 'passive', 'Can fall slowly.'],
    ['Horn of Proteus', 'ultimate', 'Summons the giant Giganto to slam down on enemies in range, damaging them and stopping them from using movement abilities.'],
  ]],
  'moon-knight': ['2026-10-01', [
    ['Crescent Dart', 'attack', 'Throws darts that bounce between enemies and Ankhs.'],
    ['Moon Blade', 'ability', 'Throws a blade that bounces between enemies and Ankhs, giving him bonus health for each enemy hit. Two charges.'],
    ['Ancient Ankh', 'ability', 'Fires an Ankh that pulls nearby enemies toward its center, knocking them up. His darts and blades bounce off it to hit more enemies.'],
    ['Moonlight Hook', 'ability', 'A grappling hook that pulls him to where it lands.'],
    ['Triple Eclipse', 'ability', 'A three-strike truncheon combo. The third strike lightly knocks enemies up.'],
    ['Night Glider', 'passive', 'Glides through the air.'],
    ['Rising Leap', 'passive', 'Double jump.'],
    ['Hand of Khonshu', 'ultimate', 'Opens a portal from which Khonshu rains talons on an area, hitting hardest at the center.'],
  ]],
  'the-punisher': ['2026-10-01', [
    ['Adjudication', 'attack', 'An automatic rifle for mid to long range.'],
    ['Deliverance', 'attack', 'A shotgun for close range. He swaps between it and the rifle.'],
    ['Scourge Grenade', 'ability', 'Throws a smoke grenade that blocks enemy vision while he leaps backward.'],
    ['Vantage Connection', 'ability', 'Fires a hook that sets up a zip line for fast movement.'],
    ['Culling Turret', 'ability', 'Mounts a turret that blocks damage from the front and deals heavy damage, but keeps him in place.'],
    ['Warrior’s Gaze', 'passive', 'Keeps seeing enemies for a short time after they leave his view.'],
    ['Final Judgement', 'ultimate', 'Unleashes two gatling guns and a missile barrage.'],
  ]],
  cyclops: ['2026-10-01', [
    ['Optic Blast', 'attack', 'Bursts of kinetic force. Hits charge Ricochet Force faster.'],
    ['Concussive Beam', 'attack', 'A continuous beam that bounces between enemies and walls. Hits charge Ricochet Force faster.'],
    ['Ricochet Force', 'ability', 'Fires a beam that splits off terrain and tracks nearby enemies. Gives him bonus health.'],
    ['Propulsion Burst', 'ability', 'A beam that pushes him and the target apart, slowing the target.'],
    ['Optic Ascent', 'ability', 'Fires a beam downward to launch himself up, knocking back and slowing enemies hit.'],
    ['Kinetic Hover', 'passive', 'Falls slowly while firing Concussive Beam in the air.'],
    ['Ruby Rage', 'ultimate', 'Takes off his visor and fires a huge sweeping beam that destroys barriers, leaving energy that erupts in a second explosion.'],
  ]],
  'squirrel-girl': ['2026-10-01', [
    ['Burst Acorn', 'attack', 'Throws acorns that bounce and explode.'],
    ['Squirrel Blockade', 'ability', 'Launches an acorn that summons squirrel guards around the first enemy hit, trapping them in place.'],
    ['Tail Bounce', 'ability', 'Bounces high into the air on her tail.'],
    ['Mammal Bond', 'ability', 'Reloads her acorns and, for a short time, lets her use one ability without waiting for its cooldown.'],
    ['Unbeatable Squirrel Tsunami', 'ultimate', 'Sends a horde of squirrels charging forward. They bounce off walls toward the nearest enemies.'],
  ]],
  phoenix: ['2026-10-01', [
    ['Cosmic Flames', 'attack', 'Fiery projectiles that put Sparks on enemies (two on a critical hit). At three Sparks they explode, adding a Spark and healing her over time.'],
    ['Psionic Detonation', 'ability', 'Marks an area: the first blast stuns enemies and two more slow them. Each blast adds a Spark.'],
    ['Telepathic Illusion', 'ability', 'Leaves an illusion behind and teleports, then the illusion explodes, adding a Spark to enemies hit.'],
    ['Dark Ascent', 'ability', 'Merges with the Phoenix force to fly freely with a speed boost.'],
    ['Endsong Inferno', 'ultimate', 'Soars up and crashes down on an area, destroying summons and shields. The shockwave adds a Spark to enemies hit.'],
  ]],
  mantis: ['2026-10-01', [
    ['Life Energy Blast', 'attack', 'Energy thorns. Critical hits give back a Life Orb.'],
    ['Healing Flower', 'ability', 'Spends Life Orbs to heal an ally over time. Recasting adds to the duration.'],
    ['Allied Inspiration', 'ability', 'Spends Life Orbs to give an ally a damage and speed boost.'],
    ['Natural Anger', 'ability', 'Spends Life Orbs to boost her own damage.'],
    ['Spore Slumber', 'ability', 'Throws a spore that puts the nearest enemy to sleep.'],
    ['Nature’s Favor', 'passive', 'Moves faster while she isn’t taking damage, and heals over time when she spends Life Orbs.'],
    ['Soul Resurgence', 'ultimate', 'Releases healing energy as she moves, healing allies around her over time and speeding them up. Extra healing becomes bonus health.'],
  ]],
  ultron: ['2026-10-01', [
    ['Encephalo-Ray', 'attack', 'A continuous burning energy beam.'],
    ['Imperative: Patch', 'ability', 'Sends up to two healing drones to follow allies, healing everyone around them and the chosen ally most.'],
    ['Imperative: Firewall', 'ability', 'Cast on his Patch target: he, the target and allies near them get bonus health, and the target gets a speed and damage boost. He then heals for a few seconds.'],
    ['Dynamic Flight', 'ability', 'Flies quickly in the direction he is moving, then keeps a speed boost.'],
    ['Rage of Ultron', 'ultimate', 'Summons drones that rain Encephalo-Rays around his target, damaging enemies or healing allies. Extra damage against bonus health.'],
  ]],
  'rocket-raccoon': ['2026-10-01', [
    ['Bombard Mode', 'attack', 'Fires energy projectiles at enemies.'],
    ['Repair Mode', 'attack', 'Fires bouncing spheres that heal allies around them. Direct hits heal more.'],
    ['Jetpack Dash', 'ability', 'Dashes forward with his jetpack.'],
    ['B.R.B.', 'ability', 'Places a Battle Rebirth Beacon that brings a fallen ally back and drops armor packs and rocket jet packs for the team.'],
    ['Wild Crawl', 'passive', 'Runs on walls.'],
    ['Flying Ace', 'passive', 'Can fall slowly.'],
    ['C.Y.A.', 'ultimate', 'Deploys an amplifier that links to nearby allies, boosting their damage and giving them bonus health.'],
  ]],
  jubilee: ['2026-10-01', [
    ['Energy Plasmoids', 'attack', 'Exploding light blasts that damage enemies and heal allies.'],
    ['Blooming Ball', 'ability', 'Launches a homing orb that damages enemies and heals allies near it. Hitting it with her shots charges it, making it bigger and stronger.'],
    ['Dazzling Detonation', 'ability', 'Sets off a firework orb that blinds enemies and makes them take more damage. She can send its energy to an ally instead, to heal and speed them up.'],
    ['Sparking Sprint', 'ability', 'A speed boost with higher jumps and faster plasmoid fire that costs no energy. When it ends, a burst knocks back enemies and heals allies.'],
    ['Sparkle Mark', 'passive', 'Dazzling Detonation and Firework Finale mark enemies. Her plasmoids set the marks off, damaging enemies and giving allies a healing boost and bonus health.'],
    ['Firework Finale', 'ultimate', 'Charges a huge ring of fireworks that launches nearby enemies, then leaves a field of circling fireworks that damages enemies and heals allies.'],
  ]],
  gambit: ['2026-10-01', [
    ['Kinetic Cards', 'attack', 'Throws three charged cards in an arc. Each explodes on impact, damaging an enemy or healing an ally.'],
    ['Bayou Bash', 'ability', 'A staff strike and slam whose shockwave damages enemies and heals allies nearby. Two charges.'],
    ['Cajun Charge', 'ability', 'A short dash with his staff. Attacking during it turns it into Big Easy Impact, a sprint that sets off three kinetic explosions that heal and damage.'],
    ['Healing Hearts', 'ability', 'Spends a card stack to heal himself and switch to his healing deck for a few seconds: cards that bounce between allies to heal them, or exploding cards that heal and cleanse.'],
    ['Breaking Spades', 'ability', 'Spends a card stack to boost his damage and switch to his attack deck for a few seconds: exploding cards that cut enemy healing, or a spread that launches enemies up.'],
    ['Sleight of Hand', 'passive', 'Card stacks that recharge over time. His two decks spend them.'],
    ['Ragin’ Royal Flush', 'ultimate', 'Locks onto an ally and throws Aces that heal and cleanse them both. Both move and jump faster and deal extra explosive damage, and the ally’s ultimate charges faster.'],
  ]],
  loki: ['2026-10-01', [
    ['Mystical Missile', 'attack', 'Magic projectiles that damage enemies or heal allies. Direct hits on allies heal extra.'],
    ['Regeneration Domain', 'ability', 'Creates a field that heals allies over time and turns part of the damage they take into more healing.'],
    ['Doppelganger', 'ability', 'Places an illusion of himself that copies some of his abilities, including his healing shots.'],
    ['Devious Exchange', 'ability', 'Swaps places with one of his illusions.'],
    ['Deception', 'ability', 'Turns invisible and leaves an illusion behind to fool enemies.'],
    ['Backstab', 'ability', 'Pulls a dagger for a strike that deals extra damage from behind.'],
    ['God of Mischief', 'ultimate', 'Transforms into a chosen ally or enemy hero and can use all of their abilities except team-ups.'],
  ]],
  'cloak-and-dagger': ['2026-10-01', [
    ['Lightforce Dagger', 'attack', 'As Dagger: bouncing light daggers that damage enemies and heal nearby allies.'],
    ['Dagger Storm', 'ability', 'As Dagger: throws daggers that create a healing field, with an instant heal for allies inside when it lands.'],
    ['Veil of Lightforce', 'ability', 'As Dagger: sends out a veil of light that heals allies it touches and boosts their healing. Shares two charges with Terror Cape.'],
    ['Darkforce Cloak', 'attack', 'As Cloak: a continuous beam that damages one enemy.'],
    ['Terror Cape', 'ability', 'As Cloak: sends out a veil of darkness that damages enemies, blinds them and makes them take more damage.'],
    ['Dark Teleportation', 'ability', 'As Cloak: wraps nearby allies in darkness, making them invisible and untargetable for a short time.'],
    ['Shadow’s Embrace / Light’s Embrace', 'ability', 'Swaps between Cloak and Dagger.'],
    ['Eternal Bond', 'ultimate', 'Four quick dashes that heal allies and damage enemies along the path, leaving healing zones behind.'],
  ]],
  'adam-warlock': ['2026-10-01', [
    ['Quantum Magic', 'attack', 'Quantum energy shots. Critical hits shorten Avatar Life Stream’s cooldown.'],
    ['Cosmic Cluster', 'ability', 'Charges up and launches a cluster of quantum energy. Each hit shortens Avatar Life Stream’s cooldown.'],
    ['Soul Bond', 'ability', 'Links nearby allies: they heal over time and share incoming damage across the bond. He can hover and attack while it lasts.'],
    ['Avatar Life Stream', 'ability', 'A healing stream that bounces from his target to other allies and back to him.'],
    ['Soaring Surge', 'ability', 'Flies forward quickly.'],
    ['Karmic Revival', 'ultimate', 'Revives knocked-out allies nearby with part of their health, extra bonus health and a moment of invulnerability.'],
  ]],
  'invisible-woman': ['2026-10-01', [
    ['Orb Projection', 'attack', 'Fires a force orb that passes through heroes, damaging enemies and healing allies, then flies back to her.'],
    ['Guardian Shield', 'ability', 'Puts a shield on an ally or herself that blocks damage, heals allies near it and slows enemies passing through.'],
    ['Force Physics', 'ability', 'Pushes or pulls enemies in front of her.'],
    ['Psionic Vortex', 'ability', 'Throws a ball of psionic energy that erupts into a vortex, pulling enemies in and damaging them.'],
    ['Agile Strike', 'ability', 'A three-hit combo. The third hit launches enemies in front of her.'],
    ['Veiled Step', 'ability', 'Launches herself off a force field into invisibility. For the first second she can’t be damaged, so hits can’t break it.'],
    ['Covert Advance', 'passive', 'Turns invisible after leaving combat and heals over time.'],
    ['Invisible Boundary', 'ultimate', 'Creates a force field over an area. Allies inside are hidden from enemies and heal over time, and enemies inside are slowed.'],
  ]],
  'white-fox': ['2026-10-01', [
    ['Yeowoo Guseul', 'attack', 'Fox marbles that bounce off walls and heroes, then home in on nearby targets. They damage enemies, heal allies and restore her Spirit Tail energy.'],
    ['Spectral Surge', 'ability', 'Spends a Spirit Tail to send a spectral fox forward that heals allies and makes them briefly invulnerable, and damages and charms enemies. Heals her too.'],
    ['Spirit Sanctuary', 'ability', 'Teleports to an ally, healing everyone nearby, and leaves a shield that heals over time.'],
    ['Fox Form Awakening', 'ability', 'Grows physical tails for a while, draining Spirit Tail energy: she heals nearby allies constantly (more when she hits enemies) and switches to close-range moves.'],
    ['Claw Strike', 'attack', 'While awakened: a flurry of claw slashes.'],
    ['Tail Sweep', 'ability', 'While awakened: sweeps her tails to launch enemies up.'],
    ['Predatory Pounce', 'ability', 'While awakened: a dash. Hitting an enemy slows them and allows a second, longer dash that knocks enemies back.'],
    ['Kumiho Unleashed', 'ultimate', 'Becomes the full Nine-Tailed Fox with a large separate health pool, healing allies around her constantly, though others can’t heal her. Allies nearby are blessed when it starts.'],
    ['Ninefold Slam', 'attack', 'As the Nine-Tailed Fox: a ground slam whose shockwave heals her and nearby allies when it hits.'],
    ['Blessed by the Nine', 'ability', 'As the Nine-Tailed Fox: gives an ally healing over time, lifesteal and immunity to crowd control for a short time.'],
  ]],
  'luna-snow': ['2026-10-01', [
    ['Light & Dark Ice', 'attack', 'Ice shots that damage enemies or heal allies.'],
    ['Absolute Zero', 'ability', 'Throws ice that freezes the enemy hit in place and heals her. A hit gives her bonus health.'],
    ['Ice Arts', 'ability', 'Fires a burst of ice shards for a few seconds that damage enemies or heal allies, healing her too. Knockouts shorten its cooldown.'],
    ['Share the Stage', 'ability', 'Attaches Idol Aura to an ally, who heals whenever she heals others.'],
    ['Number One Idol', 'passive', 'Boosts her healing, and healing others heals her too.'],
    ['Cryo Heart', 'passive', 'Heals her when she casts Ice Arts or Absolute Zero.'],
    ['Smooth Skate', 'passive', 'Skates when moving forward and jumps higher.'],
    ['Fate of Both Worlds', 'ultimate', 'Dances on the spot, switching between two performances: one heals allies around her, the other boosts their damage.'],
  ]],
  'jeff-the-land-shark': ['2026-10-01', [
    ['Joyful Splash', 'attack', 'A water spray that damages enemies and heals allies.'],
    ['Aqua Burst', 'ability', 'A fast water sphere that bursts on impact. Direct hits launch enemies up.'],
    ['Healing Bubble', 'ability', 'Spits bubbles that heal the ally who picks them up and speed them up.'],
    ['Hide and Seek', 'ability', 'Dives under the ground with just his fin showing, moving faster, healing himself and able to climb walls.'],
    ['Oblivious Cuteness', 'passive', 'Takes less damage from critical hits.'],
    ['It’s Jeff!', 'ultimate', 'Dives deep, leaving a healing pool for allies, then surfaces to swallow every enemy and ally in range and spits them out a short way ahead.'],
  ]],
  'black-widow': ['2026-10-01', [
    ['Red Room Rifle', 'attack', 'A fast-firing rifle without a scope.'],
    ['Electric Batons', 'attack', 'Close-range electric baton strikes.'],
    ['Electro-Plasma Blast', 'ability', 'Fires a plasma round that explodes on impact and slows enemies.'],
    ['Fleet Foot', 'ability', 'Dashes forward and readies a powerful jump.'],
    ['Widow’s Bite Slam', 'ability', 'Leaps to a spot and slams the ground, damaging enemies nearby.'],
    ['Edge Dancer', 'ability', 'A spinning kick that launches enemies up. If it lands, she can zip to the target with her grappling hook for a second kick.'],
    ['Assassin’s Focus', 'ultimate', 'Switches her rifle to a sniper mode for a while: up to six piercing shots that hit harder.'],
  ]],
};

// ---------------------------------------------------------------------------
// Build and validate
// ---------------------------------------------------------------------------
const ROLE = { V: 'vanguard', D: 'duelist', S: 'strategist' };
const ROLE_KEYS = Object.values(ROLE);
const CONF = { d: 'data', k: 'kit', c: 'consensus' };
const BAN = { h: 'high', m: 'medium', l: 'low' };
const TIERS = ['S', 'A', 'B', 'C', 'D', 'F'];
const BRACKET_IDS = BRACKETS.map((b) => b.id);

const errors = [];
const fail = (msg) => errors.push(msg);

const ABBR = { gorr: 'GO', 'jeff-the-land-shark': 'JF', 'the-thing': 'TT', magneto: 'MG', mantis: 'MN' };

function abbr(id, name) {
  if (id.startsWith('deadpool')) return 'DP';
  if (ABBR[id]) return ABBR[id];
  const words = name.replace(/^The /, '').replace(/&/g, ' ').split(/[\s-]+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return words[0].slice(0, 2).toUpperCase();
}

const heroes = HEROES.map(([id, name, r, tiers, ban, extra = {}]) => {
  if (!ROLE[r]) fail(`${id}: bad role ${r}`);
  if (tiers.length !== 4 || [...tiers].some((t) => !TIERS.includes(t))) fail(`${id}: bad tiers ${tiers}`);
  if (!BAN[ban]) fail(`${id}: bad ban risk ${ban}`);
  const hero = {
    id,
    name,
    role: ROLE[r],
    abbr: abbr(id, name),
    tiers: Object.fromEntries(BRACKET_IDS.map((b, i) => [b, tiers[i]])),
    banRisk: BAN[ban],
  };
  for (const k of ['consoleShift', 'platformNote', 'patchNote', 'isNew', 'variant']) {
    if (extra[k] !== undefined) hero[k] = extra[k];
  }
  if (STYLES[id]) hero.styles = STYLES[id];
  return hero;
});

const byId = new Map(heroes.map((h) => [h.id, h]));
if (byId.size !== heroes.length) fail('duplicate hero ids');

const STYLE_IDS = ['long-range', 'brawl', 'dive', 'flyer', 'area'];
for (const [id, styles] of Object.entries(STYLES)) {
  if (!byId.has(id)) fail(`styles for unknown hero ${id}`);
  if (!Array.isArray(styles) || styles.length === 0) fail(`${id}: styles must be a non-empty list`);
  for (const s of styles) if (!STYLE_IDS.includes(s)) fail(`${id}: unknown style ${s}`);
  if (new Set(styles).size !== styles.length) fail(`${id}: repeated style`);
}

const MODES = ['convergence', 'convoy', 'domination'];
const TRAITS = ['long-sightlines', 'close-quarters', 'high-ground', 'chokepoints', 'flank-routes'];
const maps = MAPS.map(([id, name, world, mode, traits, note]) => {
  if (!/^[a-z0-9-]+$/.test(id)) fail(`map ${id}: id must be lowercase letters, digits and dashes`);
  if (!name || !note) fail(`map ${id}: missing name or note`);
  if (typeof world !== 'string') fail(`map ${id}: world must be a string ('' if unsure)`);
  if (!MODES.includes(mode)) fail(`map ${id}: bad mode ${mode}`);
  if (!Array.isArray(traits) || traits.length === 0) fail(`map ${id}: needs at least one trait`);
  for (const tr of traits ?? []) if (!TRAITS.includes(tr)) fail(`map ${id}: unknown trait ${tr}`);
  return { id, name, world, mode, traits, note };
});
if (new Set(maps.map((m) => m.id)).size !== maps.length) fail('duplicate map ids');

function pick(raw, where) {
  const [hero, c, reason, extra = {}] = raw;
  if (!byId.has(hero)) fail(`${where}: unknown hero ${hero}`);
  if (!CONF[c]) fail(`${where}: bad confidence ${c}`);
  if (!reason) fail(`${where}: missing reason`);
  const p = { hero, confidence: CONF[c], reason };
  if (extra.note) p.note = extra.note;
  if (extra.weak) p.weak = true;
  if (extra.alt) {
    for (const a of extra.alt) if (!byId.has(a)) fail(`${where}: unknown alt ${a}`);
    p.alt = extra.alt;
  }
  return p;
}

for (const h of heroes) {
  const src = COUNTERS[h.id];
  if (!src) {
    fail(`${h.id}: no counters`);
    continue;
  }
  const counters = {};
  for (const role of ROLE_KEYS) {
    if (!src[role]) {
      fail(`${h.id}: missing ${role} counter`);
      continue;
    }
    const p = pick(src[role], `${h.id}.${role}`);
    const ch = byId.get(p.hero);
    if (ch && ch.role !== role) fail(`${h.id}.${role}: ${p.hero} is a ${ch.role}`);
    for (const a of p.alt ?? []) if (byId.get(a)?.role !== role) fail(`${h.id}.${role}: alt ${a} is not a ${role}`);
    if (p.hero === h.id) fail(`${h.id}.${role}: counters itself`);
    counters[role] = p;
  }
  const o = src.overall;
  if (typeof o === 'string') {
    if (!counters[o]) fail(`${h.id}.overall: bad role ref ${o}`);
    else counters.overall = { ...counters[o] };
  } else if (o && o.from) {
    if (!counters[o.from]) fail(`${h.id}.overall: bad role ref ${o.from}`);
    else counters.overall = { ...counters[o.from], note: o.note };
  } else if (Array.isArray(o)) {
    counters.overall = pick(o, `${h.id}.overall`);
  } else {
    fail(`${h.id}: missing overall counter`);
  }
  h.counters = { overall: counters.overall, vanguard: counters.vanguard, duelist: counters.duelist, strategist: counters.strategist };
}
for (const id of Object.keys(COUNTERS)) if (!byId.has(id)) fail(`counters for unknown hero ${id}`);

const FOCUS = { h: 'high', m: 'medium', l: 'low' };
const MAX_TIP = 260;
for (const [id, t] of Object.entries(TIPS)) {
  const where = `tips.${id}`;
  const hero = byId.get(id);
  if (!hero) fail(`${where}: unknown hero`);
  const list = (arr, key) => {
    if (!Array.isArray(arr) || arr.length === 0) {
      fail(`${where}.${key}: needs at least one tip`);
      return [];
    }
    for (const s of arr) {
      if (typeof s !== 'string' || !s.trim()) fail(`${where}.${key}: empty tip`);
      else if (s.length > MAX_TIP) fail(`${where}.${key}: tip is ${s.length} characters (max ${MAX_TIP}): ${s.slice(0, 50)}…`);
    }
    return arr;
  };
  const tips = { against: list(t.against, 'against'), as: list(t.as, 'as') };
  if (t.quirks !== undefined) {
    if (!Array.isArray(t.quirks)) fail(`${where}.quirks: must be a list`);
    tips.quirks = (Array.isArray(t.quirks) ? t.quirks : []).map(([text, asOf], i) => {
      if (typeof text !== 'string' || !text.trim()) fail(`${where}.quirks[${i}]: missing text`);
      else if (text.length > MAX_TIP) fail(`${where}.quirks[${i}]: too long`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(asOf ?? '')) fail(`${where}.quirks[${i}]: asOf must be YYYY-MM-DD`);
      return { text, asOf };
    });
  }
  let focus;
  if (t.focus !== undefined) {
    const [level, why] = t.focus;
    if (!FOCUS[level]) fail(`${where}.focus: level must be h, m or l`);
    if (typeof why !== 'string' || !why.trim()) fail(`${where}.focus: missing reason`);
    focus = { level: FOCUS[level], why };
  }
  if (hero) {
    hero.tips = tips;
    if (focus) hero.focus = focus;
  }
}

// Team-ups. 'deadpool' expands to every Deadpool role version, since only one can be on a team.
const DEADPOOL_IDS = heroes.filter((h) => h.id.startsWith('deadpool-')).map((h) => h.id);
const MAX_TEAMUP_TEXT = 170;
const teamUps = [];
const teamUpNames = new Set();
const ownedTeamUps = new Map();
for (const [i, entry] of TEAMUPS.entries()) {
  const [name, members, effect, bonus] = entry;
  const label = name || `team-up #${i + 1}`;
  if (typeof name !== 'string' || !name.trim()) fail(`${label}: needs its in-game name`);
  if (teamUpNames.has(name)) fail(`${label}: listed twice`);
  teamUpNames.add(name);
  if (!Array.isArray(members) || members.length !== 2) {
    fail(`${label}: needs [hero who uses it, partner]`);
    continue;
  }
  if (members[0] === members[1]) fail(`${label}: repeated hero`);
  for (const [k, text] of [['effect', effect], ['bonus', bonus]]) {
    if (typeof text !== 'string' || !text.trim()) fail(`${label}: missing ${k} text`);
    else if (text.length > MAX_TEAMUP_TEXT) fail(`${label}: ${k} text is ${text.length} characters (max ${MAX_TEAMUP_TEXT})`);
  }
  const expand = (id) => (id === 'deadpool' ? DEADPOOL_IDS : [id]);
  for (const id of members) if (id !== 'deadpool' && !byId.has(id)) fail(`${label}: unknown hero ${id}`);
  ownedTeamUps.set(members[0], (ownedTeamUps.get(members[0]) ?? 0) + 1);
  for (const owner of expand(members[0])) {
    for (const partner of expand(members[1])) teamUps.push({ name, heroes: [owner, partner], effect, bonus });
  }
}
// Every hero has exactly two team-up abilities to choose from.
for (const h of heroes) {
  const key = h.id.startsWith('deadpool-') ? 'deadpool' : h.id;
  if (ownedTeamUps.get(key) !== 2) fail(`${key}: has ${ownedTeamUps.get(key) ?? 0} team-up abilities, expected 2`);
}
const teamUpKeys = teamUps.map((t) => t.heroes.join('>'));
if (new Set(teamUpKeys).size !== teamUpKeys.length) fail('a hero has two team-ups with the same partner');

// Ability breakdowns
const KINDS = ['attack', 'ability', 'ultimate', 'passive'];
const MAX_ABILITY_TEXT = 240;
for (const [id, entry] of Object.entries(ABILITIES)) {
  const hero = byId.get(id);
  if (!hero) {
    fail(`abilities for unknown hero ${id}`);
    continue;
  }
  const [checked, list] = entry;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(checked ?? '')) fail(`${id}.abilities: checked date must be YYYY-MM-DD`);
  if (!Array.isArray(list) || !list.length) {
    fail(`${id}.abilities: empty`);
    continue;
  }
  const names = new Set();
  const abilities = list.map(([name, kind, text], i) => {
    const where = `${id}.abilities[${i}]`;
    if (typeof name !== 'string' || !name.trim()) fail(`${where}: missing name`);
    if (names.has(name)) fail(`${where}: ${name} is listed twice`);
    names.add(name);
    if (!KINDS.includes(kind)) fail(`${where}: kind must be one of ${KINDS.join(', ')}`);
    if (typeof text !== 'string' || !text.trim()) fail(`${where}: missing text`);
    else if (text.length > MAX_ABILITY_TEXT) fail(`${where}: ${text.length} characters (max ${MAX_ABILITY_TEXT})`);
    return { name, kind, text };
  });
  if (!abilities.some((a) => a.kind === 'ultimate')) fail(`${id}.abilities: no ultimate listed`);
  hero.kit = { checked, abilities };
}
for (const h of heroes) if (!h.kit) fail(`${h.id}: no ability breakdown`);

const comps = COMPS.map((c) => {
  const slots = c.slots.map(([r, options]) => {
    for (const id of options) {
      const h = byId.get(id);
      if (!h) fail(`${c.id}: unknown slot hero ${id}`);
      else if (h.role !== ROLE[r]) fail(`${c.id}: ${id} is not a ${ROLE[r]}`);
    }
    return { role: ROLE[r], options };
  });
  const counts = slots.reduce((acc, s) => ({ ...acc, [s.role]: (acc[s.role] ?? 0) + 1 }), {});
  const split = `${counts.vanguard ?? 0}-${counts.duelist ?? 0}-${counts.strategist ?? 0}`;
  if (split !== c.split) fail(`${c.id}: split ${c.split} does not match slots ${split}`);
  for (const t of c.teamUps) for (const id of t.heroes) if (!byId.has(id)) fail(`${c.id}: unknown team-up hero ${id}`);
  for (const t of c.teamUps) {
    if (!teamUps.some((u) => u.name === t.name && u.heroes.join('>') === t.heroes.join('>'))) {
      fail(`${c.id}: team-up ${t.name} with ${t.heroes.join(' and ')} is not in TEAMUPS (list the hero who uses it first)`);
    }
  }
  for (const id of c.counter.heroes) if (!byId.has(id)) fail(`${c.id}: unknown counter hero ${id}`);
  for (const b of c.bestBrackets) if (!BRACKET_IDS.includes(b)) fail(`${c.id}: bad bracket ${b}`);
  return { ...c, slots };
});

if (errors.length) {
  console.error(`Data check failed (${errors.length}):\n- ${errors.join('\n- ')}`);
  process.exit(1);
}

const dataset = {
  schemaVersion: 1,
  revision: REVISION,
  ...META,
  brackets: BRACKETS,
  methodology: METHODOLOGY,
  seasonNotes: SEASON_NOTES,
  changelog: CHANGELOG,
  heroes,
  comps,
  maps,
  teamUps,
};

const out = resolve(dirname(fileURLToPath(import.meta.url)), '../src/data/heroes.json');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(dataset, null, 2) + '\n');

const perRole = ROLE_KEYS.map((r) => `${heroes.filter((h) => h.role === r).length} ${r}s`).join(', ');
const withTips = heroes.filter((h) => h.tips).length;
const abilityCount = heroes.reduce((n, h) => n + (h.kit?.abilities.length ?? 0), 0);
console.log(
  `Wrote ${out}\nrevision ${REVISION}: ${heroes.length} hero entries (${perRole}), ${comps.length} comps, ` +
    `${maps.length} maps, ${teamUps.length} team-ups, ${abilityCount} abilities, tips for ${withTips} heroes`,
);
