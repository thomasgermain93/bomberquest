import { Rarity, MAP_CONFIGS } from './types';

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

export function rollRarityFromRates(dropRates: ShardDropRates): Rarity {
  const roll = Math.random();
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
    const roll = random();
    let cumulative = 0;
    let rarity: Rarity = 'common';
    
    cumulative += dropRates.common;
    if (roll < cumulative) {
      rarity = 'common';
    } else {
      cumulative += dropRates.rare;
      if (roll < cumulative) {
        rarity = 'rare';
      } else {
        cumulative += dropRates.epic;
        if (roll < cumulative) {
          rarity = 'epic';
        } else {
          rarity = 'legend';
        }
      }
    }
    
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

export function getMapTierName(tier: FarmTier): string {
  switch (tier) {
    case 'low': return 'Débutant';
    case 'medium': return 'Intermédiaire';
    case 'high': return 'Avancé';
  }
}

export function getMapInfoForTier(mapIndex: number): { tier: FarmTier; tierName: string; mapName: string } {
  const tier = getFarmTier(mapIndex);
  const mapConfig = MAP_CONFIGS[mapIndex];
  return {
    tier,
    tierName: getMapTierName(tier),
    mapName: mapConfig?.name ?? 'Inconnu',
  };
}
