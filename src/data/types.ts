export type RoleId = 'vanguard' | 'duelist' | 'strategist';
export type Tier = 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
export type BracketId = 'bronze_gold' | 'plat_diamond' | 'gm_celestial' | 'eternity_oaa';
export type Platform = 'pc' | 'console';
export type Confidence = 'data' | 'kit' | 'consensus';
export type BanRisk = 'high' | 'medium' | 'low';

export type MapMode = 'domination' | 'convoy' | 'convergence';
/** Layout traits that change which heroes do well on a map. */
export type MapTrait = 'long-sightlines' | 'close-quarters' | 'high-ground' | 'chokepoints' | 'flank-routes';
/** How a hero plays, for matching heroes to map layouts. */
export type HeroStyle = 'long-range' | 'brawl' | 'dive' | 'flyer' | 'area';
/** Which side you're on. Only Convoy and Convergence have sides. */
export type MapSide = 'either' | 'attack' | 'defense';

export interface GameMap {
  id: string;
  name: string;
  /** Where the map is set, such as "Tokyo 2099". */
  world: string;
  mode: MapMode;
  traits: MapTrait[];
  /** One line on how the map plays. */
  note: string;
}

export interface CounterPick {
  hero: string;
  confidence: Confidence;
  reason: string;
  note?: string;
  alt?: string[];
  /** Best available in its role, but only a slight edge. */
  weak?: boolean;
}

export interface Hero {
  id: string;
  name: string;
  role: RoleId;
  /** Two-letter initials for the avatar. */
  abbr: string;
  /** PC tiers. Console tiers are derived with consoleShift. */
  tiers: Record<BracketId, Tier>;
  /** +1 = one tier better on console, -1 = one tier worse. */
  consoleShift?: number;
  platformNote?: string;
  patchNote?: string;
  banRisk: BanRisk;
  isNew?: boolean;
  /** One of several role versions of the same hero (Deadpool). */
  variant?: boolean;
  /** Play styles for map matching. Missing or empty means no map nudge either way. */
  styles?: HeroStyle[];
  counters: {
    overall: CounterPick;
    vanguard: CounterPick;
    duelist: CounterPick;
    strategist: CounterPick;
  };
}

export interface CompSlot {
  role: RoleId;
  /** Hero ids that fit the slot. Empty means any hero of that role. */
  options: string[];
}

export interface TeamUp {
  name: string;
  heroes: string[];
  note?: string;
}

export interface Comp {
  id: string;
  name: string;
  style: string;
  split: string;
  summary: string;
  slots: CompSlot[];
  teamUps: TeamUp[];
  bestBrackets: BracketId[];
  evidence: string;
  counter: { name: string; heroes: string[]; why: string };
}

export interface Bracket {
  id: BracketId;
  label: string;
  short: string;
}

export interface Dataset {
  schemaVersion: 1;
  revision: number;
  season: string;
  seasonShort: string;
  patch: string;
  updated: string;
  nextReview: string;
  brackets: Bracket[];
  methodology: string[];
  seasonNotes: string[];
  changelog: string[];
  heroes: Hero[];
  comps: Comp[];
  /** Ranked map pool. Optional so older data files still load. */
  maps?: GameMap[];
}
