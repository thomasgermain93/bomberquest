export type TileType = 'floor' | 'wall' | 'block';

export type Rarity = 'common' | 'rare' | 'super-rare' | 'epic' | 'legend' | 'super-legend';

export type ChestTier = 'wood' | 'silver' | 'gold' | 'crystal' | 'legendary';

export interface HeroStats {
  pwr: number;
  spd: number;
  rng: number;
  bnb: number;
  sta: number;
  lck: number;
}

export interface Skill {
  name: string;
  description: string;
  trigger: string;
  effect: string;
  skillLevel?: number; // 1-5, default 1
}

export interface HeroProgressionStats {
  chestsOpened: number;
  totalDamageDealt: number;
  battlesPlayed: number;
  victories: number;
  obtainedAt: number; // timestamp
}

export interface Hero {
  id: string;
  name: string;
  rarity: Rarity;
  level: number;
  xp: number;
  stars: number;
  stats: HeroStats;
  skills: Skill[];
  currentStamina: number;
  maxStamina: number;
  isActive: boolean;
  houseLevel: number;
  position: { x: number; y: number };
  targetPosition: { x: number; y: number } | null;
  path: { x: number; y: number }[] | null;
  state: 'idle' | 'moving' | 'bombing' | 'retreating' | 'resting';
  bombCooldown: number;
  stuckTimer: number;
  icon: string; // icon key for PixelIcon
  progressionStats: HeroProgressionStats;
  isLocked?: boolean; // Verrouillé : protégé du recyclage accidentel
  family?: HeroFamilyId; // Clan du héros
}

export const MAX_LEVEL_BY_RARITY: Record<Rarity, number> = {
  common: 20,
  rare: 40,
  'super-rare': 60,
  epic: 80,
  legend: 100,
  'super-legend': 120,
};

export type BombTeam = 'heroes' | 'enemies';

export interface Bomb {
  id: string;
  heroId: string;
  position: { x: number; y: number };
  range: number;
  timer: number;
  power: number;
  team: BombTeam;
  family?: HeroFamilyId; // Clan du héros qui a placé la bombe
}

export interface Explosion {
  id: string;
  tiles: { x: number; y: number }[];
  timer: number;
  team: BombTeam;
  heroId?: string;
}

export interface Chest {
  id: string;
  tier: ChestTier;
  position: { x: number; y: number };
  hp: number;
  maxHp: number;
  reward: number;
}

export interface GameMap {
  width: number;
  height: number;
  tiles: TileType[][];
  chests: Chest[];
}

export interface GameState {
  map: GameMap;
  heroes: Hero[];
  bombs: Bomb[];
  explosions: Explosion[];
  bomberCoins: number;
  coinsEarned: number;
  isRunning: boolean;
  isPaused: boolean;
  speed: number;
  mapCompleted: boolean;
  eventLog: string[];
  bombsPlaced: number;
  chestsOpened: number;
  // Story mode fields
  enemies?: any[];
  boss?: any | null;
  isStoryMode?: boolean;
  storyStageId?: string;
  enemiesKilled?: number;
  bossDefeated?: boolean;
  storyFailed?: boolean;
}

export interface AchievementProgress {
  progress: number;
  unlocked: boolean;
  unlockedAt?: number;
}

export type AchievementState = Record<string, AchievementProgress>;

export interface PlayerData {
  bomberCoins: number;
  heroes: Hero[];
  accountLevel: number;
  xp: number;
  pityCounters: {
    rare: number;
    superRare: number;
    epic: number;
    legend: number;
  };
  totalHeroesOwned: number;
  mapsCompleted: number;
  /** @deprecated Migré vers universalShards */
  shards: Record<Rarity, number>;
  universalShards: number;
  huntSpeed?: number;
  achievements: AchievementState;
}

