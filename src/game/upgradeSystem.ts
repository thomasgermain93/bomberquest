import { Hero, HeroStats, Rarity, RARITY_CONFIG, MAX_LEVEL_BY_RARITY } from './types';

/** XP required per level (level 1 requires 0 XP, level 2 requires XP_FOR_LEVEL[1], etc.) */
export const XP_FOR_LEVEL: Record<number, number> = {
  1: 0,
  2: 100,
  3: 250,
  4: 450,
  5: 700,
  6: 1000,
  7: 1350,
  8: 1750,
  9: 2200,
  10: 2700,
  11: 3250,
  12: 3850,
  13: 4500,
  14: 5200,
  15: 5950,
  16: 6750,
  17: 7600,
  18: 8500,
  19: 9450,
  20: 10450,
  21: 11500,
  22: 12600,
  23: 13750,
  24: 14950,
  25: 16200,
  26: 17500,
  27: 18850,
  28: 20250,
  29: 21700,
  30: 23200,
  31: 24750,
  32: 26350,
  33: 28000,
  34: 29700,
  35: 31450,
  36: 33250,
  37: 35100,
  38: 37000,
  39: 38950,
  40: 40950,
  41: 43000,
  42: 45100,
  43: 47250,
  44: 49450,
  45: 51700,
  46: 54000,
  47: 56350,
  48: 58750,
  49: 61200,
  50: 63700,
  51: 66250,
  52: 68850,
  53: 71500,
  54: 74200,
  55: 76950,
  56: 79750,
  57: 82600,
  58: 85500,
  59: 88450,
  60: 91450,
  61: 94500,
  62: 97600,
  63: 100750,
  64: 103950,
  65: 107200,
  66: 110500,
  67: 113850,
  68: 117250,
  69: 120700,
  70: 124200,
  71: 127750,
  72: 131350,
  73: 135000,
  74: 138700,
  75: 142450,
  76: 146250,
  77: 150100,
  78: 154000,
  79: 157950,
  80: 161950,
  81: 166000,
  82: 170100,
  83: 174250,
  84: 178450,
  85: 182700,
  86: 187000,
  87: 191350,
  88: 195750,
  89: 200200,
  90: 204700,
  91: 209250,
  92: 213850,
  93: 218500,
  94: 223200,
  95: 227950,
  96: 232750,
  97: 237600,
  98: 242500,
  99: 247450,
  100: 252450,
  101: 257500,
  102: 262600,
  103: 267750,
  104: 272950,
  105: 278200,
  106: 283500,
  107: 288850,
  108: 294250,
  109: 299700,
  110: 305200,
  111: 310750,
  112: 316350,
  113: 322000,
  114: 327700,
  115: 333450,
  116: 339250,
  117: 345100,
  118: 351000,
  119: 356950,
  120: 362950,
};

/** Skill unlock levels (every 20 levels) */
export const SKILL_UNLOCK_LEVELS: Record<Rarity, number[]> = {
  common: [20],
  rare: [20, 40],
  'super-rare': [20, 40, 60],
  epic: [20, 40, 60, 80],
  legend: [20, 40, 60, 80, 100],
  'super-legend': [20, 40, 60, 80, 100, 120],
};

/** Stat multiplier at each level */
export const LEVEL_MULTIPLIERS: Record<number, number> = {
  1: 1.0,
  2: 1.05,
  3: 1.10,
  4: 1.16,
  5: 1.22,
  6: 1.28,
  7: 1.35,
  8: 1.42,
  9: 1.50,
  10: 1.58,
  11: 1.66,
  12: 1.75,
  13: 1.84,
  14: 1.94,
  15: 2.04,
  16: 2.15,
  17: 2.26,
  18: 2.38,
  19: 2.50,
  20: 2.63,
  21: 2.77,
  22: 2.91,
  23: 3.06,
  24: 3.21,
  25: 3.37,
  26: 3.54,
  27: 3.71,
  28: 3.89,
  29: 4.08,
  30: 4.27,
  31: 4.47,
  32: 4.68,
  33: 4.89,
  34: 5.11,
  35: 5.34,
  36: 5.57,
  37: 5.81,
  38: 6.06,
  39: 6.32,
  40: 6.58,
  41: 6.85,
  42: 7.13,
  43: 7.42,
  44: 7.71,
  45: 8.01,
  46: 8.32,
  47: 8.64,
  48: 8.97,
  49: 9.31,
  50: 9.66,
  51: 10.02,
  52: 10.39,
  53: 10.77,
  54: 11.16,
  55: 11.56,
  56: 11.97,
  57: 12.39,
  58: 12.82,
  59: 13.26,
  60: 13.71,
  61: 14.17,
  62: 14.64,
  63: 15.12,
  64: 15.61,
  65: 16.11,
  66: 16.62,
  67: 17.14,
  68: 17.67,
  69: 18.21,
  70: 18.76,
  71: 19.32,
  72: 19.89,
  73: 20.47,
  74: 21.06,
  75: 21.66,
  76: 22.27,
  77: 22.89,
  78: 23.52,
  79: 24.16,
  80: 24.81,
  81: 25.47,
  82: 26.14,
  83: 26.82,
  84: 27.51,
  85: 28.21,
  86: 28.92,
  87: 29.64,
  88: 30.37,
  89: 31.11,
  90: 31.86,
  91: 32.62,
  92: 33.39,
  93: 34.17,
  94: 34.96,
  95: 35.76,
  96: 36.57,
  97: 37.39,
  98: 38.22,
  99: 39.06,
  100: 39.91,
  101: 40.77,
  102: 41.64,
  103: 42.52,
  104: 43.41,
  105: 44.31,
  106: 45.22,
  107: 46.14,
  108: 47.07,
  109: 48.01,
  110: 48.96,
  111: 49.92,
  112: 50.89,
  113: 51.87,
  114: 52.86,
  115: 53.86,
  116: 54.87,
  117: 55.89,
  118: 56.92,
  119: 57.96,
  120: 59.01,
};

