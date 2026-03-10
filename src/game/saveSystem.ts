import { PlayerData, Rarity } from './types';
import { generateHero } from './summoning';

const SAVE_KEY = 'bomberquest_save';

export function getDefaultPlayerData(): PlayerData {
  const starterHero = generateHero('common');
  starterHero.name = 'Blaze #1';
  starterHero.icon = 'bomb';

  return {
    bomberCoins: 200,
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
  };
}

export function savePlayerData(data: PlayerData): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    console.warn('Failed to save game data');
  }
}

export function loadPlayerData(): PlayerData {
  try {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    console.warn('Failed to load save data');
  }
  return getDefaultPlayerData();
}

export function clearSaveData(): void {
  localStorage.removeItem(SAVE_KEY);
}
