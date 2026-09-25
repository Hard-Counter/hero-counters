// Pure logic shared by the app and the web preview. No React Native imports here.
import type {
  BanRisk,
  BracketId,
  CounterPick,
  Dataset,
  GameMap,
  Hero,
  HeroStyle,
  MapMode,
  MapSide,
  MapTrait,
  Platform,
  RoleId,
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
}

export interface Matchup {
  enemy: Hero;
  pick: CounterPick;
  counter: Hero;
}

/**
 * Best picks in your role against an enemy team, plus the in-role counter for each enemy.
 * An optional map and side nudge close calls toward heroes whose play style suits the layout.
 */
export function draft(
  data: Dataset,
  idx: HeroIndex,
  role: RoleId,
  enemyIds: string[],
  bracket: BracketId,
  platform: Platform,
  mapCtx?: MapContext | null,
): { picks: Suggestion[]; matchups: Matchup[] } {
  const rows = new Map<string, Suggestion>();
  for (const h of data.heroes) {
    if (h.role !== role) continue;
    const tier = tierFor(h, bracket, platform);
    const fit = mapFit(h, mapCtx);
    rows.set(h.id, { hero: h, score: TIER_SCORE[tier] + fit.score, tier, beats: [], edges: [], map: fit });
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

    const counter = idx[rp.hero];
    if (counter) matchups.push({ enemy, pick: rp, counter });
  }

  const picks = [...rows.values()]
    .sort((a, b) => b.score - a.score || tierRank(a.tier) - tierRank(b.tier) || a.hero.name.localeCompare(b.hero.name))
    .slice(0, 3);

  return { picks, matchups };
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
