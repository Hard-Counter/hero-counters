// Pure logic shared by the app and the web preview. No React Native imports here.
import type {
  Ability,
  AbilityKind,
  BanRisk,
  BracketId,
  ChangeKind,
  CounterPick,
  Dataset,
  Difficulty,
  FocusLevel,
  GameMap,
  Hero,
  HeroStyle,
  HistoryChange,
  HistoryData,
  MapMode,
  MapSide,
  MapTrait,
  PadKey,
  PadStyle,
  PcKey,
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

const text = (x: unknown) => (typeof x === 'string' && x.trim() ? x : undefined);

/** Team-ups from the data file whose heroes this version of the app knows. */
export function usableTeamUps(data: Dataset, idx: HeroIndex): TeamUp[] {
  if (!Array.isArray(data.teamUps)) return [];
  return data.teamUps
    .filter(
      (t) =>
        !!t &&
        Array.isArray(t.heroes) &&
        t.heroes.length >= 2 &&
        t.heroes.every((id) => typeof id === 'string' && !!idx[id]),
    )
    .map((t) => ({ name: text(t.name) ?? '', heroes: t.heroes, effect: text(t.effect), bonus: text(t.bonus) }));
}

export interface TeamUpMatch {
  name: string;
  /** The teammates this hero would team up with. */
  partners: Hero[];
}

/** Team-ups a hero would power up with the heroes already on your team, whichever of them uses it. */
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

export interface HeroTeamUp {
  name: string;
  /** The hero who uses the ability. */
  user: Hero;
  /** The hero whose presence makes it stronger. */
  partner: Hero;
  effect?: string;
  bonus?: string;
}

/**
 * A hero's own team-up abilities, and other heroes' team-ups this hero powers up as the partner.
 * Older data files without effect texts still list the pairs.
 */
export function heroTeamUps(heroId: string, teamUps: readonly TeamUp[], idx: HeroIndex): { own: HeroTeamUp[]; boosts: HeroTeamUp[] } {
  const own: HeroTeamUp[] = [];
  const boosts: HeroTeamUp[] = [];
  // Deadpool's role versions share their team-ups, so list each one once.
  const seen = new Set<string>();
  for (const t of teamUps) {
    if (t.heroes.length !== 2 || !t.heroes.includes(heroId)) continue;
    const [user, partner] = t.heroes.map((id) => idx[id]);
    if (!user || !partner) continue;
    const key = `${t.name}|${user.name}|${partner.name}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const view = { name: t.name, user, partner, effect: t.effect, bonus: t.bonus };
    (user.id === heroId ? own : boosts).push(view);
  }
  return { own, boosts };
}

/** "Metallic Chaos with Magneto", or "Team-up with Magneto" when the name isn't known. */
export function teamUpLabel(m: TeamUpMatch): string {
  const who = m.partners.map((h) => h.name).join(' and ');
  return m.name ? `${m.name} with ${who}` : `Team-up with ${who}`;
}

// ---- Draft ----

// Since Season 9 team-up abilities work alone and a partner only makes them stronger,
// so completing one is a small tie-breaker.
const TEAMUP_BONUS = 0.15;
const TEAMUP_MAX = 0.3;
// A hero you're comfortable on is worth about a tier and a half, and one you've marked
// Not for me loses as much. A listed counter is worth several tiers, so it still wins.
const COMFORT_BONUS = 0.75;
const NOT_FOR_ME_PENALTY = COMFORT_BONUS;
// Flex: filling a role nobody on your team plays yet, or stacking a fourth of one role.
const ROLE_GAP_BONUS = 0.75;
const ROLE_STACK_PENALTY = 0.5;
// A duo swap has to beat your best solo pick by a clear margin (three tier steps, or half a listed counter).
const DUO_MIN_GAIN = 1.5;

/** Your role in the draft helper. Flex looks at every role and lets the team go off 2-2-2. */
export type DraftRole = RoleId | 'flex';
export const DRAFT_ROLES: DraftRole[] = ['vanguard', 'duelist', 'strategist', 'flex'];
export const DRAFT_ROLE_LABEL: Record<DraftRole, string> = { ...ROLE_LABEL, flex: 'Flex' };
/** How many heroes you can star as yours. */
export const MAX_MY_HEROES = 12;

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
  /** One of the heroes you starred as yours. */
  comfort: boolean;
  /** One of the heroes you marked Not for me. It still shows when it's a strong enough pick. */
  notMine: boolean;
  /** Flex: the pick fills a role your team doesn't have yet. */
  fillsRole?: RoleId;
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
  /** Heroes you starred as yours. They get a boost. */
  mine?: readonly string[];
  /** Heroes you marked Not for me. They rank lower. */
  notMine?: readonly string[];
}

interface Scored {
  rows: Map<string, Suggestion>;
  /** Counter points each hero earns against each enemy, for judging pairs. */
  credits: Map<string, Map<string, number>>;
}

const pickWeight = (p: CounterPick) => CONFIDENCE_WEIGHT[p.confidence] * (p.weak ? 0.4 : 1);

/**
 * Scores every available hero in every role: tier, map, team-ups and comfort, plus points for each
 * enemy it's listed against (in its own role, and as the best counter overall).
 */
function scoreHeroes(
  data: Dataset,
  idx: HeroIndex,
  enemyIds: readonly string[],
  bracket: BracketId,
  platform: Platform,
  opts: DraftOptions,
  flex: boolean,
): Scored {
  const banned = new Set(opts.banned ?? []);
  const allyList = (opts.allies ?? []).filter((id) => !!idx[id]);
  const allies = new Set(allyList);
  const mine = new Set(opts.mine ?? []);
  const notMine = new Set((opts.notMine ?? []).filter((id) => !mine.has(id)));
  const teamUps = opts.teamUps ?? [];

  const rows = new Map<string, Suggestion>();
  const credits = new Map<string, Map<string, number>>();
  for (const h of data.heroes) {
    if (banned.has(h.id) || allies.has(h.id)) continue;
    const tier = tierFor(h, bracket, platform);
    const fit = mapFit(h, opts.map);
    const ups = teamUpsWith(h.id, allyList, teamUps, idx);
    const bonus = Math.min(TEAMUP_MAX, ups.length * TEAMUP_BONUS);
    const comfort = mine.has(h.id);
    const avoid = notMine.has(h.id);
    rows.set(h.id, {
      hero: h,
      score: TIER_SCORE[tier] + fit.score + bonus + (comfort ? COMFORT_BONUS : 0) - (avoid ? NOT_FOR_ME_PENALTY : 0),
      tier,
      beats: [],
      edges: [],
      map: fit,
      teamUps: ups,
      comfort,
      notMine: avoid,
    });
    credits.set(h.id, new Map());
  }

  const credit = (heroId: string, enemy: Hero, points: number, weak: boolean) => {
    const row = rows.get(heroId);
    if (!row) return;
    row.score += points;
    const per = credits.get(heroId)!;
    per.set(enemy.id, (per.get(enemy.id) ?? 0) + points);
    const list = weak ? row.edges : row.beats;
    if (!list.includes(enemy)) list.push(enemy);
  };

  for (const id of enemyIds) {
    const enemy = idx[id];
    if (!enemy) continue;
    for (const r of ROLES) {
      const rp = enemy.counters[r];
      if (!rp) continue;
      const w = pickWeight(rp);
      credit(rp.hero, enemy, 3 * w, !!rp.weak);
      for (const a of rp.alt ?? []) credit(a, enemy, 2 * w, !!rp.weak);
    }
    const op = enemy.counters.overall;
    const opRole = idx[op.hero]?.role;
    if (opRole && op.hero !== enemy.counters[opRole]?.hero) credit(op.hero, enemy, 2 * pickWeight(op), !!op.weak);
    // With every role open, the best counter overall should stand out from the best in each role.
    if (flex) credit(op.hero, enemy, pickWeight(op), !!op.weak);
  }
  return { rows, credits };
}

/** Flex nudges: a role nobody on your team plays yet, or a fourth hero in one role. */
function roleNudges(allies: readonly Hero[]): { bonus: Record<RoleId, number>; gaps: RoleId[] } {
  const bonus: Record<RoleId, number> = { vanguard: 0, duelist: 0, strategist: 0 };
  const gaps: RoleId[] = [];
  for (const r of ROLES) {
    const n = allies.filter((h) => h.role === r).length;
    if (allies.length >= 3 && n === 0) {
      bonus[r] += ROLE_GAP_BONUS;
      gaps.push(r);
    }
    if (n >= 3) bonus[r] -= ROLE_STACK_PENALTY;
  }
  return { bonus, gaps };
}

const byScore = (a: Suggestion, b: Suggestion) =>
  b.score - a.score || tierRank(a.tier) - tierRank(b.tier) || a.hero.name.localeCompare(b.hero.name);

/**
 * Best picks in your role, or in any role for Flex, plus the counter for each enemy. Banned heroes
 * and heroes your teammates took are left out. The map, team-ups and your own heroes nudge close
 * calls; counters count most.
 */
export function draft(
  data: Dataset,
  idx: HeroIndex,
  role: DraftRole,
  enemyIds: readonly string[],
  bracket: BracketId,
  platform: Platform,
  opts: DraftOptions = {},
): { picks: Suggestion[]; matchups: Matchup[] } {
  const flex = role === 'flex';
  const banned = new Set(opts.banned ?? []);
  const allies = new Set((opts.allies ?? []).filter((id) => !!idx[id]));
  const { rows } = scoreHeroes(data, idx, enemyIds, bracket, platform, opts, flex);

  if (flex) {
    const { bonus, gaps } = roleNudges([...allies].map((id) => idx[id]));
    for (const row of rows.values()) {
      row.score += bonus[row.hero.role];
      if (gaps.includes(row.hero.role)) row.fillsRole = row.hero.role;
    }
  }

  const matchups: Matchup[] = [];
  for (const id of enemyIds) {
    const enemy = idx[id];
    if (!enemy) continue;
    const rp = flex ? enemy.counters.overall : enemy.counters[role];
    if (!rp) continue;
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

  const picks = [...rows.values()].filter((r) => flex || r.hero.role === role).sort(byScore).slice(0, 3);
  return { picks, matchups };
}

export interface DuoSwap {
  /** Your duo's hero now. */
  from: Hero;
  /** What your duo switches to. */
  duo: Suggestion;
  /** What you pick. */
  you: Suggestion;
  /** Enemies the two of you would counter between you. */
  covers: Hero[];
}

/**
 * When a teammate you trust will switch too, the best pair of picks for the two of you, if it beats
 * your best solo pick next to their current hero by a clear margin. Outside Flex, the two of you keep
 * the team's roles: either both stay in role, or you trade roles.
 */
export function duoSwap(
  data: Dataset,
  idx: HeroIndex,
  role: DraftRole,
  duoId: string | null | undefined,
  enemyIds: readonly string[],
  bracket: BracketId,
  platform: Platform,
  opts: DraftOptions = {},
): DuoSwap | null {
  const allyIds = (opts.allies ?? []).filter((id) => !!idx[id]);
  const from = duoId ? idx[duoId] : undefined;
  if (!from || !allyIds.includes(from.id) || !enemyIds.some((id) => !!idx[id])) return null;
  const flex = role === 'flex';
  const others = allyIds.filter((id) => id !== from.id);
  const { rows, credits } = scoreHeroes(data, idx, enemyIds, bracket, platform, { ...opts, allies: others }, flex);
  const nudges = flex ? roleNudges(others.map((id) => idx[id])) : null;

  // A pair's value: each hero's own worth, plus the better of the two against each enemy,
  // so two heroes countering the same enemy don't count twice.
  const own = (row: Suggestion, forDuo: boolean) => {
    let v = row.score;
    for (const pts of credits.get(row.hero.id)?.values() ?? []) v -= pts;
    // Your starred and Not for me heroes are yours, not your duo's.
    if (forDuo && row.comfort) v -= COMFORT_BONUS;
    if (forDuo && row.notMine) v += NOT_FOR_ME_PENALTY;
    return v;
  };
  const pairValue = (a: Suggestion, b: Suggestion) => {
    let v = own(a, false) + own(b, true);
    const ca = credits.get(a.hero.id) ?? new Map<string, number>();
    const cb = credits.get(b.hero.id) ?? new Map<string, number>();
    for (const id of new Set([...ca.keys(), ...cb.keys()])) v += Math.max(ca.get(id) ?? 0, cb.get(id) ?? 0);
    if (teamUpsWith(a.hero.id, [b.hero.id], opts.teamUps ?? [], idx).length) v += TEAMUP_BONUS;
    if (nudges) {
      // Flex: judge the two picks' roles together against the rest of the team.
      const roles = [a.hero.role, b.hero.role];
      for (const r of ROLES) {
        const n = others.filter((id) => idx[id]?.role === r).length + roles.filter((x) => x === r).length;
        if (others.length + 2 >= 5 && n === 0) v -= ROLE_GAP_BONUS;
        if (n >= 4) v -= ROLE_STACK_PENALTY;
      }
    }
    return v;
  };

  const all = [...rows.values()];
  const top = (pred: (r: Suggestion) => boolean, n = 8) => all.filter(pred).sort(byScore).slice(0, n);
  const current = rows.get(from.id);
  if (!current) return null;

  // Staying put: your best pick in your role next to your duo's current hero.
  const mineNow = top((r) => r.hero.id !== from.id && (flex || r.hero.role === role));
  let base = -Infinity;
  for (const a of mineNow) base = Math.max(base, pairValue(a, current));

  // Pairs that keep the team's roles (or any roles, for Flex).
  const roleSets: [((r: Suggestion) => boolean), ((r: Suggestion) => boolean)][] = flex
    ? [[() => true, () => true]]
    : [
        [(r) => r.hero.role === role, (r) => r.hero.role === from.role],
        [(r) => r.hero.role === from.role, (r) => r.hero.role === role],
      ];
  let best: { you: Suggestion; duo: Suggestion; value: number } | null = null;
  for (const [youOk, duoOk] of roleSets) {
    const youList = top(youOk, flex ? 12 : 8);
    const duoList = top(duoOk, flex ? 12 : 8);
    for (const a of youList) {
      for (const b of duoList) {
        if (a.hero.id === b.hero.id || b.hero.id === from.id) continue;
        const value = pairValue(a, b);
        if (!best || value > best.value) best = { you: a, duo: b, value };
      }
    }
  }
  if (!best || best.value - base < DUO_MIN_GAIN) return null;

  const covers: Hero[] = [];
  for (const id of enemyIds) {
    const e = idx[id];
    if (e && (best.you.beats.includes(e) || best.duo.beats.includes(e))) covers.push(e);
  }
  return { from, duo: best.duo, you: best.you, covers };
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

// ---- When to pick: difficulty and "Shines when" ----

/** The game rates difficulty from one star to five. */
export const MAX_DIFFICULTY = 5;

export interface WhenToPick {
  /** The game's own difficulty rating in stars, or our estimate when `difficultyNote` is set. */
  difficulty: Difficulty | null;
  /** Says the rating is our estimate, and why. Null for the game's own rating. */
  difficultyNote: string | null;
  /** One sentence starting "Shines". */
  shines: string | null;
}

/** The difficulty rating and when the hero shines. Null when the data has neither. */
export function whenToPick(hero: Hero): WhenToPick | null {
  const d = hero.difficulty;
  const difficulty = Number.isInteger(d) && (d as number) >= 1 && (d as number) <= MAX_DIFFICULTY ? (d as Difficulty) : null;
  const note = typeof hero.difficultyNote === 'string' ? hero.difficultyNote.trim() : '';
  const difficultyNote = difficulty && note ? note : null;
  const shines = typeof hero.shines === 'string' && hero.shines.trim() ? hero.shines.trim() : null;
  return difficulty || shines ? { difficulty, difficultyNote, shines } : null;
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
export function teamNote(allies: readonly Hero[], myRole: RoleId | null): string | null {
  if (!allies.length) return null;
  const count = (r: RoleId) => allies.filter((h) => h.role === r).length;
  const parts = ROLES.filter((r) => count(r) > 0).map((r) => `${count(r)} ${ROLE_LABEL[r]}${count(r) > 1 ? 's' : ''}`);
  const list = parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}` : parts[0];
  const missing = ROLES.filter((r) => r !== myRole && count(r) === 0);
  const gap = allies.length >= 3 && missing.length ? ` No ${missing.map((r) => ROLE_LABEL[r]).join(' or ')} yet.` : '';
  return `${list} so far.${gap}`;
}

// ---- Abilities ----

export const ABILITY_KINDS: AbilityKind[] = ['attack', 'ability', 'ultimate', 'passive'];
export const ABILITY_KIND_LABEL: Record<AbilityKind, string> = {
  attack: 'Attacks',
  ability: 'Abilities',
  ultimate: 'Ultimate',
  passive: 'Passives',
};

export const PC_KEYS: PcKey[] = ['lmb', 'rmb', 'shift', 'e', 'f', 'q', 'c', 'v', 'space'];
export const PC_KEY_LABEL: Record<PcKey, string> = {
  lmb: 'LMB',
  rmb: 'RMB',
  shift: 'Shift',
  e: 'E',
  f: 'F',
  q: 'Q',
  c: 'C',
  v: 'V',
  space: 'Space',
};
/** What a screen reader says for each key. */
export const PC_KEY_NAME: Record<PcKey, string> = {
  lmb: 'left mouse button',
  rmb: 'right mouse button',
  shift: 'Shift',
  e: 'E',
  f: 'F',
  q: 'Q',
  c: 'C',
  v: 'V',
  space: 'Space',
};

export const PAD_KEYS: PadKey[] = ['rt', 'lt', 'rb', 'lb', 'a', 'b', 'x', 'y', 'ls', 'rs', 'ls+rs'];
export const PAD_STYLES: PadStyle[] = ['xbox', 'playstation'];
export const PAD_STYLE_LABEL: Record<PadStyle, string> = { xbox: 'Xbox', playstation: 'PlayStation' };
export const PAD_LABEL: Record<PadStyle, Record<PadKey, string>> = {
  xbox: { rt: 'RT', lt: 'LT', rb: 'RB', lb: 'LB', a: 'A', b: 'B', x: 'X', y: 'Y', ls: 'LS', rs: 'RS', 'ls+rs': 'LS+RS' },
  playstation: { rt: 'R2', lt: 'L2', rb: 'R1', lb: 'L1', a: '✕', b: '○', x: '□', y: '△', ls: 'L3', rs: 'R3', 'ls+rs': 'L3+R3' },
};
/** What a screen reader says for each button. */
export const PAD_NAME: Record<PadStyle, Record<PadKey, string>> = {
  xbox: {
    rt: 'right trigger',
    lt: 'left trigger',
    rb: 'right bumper',
    lb: 'left bumper',
    a: 'A',
    b: 'B',
    x: 'X',
    y: 'Y',
    ls: 'left stick click',
    rs: 'right stick click',
    'ls+rs': 'both stick clicks',
  },
  playstation: {
    rt: 'R2',
    lt: 'L2',
    rb: 'R1',
    lb: 'L1',
    a: 'Cross',
    b: 'Circle',
    x: 'Square',
    y: 'Triangle',
    ls: 'L3',
    rs: 'R3',
    'ls+rs': 'L3 and R3',
  },
};

export type AbilityInput = { kind: 'pc'; key: PcKey } | { kind: 'pad'; key: PadKey };

/** The ability's default key or controller button on a platform, when the data has one. */
export function abilityInput(a: Ability, platform: Platform): AbilityInput | null {
  if (platform === 'pc') {
    const k = a.keys?.pc;
    return k && PC_KEYS.includes(k) ? { kind: 'pc', key: k } : null;
  }
  const k = a.keys?.console;
  return k && PAD_KEYS.includes(k) ? { kind: 'pad', key: k } : null;
}

/** True when the data has this hero's controller layout. */
export function hasPadLayout(hero: Hero): boolean {
  return !!hero.kit?.abilities?.some((a) => !!a?.keys?.console && PAD_KEYS.includes(a.keys.console));
}

export interface KitView {
  checked: string;
  groups: { kind: AbilityKind; label: string; abilities: Ability[] }[];
}

/** A hero's abilities grouped by kind, cleaned up. Null when the data has none. */
export function kitFor(hero: Hero): KitView | null {
  const k = hero.kit;
  if (!k || typeof k !== 'object' || !Array.isArray(k.abilities)) return null;
  const valid = k.abilities.filter(
    (a): a is Ability =>
      !!a && typeof a.name === 'string' && !!a.name.trim() && typeof a.text === 'string' && ABILITY_KINDS.includes(a.kind),
  );
  if (!valid.length) return null;
  const groups = ABILITY_KINDS.map((kind) => ({
    kind,
    label: ABILITY_KIND_LABEL[kind],
    abilities: valid.filter((a) => a.kind === kind),
  })).filter((g) => g.abilities.length > 0);
  return { checked: typeof k.checked === 'string' ? k.checked : '', groups };
}

/** The tabs on a hero page. */
export type HeroTab = 'against' | 'as' | 'abilities' | 'history';
export const HERO_TABS: HeroTab[] = ['against', 'as', 'abilities', 'history'];
export const HERO_TAB_LABEL: Record<HeroTab, string> = { against: 'Against', as: 'Play as', abilities: 'Abilities', history: 'History' };

// ---- Patch history ----

export const CHANGE_KINDS: ChangeKind[] = ['b', 'n', 'm', 'c', 'f'];
export const CHANGE_LABEL: Record<ChangeKind, string> = { b: 'Buff', n: 'Nerf', m: 'Mixed', c: 'Change', f: 'Fix' };

/** How a hero's strength moved this season, for the tier list markers. */
export type SeasonShift = 'buffed' | 'nerfed' | 'mixed';
export const SEASON_SHIFT_LABEL: Record<SeasonShift, string> = {
  buffed: 'Buffed this season',
  nerfed: 'Nerfed this season',
  mixed: 'Buffed and nerfed this season',
};

export interface HistoryEntry {
  date: string;
  season: string;
  kind: ChangeKind;
  ability: string;
  text: string;
}

export interface SeasonTally {
  season: string;
  start: string;
  counts: Record<ChangeKind, number>;
}

export interface HistoryView {
  /** When the hero joined, if they weren't in the launch roster. */
  added?: string;
  /** Newest first. */
  entries: HistoryEntry[];
  /** Oldest first, from launch or the hero's arrival to the current season. */
  seasons: SeasonTally[];
  totals: Record<ChangeKind, number>;
  current: string;
}

// Balance posts come out a few days before a season starts, so a change dated up to six days
// early counts toward the new season.
const EARLY_DAYS = 6;

function daysBefore(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

function historyOf(data: Dataset): HistoryData | null {
  const h = data.history;
  if (!h || typeof h !== 'object' || !Array.isArray(h.changes) || !Array.isArray(h.seasons)) return null;
  const seasons = h.seasons.filter((s) => Array.isArray(s) && typeof s[0] === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s[1]));
  if (!seasons.length) return null;
  return { seasons, added: h.added && typeof h.added === 'object' ? h.added : {}, changes: h.changes };
}

/** The season a change dated `date` belongs to. */
export function seasonOf(date: string, seasons: readonly [string, string][]): string {
  let id = seasons[0]?.[0] ?? '0';
  for (const [s, start] of seasons) {
    if (date >= daysBefore(start, EARLY_DAYS)) id = s;
    else break;
  }
  return id;
}

/** The season running on `date`, by its actual start. */
export function seasonOn(date: string, seasons: readonly [string, string][]): string {
  let id = seasons[0]?.[0] ?? '0';
  for (const [s, start] of seasons) {
    if (date >= start) id = s;
    else break;
  }
  return id;
}

export function seasonLabel(id: string): string {
  return `Season ${id}`;
}

const zeroCounts = (): Record<ChangeKind, number> => ({ b: 0, n: 0, m: 0, c: 0, f: 0 });

function validChange(c: unknown): c is HistoryChange {
  if (!Array.isArray(c) || c.length < 5) return false;
  const [date, ids, kind, ability, text] = c;
  return (
    typeof date === 'string' &&
    Array.isArray(ids) &&
    CHANGE_KINDS.includes(kind) &&
    typeof ability === 'string' &&
    typeof text === 'string'
  );
}

/** Ids a change can name this hero by: its own, and 'deadpool' for any Deadpool version. */
function historyKeys(heroId: string): string[] {
  return heroId.startsWith('deadpool-') ? [heroId, 'deadpool'] : [heroId];
}

/** Every change to a hero since launch, with per-season counts. Null when the data has no history. */
export function historyFor(data: Dataset, heroId: string): HistoryView | null {
  const h = historyOf(data);
  if (!h) return null;
  const keys = historyKeys(heroId);
  const current = seasonOn(data.updated, h.seasons);
  const entries: HistoryEntry[] = [];
  for (const c of h.changes) {
    if (!validChange(c) || !c[1].some((id) => keys.includes(id))) continue;
    entries.push({ date: c[0], season: seasonOf(c[0], h.seasons), kind: c[2], ability: c[3], text: c[4] });
  }
  entries.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  const added = typeof h.added[heroId] === 'string' ? h.added[heroId] : undefined;
  const first = added ? seasonOn(added, h.seasons) : h.seasons[0][0];
  const from = h.seasons.findIndex(([id]) => id === first);
  const to = h.seasons.findIndex(([id]) => id === current);
  const totals = zeroCounts();
  const seasons: SeasonTally[] = h.seasons.slice(Math.max(0, from), to + 1).map(([season, start]) => ({ season, start, counts: zeroCounts() }));
  for (const e of entries) {
    totals[e.kind] += 1;
    const tally = seasons.find((s) => s.season === e.season);
    if (tally) tally.counts[e.kind] += 1;
  }
  return { added, entries, seasons, totals, current };
}

/** Heroes whose strength changed in the current season, for the tier list. */
export function seasonShifts(data: Dataset): Map<string, SeasonShift> {
  const out = new Map<string, SeasonShift>();
  const h = historyOf(data);
  if (!h) return out;
  const current = seasonOn(data.updated, h.seasons);
  const seen = new Map<string, Set<ChangeKind>>();
  for (const c of h.changes) {
    // Team-up changes name every hero in the team-up, so they'd mark partners the change didn't touch.
    if (!validChange(c) || c[1].length !== 1 || !['b', 'n', 'm'].includes(c[2]) || seasonOf(c[0], h.seasons) !== current) continue;
    for (const id of c[1]) {
      const targets = id === 'deadpool' ? data.heroes.filter((x) => x.id.startsWith('deadpool-')).map((x) => x.id) : [id];
      for (const t of targets) {
        if (!seen.has(t)) seen.set(t, new Set());
        seen.get(t)!.add(c[2]);
      }
    }
  }
  for (const [id, kinds] of seen) {
    out.set(id, kinds.has('m') || (kinds.has('b') && kinds.has('n')) ? 'mixed' : kinds.has('b') ? 'buffed' : 'nerfed');
  }
  return out;
}

// ---- Glossary ----

export type GlossaryGroupId = 'roles' | 'tiers' | 'counters' | 'bans' | 'styles' | 'maps' | 'match' | 'abilities' | 'history';

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
      {
        term: 'Buffed or nerfed',
        text: 'An up arrow marks a hero made stronger this season, a down arrow one made weaker, and a double arrow a mix of both. Each hero’s History tab lists every change.',
      },
      {
        term: 'Difficulty',
        text: 'The game’s own rating, from one star to five. More stars means a hero takes more practice to play well. Where the game’s rating doesn’t help, the hero page shows our estimate and says so.',
      },
      {
        term: 'Shines when',
        text: 'The maps, teams and enemy picks where a hero beats their tier. A low tier doesn’t mean a hero is never a good pick.',
      },
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
      {
        term: 'Team-up',
        text: 'Each hero picks one of two team-up abilities. It works on its own and gets stronger when its partner hero is on your team.',
      },
      { term: 'Focus priority', text: 'Who to take out first when a hero is on the enemy team: high, medium or low.' },
      {
        term: 'Flex',
        text: 'Shows the best picks from every role, for when you’ll play anything or your team isn’t going two of each. Picks that fill a role your team is missing get a nudge.',
      },
      {
        term: 'My heroes',
        text: `Up to ${MAX_MY_HEROES} heroes you star as ones you play well. The draft helper ranks them about a tier and a half higher. Counters still count more.`,
      },
      {
        term: 'Not for me',
        text: 'Heroes you mark as ones you don’t play well. The draft helper ranks them about a tier and a half lower, but a strong counter can still make your picks, marked so you know.',
      },
      {
        term: 'Duo swap',
        text: 'Mark a teammate who’ll switch heroes with you. If a new pair of picks would counter the enemy team clearly better, the draft helper suggests it. Outside Flex, you both keep your roles or trade them.',
      },
      {
        term: 'Quirk',
        text: 'Something the in-game ability text gets wrong or doesn’t explain, a known bug, or advice that went out of date. Each shows when it was last checked.',
      },
    ],
  },
  {
    id: 'abilities',
    title: 'Ability terms',
    intro: 'Words the ability breakdowns use.',
    terms: [
      { term: 'Attack', text: 'A hero’s main weapon or melee. Some heroes swap between two.' },
      { term: 'Ultimate', text: 'A powerful ability that charges over the fight. Every hero has one.' },
      { term: 'Passive', text: 'Always on, or triggers by itself.' },
      { term: 'Bonus health', text: 'Extra health on top of the usual maximum. It’s lost first and usually drains away after a few seconds.' },
      { term: 'Crowd control', text: 'Effects that limit what an enemy can do, like stuns, slows and launches.' },
      { term: 'Stun', text: 'Can’t move, attack or use abilities for a moment.' },
      { term: 'Immobilize or root', text: 'Held in place, but can still attack.' },
      { term: 'Slow', text: 'Moves more slowly for a while.' },
      { term: 'Launch', text: 'Thrown up into the air.' },
      { term: 'Knock back', text: 'Pushed away.' },
      { term: 'Knock down', text: 'Brought to the ground. Flying heroes drop out of the air.' },
      { term: 'Grounded', text: 'Can’t fly or use movement that leaves the ground for a moment.' },
      { term: 'Taunt', text: 'Forced to turn toward and attack the hero who taunted them.' },
      { term: 'Charm', text: 'Walks toward the caster and can’t fight back for a moment.' },
      { term: 'Blind', text: 'Most of the screen goes dark.' },
      { term: 'Vulnerability', text: 'Takes extra damage from everything.' },
      { term: 'Healing reduction', text: 'Gets less healing.' },
      { term: 'Unstoppable', text: 'Can’t be crowd-controlled.' },
      { term: 'Invulnerable', text: 'Can’t be damaged.' },
      { term: 'Team-up ability', text: 'Each hero picks one of two before the match. It works alone and gets stronger with its partner on your team.' },
    ],
  },
  {
    id: 'history',
    title: 'Patch history',
    intro: 'Every change to a hero since launch, from the official balance posts and patch notes, in our own words.',
    terms: [
      { term: 'Buff', text: 'Made the hero stronger.' },
      { term: 'Nerf', text: 'Made the hero weaker.' },
      { term: 'Mixed', text: 'Stronger in one way and weaker in another.' },
      { term: 'Change', text: 'Works differently without clearly getting stronger or weaker, or a team-up change.' },
      { term: 'Fix', text: 'A bug fix. Hidden unless you turn on Show fixes.' },
      {
        term: 'Seasons',
        text: 'Each season and half season usually starts with a balance patch. Balance posts come out a few days early, so their changes count toward the new season.',
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

/** '2025-09-24' -> 'Sep 24, 2025' */
export function formatLongDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  return `${MONTHS[Number(m[2]) - 1] ?? m[2]} ${Number(m[3])}, ${m[1]}`;
}

/** '2025-09-24' -> 'Sep 2025' */
export function formatMonth(iso: string): string {
  const m = /^(\d{4})-(\d{2})/.exec(iso);
  if (!m) return iso;
  return `${MONTHS[Number(m[2]) - 1] ?? m[2]} ${m[1]}`;
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
