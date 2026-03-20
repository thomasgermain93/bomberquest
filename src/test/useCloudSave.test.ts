import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// vi.hoisted() garantit que les variables sont disponibles avant le hoisting de vi.mock()
const { mockUpsert, mockMaybySingle, mockEq, mockSelect, mockFrom } = vi.hoisted(() => {
  const mockUpsert = vi.fn().mockResolvedValue({ error: null });
  const mockMaybySingle = vi.fn().mockResolvedValue({ data: null, error: null });
  const mockEq = vi.fn();
  const mockSelect = vi.fn();
  const mockFrom = vi.fn();
  return { mockUpsert, mockMaybySingle, mockEq, mockSelect, mockFrom };
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: mockFrom },
}));

import { useCloudSave } from '../hooks/useCloudSave';

function buildFromChain(savesData: unknown = null, savesError: unknown = null) {
  // Réinitialise la chaîne fluente pour chaque test
  mockMaybySingle.mockResolvedValue({ data: savesData, error: savesError });
  mockEq.mockReturnValue({
    maybeSingle: mockMaybySingle,
    in: vi.fn().mockResolvedValue({ data: [], error: null }),
  });
  mockSelect.mockReturnValue({ eq: mockEq });
  mockFrom.mockReturnValue({
    select: mockSelect,
    upsert: mockUpsert,
    delete: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        in: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    }),
  });
}

const MINIMAL_PLAYER_DATA = {
  bomberCoins: 100,
  heroes: [],
  accountLevel: 1,
  xp: 0,
  pityCounters: { rare: 0, superRare: 0, epic: 0, legend: 0 },
  totalHeroesOwned: 0,
  mapsCompleted: 0,
  shards: { common: 0, rare: 0, 'super-rare': 0, epic: 0, legend: 0, 'super-legend': 0 },
  universalShards: 0,
  huntSpeed: 1,
  achievements: {},
  tutorialStep: 0,
} as any;

const MINIMAL_STORY = {
  completedStages: [],
  currentRegion: 'forest' as const,
  bossesDefeated: [],
  highestStage: 0,
  bossFirstClearRewards: [],
};

describe('useCloudSave', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    buildFromChain();
  });

  describe('loadFromCloud', () => {
    it('retourne null quand userId est undefined', async () => {
      const { result } = renderHook(() => useCloudSave(undefined, false));

      let loadResult: Awaited<ReturnType<typeof result.current.loadFromCloud>>;
      await act(async () => {
        loadResult = await result.current.loadFromCloud();
      });

      expect(loadResult!).toBeNull();
      // Supabase ne doit pas être appelé si pas d'userId
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('retourne null quand Supabase ne trouve pas de sauvegarde (nouvel utilisateur)', async () => {
      buildFromChain(null, null);

      const { result } = renderHook(() => useCloudSave('user-123', true));

      let loadResult: Awaited<ReturnType<typeof result.current.loadFromCloud>>;
      await act(async () => {
        loadResult = await result.current.loadFromCloud();
      });

      expect(loadResult!).toBeNull();
    });

    it('lève une erreur quand player_saves retourne une erreur Supabase', async () => {
      buildFromChain(null, { message: 'db error' });

      const { result } = renderHook(() => useCloudSave('user-123', true));

      await expect(
        act(async () => {
          await result.current.loadFromCloud();
        })
      ).rejects.toThrow('player_saves_load_failed:db error');
    });
  });

  describe('saveStatsToCloud', () => {
    it("n'appelle pas supabase.from quand userId est undefined", () => {
      vi.useFakeTimers();
      const { result } = renderHook(() => useCloudSave(undefined, true));

      act(() => {
        result.current.saveStatsToCloud(MINIMAL_PLAYER_DATA, MINIMAL_STORY, null as any);
      });

      vi.runAllTimers();
      expect(mockUpsert).not.toHaveBeenCalled();
      vi.useRealTimers();
    });

    it("n'appelle pas supabase.from quand canWriteCloud est false", () => {
      vi.useFakeTimers();
      const { result } = renderHook(() => useCloudSave('user-123', false));

      act(() => {
        result.current.saveStatsToCloud(MINIMAL_PLAYER_DATA, MINIMAL_STORY, null as any);
      });

      vi.runAllTimers();
      expect(mockUpsert).not.toHaveBeenCalled();
      vi.useRealTimers();
    });

    it('appelle supabase.from("player_saves").upsert() après le debounce de 3s', async () => {
      vi.useFakeTimers();

      const { result } = renderHook(() => useCloudSave('user-123', true));

      act(() => {
        result.current.saveStatsToCloud(
          { ...MINIMAL_PLAYER_DATA, bomberCoins: 500, accountLevel: 2 },
          MINIMAL_STORY,
          null as any,
        );
      });

      // Avant les 3000ms, upsert ne doit pas encore être appelé
      expect(mockUpsert).not.toHaveBeenCalled();

      await act(async () => {
        vi.advanceTimersByTime(3000);
      });

      expect(mockFrom).toHaveBeenCalledWith('player_saves');
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: 'user-123' }),
        expect.objectContaining({ onConflict: 'user_id' }),
      );

      vi.useRealTimers();
    });

    it('debounce : un second appel dans la fenêtre annule le premier', async () => {
      vi.useFakeTimers();
      const { result } = renderHook(() => useCloudSave('user-123', true));

      act(() => {
        result.current.saveStatsToCloud(MINIMAL_PLAYER_DATA, MINIMAL_STORY, null as any);
      });

      // Second appel avant les 3s — doit annuler le timer précédent
      act(() => {
        result.current.saveStatsToCloud(
          { ...MINIMAL_PLAYER_DATA, bomberCoins: 9999 },
          MINIMAL_STORY,
          null as any,
        );
      });

      await act(async () => {
        vi.advanceTimersByTime(3000);
      });

      // upsert appelé une seule fois (le deuxième timer)
      expect(mockUpsert).toHaveBeenCalledTimes(1);
      // Les données envoyées correspondent au second appel (bomberCoins 9999)
      const payload = mockUpsert.mock.calls[0][0] as any;
      expect(payload.save_data?.bomberCoins).toBe(9999);

      vi.useRealTimers();
    });
  });

  describe('isSyncing', () => {
    it('est false par défaut', () => {
      const { result } = renderHook(() => useCloudSave('user-123', true));
      expect(result.current.isSyncing).toBe(false);
    });
  });
});
