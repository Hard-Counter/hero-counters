// Pure logic shared by the app and the web preview. No React Native imports here.
import type {
  BanRisk,
  BracketId,
  CounterPick,
  Dataset,
  FocusLevel,
  GameMap,
  Hero,
  HeroStyle,
  MapMode,
  MapSide,
  MapTrait,
  Platform,
  Quirk,
  RoleId,
  TeamUp,
  Tier,
} from './data/types';

export const ROLES: RoleId[] = ['vanguard', 'duelist', 'strategist'];

export const ROLE_LABEL: Record<RoleId, string> = {
  vanguard: 'Vanguard',
  duelist: 'Duelist',
  strategist: 'Strategist',
};

export const TIERS: Tier[] = ['S', 'A', 'B', 'C', 'D', 'F'];

export const CONFIDENCE_LABEL = { data: 'Data-backed', kit: 'Kit-based', consensus: 'Consensus' } as const;

export const BAN_LABEL: Record<BanRisk, string> = {
  high: 'Often banned at Gold III and above',
  medium: 'Sometimes banned at Gold III and above',
  low: 'Rarely banned',
};

const TIER_SCORE: Record<Tier, number> = { S: 2, A: 1.5, B: 1, C: 0.5, D: 0, F: -0.5 };
const CONFIDENCE_WEIGHT = { data: 1, kit: 0.8, consensus: 0.8 } as const;

// ---- Maps ----

export const MAP_MODES: MapMode[] = ['convergence', 'convoy', 'domination'];

export const MAP_MODE_LABEL: Record<MapMode, string> = {
  domination: 'Domination',
  convoy: 'Convoy',
  convergence: 'Convergence',
};

export const MAP_TRAIT_LABEL: Record<MapTrait, string> = {
  'long-sightlines': 'Long sightlines',
  'close-quarters': 'Tight spaces',
  'high-ground': 'High ground',
  chokepoints: 'Chokepoints',
  'flank-routes': 'Flank routes',
};

export const HERO_STYLE_LABEL: Record<HeroStyle, string> = {
  'long-range': 'Long range',
  brawl: 'Brawler',
  dive: 'Dive',
  flyer: 'Flyer',
  area: 'Area control',
};

/** What each play style means, in plain words. */
export const HERO_STYLE_INFO: Record<HeroStyle, string> = {
  'long-range': 'Deals damage from far away. Wants open sightlines and struggles when enemies get close.',
  brawl: 'Fights up close and wins by staying in the middle of the fight or on the objective.',
  dive: 'Jumps onto enemy healers and damage dealers, then gets out. Likes flank routes and high ground.',
  flyer: 'Spends long stretches in the air, out of reach of many melee heroes.',
  area: 'Controls space with zones, turrets, walls, shields or traps. Strongest at chokepoints and objectives.',
};

/** What each map trait means, in plain words. */
export const MAP_TRAIT_INFO: Record<MapTrait, string> = {
  'long-sightlines': 'Long, open views that favor long-range damage.',
  'close-quarters': 'Tight rooms and corners that force short-range fights.',
  'high-ground': 'Raised ledges and platforms that flyers and divers can use.',
  chokepoints: 'Narrow passages the attackers have to push through.',
  'flank-routes': 'Side paths that let heroes get behind the enemy team.',
};

export const MAP_MODE_INFO: Record<MapMode, string> = {
  domination: 'Both teams fight over one point. Hold it to score.',
  convoy: 'Attackers escort a vehicle along a route while defenders try to stop it.',
  convergence: 'Attackers capture a point, then escort a vehicle from it.',
};

export const MAP_SIDES: MapSide[] = ['either', 'attack', 'defense'];

export const MAP_SIDE_LABEL: Record<MapSide, string> = { either: 'Either side', attack: 'Attacking', defense: 'Defending' };

/** Only modes where one team attacks have sides. */
export function hasSides(mode: MapMode): boolean {
  return mode !== 'domination';
}

// How much a map trait or objective helps (+) or hurts (-) each play style. Kept small on purpose:
// a map only reorders close calls, and a real counter always outweighs it.
const TRAIT_FIT: Record<MapTrait, Partial<Record<HeroStyle, number>>> = {
  'long-sightlines': { 'long-range': 0.5, flyer: 0.25, brawl: -0.25 },
  'close-quarters': { brawl: 0.5, area: 0.25, 'long-range': -0.25 },
  'high-ground': { flyer: 0.5, dive: 0.25 },
  chokepoints: { area: 0.5, 'long-range': 0.25 },
  'flank-routes': { dive: 0.5 },
};

