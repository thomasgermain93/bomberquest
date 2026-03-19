import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Hero, PlayerData } from '@/game/types';
import { StoryProgress } from '@/game/storyTypes';
import { DailyQuestData } from '@/game/questSystem';
import type { Database } from '@/integrations/supabase/types';

type PlayerHeroRow = Database['public']['Tables']['player_heroes']['Row'];

// Converts a Hero to a DB row (excludes runtime fields)
function heroToRow(hero: Hero, userId: string) {
  return {
    id: hero.id,
    user_id: userId,
    name: hero.name,
    rarity: hero.rarity,
    level: hero.level,
    stars: hero.stars,
    xp: hero.xp,
    stats: hero.stats as any,
    skills: hero.skills as any,
    current_stamina: hero.currentStamina,
    max_stamina: hero.maxStamina,
    is_active: hero.isActive,
    house_level: hero.houseLevel,
    icon: hero.icon,
  };
}

// Converts a DB row back to a Hero with runtime defaults
function rowToHero(row: PlayerHeroRow): Hero {
  return {
    id: row.id,
    name: row.name,
    rarity: row.rarity,
    level: Number.isFinite(Number(row.level)) ? Math.max(1, Math.min(Number(row.level), 120)) : 1,
    stars: row.stars,
    xp: Number.isFinite(Number(row.xp)) ? Number(row.xp) : 0,
    stats: row.stats,
    skills: row.skills,
    currentStamina: Number(row.current_stamina),
    maxStamina: Number(row.max_stamina),
    isActive: row.is_active,
    houseLevel: row.house_level,
    icon: row.icon,
    // Runtime defaults
    position: { x: 1, y: 1 },
    targetPosition: null,
    path: null,
    state: 'idle',
    bombCooldown: 0,
    stuckTimer: 0,
    progressionStats: (row as any).progression_stats ?? { chestsOpened: 0, totalDamageDealt: 0, battlesPlayed: 0, victories: 0, obtainedAt: Date.now() },
    isLocked: (row as any).is_locked ?? false,
    family: (row as any).family ?? undefined,
  };
}