export const RARITY_CONFIG: Record<Rarity, {
  rate: number;
  statMultiplier: number;
  skills: number;
  color: string;
  label: string;
  baseStats: HeroStats;
  maxLevel: number;
}> = {
  common: {
    rate: 0.60, statMultiplier: 1.0, skills: 0, color: 'rarity-common', label: 'Common',
    baseStats: { pwr: 1, spd: 1, rng: 1, bnb: 1, sta: 30, lck: 3 },
    maxLevel: 20,
  },
  rare: {
    rate: 0.25, statMultiplier: 1.4, skills: 1, color: 'rarity-rare', label: 'Rare',
    baseStats: { pwr: 2, spd: 1, rng: 2, bnb: 1, sta: 45, lck: 6 },
    maxLevel: 40,
  },
  'super-rare': {
    rate: 0.10, statMultiplier: 2.0, skills: 2, color: 'rarity-super-rare', label: 'Super Rare',
    baseStats: { pwr: 3, spd: 2, rng: 3, bnb: 2, sta: 60, lck: 10 },
    maxLevel: 60,
  },
  epic: {
    rate: 0.04, statMultiplier: 3.0, skills: 3, color: 'rarity-epic', label: 'Epic',
    baseStats: { pwr: 4, spd: 2, rng: 4, bnb: 3, sta: 80, lck: 15 },
    maxLevel: 80,
  },
  legend: {
    rate: 0.009, statMultiplier: 5.0, skills: 4, color: 'rarity-legend', label: 'Legend',
    baseStats: { pwr: 6, spd: 3, rng: 5, bnb: 4, sta: 110, lck: 22 },
    maxLevel: 100,
  },
  'super-legend': {
    rate: 0.001, statMultiplier: 8.0, skills: 5, color: 'rarity-super-legend', label: 'Super Legend',
    baseStats: { pwr: 8, spd: 4, rng: 6, bnb: 5, sta: 140, lck: 30 },
    maxLevel: 120,
  },
};

export const CHEST_CONFIG: Record<ChestTier, {
  hp: number;
  rewardMin: number;
  rewardMax: number;
  rareChance: number;
  color: string;
}> = {
  wood: { hp: 2, rewardMin: 5, rewardMax: 10, rareChance: 0.05, color: '#8B6914' },
  silver: { hp: 5, rewardMin: 20, rewardMax: 40, rareChance: 0.10, color: '#C0C0C0' },
  gold: { hp: 10, rewardMin: 80, rewardMax: 150, rareChance: 0.20, color: '#FFD700' },
  crystal: { hp: 20, rewardMin: 300, rewardMax: 500, rareChance: 0.40, color: '#00CED1' },
  legendary: { hp: 40, rewardMin: 1000, rewardMax: 2000, rareChance: 0.75, color: '#9B30FF' },
};

export const HERO_FAMILIES = [
  { id: 'ember-clan', name: 'Clan Braise' },
  { id: 'storm-riders', name: "Cavaliers de l'Orage" },
  { id: 'forge-guard', name: 'Garde de Forge' },
  { id: 'shadow-core', name: "Noyau d'Ombre" },
  { id: 'arcane-circuit', name: 'Circuit Arcanique' },
  { id: 'wild-pack', name: 'Meute Sauvage' },
] as const;

export type HeroFamilyId = typeof HERO_FAMILIES[number]['id'];

export const HERO_FAMILY_MAP: Record<string, HeroFamilyId> = {
  blaze: 'ember-clan', ember: 'ember-clan', pyro: 'ember-clan', fuse: 'ember-clan', blast: 'ember-clan', sol: 'ember-clan',
  spark: 'storm-riders', volt: 'storm-riders', storm: 'storm-riders', zap: 'storm-riders', vega: 'storm-riders', dash: 'storm-riders',
  flint: 'forge-guard', rex: 'forge-guard', atlas: 'forge-guard', duke: 'forge-guard', max: 'forge-guard',
  ash: 'shadow-core', nova: 'shadow-core', echo: 'shadow-core', crash: 'shadow-core', luna: 'shadow-core',
  pixel: 'arcane-circuit', chip: 'arcane-circuit', byte: 'arcane-circuit', orion: 'arcane-circuit',
  boom: 'wild-pack', nitro: 'wild-pack', rush: 'wild-pack', flash: 'wild-pack', jet: 'wild-pack', ace: 'wild-pack',
};