const OBJECTIVE_FIT: Record<'point' | 'attack' | 'defense', { label: string; fit: Partial<Record<HeroStyle, number>> }> = {
  point: { label: 'holding the point', fit: { area: 0.25, brawl: 0.25 } },
  attack: { label: 'pushing on attack', fit: { brawl: 0.25, dive: 0.25 } },
  defense: { label: 'holding on defense', fit: { area: 0.25, 'long-range': 0.25 } },
};

const MAP_FIT_MIN = -0.5;
const MAP_FIT_MAX = 0.75;

export interface MapContext {
  map: GameMap;
  side: MapSide;
}

export interface MapFit {
  /** Added to the draft score, between -0.5 and +0.75 (a tier step is 0.5). */
  score: number;
  /** What about the map suits the hero, in plain words. */
  helps: string[];
  /** What about the map works against the hero. */
  hurts: string[];
}

/** How well a hero's play styles suit a map and side. No map or no styles means no effect. */
export function mapFit(hero: Hero, ctx: MapContext | null | undefined): MapFit {
  const fit: MapFit = { score: 0, helps: [], hurts: [] };
  const styles = Array.isArray(hero.styles) ? hero.styles : [];
  if (!ctx || !styles.length) return fit;
  const apply = (table: Partial<Record<HeroStyle, number>>, label: string) => {
    let points = 0;
    for (const s of styles) points += table[s] ?? 0;
    if (points > 0) fit.helps.push(label);
    else if (points < 0) fit.hurts.push(label);
    fit.score += points;
  };
  for (const trait of ctx.map.traits) {
    const table = TRAIT_FIT[trait];
    if (table) apply(table, MAP_TRAIT_LABEL[trait].toLowerCase());
  }
  const objective = ctx.map.mode === 'domination' ? 'point' : ctx.side === 'either' ? null : ctx.side;
  if (objective) apply(OBJECTIVE_FIT[objective].fit, OBJECTIVE_FIT[objective].label);
  fit.score = Math.min(MAP_FIT_MAX, Math.max(MAP_FIT_MIN, fit.score));
  return fit;
}

/** "Good on this map: long sightlines and high ground", or null when the map barely matters. */
export function mapNote(fit: MapFit | undefined): string | null {
  if (!fit || Math.abs(fit.score) < 0.25) return null;
  const list = (items: string[]) =>
    items.length > 1 ? `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}` : items[0];
  if (fit.score > 0 && fit.helps.length) return `Good on this map: ${list(fit.helps)}`;
  if (fit.score < 0 && fit.hurts.length) return `Harder on this map: ${list(fit.hurts)}`;
  return null;
}

/** Maps from the data file that this version of the app understands. Unknown traits are dropped. */
export function usableMaps(data: Dataset): GameMap[] {
  if (!Array.isArray(data.maps)) return [];
  return data.maps
    .filter((m) => !!m && typeof m.id === 'string' && typeof m.name === 'string' && MAP_MODES.includes(m.mode))
    .map((m) => ({
      ...m,
      world: typeof m.world === 'string' ? m.world : '',
      note: typeof m.note === 'string' ? m.note : '',
      traits: Array.isArray(m.traits) ? m.traits.filter((tr) => tr in MAP_TRAIT_LABEL) : [],
    }));
}

export type HeroIndex = Record<string, Hero>;

export function indexHeroes(data: Dataset): HeroIndex {
  const idx: HeroIndex = {};
  for (const h of data.heroes) idx[h.id] = h;
  return idx;
}

/** Tier for a hero at a rank bracket on a platform. Console = PC tier moved by consoleShift. */
export function tierFor(hero: Hero, bracket: BracketId, platform: Platform): Tier {
  const base = hero.tiers[bracket];
  if (platform === 'pc' || !hero.consoleShift) return base;
  const i = TIERS.indexOf(base) - hero.consoleShift;
  return TIERS[Math.min(TIERS.length - 1, Math.max(0, i))];
}

export function tierRank(t: Tier): number {
  return TIERS.indexOf(t);
}

export function sortHeroes(heroes: Hero[], bracket: BracketId, platform: Platform): Hero[] {
  return [...heroes].sort(
    (a, b) =>
      tierRank(tierFor(a, bracket, platform)) - tierRank(tierFor(b, bracket, platform)) ||
      ROLES.indexOf(a.role) - ROLES.indexOf(b.role) ||
      a.name.localeCompare(b.name),
  );
}