export function useCloudSave(userId: string | undefined, canWriteCloud: boolean) {
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const heroSyncTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (heroSyncTimerRef.current) clearTimeout(heroSyncTimerRef.current);
    };
  }, []);

  const loadFromCloud = useCallback(async (): Promise<{
    playerData: PlayerData;
    storyProgress: StoryProgress;
    dailyQuests: DailyQuestData;
  } | null> => {
    if (!userId) return null;
    setIsSyncing(true);

    // Load stats and heroes in parallel
    const [savesResult, heroesResult] = await Promise.all([
      supabase.from('player_saves').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('player_heroes').select('*').eq('user_id', userId),
    ]);

    if (savesResult.error) {
      throw new Error(`player_saves_load_failed:${savesResult.error.message}`);
    }

    if (heroesResult.error) {
      throw new Error(`player_heroes_load_failed:${heroesResult.error.message}`);
    }

    const saveData = savesResult.data;
    if (!saveData) return null;

    let heroes: Hero[] = [];

    if (heroesResult.data && heroesResult.data.length > 0) {
      // Cas normal : héros dans la table dédiée
      heroes = heroesResult.data.map(rowToHero);
    } else {
      // Fallback 1 : migration depuis l'ancien format JSONB (save_data.heroes)
      const oldData = saveData.save_data as any;
      if (Array.isArray(oldData?.heroes) && oldData.heroes.length > 0) {
        const rows = oldData.heroes.map((h: Hero) => heroToRow(h, userId));
        await supabase.from('player_heroes').upsert(rows, { onConflict: 'id,user_id' });
        heroes = rows.map(rowToHero);
      }

      // Fallback 2 : backup récent stocké dans save_data.heroes_backup
      if (heroes.length === 0) {
        const backup = (saveData.save_data as any)?.heroes_backup;
        if (Array.isArray(backup) && backup.length > 0) {
          const rows = backup.map((h: Hero) => heroToRow(h, userId));
          await supabase.from('player_heroes').upsert(rows, { onConflict: 'id,user_id' });
          heroes = rows.map(rowToHero);
        }
      }
    }

    const rawStats = saveData.save_data as any;
    // Exclure les champs heroes/* du spread stats (ils restent dans player_heroes)
    const { heroes: _h, heroes_backup: _hb, ...statsOnly } = rawStats ?? {};

    const playerData: PlayerData = {
      ...(statsOnly as PlayerData),
      heroes,
    };

    console.log('CLOUD_LOAD_ROWS', {
      hasSave: !!saveData,
      heroRows: heroes.length,
      source: heroesResult.data?.length > 0 ? 'player_heroes' : heroes.length > 0 ? 'migration' : 'empty',
    });

    setIsSyncing(false);
    return {
      playerData,
      storyProgress: saveData.story_progress as unknown as StoryProgress,
      dailyQuests: saveData.daily_quests as unknown as DailyQuestData,
    };
  }, [userId]);

  const saveHeroesToCloud = useCallback(async (heroes: Hero[]) => {
    if (!userId || !canWriteCloud || heroes.length === 0) return;
    setIsSyncing(true);
    try {
      const rows = heroes.map(h => heroToRow(h, userId));
      await supabase.from('player_heroes').upsert(rows, { onConflict: 'id,user_id' });
    } finally {
      setIsSyncing(false);
    }
  }, [userId, canWriteCloud]);

  const removeHeroesFromCloud = useCallback(async (ids: string[]) => {
    if (!userId || !canWriteCloud || ids.length === 0) return;
    await supabase.from('player_heroes').delete().eq('user_id', userId).in('id', ids);
  }, [userId, canWriteCloud]);

  const saveStatsToCloud = useCallback((
    playerData: PlayerData,
    storyProgress: StoryProgress,
    dailyQuests: DailyQuestData,
  ) => {
    if (!userId || !canWriteCloud) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      setIsSyncing(true);
      try {
        const { heroes: _, ...statsOnly } = playerData;
        // Inclure heroes_backup dans save_data comme filet de sécurité
        // Au cas où player_heroes serait corrompu ou vidé
        const saveDataWithBackup = playerData.heroes.length > 0
          ? { ...statsOnly, heroes_backup: playerData.heroes }
          : statsOnly;
        await supabase
          .from('player_saves')
          .upsert({
            user_id: userId,
            save_data: saveDataWithBackup as any,
            story_progress: storyProgress as any,
            daily_quests: dailyQuests as any,
          }, { onConflict: 'user_id' });
      } finally {
        setIsSyncing(false);
      }
    }, 3000);
  }, [userId, canWriteCloud]);

  const syncHeroesSnapshotToCloud = useCallback((heroes: Hero[]) => {
    if (!userId || !canWriteCloud) return;
    // GUARD : ne jamais sync si le roster est vide (évite la suppression accidentelle)
    if (heroes.length === 0) return;
    if (heroSyncTimerRef.current) clearTimeout(heroSyncTimerRef.current);

    heroSyncTimerRef.current = setTimeout(async () => {
      setIsSyncing(true);
      try {
        const rows = heroes.map(h => heroToRow(h, userId));

        await supabase.from('player_heroes').upsert(rows, { onConflict: 'id,user_id' });

        const { data: existingRows, error } = await supabase
          .from('player_heroes')
          .select('id')
          .eq('user_id', userId);

        if (error) {
          throw new Error(`player_heroes_sync_failed:${error.message}`);
        }

        const keepIds = new Set(heroes.map(h => h.id));
        const idsToDelete = (existingRows || [])
          .map((row: any) => row.id as string)
          .filter(id => !keepIds.has(id));

        // Double guard : ne supprimer que si on a des héros à conserver
        if (idsToDelete.length > 0 && rows.length > 0) {
          await supabase.from('player_heroes').delete().eq('user_id', userId).in('id', idsToDelete);
        }
      } finally {
        setIsSyncing(false);
      }
    }, 1200);
  }, [userId, canWriteCloud]);

  return { loadFromCloud, saveHeroesToCloud, removeHeroesFromCloud, saveStatsToCloud, syncHeroesSnapshotToCloud, isSyncing };
}