export const HERO_NAMES = [
  'Blaze', 'Spark', 'Ember', 'Flint', 'Boom', 'Pyro', 'Ash', 'Nitro',
  'Fuse', 'Volt', 'Storm', 'Rex', 'Nova', 'Pixel', 'Chip', 'Byte',
  'Luna', 'Sol', 'Vega', 'Orion', 'Atlas', 'Echo', 'Zap', 'Rush',
  'Blast', 'Crash', 'Dash', 'Flash', 'Jet', 'Max', 'Ace', 'Duke',
];

export const HERO_ICON_KEYS = [
  'bomb', 'zap', 'sparkle', 'star', 'target', 'rocket', 'gamepad', 'bot',
  'shield', 'sword', 'axe', 'flame', 'crown', 'skull', 'gem', 'bird',
];

export interface HeroVisualTraits {
  helmetStyle: 'standard' | 'horned' | 'crowned' | 'tech' | 'mask';
  cape: boolean;
  wings: boolean;
  aura: boolean;
  accentColor: string;
}

export const HERO_VISUALS: Record<string, { family: HeroFamilyId; traits: HeroVisualTraits }> = {
  blaze: { family: 'ember-clan', traits: { helmetStyle: 'standard', cape: false, wings: false, aura: false, accentColor: '#FF6B35' } },
  ember: { family: 'ember-clan', traits: { helmetStyle: 'standard', cape: false, wings: false, aura: false, accentColor: '#E85D04' } },
  pyro: { family: 'ember-clan', traits: { helmetStyle: 'horned', cape: true, wings: false, aura: true, accentColor: '#FF4500' } },
  fuse: { family: 'ember-clan', traits: { helmetStyle: 'horned', cape: true, wings: false, aura: true, accentColor: '#FF6600' } },
  blast: { family: 'ember-clan', traits: { helmetStyle: 'crowned', cape: true, wings: false, aura: true, accentColor: '#FFD700' } },
  sol: { family: 'ember-clan', traits: { helmetStyle: 'crowned', cape: true, wings: true, aura: true, accentColor: '#FFFF00' } },
  spark: { family: 'storm-riders', traits: { helmetStyle: 'standard', cape: false, wings: false, aura: false, accentColor: '#4CC9F0' } },
  volt: { family: 'storm-riders', traits: { helmetStyle: 'standard', cape: false, wings: false, aura: false, accentColor: '#4361EE' } },
  storm: { family: 'storm-riders', traits: { helmetStyle: 'horned', cape: true, wings: false, aura: true, accentColor: '#00B4D8' } },
  zap: { family: 'storm-riders', traits: { helmetStyle: 'horned', cape: true, wings: false, aura: true, accentColor: '#48CAE4' } },
  vega: { family: 'storm-riders', traits: { helmetStyle: 'crowned', cape: true, wings: false, aura: true, accentColor: '#90E0EF' } },
  dash: { family: 'storm-riders', traits: { helmetStyle: 'standard', cape: false, wings: false, aura: false, accentColor: '#0077B6' } },
  flint: { family: 'forge-guard', traits: { helmetStyle: 'standard', cape: false, wings: false, aura: false, accentColor: '#A8A8A8' } },
  rex: { family: 'forge-guard', traits: { helmetStyle: 'standard', cape: false, wings: false, aura: false, accentColor: '#6C757D' } },
  atlas: { family: 'forge-guard', traits: { helmetStyle: 'crowned', cape: true, wings: false, aura: true, accentColor: '#495057' } },
  duke: { family: 'forge-guard', traits: { helmetStyle: 'horned', cape: true, wings: false, aura: true, accentColor: '#ADB5BD' } },
  max: { family: 'forge-guard', traits: { helmetStyle: 'standard', cape: false, wings: false, aura: false, accentColor: '#343A40' } },
  ash: { family: 'shadow-core', traits: { helmetStyle: 'standard', cape: false, wings: false, aura: false, accentColor: '#7B2CBF' } },
  nova: { family: 'shadow-core', traits: { helmetStyle: 'crowned', cape: true, wings: false, aura: true, accentColor: '#9D4EDD' } },
  echo: { family: 'shadow-core', traits: { helmetStyle: 'horned', cape: true, wings: false, aura: true, accentColor: '#C77DFF' } },
  crash: { family: 'shadow-core', traits: { helmetStyle: 'mask', cape: true, wings: false, aura: true, accentColor: '#5A189A' } },
  luna: { family: 'shadow-core', traits: { helmetStyle: 'crowned', cape: true, wings: true, aura: true, accentColor: '#E0AAFF' } },
  pixel: { family: 'arcane-circuit', traits: { helmetStyle: 'tech', cape: false, wings: false, aura: false, accentColor: '#06D6A0' } },
  chip: { family: 'arcane-circuit', traits: { helmetStyle: 'tech', cape: false, wings: false, aura: false, accentColor: '#2EC4B6' } },
  byte: { family: 'arcane-circuit', traits: { helmetStyle: 'tech', cape: false, wings: false, aura: false, accentColor: '#20A4F3' } },
  orion: { family: 'arcane-circuit', traits: { helmetStyle: 'tech', cape: true, wings: false, aura: true, accentColor: '#3A86FF' } },
  boom: { family: 'wild-pack', traits: { helmetStyle: 'standard', cape: false, wings: false, aura: false, accentColor: '#70E000' } },
  nitro: { family: 'wild-pack', traits: { helmetStyle: 'horned', cape: true, wings: false, aura: true, accentColor: '#38B000' } },
  rush: { family: 'wild-pack', traits: { helmetStyle: 'standard', cape: false, wings: false, aura: false, accentColor: '#9EF01A' } },
  flash: { family: 'wild-pack', traits: { helmetStyle: 'horned', cape: true, wings: false, aura: true, accentColor: '#CCFF33' } },
  jet: { family: 'wild-pack', traits: { helmetStyle: 'standard', cape: false, wings: false, aura: false, accentColor: '#80B918' } },
  ace: { family: 'wild-pack', traits: { helmetStyle: 'horned', cape: true, wings: false, aura: true, accentColor: '#B5E48C' } },
};

