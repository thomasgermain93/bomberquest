import { describe, it, expect } from "vitest";
import {
  getFarmTier,
  getDropRatesForMap,
  generateShardRewards,
  applyShardRewards,
  SHARD_DROP_RATES,
  FARM_TIER_THRESHOLDS,
} from '@/game/shardRewardSystem';
import { Rarity } from '@/game/types';

describe('shardRewardSystem', () => {
  describe('getFarmTier', () => {
    it('should return low tier for early maps (Prairie, Forêt)', () => {
      expect(getFarmTier(0)).toBe('low');
      expect(getFarmTier(1)).toBe('low');
    });

    it('should return medium tier for middle maps (Mines, Château)', () => {
      expect(getFarmTier(2)).toBe('medium');
      expect(getFarmTier(3)).toBe('medium');
    });

    it('should return high tier for late maps (Volcan, Citadelle)', () => {
      expect(getFarmTier(4)).toBe('high');
      expect(getFarmTier(5)).toBe('high');
    });

    it('should return low tier for unknown map indices', () => {
      expect(getFarmTier(99)).toBe('low');
      expect(getFarmTier(-1)).toBe('low');
    });
  });

  describe('getDropRatesForMap', () => {
    it('should return correct drop rates for low tier', () => {
      const rates = getDropRatesForMap(0);
      expect(rates.common).toBe(0.70);
      expect(rates.rare).toBe(0.25);
      expect(rates.epic).toBe(0.05);
      expect(rates.legend).toBe(0.00);
    });

    it('should return correct drop rates for medium tier', () => {
      const rates = getDropRatesForMap(2);
      expect(rates.common).toBe(0.45);
      expect(rates.rare).toBe(0.40);
      expect(rates.epic).toBe(0.13);
      expect(rates.legend).toBe(0.02);
    });

    it('should return correct drop rates for high tier', () => {
      const rates = getDropRatesForMap(4);
      expect(rates.common).toBe(0.25);
      expect(rates.rare).toBe(0.45);
      expect(rates.epic).toBe(0.24);
      expect(rates.legend).toBe(0.06);
    });
  });

  describe('generateShardRewards', () => {
    it('should generate between 1 and 3 shards', () => {
      const deterministicRng = () => 0.5;
      const rewards = generateShardRewards(0, deterministicRng);
      const totalQuantity = rewards.reduce((sum, r) => sum + r.quantity, 0);
      expect(totalQuantity).toBeGreaterThanOrEqual(1);
      expect(totalQuantity).toBeLessThanOrEqual(3);
    });

    it('should generate deterministic results with seeded RNG', () => {
      const deterministicRng = () => 0.5;
      const rewards1 = generateShardRewards(0, deterministicRng);
      const rewards2 = generateShardRewards(0, deterministicRng);
      expect(rewards1).toEqual(rewards2);
    });

    it('should always return at least 1 shard', () => {
      const veryLowRng = () => 0.001;
      const rewards = generateShardRewards(0, veryLowRng);
      expect(rewards.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle multiple shards of same rarity', () => {
      const rngCalls = [0.5, 0.1, 0.2];
      let callIndex = 0;
      const rng = () => rngCalls[callIndex++ % 3];
      const rewards = generateShardRewards(0, rng);
      expect(rewards.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('applyShardRewards', () => {
    it('should add shards to existing inventory', () => {
      const currentShards: Record<Rarity, number> = {
        common: 5,
        rare: 3,
        'super-rare': 0,
        epic: 1,
        legend: 0,
        'super-legend': 0,
      };
      const rewards = [
        { rarity: 'common' as Rarity, quantity: 2 },
        { rarity: 'rare' as Rarity, quantity: 1 },
      ];
      const result = applyShardRewards(currentShards, rewards);
      expect(result.common).toBe(7);
      expect(result.rare).toBe(4);
      expect(result.epic).toBe(1);
    });

    it('should initialize missing rarities to 0', () => {
      const currentShards: Record<Rarity, number> = {
        common: 5,
        rare: 3,
        'super-rare': 0,
        epic: 1,
        legend: 0,
        'super-legend': 0,
      };
      const rewards = [
        { rarity: 'legend' as Rarity, quantity: 10 },
      ];
      const result = applyShardRewards(currentShards, rewards);
      expect(result.legend).toBe(10);
    });

    it('should not mutate original shards object', () => {
      const currentShards: Record<Rarity, number> = {
        common: 5,
        rare: 3,
        'super-rare': 0,
        epic: 1,
        legend: 0,
        'super-legend': 0,
      };
      const originalCommon = currentShards.common;
      const rewards = [{ rarity: 'common' as Rarity, quantity: 2 }];
      applyShardRewards(currentShards, rewards);
      expect(currentShards.common).toBe(originalCommon);
    });
  });

  describe('SHARD_DROP_RATES', () => {
    it('should have rates that sum to 1 for each tier', () => {
      expect(SHARD_DROP_RATES.low.common + SHARD_DROP_RATES.low.rare + SHARD_DROP_RATES.low.epic + SHARD_DROP_RATES.low.legend).toBe(1);
      expect(SHARD_DROP_RATES.medium.common + SHARD_DROP_RATES.medium.rare + SHARD_DROP_RATES.medium.epic + SHARD_DROP_RATES.medium.legend).toBe(1);
      expect(SHARD_DROP_RATES.high.common + SHARD_DROP_RATES.high.rare + SHARD_DROP_RATES.high.epic + SHARD_DROP_RATES.high.legend).toBe(1);
    });

    it('should have probabilities that make sense for each tier', () => {
      expect(SHARD_DROP_RATES.low.legend).toBeLessThan(SHARD_DROP_RATES.medium.legend);
      expect(SHARD_DROP_RATES.medium.legend).toBeLessThan(SHARD_DROP_RATES.high.legend);
      expect(SHARD_DROP_RATES.low.common).toBeGreaterThan(SHARD_DROP_RATES.high.common);
    });
  });

  describe('FARM_TIER_THRESHOLDS', () => {
    it('should map all MAP_CONFIGS indices', () => {
      for (let i = 0; i < 6; i++) {
        expect(FARM_TIER_THRESHOLDS[i]).toBeDefined();
      }
    });
  });
});
