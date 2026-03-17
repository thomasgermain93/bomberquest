import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getDefaultPlayerData } from '../game/saveSystem';

// Mock localStorage for tests
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
  });
});