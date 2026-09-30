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

const REVISION = 4;

const META = {
  season: "Season 10: Butcher's Blasphemy",
  seasonShort: 'Season 10',
  patch: 'Sept 11 balance patch, Sept 17 fix and Sept 24 update (cosmetic only)',
  updated: '2026-09-26',
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
  'The draft helper leaves out banned heroes and heroes your teammates already picked, and nudges close calls toward picks that form a team-up with your team.',
  'Picking a map in the draft helper nudges close calls toward heroes whose play style suits its layout, mode and side. A real counter always outweighs the map.',
  'Hero tips are our own advice, written from official patch notes and current guides. Each quirk shows the date it was last checked.',
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
      'Break her Spider-Nest first. It spreads the webs that heal her, speed her up and hide her mines.',
      'Treat webbed ground as mined. Mines placed on her webs are invisible to you.',
      'Her web snare roots you for a moment. If you play a diver, bait it out before you commit.',
      'During her mech ultimate she is much tougher and faster. Spread out and kite until it ends instead of trading with her.',
      'Since Season 10 she no longer slows down while firing, so expect her to keep moving while she shoots.',
    ],
    as: [
      'Place the nest where it covers the objective or a choke but sits out of long sightlines, then fight on your webs for healing and speed.',
      'Drop mines on your webs so enemies can’t see them.',
      'Since Season 10 you move at full speed while firing. Strafe and use cover instead of standing still.',
      'Keep your web swing and wall climbing for escaping or taking high ground, and save the snare for divers.',
      'Spider-Man’s and Black Panther’s team-ups with you got shorter cooldowns in Season 10, so both pair well.',
    ],
    quirks: [
      ['Her snare’s cooldown used to start the moment it was cast, so it came back early. The Sept 11 patch fixed that, so it now takes its full cooldown.', '2026-09-24'],
      ['Webs laid during her mech ultimate disappear when it ends.', '2026-09-24'],
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
    quirks: [['He takes reduced damage from critical hits, so headshots do less to him than usual.', '2026-09-24']],
  },
  magneto: {
    focus: ['m', 'Hard to hurt through his curtain and shields, but since Season 10 he drops fast once his shield is on cooldown.'],
    against: [
      'His Metallic Curtain only blocks projectiles. Use beams, hitscan or melee, walk around it, or wait for its energy to run out.',
      'His ally shield and self shield share one cooldown. Once he shields a teammate he can’t shield himself for a while, so burst him then.',
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
    quirks: [['His meteor can overload and cancel if it absorbs too many projectiles.', '2026-09-24']],
  },
  'the-hood': {
    focus: ['h', 'Low health for a Vanguard after Season 10 and no hard crowd control. He goes down fast once his parry is used.'],
    against: [
      'Bait out Mantle of Oblivion, his short parry, before you commit burst or an ultimate. Season 10 gave it a longer cooldown.',
      'He can’t parry while in Half-Demon form. That form hits hardest, but it’s also your window to burst him.',
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
    quirks: [['Demonic Energy doesn’t drain while you’re out of Half-Demon form, so you can carry it into the next fight.', '2026-09-24']],
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
      ['Kills don’t turn enemies into copies of themselves. Each kill spawns an ordinary Berserker where the enemy fell.', '2026-09-24'],
      ['Berserkers shoot from range, but fight in melee when you pull them in with Necro-Power.', '2026-09-24'],
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
      ['Each enemy hit by Magik Slash takes a second off your portal cooldown.', '2026-09-24'],
      ['Eldritch Whirl and Demon’s Rage can only be used for a short time after a portal.', '2026-09-24'],
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
      'With Peni Parker on your team, throw her spider-bomb often. Its cooldown was cut in Season 10.',
    ],
  },
  'scarlet-witch': {
    focus: ['m', 'Squishy, and her escape is slower since her rework. Raise her priority when several of your team are marked or her ultimate is ready.'],
    against: [
      'Her Chaos Marks are the key. Scarlet Hex (a long line in front of her) and Dark Seal mark you, and her beam then hits every marked enemy at once. Don’t line up, and break line of sight once marked.',
      'Fight her from beyond about 20 meters, the reach of her marks and her multi-target beam.',
      'Dark Seal now stuns only once, briefly, when it goes off. Walk out of the field instead of waiting in it.',
      'Burst her instead of trading slowly. Her self-healing is small and only comes from hitting marked targets, and her escape is slower since Season 10.',
      'During her ultimate wind-up, get more than 15 meters away or kill her. Keep shooting, since Sept 17 she rarely becomes immune during it.',
    ],
    as: [
      'Mark, then beam. Open with Scarlet Hex down a corridor or Dark Seal on a group, then hold Chaos Control to hit every marked enemy in front of you.',
      'Keep marked enemies within about 20 meters and in front of you. The beam covers a wide cone but has a range limit.',
      'Your healing only comes from hitting marked targets, so keep marks up.',
      'Use Dark Seal to mark and slow, not to hold a diver. Its stun is very short now.',
      'Don’t count on ultimate immunity. Ult from cover or after the enemy has committed.',
    ],
    quirks: [
      ['Her ultimate wind-up can still randomly make her immune to damage, but since the Sept 17 patch it rarely happens. The odds were never published.', '2026-09-24'],
      ['Advice about Dark Seal stunning over and over is out of date. Since the Season 10 rework it stuns once.', '2026-09-24'],
    ],
  },
  hela: {
    focus: ['h', 'Picks off your healers from long range. Pressure her position and make her use her crow escape before you commit.'],
    against: [
      'She wins long-range duels. Cross open lanes behind cover or shields, and come at her from corners and flanks.',
      'Her crow form, Astral Flock, is her escape, and she can’t be hurt during it. Don’t waste burst on the crows. Commit once it’s used.',
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
    quirks: [['Guides from before Season 9 are out of date. Her damage, range falloff and crow-form flight all changed then.', '2026-09-24']],
  },
  'black-panther': {
    focus: ['h', 'The biggest threat to your healers. Track him all fight and punish him when his dash resets fail.'],
    against: [
      'His attack runs on marks. A spear or spinning kick marks you, then dashing through a marked target resets his dash and heals him. A mark on your backline means he’s coming.',
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
    quirks: [['Guides that list his health as a flat 275 are out of date. Since Season 9 part of it is a shield that refills when he avoids damage for a few seconds.', '2026-09-24']],
  },
  mantis: {
    focus: ['h', 'A top healer who also boosts her team’s damage. Easy to kill once her sleep is baited out.'],
    against: [
      'Bait out her sleep, Spore Slumber, before you dive her. It’s her only self-defense.',
      'If a teammate gets slept, shoot the Mantis illusion that appears near them to wake them early.',
      'Keep up steady pressure. Her heals and buffs spend Life Orbs, which refill more slowly since Season 10.',
      'During her ultimate, back off and re-engage when it ends, or take out Mantis herself.',
      'If Adam Warlock is on her team, a kill may not stick. Their team-up turns her into a soul that can fly and revive.',
    ],
    as: [
      'Land critical hits for extra Life Orbs. It matters more now that orbs refill more slowly.',
      'Before fights, put Healing Flower on your frontline and Allied Inspiration on your best damage dealer.',
      'Save your sleep for divers like Black Panther. Any damage wakes them, so reposition or line up one big hit.',
      'Stay behind your tanks. Apart from your speed boost, you have no escape.',
      'Adam Warlock is your stronger team-up partner now. Star-Lord’s team-up got weaker in Season 10.',
    ],
    quirks: [['Guides that say she makes a Life Orb every 3 seconds are out of date. Since Season 10 it’s every 4.', '2026-09-24']],
  },
  ultron: {
    focus: ['h', 'Top-tier healing from the air. Hitscan and flyers should focus him, and everyone else should pressure whoever he’s healing.'],
    against: [
      'He’s a fragile flyer. Long-range hitscan and flying heroes are the reliable answers. Melee divers struggle unless he comes down low.',
      'Firewall is how he survives burst. Since Season 10 it gives less bonus health but also heals him for a few seconds, so burst him before he casts it.',
      'Punish him while his dash, Dynamic Flight, is on cooldown.',
      'His drone heals everyone around its target, so focus enemies away from it.',
      'He can’t be crowd-controlled during his ultimate. Don’t waste stuns on him then.',
    ],
    as: [
      'Keep your Patch drone on the ally under the most pressure, or on one standing in a group.',
      'Use Firewall against enemy burst and ultimates. Since Season 10 it also heals you.',
      'Use height and cover, and don’t hover in open sightlines. Save your dash for escaping divers.',
      'Add beam damage when nobody needs healing.',
      'Use your ultimate to answer an enemy engage. You can’t be crowd-controlled during it.',
    ],
    quirks: [['Older guides say he can’t heal himself. Since Season 10, Firewall also heals him for a few seconds.', '2026-09-24']],
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
// Team-ups active this season: [name ('' if unsure), heroes who must all be on the team].
// The draft helper points out picks that form one with your teammates. Team-ups rotate
// every season, so rebuild this list from the season's balance post at each launch.
// Source: the official Season 10 balance post, plus Gorr's launch team-ups.
// ---------------------------------------------------------------------------
const TEAMUPS = [
  ['Voltaic Union', ['captain-america', 'thor']],
  ['Stars Aligned', ['captain-america', 'winter-soldier']],
  ['Bloodline Awakening', ['blade', 'captain-america']],
  ['Primal Punishment', ['devil-dinosaur', 'the-punisher']],
  ['Smoky Snare', ['elsa-bloodstone', 'devil-dinosaur']],
  ['Gamma Maelstrom', ['doctor-strange', 'hulk']],
  ['Gamma Monstro', ['namor', 'hulk']],
  ['Metallic Chaos', ['magneto', 'scarlet-witch']],
  ['Favorable Odds', ['gambit', 'magneto']],
  ['Vibranium Mech', ['peni-parker', 'black-panther']],
  ['Parker Power-Up', ['spider-man', 'peni-parker']],
  ['Fortune Synergy', ['black-cat', 'black-panther']],
  ['Divine Armory', ['thor', 'angela']],
  ['Two-in-One', ['the-thing', 'human-torch']],
  ['Clobberin’ Research Dept.', ['mister-fantastic', 'the-thing']],
  ['Void Pentagram', ['magik', 'the-hood']],
  ['New Moon’s Shadow', ['the-hood', 'moon-knight']],
  ['Frozen Spawn', ['namor', 'luna-snow']],
  ['Frozen Haven', ['cloak-and-dagger', 'luna-snow']],
  ['Ceaseless Charge', ['winter-soldier', 'elsa-bloodstone']],
  ['Kinetic Claws', ['wolverine', 'cyclops']],
  ['', ['mantis', 'star-lord']],
  ['', ['mantis', 'adam-warlock']],
  ['', ['scarlet-witch', 'jubilee']],
  ['Ragnarök', ['gorr', 'hela']],
  ['Hive Mind', ['gorr', 'venom']],
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

const teamUps = TEAMUPS.map(([name, members], i) => {
  const label = name || `team-up #${i + 1}`;
  if (typeof name !== 'string') fail(`${label}: name must be a string ('' if unsure)`);
  if (!Array.isArray(members) || members.length < 2) fail(`${label}: needs at least two heroes`);
  for (const id of members ?? []) if (!byId.has(id)) fail(`${label}: unknown hero ${id}`);
  if (new Set(members).size !== members?.length) fail(`${label}: repeated hero`);
  return { name, heroes: members };
});
const teamUpKeys = teamUps.map((t) => [...(t.heroes ?? [])].sort().join('+'));
if (new Set(teamUpKeys).size !== teamUpKeys.length) fail('the same heroes are listed in two team-ups');

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
  maps,
  teamUps,
};

const out = resolve(dirname(fileURLToPath(import.meta.url)), '../src/data/heroes.json');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(dataset, null, 2) + '\n');

const perRole = ROLE_KEYS.map((r) => `${heroes.filter((h) => h.role === r).length} ${r}s`).join(', ');
const withTips = heroes.filter((h) => h.tips).length;
console.log(
  `Wrote ${out}\nrevision ${REVISION}: ${heroes.length} hero entries (${perRole}), ${comps.length} comps, ` +
    `${maps.length} maps, ${teamUps.length} team-ups, tips for ${withTips} heroes`,
);
