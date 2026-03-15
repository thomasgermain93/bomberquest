import { useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Hero, PlayerData } from '@/game/types';
import { StoryProgress } from '@/game/storyTypes';
import { DailyQuestData } from '@/game/questSystem';

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
function rowToHero(row: any): Hero {
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
  };
}

export function useCloudSave(userId: string | undefined, canWriteCloud: boolean) {
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const heroSyncTimerRef = useRef<ReturnType<typeof setTimeout>>();

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

    if (heroesResult.data) {
      if (heroesResult.data.length > 0) {
        // Normal case: heroes in dedicated table
        heroes = heroesResult.data.map(rowToHero);
      } else if (saveData?.save_data) {
        // One-shot migration: old account with heroes embedded in save_data JSONB
        const oldData = saveData.save_data as any;
        if (Array.isArray(oldData?.heroes) && oldData.heroes.length > 0) {
          const rows = oldData.heroes.map((h: Hero) => heroToRow(h, userId));
          await supabase.from('player_heroes').upsert(rows, { onConflict: 'id,user_id' });
          heroes = rows.map(rowToHero);
        }
      }
    }

    const rawStats = saveData.save_data as any;
    const { heroes: _removedHeroes, ...statsOnly } = rawStats ?? {};

    const playerData: PlayerData = {
      ...(statsOnly as PlayerData),
      heroes,
    };

    console.log('CLOUD_LOAD_ROWS', {
      hasSave: !!saveData,
      heroRows: heroes.length,
      migratedFromLegacy: heroesResult.data?.length === 0 && heroes.length > 0,
    });

    return {
      playerData,
      storyProgress: saveData.story_progress as unknown as StoryProgress,
      dailyQuests: saveData.daily_quests as unknown as DailyQuestData,
    };
  }, [userId]);

  const saveHeroesToCloud = useCallback(async (heroes: Hero[]) => {
    if (!userId || !canWriteCloud || heroes.length === 0) return;
    const rows = heroes.map(h => heroToRow(h, userId));
    await supabase.from('player_heroes').upsert(rows, { onConflict: 'id,user_id' });
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
      // Strip heroes from save_data — they live in player_heroes
      const { heroes: _, ...statsOnly } = playerData;
      await supabase
        .from('player_saves')
        .upsert({
          user_id: userId,
          save_data: statsOnly as any,
          story_progress: storyProgress as any,
          daily_quests: dailyQuests as any,
        }, { onConflict: 'user_id' });
    }, 3000);
  }, [userId, canWriteCloud]);

  const syncHeroesSnapshotToCloud = useCallback((heroes: Hero[]) => {
    if (!userId || !canWriteCloud) return;
    if (heroSyncTimerRef.current) clearTimeout(heroSyncTimerRef.current);

    heroSyncTimerRef.current = setTimeout(async () => {
      const rows = heroes.map(h => heroToRow(h, userId));

      if (rows.length > 0) {
        await supabase.from('player_heroes').upsert(rows, { onConflict: 'id,user_id' });
      }

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

      if (idsToDelete.length > 0) {
        await supabase.from('player_heroes').delete().eq('user_id', userId).in('id', idsToDelete);
      }
    }, 1200);
  }, [userId, canWriteCloud]);

  return { loadFromCloud, saveHeroesToCloud, removeHeroesFromCloud, saveStatsToCloud, syncHeroesSnapshotToCloud };
}