/** Heroes that list this hero as a counter (overall, in a role, or as an alternative). */
export function goodAgainst(data: Dataset, heroId: string): Hero[] {
  return data.heroes.filter((e) => {
    if (e.id === heroId) return false;
    const picks = [e.counters.overall, e.counters.vanguard, e.counters.duelist, e.counters.strategist];
    return picks.some((p) => p.hero === heroId || (p.alt ?? []).includes(heroId));
  });
}

// ---- Team-ups ----

/** Team-ups from the data file whose heroes this version of the app knows. */
export function usableTeamUps(data: Dataset, idx: HeroIndex): TeamUp[] {
  if (!Array.isArray(data.teamUps)) return [];
  return data.teamUps.filter(
    (t) =>
      !!t &&
      Array.isArray(t.heroes) &&
      t.heroes.length >= 2 &&
      t.heroes.every((id) => typeof id === 'string' && !!idx[id]),
  ).map((t) => ({ name: typeof t.name === 'string' ? t.name : '', heroes: t.heroes }));
}

export interface TeamUpMatch {
  name: string;
  /** The teammates this hero would team up with. */
  partners: Hero[];
}

/** Team-ups a hero would complete with the heroes already on your team. */
export function teamUpsWith(heroId: string, allies: readonly string[], teamUps: readonly TeamUp[], idx: HeroIndex): TeamUpMatch[] {
  const out: TeamUpMatch[] = [];
  for (const t of teamUps) {
    if (!t.heroes.includes(heroId)) continue;
    const others = t.heroes.filter((id) => id !== heroId);
    if (others.length && others.every((id) => allies.includes(id))) {
      out.push({ name: t.name, partners: others.map((id) => idx[id]).filter(Boolean) });
    }
  }
  return out;
}

/** "Metallic Chaos with Magneto", or "Team-up with Magneto" when the name isn't known. */
export function teamUpLabel(m: TeamUpMatch): string {
  const who = m.partners.map((h) => h.name).join(' and ');
  return m.name ? `${m.name} with ${who}` : `Team-up with ${who}`;
}

// ---- Draft ----

const TEAMUP_BONUS = 0.25;
const TEAMUP_MAX = 0.5;

export interface Suggestion {
  hero: Hero;
  score: number;
  tier: Tier;
  /** Enemies this hero is a listed counter to. */
  beats: Hero[];
  /** Enemies where this hero only has a slight edge. */
  edges: Hero[];
  /** How the chosen map and side affect this hero. */
  map: MapFit;
  /** Team-ups this pick would form with your teammates. */
  teamUps: TeamUpMatch[];
}

/**
 * ok: the counter is available. ally: a teammate already plays it.
 * banned: the listed counter and its alternatives are all banned.
 */
export type MatchupStatus = 'ok' | 'ally' | 'banned';

export interface Matchup {
  enemy: Hero;
  pick: CounterPick;
  counter: Hero;
  status: MatchupStatus;
  /** The listed counter, when it's banned and an alternative stands in. */
  instead?: Hero;
}

export interface DraftOptions {
  map?: MapContext | null;
  /** Banned this match. Nobody can pick them. */
  banned?: readonly string[];
  /** Heroes your teammates picked. You can't pick them too, and they unlock team-ups. */
  allies?: readonly string[];
  teamUps?: readonly TeamUp[];
}

/**
 * Best picks in your role, plus the in-role counter for each enemy. Banned heroes and heroes your
 * teammates took are left out. The map and team-ups nudge close calls; counters count most.
 */
