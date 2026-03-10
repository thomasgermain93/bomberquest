import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PlayerData } from '@/game/types';
import { StoryProgress } from '@/game/storyTypes';
import { DailyQuestData } from '@/game/questSystem';

export function useCloudSave(userId: string | undefined) {
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const loadFromCloud = useCallback(async () => {
    if (!userId) return null;
    const { data, error } = await supabase
      .from('player_saves')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error || !data) return null;
    return {
      playerData: data.save_data as unknown as PlayerData,
      storyProgress: data.story_progress as unknown as StoryProgress,
      dailyQuests: data.daily_quests as unknown as DailyQuestData,
    };
  }, [userId]);

  const saveToCloud = useCallback((
    playerData: PlayerData,
    storyProgress: StoryProgress,
    dailyQuests: DailyQuestData
  ) => {
    if (!userId) return;
    // Debounce saves to avoid spamming
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      await supabase
        .from('player_saves')
        .upsert({
          user_id: userId,
          save_data: playerData as any,
          story_progress: storyProgress as any,
          daily_quests: dailyQuests as any,
        }, { onConflict: 'user_id' });
    }, 3000);
  }, [userId]);

  return { loadFromCloud, saveToCloud };
}