export function getHeroVisualTraits(heroId: string): HeroVisualTraits {
  const visuals = HERO_VISUALS[heroId.toLowerCase()];
  if (!visuals) {
    return { helmetStyle: 'standard', cape: false, wings: false, aura: false, accentColor: '#888888' };
  }
  return visuals.traits;
}

// Rarity ordering: higher value = higher rarity
export const RARITY_ORDER: Record<string, number> = {
  'super-legend': 6,
  legend: 5,
  epic: 4,
  'super-rare': 3,
  rare: 2,
  common: 1,
};

export function sortByRarity<T extends { rarity: string }>(a: T, b: T): number {
  return (RARITY_ORDER[b.rarity] ?? 0) - (RARITY_ORDER[a.rarity] ?? 0);
}

export const MAP_CONFIGS = [
  { name: 'Prairie', width: 13, height: 9, chests: 12, blockDensity: 0.40, reward: 350, unlockLevel: 1, unlockMaps: 0, icon: 'prairie' },
  { name: 'Forêt', width: 15, height: 11, chests: 22, blockDensity: 0.45, reward: 750, unlockLevel: 5, unlockMaps: 3, icon: 'forest' },
  { name: 'Mines', width: 17, height: 11, chests: 32, blockDensity: 0.50, reward: 1500, unlockLevel: 10, unlockMaps: 8, icon: 'caves' },
  { name: 'Château', width: 19, height: 13, chests: 45, blockDensity: 0.55, reward: 3000, unlockLevel: 20, unlockMaps: 15, icon: 'fortress' },
  { name: 'Volcan', width: 21, height: 13, chests: 55, blockDensity: 0.60, reward: 6000, unlockLevel: 35, unlockMaps: 25, icon: 'inferno' },
  { name: 'Citadelle', width: 23, height: 15, chests: 75, blockDensity: 0.65, reward: 11000, unlockLevel: 50, unlockMaps: 40, icon: 'citadel' },
];