export function draft(
  data: Dataset,
  idx: HeroIndex,
  role: RoleId,
  enemyIds: readonly string[],
  bracket: BracketId,
  platform: Platform,
  opts: DraftOptions = {},
): { picks: Suggestion[]; matchups: Matchup[] } {
  const banned = new Set(opts.banned ?? []);
  const allyList = (opts.allies ?? []).filter((id) => !!idx[id]);
  const allies = new Set(allyList);
  const teamUps = opts.teamUps ?? [];

  const rows = new Map<string, Suggestion>();
  for (const h of data.heroes) {
    if (h.role !== role || banned.has(h.id) || allies.has(h.id)) continue;
    const tier = tierFor(h, bracket, platform);
    const fit = mapFit(h, opts.map);
    const ups = teamUpsWith(h.id, allyList, teamUps, idx);
    const bonus = Math.min(TEAMUP_MAX, ups.length * TEAMUP_BONUS);
    rows.set(h.id, { hero: h, score: TIER_SCORE[tier] + fit.score + bonus, tier, beats: [], edges: [], map: fit, teamUps: ups });
  }

  const credit = (heroId: string, enemy: Hero, points: number, weak: boolean) => {
    const row = rows.get(heroId);
    if (!row) return;
    row.score += points;
    const list = weak ? row.edges : row.beats;
    if (!list.includes(enemy)) list.push(enemy);
  };

  const matchups: Matchup[] = [];
  for (const id of enemyIds) {
    const enemy = idx[id];
    if (!enemy) continue;
    const rp = enemy.counters[role];
    const w = CONFIDENCE_WEIGHT[rp.confidence] * (rp.weak ? 0.4 : 1);
    credit(rp.hero, enemy, 3 * w, !!rp.weak);
    for (const a of rp.alt ?? []) credit(a, enemy, 2 * w, !!rp.weak);

    const op = enemy.counters.overall;
    if (op.hero !== rp.hero && idx[op.hero]?.role === role) {
      credit(op.hero, enemy, 2 * CONFIDENCE_WEIGHT[op.confidence] * (op.weak ? 0.4 : 1), !!op.weak);
    }

    const alts = (rp.alt ?? []).filter((a) => !!idx[a]);
    let counterId = rp.hero;
    let status: MatchupStatus = 'ok';
    let instead: Hero | undefined;
    if (allies.has(rp.hero)) {
      status = 'ally';
    } else if (banned.has(rp.hero)) {
      const allyAlt = alts.find((a) => allies.has(a));
      const freeAlt = alts.find((a) => !banned.has(a) && !allies.has(a));
      if (allyAlt) {
        counterId = allyAlt;
        status = 'ally';
      } else if (freeAlt) {
        counterId = freeAlt;
        instead = idx[rp.hero];
      } else {
        status = 'banned';
      }
    }
    const counter = idx[counterId];
    if (counter) matchups.push({ enemy, pick: rp, counter, status, instead });
  }

  const picks = [...rows.values()]
    .sort((a, b) => b.score - a.score || tierRank(a.tier) - tierRank(b.tier) || a.hero.name.localeCompare(b.hero.name))
    .slice(0, 3);

  return { picks, matchups };
}

export interface BanSuggestion {
  hero: Hero;
  /** Why this hero beats the one you want to play. */
  pick: CounterPick;
}

/** The strongest available counters to the hero you want to play: ban these to protect your pick. */
export function banSuggestions(
  idx: HeroIndex,
  heroId: string,
  bracket: BracketId,
  platform: Platform,
  unavailable: readonly string[],
  limit = 3,
): BanSuggestion[] {
  const hero = idx[heroId];
  if (!hero) return [];
  const found = new Map<string, BanSuggestion & { score: number }>();
  const consider = (id: string, pick: CounterPick, weight: number) => {
    const c = idx[id];
    if (!c || id === heroId || unavailable.includes(id)) return;
    const s = weight * CONFIDENCE_WEIGHT[pick.confidence] * (pick.weak ? 0.4 : 1) + TIER_SCORE[tierFor(c, bracket, platform)];
    const prev = found.get(id);
    // Listed in more than one slot means a bigger threat.
    if (prev) prev.score = Math.max(prev.score, s) + 0.5;
    else found.set(id, { hero: c, pick, score: s });
  };
  for (const key of ['overall', ...ROLES] as const) {
    const p = hero.counters[key];
    if (!p) continue;
    consider(p.hero, p, key === 'overall' ? 3 : 2.5);
    for (const a of p.alt ?? []) consider(a, p, 1.5);
  }
  return [...found.values()]
    .sort((a, b) => b.score - a.score || a.hero.name.localeCompare(b.hero.name))
    .slice(0, limit)
    .map(({ hero: h, pick }) => ({ hero: h, pick }));
}

// ---- Focus, tips and team makeup ----

export const FOCUS_LABEL: Record<FocusLevel, string> = { high: 'High', medium: 'Medium', low: 'Low' };
const FOCUS_RANK: Record<FocusLevel, number> = { high: 0, medium: 1, low: 2 };

