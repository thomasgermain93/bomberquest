import { Hero, HeroStats, Rarity, Skill, RARITY_CONFIG, MAX_LEVEL_BY_RARITY } from './types';
import { generateSkillsForRarity } from './summoning';

/** XP required per level (level 1 requires 0 XP, level 2 requires XP_FOR_LEVEL[1], etc.) */
const XP_FOR_LEVEL: Record<number, number> = {
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
const SKILL_UNLOCK_LEVELS: Record<Rarity, number[]> = {
  common: [],
  rare: [20, 40],
  'super-rare': [20, 40, 60],
  epic: [20, 40, 60, 80],
  legend: [20, 40, 60, 80, 100],
  'super-legend': [20, 40, 60, 80, 100, 120],
};

/** Stat multiplier at each level */
const LEVEL_MULTIPLIERS: Record<number, number> = {
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
const ASCENSION_CONFIG: Record<number, { cost: number; duplicates: number; statBonus: number }> = {
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

function getXpForLevel(level: number): number {
  return XP_FOR_LEVEL[level] ?? 0;
}

function getXpForNextLevel(currentLevel: number): number {
  return XP_FOR_LEVEL[currentLevel + 1] ?? XP_FOR_LEVEL[currentLevel];
}

function canLevelUp(hero: Hero): boolean {
  const maxLevel = getMaxLevel(hero.rarity);
  return hero.level < maxLevel;
}

export function getXpProgress(hero: Hero): { current: number; required: number; percentage: number } {
  const maxLevel = getMaxLevel(hero.rarity);
  const maxXp = getXpForLevel(maxLevel);
  const heroXp = Number.isFinite(hero.xp) ? hero.xp : 0;
  const heroLevel = Number.isFinite(hero.level) ? Math.max(1, hero.level) : 1;

  if (heroLevel >= maxLevel) {
    return { current: maxXp, required: maxXp, percentage: 100 };
  }

  const required = getXpForLevel(heroLevel + 1);
  const prevRequired = getXpForLevel(heroLevel);
  const progress = Math.max(0, heroXp - prevRequired);
  const needed = Math.max(1, required - prevRequired);
  const percentage = Math.min(100, Math.max(2, (progress / needed) * 100));
  return { current: progress, required: needed, percentage };
}

export function addXp(hero: Hero, xp: number): Hero {
  const maxLevel = getMaxLevel(hero.rarity);
  const heroLevel = Number.isFinite(hero.level) ? Math.max(1, hero.level) : 1;
  if (heroLevel >= maxLevel) return hero;

  const baseXp = Number.isFinite(hero.xp) ? hero.xp : 0;
  const earnedXp = Number.isFinite(xp) ? xp : 0;
  const maxXp = getXpForLevel(maxLevel);
  const newXp = Math.min(baseXp + earnedXp, maxXp);
  let newLevel = heroLevel;

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
  const heroLevel = Number.isFinite(hero.level) ? Math.max(1, hero.level) : 1;
  if (heroLevel >= maxLevel) return hero;
  const newLevel = heroLevel + 1;
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
  const heroLevel = Number.isFinite(hero.level) ? Math.max(1, hero.level) : 1;
  if (heroLevel < maxLevel || hero.stars >= MAX_STARS) return hero;
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

function isHeroMaxLevel(hero: Hero): boolean {
  return hero.level >= getMaxLevel(hero.rarity);
}

/** Count how many duplicates of a given hero's rarity exist (excluding the hero itself) */
export function countDuplicates(heroes: Hero[], heroId: string, rarity: Rarity): number {
  return heroes.filter(h => h.id !== heroId && h.rarity === rarity).length;
}

/**
 * Retourne uniquement les compétences débloquées du héros.
 * Règle : skill[i] (0-indexed) se débloque au niveau (i+1) * 20.
 */
export function getUnlockedSkills(hero: Hero): Skill[] {
  return hero.skills.filter((_, i) => hero.level >= (i + 1) * 20);
}

// Coût en nombre de doublons par level de skill (index = level actuel)
const SKILL_UPGRADE_COST = [0, 1, 2, 3, 5]; // Pour passer du level 1→2, 2→3, 3→4, 4→5

// Niveau max d'un skill selon la rareté du héros
const MAX_SKILL_LEVEL_BY_RARITY: Record<Rarity, number> = {
  common: 1,
  rare: 2,
  'super-rare': 3,
  epic: 4,
  legend: 5,
  'super-legend': 5,
};

// Retourne la description d'un skill avec son niveau si > 1
function getSkillDescription(skill: Skill): string {
  const level = skill.skillLevel || 1;
  const levelSuffix = level > 1 ? ` (Niveau ${level})` : '';
  return skill.description + levelSuffix;
}

// Vérifie si un héros peut avoir un skill amélioré via un doublon
export function canUpgradeSkill(
  hero: Hero,
  skillIndex: number,
  duplicates: Hero[]
): { canUpgrade: boolean; reason: string; duplicatesNeeded: number } {
  if (!hero.skills || hero.skills.length === 0) {
    return { canUpgrade: false, reason: "Ce héros n'a pas de compétences", duplicatesNeeded: 0 };
  }

  const skill = hero.skills[skillIndex];
  if (!skill) {
    return { canUpgrade: false, reason: 'Compétence introuvable', duplicatesNeeded: 0 };
  }

  const currentLevel = skill.skillLevel || 1;
  const maxLevel = MAX_SKILL_LEVEL_BY_RARITY[hero.rarity];

  if (currentLevel >= maxLevel) {
    return { canUpgrade: false, reason: 'Niveau maximum atteint', duplicatesNeeded: 0 };
  }

  const needed = SKILL_UPGRADE_COST[currentLevel] || 1;
  const availableDuplicates = duplicates.filter(
    d => d.id !== hero.id && d.templateId && d.templateId === hero.templateId && !d.isLocked
  ).length;

  if (availableDuplicates < needed) {
    return {
      canUpgrade: false,
      reason: `${needed - availableDuplicates} doublon(s) manquant(s)`,
      duplicatesNeeded: needed,
    };
  }

  return { canUpgrade: true, reason: '', duplicatesNeeded: needed };
}

/**
 * Fusionne un héros vers une rareté supérieure en conservant son identité
 * (id, name, family, icon). Les skills sont ceux de la rareté cible.
 */
export function upgradeHeroRarity(hero: Hero, to: Rarity): Hero {
  const config = RARITY_CONFIG[to];
  const fromConfig = RARITY_CONFIG[hero.rarity];
  const newLevel = fromConfig.maxLevel;
  const newStats = getStatsAtLevel(to, newLevel, hero.stars);
  return {
    ...hero,                       // conserve id, templateId, name, family, icon, progressionStats…
    rarity: to,
    level: newLevel,
    xp: 0,
    stars: 0,
    stats: newStats,
    skills: generateSkillsForRarity(to),
    maxStamina: newStats.sta,
    currentStamina: newStats.sta,
  };
}

// Applique l'upgrade : supprime les doublons consommés, améliore le skill
export function upgradeSkillWithDuplicate(
  heroes: Hero[],
  heroId: string,
  skillIndex: number
): { updatedHeroes: Hero[]; success: boolean; message: string; removedIds: string[] } {
  const hero = heroes.find(h => h.id === heroId);
  if (!hero) {
    return { updatedHeroes: heroes, success: false, message: 'Héros introuvable', removedIds: [] };
  }

  const check = canUpgradeSkill(hero, skillIndex, heroes);
  if (!check.canUpgrade) {
    return { updatedHeroes: heroes, success: false, message: check.reason, removedIds: [] };
  }

  // Trouver les doublons à consommer (même templateId, non verrouillés)
  const duplicatesToConsume = heroes
    .filter(d => d.id !== heroId && d.templateId && d.templateId === hero.templateId && !d.isLocked)
    .slice(0, check.duplicatesNeeded);

  const removedIds = duplicatesToConsume.map(d => d.id);
  const newLevel = (hero.skills[skillIndex].skillLevel || 1) + 1;

  // Améliorer le skill du héros
  const updatedHero: Hero = {
    ...hero,
    skills: hero.skills.map((s, i) =>
      i === skillIndex ? { ...s, skillLevel: newLevel } : s
    ),
  };

  const updatedHeroes = heroes
    .filter(h => !removedIds.includes(h.id))
    .map(h => h.id === heroId ? updatedHero : h);

  return {
    updatedHeroes,
    success: true,
    message: `${hero.skills[skillIndex].name} amélioré au niveau ${newLevel}!`,
    removedIds,
  };
}
