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
  shards: Record<Rarity, number>;
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

export const MAP_CONFIGS = [
  { name: 'Prairie', width: 13, height: 9, chests: 12, blockDensity: 0.40, reward: 350, unlockLevel: 1, unlockMaps: 0, icon: 'prairie' },
  { name: 'Forêt', width: 15, height: 11, chests: 22, blockDensity: 0.45, reward: 750, unlockLevel: 5, unlockMaps: 3, icon: 'forest' },
  { name: 'Mines', width: 17, height: 11, chests: 32, blockDensity: 0.50, reward: 1500, unlockLevel: 10, unlockMaps: 8, icon: 'caves' },
  { name: 'Château', width: 19, height: 13, chests: 45, blockDensity: 0.55, reward: 3000, unlockLevel: 20, unlockMaps: 15, icon: 'fortress' },
  { name: 'Volcan', width: 21, height: 13, chests: 55, blockDensity: 0.60, reward: 6000, unlockLevel: 35, unlockMaps: 25, icon: 'inferno' },
  { name: 'Citadelle', width: 23, height: 15, chests: 75, blockDensity: 0.65, reward: 11000, unlockLevel: 50, unlockMaps: 40, icon: 'citadel' },
];
