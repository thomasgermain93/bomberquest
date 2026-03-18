import { PlayerData, Rarity } from './types';
import { generateHero } from './summoning';
import { StoryProgress } from './storyTypes';
import { getDefaultAchievementState } from './achievements';

const SAVE_KEY = 'bomberquest_save';

export function getDefaultPlayerData(): PlayerData {
  const starterHero = generateHero('common');
  starterHero.name = 'Blaze #1';
  starterHero.icon = 'bomb';

  return {
    bomberCoins: 2000,
    heroes: [starterHero],
    accountLevel: 1,
    xp: 0,
    pityCounters: { rare: 0, superRare: 0, epic: 0, legend: 0 },
    totalHeroesOwned: 1,
    mapsCompleted: 0,
    shards: {
      common: 0,
      rare: 0,
      'super-rare': 0,
      epic: 0,
      legend: 0,
      'super-legend': 0,
    } as Record<Rarity, number>,
    universalShards: 0,
    huntSpeed: 1,
    achievements: getDefaultAchievementState(),
  };
}

export function savePlayerData(data: PlayerData): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    console.warn('Échec de la sauvegarde');
  }
}

export function loadPlayerData(): PlayerData {
  try {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!parsed.achievements) {
        parsed.achievements = getDefaultAchievementState();
      }
      if (parsed.universalShards === undefined) {
        // Migration: convertir les anciens shards par rareté en universalShards
        const s = parsed.shards || { common: 0, rare: 0, 'super-rare': 0, epic: 0, legend: 0, 'super-legend': 0 };
        parsed.universalShards = (s.common || 0) + (s.rare || 0) * 2 + (s['super-rare'] || 0) * 4 + (s.epic || 0) * 10 + (s.legend || 0) * 25 + (s['super-legend'] || 0) * 100;
        parsed.shards = { common: 0, rare: 0, 'super-rare': 0, epic: 0, legend: 0, 'super-legend': 0 };
      }
      parsed.xp = Number.isFinite(Number(parsed?.xp)) ? Number(parsed.xp) : 0;
      if (Array.isArray(parsed.heroes)) {
        parsed.heroes = parsed.heroes.map((hero: any) => ({
          ...hero,
          xp: Number.isFinite(Number(hero?.xp)) ? Number(hero.xp) : 0,
          level: Number.isFinite(Number(hero?.level)) ? Math.max(1, Math.min(Number(hero.level), 120)) : 1,
          progressionStats: hero.progressionStats ?? { chestsOpened: 0, totalDamageDealt: 0, battlesPlayed: 0, victories: 0, obtainedAt: Date.now() },
        }));
      } else {
        parsed.heroes = [];
      }
      return parsed;
    }
  } catch {
    console.warn('Échec du chargement de la sauvegarde');
  }
  return getDefaultPlayerData();
}

export function clearSaveData(): void {
  localStorage.removeItem(SAVE_KEY);
}

const STORY_KEY = 'bq_story';

export function saveStoryProgress(sp: StoryProgress): void {
  localStorage.setItem(STORY_KEY, JSON.stringify(sp));
}

export function loadStoryProgress(): StoryProgress {
  try {
    const raw = localStorage.getItem(STORY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...{ completedStages: [], currentRegion: 'forest', bossesDefeated: [], highestStage: 0, bossFirstClearRewards: [] },
        ...parsed,
      };
    }
  } catch {}
  return { completedStages: [], currentRegion: 'forest', bossesDefeated: [], highestStage: 0, bossFirstClearRewards: [] };
}
