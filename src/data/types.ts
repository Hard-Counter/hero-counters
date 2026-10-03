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

export type FocusLevel = 'high' | 'medium' | 'low';

export interface Quirk {
  text: string;
  /** Date it was last checked against the patch notes, 'YYYY-MM-DD'. */
  asOf: string;
}

export interface HeroTips {
  /** Playing against this hero. */
  against: string[];
  /** Playing as this hero. */
  as: string[];
  /** Mechanics the in-game text doesn't explain, known bugs, outdated advice. */
  quirks?: Quirk[];
}

export type AbilityKind = 'attack' | 'ability' | 'ultimate' | 'passive';

export interface Ability {
  name: string;
  kind: AbilityKind;
  /** What it does, in plain words. */
  text: string;
}

export interface HeroKit {
  /** Date the kit was last checked against the patch notes, 'YYYY-MM-DD'. */
  checked: string;
  abilities: Ability[];
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
  /** Optional tips. Heroes without them simply show none. */
  tips?: HeroTips;
  /** How high a priority this hero is when they're on the enemy team. */
  focus?: { level: FocusLevel; why: string };
  /** What each ability does. Optional so older data files still load. */
  kit?: HeroKit;
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
  /** Can be empty when the in-game name isn't confirmed. */
  name: string;
  /**
   * Since Season 9: the hero who uses the team-up ability, then the partner whose presence
   * makes it stronger. Older data listed heroes who all had to be on the team.
   */
  heroes: string[];
  /** What the ability does on its own. */
  effect?: string;
  /** What it gains when the partner is on the team. */
  bonus?: string;
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
  /** Team-ups active this season. Optional so older data files still load. */
  teamUps?: TeamUp[];
  /** Every hero change since launch. Optional so older data files still load. */
  history?: HistoryData;
}

/** b buff, n nerf, m mixed, c other change, f bug fix. */
export type ChangeKind = 'b' | 'n' | 'm' | 'c' | 'f';

/**
 * One change from a balance post or patch notes: date, the heroes it touches ('deadpool' means all
 * three versions, and a team-up change lists every hero in it), kind, ability, and what changed.
 */
export type HistoryChange = [date: string, heroes: string[], kind: ChangeKind, ability: string, text: string];

export interface HistoryData {
  /** Season ids ('10', '10.5') with their start dates, oldest first. */
  seasons: [id: string, start: string][];
  /** When heroes who weren't in the launch roster joined. */
  added: Record<string, string>;
  changes: HistoryChange[];
}
