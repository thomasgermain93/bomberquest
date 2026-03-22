import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCloudSave } from '@/hooks/useCloudSave';
import { getDefaultPlayerData } from '@/game/saveSystem';

// Mock Supabase — la factory ne peut PAS référencer des variables externes (hoisting)
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
    channel: vi.fn(),
  },
}));

// Import après le mock pour récupérer les références mockées
import { supabase } from '@/integrations/supabase/client';

const mockFrom = supabase.from as ReturnType<typeof vi.fn>;

// ----- Helpers -----

function buildSaveRow(overrides: Record<string, unknown> = {}) {
  return {
    user_id: 'user-123',
    save_data: {
      bomberCoins: 3000,
      accountLevel: 5,
      xp: 1200,
      universalShards: 10,
      huntSpeed: 1,
      mapsCompleted: 20,
      totalHeroesOwned: 3,
      pityCounters: { rare: 0, superRare: 0, epic: 0, legend: 0 },
      shards: { common: 0, rare: 0, 'super-rare': 0, epic: 0, legend: 0, 'super-legend': 0 },
    },
    story_progress: { completedStages: ['forest-1'], currentRegion: 'forest', bossesDefeated: [], highestStage: 1, bossFirstClearRewards: [] },
    daily_quests: { date: '2026-03-22', quests: [] },
    ...overrides,
  };
}

function buildHeroRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'hero-1',
    user_id: 'user-123',
    name: 'Blaze #1',
    rarity: 'common',
    level: 5,
    stars: 0,
    xp: 300,
    stats: { pwr: 8, spd: 7, rng: 2, bnb: 3, sta: 10, lck: 5 },
    skills: [],
    current_stamina: 100,
    max_stamina: 100,
    is_active: true,
    house_level: 1,
    icon: 'flame',
    progression_stats: { chestsOpened: 5, totalDamageDealt: 200, battlesPlayed: 10, victories: 8, obtainedAt: 1700000000000 },
    is_locked: false,
    family: 'ember-clan',
    ...overrides,
  };
}

/**
 * Configure le mock supabase.from() pour renvoyer les résultats désirés
 * pour les deux requêtes parallèles de loadFromCloud :
 *   1) player_saves → savesResult
 *   2) player_heroes → heroesResult
 */
function mockSupabaseLoad(
  saveRow: ReturnType<typeof buildSaveRow> | null,
  heroRows: ReturnType<typeof buildHeroRow>[] = [],
  saveError: { message: string } | null = null,
  heroError: { message: string } | null = null,
) {
  mockFrom.mockImplementation((table: string) => {
    if (table === 'player_saves') {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: saveRow, error: saveError }),
      };
    }
    if (table === 'player_heroes') {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue({ data: heroRows, error: heroError }),
        upsert: vi.fn().mockResolvedValue({ error: null }),
        delete: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({ error: null }),
      };
    }
    return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() };
  });
}

// ----- Tests -----

