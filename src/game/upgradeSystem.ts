import { Hero, HeroStats, Rarity, RARITY_CONFIG } from './types';

/** Cost in BomberCoins to upgrade from `currentLevel` to `currentLevel + 1` */
export const UPGRADE_COSTS: Record<number, number> = {
  1: 200,
  2: 500,
  3: 1000,
  4: 2000,
  5: 4000,
  6: 8000,
  7: 15000,
  8: 25000,
  9: 50000,
};

/** Stat multiplier at each level */
export const LEVEL_MULTIPLIERS: Record<number, number> = {
  1: 1.0,
  2: 1.15,
  3: 1.30,
  4: 1.50,
  5: 1.75,
  6: 2.10,
  7: 2.60,
  8: 3.20,
  9: 4.00,
  10: 5.00,
};

/** Ascension (star) config: cost in BC and duplicates needed per star */
export const ASCENSION_CONFIG: Record<number, { cost: number; duplicates: number; statBonus: number }> = {
  1: { cost: 500, duplicates: 3, statBonus: 0.20 },
  2: { cost: 1000, duplicates: 5, statBonus: 0.40 },
  3: { cost: 2000, duplicates: 8, statBonus: 0.60 },
};

export const MAX_STARS = 3;

export function getUpgradeCost(currentLevel: number): number {
  return UPGRADE_COSTS[currentLevel] ?? Infinity;
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
  if (hero.level >= 10) return hero;
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
  if (hero.level < 10 || hero.stars >= MAX_STARS) return hero;
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

/** Count how many duplicates of a given hero's rarity exist (excluding the hero itself) */
export function countDuplicates(heroes: Hero[], heroId: string, rarity: Rarity): number {
  return heroes.filter(h => h.id !== heroId && h.rarity === rarity).length;
}