/** Ascension (star) config: cost in BC and duplicates needed per star */
export const ASCENSION_CONFIG: Record<number, { cost: number; duplicates: number; statBonus: number }> = {
  1: { cost: 500, duplicates: 3, statBonus: 0.20 },
  2: { cost: 1000, duplicates: 5, statBonus: 0.40 },
  3: { cost: 2000, duplicates: 8, statBonus: 0.60 },
};

export const MAX_STARS = 3;

export function getUpgradeCost(currentLevel: number): number {
  if (currentLevel <= 9) {
    return {
      1: 200, 2: 500, 3: 1000, 4: 2000, 5: 4000,
      6: 8000, 7: 15000, 8: 25000, 9: 50000,
    }[currentLevel] ?? 100000;
  }
  const baseCost = 50000;
  const levelScaling = (currentLevel - 9) * 30000;
  return baseCost + levelScaling;
}

export function getMaxLevel(rarity: Rarity): number {
  return MAX_LEVEL_BY_RARITY[rarity];
}

export function getXpForLevel(level: number): number {
  return XP_FOR_LEVEL[level] ?? 0;
}

export function getXpForNextLevel(currentLevel: number): number {
  return XP_FOR_LEVEL[currentLevel + 1] ?? XP_FOR_LEVEL[currentLevel];
}

export function canLevelUp(hero: Hero): boolean {
  const maxLevel = getMaxLevel(hero.rarity);
  return hero.level < maxLevel;
}

export function getXpProgress(hero: Hero): { current: number; required: number; percentage: number } {
  const maxLevel = getMaxLevel(hero.rarity);
  const maxXp = getXpForLevel(maxLevel);

  if (hero.level >= maxLevel) {
    return { current: maxXp, required: maxXp, percentage: 100 };
  }

  const required = getXpForLevel(hero.level + 1);
  const prevRequired = getXpForLevel(hero.level);
  const progress = hero.xp - prevRequired;
  const needed = required - prevRequired;
  const percentage = Math.min(100, Math.max(0, (progress / needed) * 100));
  return { current: progress, required: needed, percentage };
}

export function addXp(hero: Hero, xp: number): Hero {
  const maxLevel = getMaxLevel(hero.rarity);
  if (hero.level >= maxLevel) return hero;

  const maxXp = getXpForLevel(maxLevel);
  const newXp = Math.min(hero.xp + xp, maxXp);
  let newLevel = hero.level;

  while (newLevel < maxLevel && newXp >= getXpForLevel(newLevel + 1)) {
    newLevel++;
  }

  const newStats = getStatsAtLevel(hero.rarity, newLevel, hero.stars);
  return {
    ...hero,
    level: newLevel,
    xp: newXp,
    stats: newStats,
    maxStamina: newStats.sta,
    currentStamina: Math.min(hero.currentStamina, newStats.sta),
  };
}

export function getAscensionCost(currentStars: number): { cost: number; duplicates: number } | null {
  if (currentStars >= MAX_STARS) return null;
  const cfg = ASCENSION_CONFIG[currentStars + 1];
  return cfg ? { cost: cfg.cost, duplicates: cfg.duplicates } : null;
}

export function getStatsAtLevel(rarity: Rarity, level: number, stars: number = 0): HeroStats {
  const base = RARITY_CONFIG[rarity].baseStats;
  const mult = LEVEL_MULTIPLIERS[level] ?? 1;
  const starBonus = stars > 0 ? (ASCENSION_CONFIG[stars]?.statBonus ?? 0) : 0;
  const totalMult = mult * (1 + starBonus);
  return {
    pwr: Math.round(base.pwr * totalMult),
    spd: Math.min(5, Math.round(base.spd * Math.sqrt(totalMult))),
    rng: Math.round(base.rng * totalMult),
    bnb: Math.min(5, Math.round(base.bnb * Math.sqrt(totalMult))),
    sta: Math.round(base.sta * totalMult),
    lck: Math.round(base.lck * totalMult),
  };
}

export function upgradeHero(hero: Hero): Hero {
  const maxLevel = getMaxLevel(hero.rarity);
  if (hero.level >= maxLevel) return hero;
  const newLevel = hero.level + 1;
  const newStats = getStatsAtLevel(hero.rarity, newLevel, hero.stars);
  return {
    ...hero,
    level: newLevel,
    stats: newStats,
    maxStamina: newStats.sta,
    currentStamina: Math.min(hero.currentStamina, newStats.sta),
  };
}

export function ascendHero(hero: Hero): Hero {
  const maxLevel = getMaxLevel(hero.rarity);
  if (hero.level < maxLevel || hero.stars >= MAX_STARS) return hero;
  const newStars = hero.stars + 1;
  const newStats = getStatsAtLevel(hero.rarity, hero.level, newStars);
  return {
    ...hero,
    stars: newStars,
    stats: newStats,
    maxStamina: newStats.sta,
    currentStamina: Math.min(hero.currentStamina, newStats.sta),
  };
}

export function isHeroMaxLevel(hero: Hero): boolean {
  return hero.level >= getMaxLevel(hero.rarity);
}

/** Count how many duplicates of a given hero's rarity exist (excluding the hero itself) */
export function countDuplicates(heroes: Hero[], heroId: string, rarity: Rarity): number {
  return heroes.filter(h => h.id !== heroId && h.rarity === rarity).length;
}