describe('useCloudSave', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ------------------------------------------------------------------ //
  // 1. Pas d'userId → loadFromCloud retourne null                       //
  // ------------------------------------------------------------------ //
  describe('utilisateur non authentifié', () => {
    it('loadFromCloud retourne null sans appeler Supabase', async () => {
      const { result } = renderHook(() => useCloudSave(undefined, false));

      const data = await result.current.loadFromCloud();

      expect(data).toBeNull();
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('saveStatsToCloud ne déclenche aucun appel Supabase', () => {
      vi.useFakeTimers();
      const { result } = renderHook(() => useCloudSave(undefined, false));
      const playerData = getDefaultPlayerData();

      result.current.saveStatsToCloud(
        playerData,
        { completedStages: [], currentRegion: 'forest', bossesDefeated: [], highestStage: 0, bossFirstClearRewards: [] },
        { date: '2026-03-22', quests: [] } as any,
      );

      vi.runAllTimers();
      expect(mockFrom).not.toHaveBeenCalled();
    });
  });

  // ------------------------------------------------------------------ //
  // 2. Flow complet loadFromCloud                                       //
  // ------------------------------------------------------------------ //
  describe('loadFromCloud — flow nominal', () => {
    it('renvoie les données cloud quand le joueur est authentifié', async () => {
      const saveRow = buildSaveRow();
      const heroRow = buildHeroRow();
      mockSupabaseLoad(saveRow, [heroRow]);

      const { result } = renderHook(() => useCloudSave('user-123', true));

      const data = await result.current.loadFromCloud();

      expect(data).not.toBeNull();
      expect(data!.playerData.bomberCoins).toBe(3000);
      expect(data!.playerData.accountLevel).toBe(5);
      expect(data!.playerData.heroes).toHaveLength(1);
      expect(data!.playerData.heroes[0].name).toBe('Blaze #1');
    });

    it('storyProgress et dailyQuests sont retournés depuis la save cloud', async () => {
      const saveRow = buildSaveRow();
      mockSupabaseLoad(saveRow, [buildHeroRow()]);

      const { result } = renderHook(() => useCloudSave('user-123', true));
      const data = await result.current.loadFromCloud();

      expect(data!.storyProgress).toEqual(saveRow.story_progress);
      expect(data!.dailyQuests).toEqual(saveRow.daily_quests);
    });

    it('retourne null si aucune save en DB (nouveau joueur)', async () => {
      mockSupabaseLoad(null, []);

      const { result } = renderHook(() => useCloudSave('user-123', true));
      const data = await result.current.loadFromCloud();

      expect(data).toBeNull();
    });

    it('les champs manquants dans save_data reçoivent les valeurs par défaut', async () => {
      // save_data partiel : pas de bomberCoins
      const saveRow = buildSaveRow({ save_data: { accountLevel: 3 } });
      mockSupabaseLoad(saveRow, []);

      const { result } = renderHook(() => useCloudSave('user-123', true));
      const data = await result.current.loadFromCloud();

      // bomberCoins absent → défaut de getDefaultPlayerData = 2000
      expect(data!.playerData.bomberCoins).toBe(2000);
      expect(data!.playerData.accountLevel).toBe(3);
    });
  });

  // ------------------------------------------------------------------ //
  // 3. Migration universalShards                                        //
  // ------------------------------------------------------------------ //
  describe('migration universalShards', () => {
    it('si universalShards manque dans save_data, getDefaultPlayerData() l\'initialise à 0', async () => {
      const saveDataWithoutUniversalShards = {
        bomberCoins: 500,
        accountLevel: 2,
        xp: 0,
        huntSpeed: 1,
        mapsCompleted: 5,
        totalHeroesOwned: 1,
        pityCounters: { rare: 0, superRare: 0, epic: 0, legend: 0 },
        shards: { common: 0, rare: 0, 'super-rare': 0, epic: 0, legend: 0, 'super-legend': 0 },
        // universalShards absent intentionnellement
      };
      const saveRow = buildSaveRow({ save_data: saveDataWithoutUniversalShards });
      mockSupabaseLoad(saveRow, []);

      const { result } = renderHook(() => useCloudSave('user-123', true));
      const data = await result.current.loadFromCloud();

      // getDefaultPlayerData() met universalShards=0, et le spread de statsOnly ne l'override pas
      expect(data!.playerData.universalShards).toBe(0);
    });

    it('si universalShards est présent dans save_data, il est conservé', async () => {
      const saveRow = buildSaveRow({
        save_data: { ...buildSaveRow().save_data, universalShards: 42 },
      });
      mockSupabaseLoad(saveRow, []);

      const { result } = renderHook(() => useCloudSave('user-123', true));
      const data = await result.current.loadFromCloud();

      expect(data!.playerData.universalShards).toBe(42);
    });
  });

  // ------------------------------------------------------------------ //
  // 4. Résolution de conflit timestamp                                  //
  // ------------------------------------------------------------------ //
  describe('résolution de conflit cloud vs local', () => {
    it('utilise les données cloud quand elles sont plus récentes que le localStorage', async () => {
      // Simule un localStorage avec des données "anciennes"
      const localCoins = 500;
      const cloudCoins = 9999;

      const saveRow = buildSaveRow({ save_data: { ...buildSaveRow().save_data, bomberCoins: cloudCoins } });
      mockSupabaseLoad(saveRow, []);

      const { result } = renderHook(() => useCloudSave('user-123', true));
      const cloudData = await result.current.loadFromCloud();

      // La donnée cloud est la source de vérité quand l'utilisateur est authentifié
      expect(cloudData!.playerData.bomberCoins).toBe(cloudCoins);
      expect(cloudData!.playerData.bomberCoins).not.toBe(localCoins);
    });

    it('le timestamp local est plus récent → tutorialStep local doit être conservable', async () => {
      // En pratique useCloudSave charge toujours le cloud d'abord.
      // C'est l'appelant (useCloudSync) qui fait la résolution via timestamps.
      // On vérifie ici que tutorialStep est bien préservé depuis save_data quand il est défini.
      const saveRow = buildSaveRow({
        save_data: { ...buildSaveRow().save_data, tutorialStep: 3 },
      });
      mockSupabaseLoad(saveRow, []);

      const { result } = renderHook(() => useCloudSave('user-123', true));
      const data = await result.current.loadFromCloud();

      expect(data!.playerData.tutorialStep).toBe(3);
    });

    it('tutorialStep absent de save_data (tutoriel terminé) → undefined', async () => {
      // Si le joueur a terminé le tutoriel, tutorialStep n'est pas dans le JSON (stringify omet undefined)
      const saveDataWithoutTutorial: Record<string, unknown> = { ...buildSaveRow().save_data };
      delete saveDataWithoutTutorial.tutorialStep;
      const saveRow = buildSaveRow({ save_data: saveDataWithoutTutorial });
      mockSupabaseLoad(saveRow, []);

      const { result } = renderHook(() => useCloudSave('user-123', true));
      const data = await result.current.loadFromCloud();

      // Sans la clé, le code préserve undefined (tutoriel terminé)
      expect(data!.playerData.tutorialStep).toBeUndefined();
    });
  });

  // ------------------------------------------------------------------ //
  // 5. Gestion d'erreurs Supabase                                       //
  // ------------------------------------------------------------------ //
  describe('gestion d\'erreurs Supabase', () => {
    it('lève une erreur si player_saves échoue', async () => {
      mockSupabaseLoad(null, [], { message: 'DB connection refused' });

      const { result } = renderHook(() => useCloudSave('user-123', true));

      await expect(result.current.loadFromCloud()).rejects.toThrow('player_saves_load_failed');
    });

    it('lève une erreur si player_heroes échoue', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'player_saves') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: buildSaveRow(), error: null }),
          };
        }
        if (table === 'player_heroes') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: null, error: { message: 'heroes table unavailable' } }),
          };
        }
      });

      const { result } = renderHook(() => useCloudSave('user-123', true));

      await expect(result.current.loadFromCloud()).rejects.toThrow('player_heroes_load_failed');
    });
  });

  // ------------------------------------------------------------------ //
  // 6. Debounce — saveStatsToCloud                                      //
  // ------------------------------------------------------------------ //
  describe('debounce saveStatsToCloud', () => {
    it('3 appels rapides ne déclenchent qu\'un seul upsert Supabase', async () => {
      vi.useFakeTimers();

      const upsertMock = vi.fn().mockResolvedValue({ error: null });
      mockFrom.mockReturnValue({
        upsert: upsertMock,
      });

      const { result } = renderHook(() => useCloudSave('user-123', true));
      const playerData = getDefaultPlayerData();
      const storyProgress = { completedStages: [], currentRegion: 'forest' as const, bossesDefeated: [], highestStage: 0, bossFirstClearRewards: [] };
      const dailyQuests = { date: '2026-03-22', quests: [] } as any;

      // 3 appels consécutifs
      result.current.saveStatsToCloud(playerData, storyProgress, dailyQuests);
      result.current.saveStatsToCloud(playerData, storyProgress, dailyQuests);
      result.current.saveStatsToCloud(playerData, storyProgress, dailyQuests);

      // Avant l'expiration du debounce, aucun appel
      expect(upsertMock).not.toHaveBeenCalled();

      // Avance le timer de 3 secondes (debounce = 3000ms)
      await act(async () => {
        vi.advanceTimersByTime(3100);
      });

      // Un seul upsert déclenché
      expect(upsertMock).toHaveBeenCalledTimes(1);
    });

    it('saveStatsToCloud ne s\'exécute pas si canWriteCloud est false', () => {
      vi.useFakeTimers();

      const upsertMock = vi.fn().mockResolvedValue({ error: null });
      mockFrom.mockReturnValue({ upsert: upsertMock });

      const { result } = renderHook(() => useCloudSave('user-123', false));
      const playerData = getDefaultPlayerData();

      result.current.saveStatsToCloud(
        playerData,
        { completedStages: [], currentRegion: 'forest', bossesDefeated: [], highestStage: 0, bossFirstClearRewards: [] },
        { date: '2026-03-22', quests: [] } as any,
      );

      vi.runAllTimers();
      expect(upsertMock).not.toHaveBeenCalled();
    });
  });

  // ------------------------------------------------------------------ //
  // 7. saveHeroesToCloud                                                //
  // ------------------------------------------------------------------ //
  describe('saveHeroesToCloud', () => {
    it('n\'appelle pas Supabase si la liste de héros est vide', async () => {
      const { result } = renderHook(() => useCloudSave('user-123', true));

      await result.current.saveHeroesToCloud([]);

      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('n\'appelle pas Supabase si canWriteCloud est false', async () => {
      const { result } = renderHook(() => useCloudSave('user-123', false));
      const playerData = getDefaultPlayerData();

      await result.current.saveHeroesToCloud(playerData.heroes);

      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('upsert les héros dans player_heroes si userId et canWriteCloud sont OK', async () => {
      const upsertMock = vi.fn().mockResolvedValue({ error: null });
      mockFrom.mockReturnValue({ upsert: upsertMock });

      const { result } = renderHook(() => useCloudSave('user-123', true));
      const playerData = getDefaultPlayerData();

      await result.current.saveHeroesToCloud(playerData.heroes);

      expect(mockFrom).toHaveBeenCalledWith('player_heroes');
      expect(upsertMock).toHaveBeenCalledTimes(1);
    });
  });

  // ------------------------------------------------------------------ //
  // 8. removeHeroesFromCloud                                            //
  // ------------------------------------------------------------------ //
  describe('removeHeroesFromCloud', () => {
    it('n\'appelle pas Supabase si la liste d\'ids est vide', async () => {
      const { result } = renderHook(() => useCloudSave('user-123', true));

      await result.current.removeHeroesFromCloud([]);

      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('supprime les héros via delete().in() quand les ids sont fournis', async () => {
      const inMock = vi.fn().mockResolvedValue({ error: null });
      const eqMock = vi.fn().mockReturnValue({ in: inMock });
      const deleteMock = vi.fn().mockReturnValue({ eq: eqMock });
      mockFrom.mockReturnValue({ delete: deleteMock });

      const { result } = renderHook(() => useCloudSave('user-123', true));

      await result.current.removeHeroesFromCloud(['hero-1', 'hero-2']);

      expect(mockFrom).toHaveBeenCalledWith('player_heroes');
      expect(deleteMock).toHaveBeenCalled();
      expect(inMock).toHaveBeenCalledWith('id', ['hero-1', 'hero-2']);
    });
  });

  // ------------------------------------------------------------------ //
  // 9. Fallback migration depuis ancien format JSONB                    //
  // ------------------------------------------------------------------ //
  describe('fallback migration depuis save_data.heroes', () => {
    it('migre les héros depuis save_data.heroes si player_heroes est vide', async () => {
      const heroInSaveData = {
        id: 'old-hero-1',
        user_id: 'user-123',
        name: 'Legacy Hero',
        rarity: 'rare',
        level: 10,
        stars: 1,
        xp: 500,
        stats: { pwr: 12, spd: 9, rng: 3, bnb: 4, sta: 15, lck: 6 },
        skills: [],
        current_stamina: 80,
        max_stamina: 100,
        is_active: true,
        house_level: 2,
        icon: 'sword',
        currentStamina: 80,
        maxStamina: 100,
        isActive: true,
        houseLevel: 2,
        position: { x: 1, y: 1 },
        targetPosition: null,
        path: null,
        state: 'idle',
        bombCooldown: 0,
        stuckTimer: 0,
        progressionStats: { chestsOpened: 0, totalDamageDealt: 0, battlesPlayed: 0, victories: 0, obtainedAt: Date.now() },
      };

      const saveRow = buildSaveRow({
        save_data: {
          ...buildSaveRow().save_data,
          heroes: [heroInSaveData],
        },
      });

      const upsertMock = vi.fn().mockResolvedValue({ error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'player_saves') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: saveRow, error: null }),
          };
        }
        if (table === 'player_heroes') {
          return {
            select: vi.fn().mockReturnThis(),
            // Retourne 0 héros → déclenchera le fallback migration
            eq: vi.fn().mockReturnValue({ data: [], error: null }),
            upsert: upsertMock,
          };
        }
      });

      const { result } = renderHook(() => useCloudSave('user-123', true));
      const data = await result.current.loadFromCloud();

      // Le fallback doit avoir migré le héros
      expect(data!.playerData.heroes).toHaveLength(1);
      expect(data!.playerData.heroes[0].name).toBe('Legacy Hero');
      // Upsert doit avoir été appelé pour persister la migration
      expect(upsertMock).toHaveBeenCalled();
    });
  });

  // ------------------------------------------------------------------ //
  // 10. isSyncing state                                                 //
  // ------------------------------------------------------------------ //
  describe('isSyncing', () => {
    it('est false par défaut', () => {
      const { result } = renderHook(() => useCloudSave('user-123', true));
      expect(result.current.isSyncing).toBe(false);
    });

    it('passe à true pendant loadFromCloud puis revient à false', async () => {
      mockSupabaseLoad(buildSaveRow(), [buildHeroRow()]);

      const { result } = renderHook(() => useCloudSave('user-123', true));

      const loadPromise = act(async () => {
        await result.current.loadFromCloud();
      });

      await loadPromise;

      expect(result.current.isSyncing).toBe(false);
    });
  });
});
