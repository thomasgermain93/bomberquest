import { Rarity } from './types';

export type FarmTier = 'low' | 'medium' | 'high';

export interface ShardDropRates {
  common: number;
  rare: number;
  epic: number;
  legend: number;
}

export const SHARD_DROP_RATES: Record<FarmTier, ShardDropRates> = {
  low: {
    common: 0.70,
    rare: 0.25,
    epic: 0.05,
    legend: 0.00,
  },
  medium: {
    common: 0.45,
    rare: 0.40,
    epic: 0.13,
    legend: 0.02,
  },
  high: {
    common: 0.25,
    rare: 0.45,
    epic: 0.24,
    legend: 0.06,
  },
};

export const FARM_TIER_THRESHOLDS: Record<number, FarmTier> = {
  0: 'low',
  1: 'low',
  2: 'medium',
  3: 'medium',
  4: 'high',
  5: 'high',
};

export function getFarmTier(mapIndex: number): FarmTier {
  return FARM_TIER_THRESHOLDS[mapIndex] ?? 'low';
}

export function getDropRatesForMap(mapIndex: number): ShardDropRates {
  const tier = getFarmTier(mapIndex);
  return SHARD_DROP_RATES[tier];
}

export interface ShardReward {
  rarity: Rarity;
  quantity: number;
}

export function rollRarityFromRates(dropRates: ShardDropRates, roll: number): Rarity {
  let cumulative = 0;

  cumulative += dropRates.common;
  if (roll < cumulative) return 'common';

  cumulative += dropRates.rare;
  if (roll < cumulative) return 'rare';

  cumulative += dropRates.epic;
  if (roll < cumulative) return 'epic';

  return 'legend';
}

export function generateShardRewards(mapIndex: number, rng?: () => number): ShardReward[] {
  const dropRates = getDropRatesForMap(mapIndex);
  const random = rng ?? Math.random;

  const shardCount = Math.floor(random() * 3) + 1;
  const rewards: ShardReward[] = [];

  for (let i = 0; i < shardCount; i++) {
    const rarity = rollRarityFromRates(dropRates, random());

    const existing = rewards.find(r => r.rarity === rarity);
    if (existing) {
      existing.quantity += 1;
    } else {
      rewards.push({ rarity, quantity: 1 });
    }
  }

  return rewards;
}

export function applyShardRewards(
  currentShards: Record<Rarity, number>,
  rewards: ShardReward[]
): Record<Rarity, number> {
  const newShards = { ...currentShards };

  for (const reward of rewards) {
    newShards[reward.rarity] = (newShards[reward.rarity] || 0) + reward.quantity;
  }

  return newShards;
}

export function generateUniversalShardReward(mapIndex: number): number {
  // Montant en universalShards selon le tier de carte
  const tier = getFarmTier(mapIndex);
  const amounts: Record<FarmTier, number> = { low: 3, medium: 6, high: 12 };
  const base = amounts[tier];
  // +0 à +50% bonus aléatoire
  const bonus = Math.floor(base * Math.random() * 0.5);
  return base + bonus;
}

