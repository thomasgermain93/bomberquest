import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getDefaultPlayerData, savePlayerData, loadPlayerData, clearSaveData } from '../game/saveSystem';

// Mock localStorage pour les tests
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (index: number) => Object.keys(store)[index] || null,
  };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

describe('saveSystem', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('getDefaultPlayerData', () => {
    it('should return player data with 2000 initial bomberCoins for onboarding', () => {
      const playerData = getDefaultPlayerData();

      // Issue #146: New accounts start with 2000 points for 2 invocations
      expect(playerData.bomberCoins).toBe(2000);
    });

    it('should return player data with a starter hero', () => {
      const playerData = getDefaultPlayerData();

      expect(playerData.heroes).toHaveLength(1);
      expect(playerData.heroes[0].rarity).toBe('common');
      expect(playerData.heroes[0].name).toBe('Blaze #1');
    });

    it('should return player data with default achievement state', () => {
      const playerData = getDefaultPlayerData();

      expect(playerData.achievements).toBeDefined();
      expect(playerData.accountLevel).toBe(1);
      expect(playerData.xp).toBe(0);
    });

    it('should allow 2 x10 invocations with initial points (900 BC each)', () => {
      const playerData = getDefaultPlayerData();
      const singleInvocationCost = 100;
      const x10InvocationCost = 900;

      // With 2000 BC, player can do 2 x10 invocations (1800 BC total)
      expect(playerData.bomberCoins).toBeGreaterThanOrEqual(x10InvocationCost * 2);

      // Or 20 single invocations
      expect(playerData.bomberCoins).toBeGreaterThanOrEqual(singleInvocationCost * 20);
    });

    it('should have pity counters initialized at 0 for all rarities', () => {
      const playerData = getDefaultPlayerData();

      expect(playerData.pityCounters).toEqual({
        rare: 0,
        superRare: 0,
        epic: 0,
        legend: 0,
      });
    });

    it('should have all shard rarity slots initialized', () => {
      const playerData = getDefaultPlayerData();
      const expectedRarities = ['common', 'rare', 'super-rare', 'epic', 'legend', 'super-legend'];

      for (const rarity of expectedRarities) {
        expect(playerData.shards[rarity as keyof typeof playerData.shards]).toBe(0);
      }
    });

    it('should have universalShards at 0 and huntSpeed at 1', () => {
      const playerData = getDefaultPlayerData();

      expect(playerData.universalShards).toBe(0);
      expect(playerData.huntSpeed).toBe(1);
    });

    it('should have tutorialStep at 0 and mapsCompleted at 0', () => {
      const playerData = getDefaultPlayerData();

      expect(playerData.tutorialStep).toBe(0);
      expect(playerData.mapsCompleted).toBe(0);
    });

    it('should have totalHeroesOwned at 1 (starter hero)', () => {
      const playerData = getDefaultPlayerData();

      expect(playerData.totalHeroesOwned).toBe(1);
    });
  });

  describe('savePlayerData + loadPlayerData (aller-retour)', () => {
    it('should persist bomberCoins through save/load cycle', () => {
      const data = getDefaultPlayerData();
      data.bomberCoins = 4200;

      savePlayerData(data);
      const loaded = loadPlayerData();

      expect(loaded.bomberCoins).toBe(4200);
    });

    it('should persist accountLevel and xp through save/load cycle', () => {
      const data = getDefaultPlayerData();
      data.accountLevel = 15;
      data.xp = 3750;

      savePlayerData(data);
      const loaded = loadPlayerData();

      expect(loaded.accountLevel).toBe(15);
      expect(loaded.xp).toBe(3750);
    });

    it('should persist pityCounters through save/load cycle', () => {
      const data = getDefaultPlayerData();
      data.pityCounters = { rare: 5, superRare: 12, epic: 0, legend: 47 };

      savePlayerData(data);
      const loaded = loadPlayerData();

      expect(loaded.pityCounters).toEqual({ rare: 5, superRare: 12, epic: 0, legend: 47 });
    });

    it('should persist hero roster through save/load cycle', () => {
      const data = getDefaultPlayerData();
      data.heroes[0].level = 42;
      data.heroes[0].xp = 1200;

      savePlayerData(data);
      const loaded = loadPlayerData();

      expect(loaded.heroes).toHaveLength(1);
      expect(loaded.heroes[0].level).toBe(42);
      expect(loaded.heroes[0].xp).toBe(1200);
    });

    it('should return default data when localStorage is empty', () => {
      // localStorage est vide (cleared in beforeEach)
      const loaded = loadPlayerData();

      expect(loaded.bomberCoins).toBe(2000);
      expect(loaded.accountLevel).toBe(1);
      expect(loaded.heroes).toHaveLength(1);
    });

    it('should handle corrupted JSON in localStorage gracefully', () => {
      localStorage.setItem('bomberquest_save', 'not-valid-json');

      const loaded = loadPlayerData();

      // Doit retourner les données par défaut sans crash
      expect(loaded.bomberCoins).toBe(2000);
      expect(loaded.accountLevel).toBe(1);
    });

    it('should set save timestamp on save', () => {
      const data = getDefaultPlayerData();
      const before = Date.now();

      savePlayerData(data);

      const ts = Number(localStorage.getItem('bomberquest_save_ts'));
      expect(ts).toBeGreaterThanOrEqual(before);
      expect(ts).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('clearSaveData', () => {
    it('should remove save keys from localStorage', () => {
      const data = getDefaultPlayerData();
      savePlayerData(data);

      expect(localStorage.getItem('bomberquest_save')).not.toBeNull();

      clearSaveData();

      expect(localStorage.getItem('bomberquest_save')).toBeNull();
      expect(localStorage.getItem('bomberquest_save_ts')).toBeNull();
    });

    it('after clear, loadPlayerData should return defaults', () => {
      const data = getDefaultPlayerData();
      data.bomberCoins = 9999;
      savePlayerData(data);
      clearSaveData();

      const loaded = loadPlayerData();
      expect(loaded.bomberCoins).toBe(2000);
    });
  });

  describe('migration universalShards', () => {
    it('should migrate old shard format to universalShards on load', () => {
      // Simule un ancien save sans universalShards mais avec des shards par rareté
      const oldData = {
        bomberCoins: 500,
        accountLevel: 1,
        xp: 0,
        heroes: [],
        pityCounters: { rare: 0, superRare: 0, epic: 0, legend: 0 },
        totalHeroesOwned: 0,
        mapsCompleted: 0,
        huntSpeed: 1,
        tutorialStep: 0,
        shards: { common: 2, rare: 1, 'super-rare': 0, epic: 0, legend: 0, 'super-legend': 0 },
        // universalShards absent volontairement
      };

      localStorage.setItem('bomberquest_save', JSON.stringify(oldData));
      localStorage.setItem('bomberquest_save_ts', String(Date.now()));

      const loaded = loadPlayerData();

      // common=2 → ×1=2, rare=1 → ×2=2 → total=4
      expect(loaded.universalShards).toBe(4);
      // Les shards doivent être remis à 0 après migration
      expect(loaded.shards.common).toBe(0);
      expect(loaded.shards.rare).toBe(0);
    });
  });

  describe('guest TTL expiry', () => {
    it('should return defaults if save is older than 24h', () => {
      const data = getDefaultPlayerData();
      data.bomberCoins = 7777;

      localStorage.setItem('bomberquest_save', JSON.stringify(data));
      // Timestamp simulé il y a 25h
      const oldTs = Date.now() - (25 * 60 * 60 * 1000);
      localStorage.setItem('bomberquest_save_ts', String(oldTs));

      const loaded = loadPlayerData();

      // Le save expiré doit être ignoré → defaults
      expect(loaded.bomberCoins).toBe(2000);
      expect(localStorage.getItem('bomberquest_save')).toBeNull();
    });
  });
});
