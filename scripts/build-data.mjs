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

const REVISION = 1;

const META = {
  season: "Season 10: Butcher's Blasphemy",
  seasonShort: 'Season 10',
  patch: 'Sept 11 balance patch and Sept 17 fix',
  updated: '2026-09-24',
  nextReview: '2026-10-09',
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
  'Bans happen at Gold III and above. Heroes marked as often banned may not be available.',
  'The meta shifts with every patch. The data is reviewed weekly and after each balance update.',
];

const SEASON_NOTES = [
  'Gorr the God Butcher (Duelist) is new this season.',
  'Every Strategist now charges their ultimate more slowly.',
  'Ranked bans at Gold III and above alternate 1-2-2-1, removing six heroes per match.',
  'Season 10.5 arrives October 9.',
];

const CHANGELOG = [
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
  ['gorr', 'Gorr the God Butcher', 'D', 'SSSA', 'h', { isNew: true, patchNote: 'New this season. Turns downed enemies into AI Berserkers.' }],
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
  ['black-widow', 'Black Widow', 'D', 'DCCB', 'l', { consoleShift: -1, platformNote: 'Hitscan sniper: noticeably weaker on controller.', patchNote: 'Nerfed this season.' }],
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
  flyerChase: 'Mobile enough to chase flyers.',
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
    vanguard: ['peni-parker', 'k', 'Web zone punishes a big melee body.'],
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
    strategist: ['cloak-and-dagger', 'k', 'Vulnerability speeds up breaking his walls.'],
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
    vanguard: ['peni-parker', 'd', 'Webs and mines slow him before he reaches you.'],
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
    duelist: ['spider-man', 'k', R.diveSniper],
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
    vanguard: ['peni-parker', 'd', 'Webs and mines stall his melee push.', { alt: ['devil-dinosaur'] }],
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
    vanguard: ['peni-parker', 'd', 'Webs and mines stall his combos.'],
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
    vanguard: ['peni-parker', 'd', 'Webs and mines stall her dives.', { alt: ['the-thing'] }],
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
    vanguard: ['peni-parker', 'k', 'Webs and mines hold space against her pressure.'],
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
    vanguard: ['doctor-strange', 'k', 'His big shield soaks Chaos Control.'],
    duelist: ['squirrel-girl', 'd', R.dataWin, { note: 'Niche pick: Squirrel Girl is weak overall.' }],
    strategist: ['invisible-woman', 'k', 'Shields soak her beam.'],
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
    vanguard: ['peni-parker', 'k', 'Webs and mines stall his flanks.'],
    duelist: ['hela', 'k', 'Precise burst punishes his low health.'],
    strategist: ['jubilee', 'd', R.dataWin],
  },
  storm: {
    overall: 'duelist',
    vanguard: ['thor', 'k', R.flyerChase],
    duelist: ['black-widow', 'd', 'Hitscan punishes a flyer. Less reliable on controller.'],
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
    vanguard: ['peni-parker', 'k', 'Webs slow him so you can kite the melee.'],
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
      why: 'Black Widow’s hitscan punishes flyers (less reliable on controller), and Spider-Man swings up to reach Ultron and other airborne heroes.',
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
  return hero;
});

const byId = new Map(heroes.map((h) => [h.id, h]));
if (byId.size !== heroes.length) fail('duplicate hero ids');

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
};

const out = resolve(dirname(fileURLToPath(import.meta.url)), '../src/data/heroes.json');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(dataset, null, 2) + '\n');

const perRole = ROLE_KEYS.map((r) => `${heroes.filter((h) => h.role === r).length} ${r}s`).join(', ');
console.log(`Wrote ${out}\nrevision ${REVISION}: ${heroes.length} hero entries (${perRole}), ${comps.length} comps`);