/** General guidance for heroes without a curated focus note. */
const ROLE_FOCUS: Record<RoleId, { level: FocusLevel; why: string }> = {
  strategist: { level: 'high', why: 'Healer. Taking them out first swings the fight.' },
  duelist: { level: 'medium', why: 'Damage dealer.' },
  vanguard: { level: 'low', why: 'Tank. Slow to take down, so pressure the backline first.' },
};

export interface Focus {
  level: FocusLevel;
  why: string;
  /** True when this is general guidance for the role, not a note about this hero. */
  general: boolean;
}

export function focusFor(hero: Hero): Focus {
  const f = hero.focus;
  if (f && (f.level === 'high' || f.level === 'medium' || f.level === 'low') && typeof f.why === 'string' && f.why.trim()) {
    return { level: f.level, why: f.why, general: false };
  }
  return { ...ROLE_FOCUS[hero.role], general: true };
}

/** Enemy heroes in the order to focus them: priority first, then tier. */
export function focusOrder(enemies: readonly Hero[], bracket: BracketId, platform: Platform): (Focus & { hero: Hero })[] {
  return enemies
    .map((hero) => ({ hero, ...focusFor(hero) }))
    .sort(
      (a, b) =>
        FOCUS_RANK[a.level] - FOCUS_RANK[b.level] ||
        tierRank(tierFor(a.hero, bracket, platform)) - tierRank(tierFor(b.hero, bracket, platform)) ||
        a.hero.name.localeCompare(b.hero.name),
    );
}

export interface TipsView {
  against: string[];
  as: string[];
  quirks: Quirk[];
}

/** A hero's tips, cleaned up. Null when there are none. */
export function tipsFor(hero: Hero): TipsView | null {
  const t = hero.tips;
  if (!t || typeof t !== 'object') return null;
  const strings = (x: unknown) => (Array.isArray(x) ? x.filter((s): s is string => typeof s === 'string' && !!s.trim()) : []);
  const quirks = Array.isArray(t.quirks)
    ? t.quirks.filter((q): q is Quirk => !!q && typeof q.text === 'string' && !!q.text.trim() && typeof q.asOf === 'string')
    : [];
  const view = { against: strings(t.against), as: strings(t.as), quirks };
  return view.against.length || view.as.length || view.quirks.length ? view : null;
}

