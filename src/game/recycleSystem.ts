import { Hero, Rarity } from './types';

// Valeur en Universal Shards selon la rareté
export const RECYCLE_VALUES: Record<Rarity, number> = {
  common: 1,
  rare: 3,
  'super-rare': 8,
  epic: 20,
  legend: 50,
  'super-legend': 150,
};

// Calcule la valeur d'un héros au recyclage
export function getRecycleValue(hero: Hero): number {
  const base = RECYCLE_VALUES[hero.rarity];
  // Bonus selon le level : +1 shard par tranche de 10 levels
  const levelBonus = Math.floor(hero.level / 10);
  return base + levelBonus;
}

// Calcule la valeur totale d'un lot de héros
export function getTotalRecycleValue(heroes: Hero[]): number {
  return heroes.reduce((total, h) => total + getRecycleValue(h), 0);
}

// Recycle les héros : retourne les IDs supprimés et les shards gagnés
export function recycleHeroes(
  heroes: Hero[],
  idsToRecycle: string[]
): { remainingHeroes: Hero[]; shardsGained: number } {
  const toRecycle = heroes.filter(h => idsToRecycle.includes(h.id) && !h.isLocked);
  const shardsGained = getTotalRecycleValue(toRecycle);
  const remainingHeroes = heroes.filter(h => !idsToRecycle.includes(h.id) || h.isLocked);
  return { remainingHeroes, shardsGained };
}