/** "2 Vanguards and 1 Strategist so far. No Duelist yet." for your teammates' picks. */
export function teamNote(allies: readonly Hero[], myRole: RoleId): string | null {
  if (!allies.length) return null;
  const count = (r: RoleId) => allies.filter((h) => h.role === r).length;
  const parts = ROLES.filter((r) => count(r) > 0).map((r) => `${count(r)} ${ROLE_LABEL[r]}${count(r) > 1 ? 's' : ''}`);
  const list = parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}` : parts[0];
  const missing = ROLES.filter((r) => r !== myRole && count(r) === 0);
  const gap = allies.length >= 3 && missing.length ? ` No ${missing.map((r) => ROLE_LABEL[r]).join(' or ')} yet.` : '';
  return `${list} so far.${gap}`;
}

// ---- Glossary ----

export type GlossaryGroupId = 'roles' | 'tiers' | 'counters' | 'bans' | 'styles' | 'maps' | 'match';

export interface GlossaryTerm {
  term: string;
  text: string;
  /** Counter tags render as their colored pill. */
  confidence?: 'data' | 'kit' | 'consensus';
}

export interface GlossaryGroup {
  id: GlossaryGroupId;
  title: string;
  intro?: string;
  terms: GlossaryTerm[];
}

export const GLOSSARY: GlossaryGroup[] = [
  {
    id: 'roles',
    title: 'Roles',
    terms: [
      { term: 'Vanguard', text: 'Tanks. Big health or shields. They take space and protect the team.' },
      { term: 'Duelist', text: 'Damage dealers. They win fights by taking enemies out.' },
      { term: 'Strategist', text: 'Healers and supports. They keep the team alive and boost it.' },
    ],
  },
  {
    id: 'tiers',
    title: 'Tiers and ranks',
    terms: [
      { term: 'Tier (S to F)', text: 'How strong a hero is at your rank right now. S heroes are the strongest picks. F heroes rarely pay off.' },
      {
        term: 'Rank groups',
        text: 'Heroes perform differently as skill goes up, so tiers are listed for Bronze–Gold, Platinum–Diamond, Grandmaster–Celestial, and Eternity to One Above All.',
      },
      { term: 'PC and console', text: 'Tiers match on both unless official data shows a clear gap. Those heroes move one tier on console.' },
      { term: 'New', text: 'Added this season, so there’s less data on them.' },
    ],
  },
  {
    id: 'counters',
    title: 'Counters',
    terms: [
      { term: 'Counter', text: 'A hero who beats another in a fight, or takes away what makes them strong.' },
      { term: 'Data-backed', text: 'Supported by public matchup data.', confidence: 'data' },
      { term: 'Kit-based', text: 'Follows from how the two heroes’ abilities interact. Not yet confirmed by data.', confidence: 'kit' },
      { term: 'Consensus', text: 'What experienced players commonly recommend.', confidence: 'consensus' },
      { term: 'Slight edge', text: 'The best option in that role, but only a small advantage. Lean on other roles if you can.' },
      { term: 'Strong against', text: 'Heroes this hero is a listed counter to.' },
    ],
  },
  {
    id: 'bans',
    title: 'Bans',
    terms: [
      { term: 'Bans', text: 'From Gold III up, each team bans three heroes before picks. A banned hero can’t be picked by either team.' },
      { term: 'Ban risk', text: 'How often a hero gets banned at Gold III and above. A red dot marks heroes that are often banned.' },
      { term: 'Protect your pick', text: 'Choose the hero you want to play, and the draft helper suggests banning their strongest counters.' },
    ],
  },
  {
    id: 'styles',
    title: 'Play styles',
    intro: 'Each hero gets one or two play styles. The draft helper uses them to match heroes to maps.',
    terms: (Object.keys(HERO_STYLE_INFO) as HeroStyle[]).map((s) => ({ term: HERO_STYLE_LABEL[s], text: HERO_STYLE_INFO[s] })),
  },
  {
    id: 'maps',
    title: 'Maps',
    terms: [
      ...MAP_MODES.map((m) => ({ term: MAP_MODE_LABEL[m], text: MAP_MODE_INFO[m] })),
      { term: 'Side', text: 'On Convoy and Convergence maps one team attacks and the other defends. Some heroes suit one side better.' },
      ...(Object.keys(MAP_TRAIT_INFO) as MapTrait[]).map((tr) => ({ term: MAP_TRAIT_LABEL[tr], text: MAP_TRAIT_INFO[tr] })),
      {
        term: 'Good or harder on this map',
        text: 'Shown when a hero’s play style suits the map or works against it. It only reorders close calls. Counters count more.',
      },
    ],
  },
  {
    id: 'match',
    title: 'In a match',
    terms: [
      { term: 'Team-up', text: 'A bonus ability specific heroes unlock when they’re on the same team.' },
      { term: 'Focus priority', text: 'Who to take out first when a hero is on the enemy team: high, medium or low.' },
      {
        term: 'Quirk',
        text: 'Something the in-game ability text gets wrong or doesn’t explain, a known bug, or advice that went out of date. Each shows when it was last checked.',
      },
    ],
  },
];

export function glossaryGroup(id: GlossaryGroupId): GlossaryGroup {
  return GLOSSARY.find((g) => g.id === id) ?? GLOSSARY[0];
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** '2026-09-24' -> 'Sep 24' */
export function formatDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  return `${MONTHS[Number(m[2]) - 1] ?? m[2]} ${Number(m[3])}`;
}

/** Guards against a broken or incompatible remote data file. */
export function isValidDataset(x: unknown): x is Dataset {
  if (!x || typeof x !== 'object') return false;
  const d = x as Dataset;
  if (d.schemaVersion !== 1 || typeof d.revision !== 'number') return false;
  if (!Array.isArray(d.heroes) || d.heroes.length === 0 || !Array.isArray(d.brackets) || !Array.isArray(d.comps)) {
    return false;
  }
  const ids = new Set(d.heroes.map((h) => h?.id));
  const bracketIds = d.brackets.map((b) => b?.id);
  for (const h of d.heroes) {
    if (!h || typeof h.name !== 'string' || !ROLES.includes(h.role) || !h.tiers || !h.counters) return false;
    if (bracketIds.some((b) => !TIERS.includes(h.tiers[b]))) return false;
    for (const key of ['overall', ...ROLES] as const) {
      const p = h.counters[key];
      if (!p || !ids.has(p.hero) || typeof p.reason !== 'string') return false;
    }
  }
  return true;
}
