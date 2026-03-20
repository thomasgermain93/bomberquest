import { useEffect, useRef, useState } from 'react';
import { useCloudSave } from '@/hooks/useCloudSave';
import { PlayerData } from '@/game/types';
import { StoryProgress } from '@/game/storyTypes';
import { DailyQuestData, generateDailyQuests } from '@/game/questSystem';
import { getDefaultPlayerData } from '@/game/saveSystem';
import { toast } from 'sonner';

interface UseCloudSyncParams {
  userId: string | undefined;
  sessionAccessToken: string | undefined;
  authLoading: boolean;
}

interface UseCloudSyncReturn {
  /** True once the cloud session is valid and data has been validated */
  canWriteCloud: boolean;
  /** True while the initial cloud load is in progress */
  isCloudLoading: boolean;
  /** Cloud save helpers (pass-through from useCloudSave) */
  loadFromCloud: ReturnType<typeof useCloudSave>['loadFromCloud'];
  saveHeroesToCloud: ReturnType<typeof useCloudSave>['saveHeroesToCloud'];
  removeHeroesFromCloud: ReturnType<typeof useCloudSave>['removeHeroesFromCloud'];
  saveStatsToCloud: ReturnType<typeof useCloudSave>['saveStatsToCloud'];
  syncHeroesSnapshotToCloud: ReturnType<typeof useCloudSave>['syncHeroesSnapshotToCloud'];
}

/**
 * Wraps useCloudSave with session-readiness checks and initial cloud load logic.
 *
 * On mount (for authenticated users), it loads the cloud save and calls the
 * provided setters to hydrate player, storyProgress, and dailyQuests.
 */
export function useCloudSync(
  { userId, sessionAccessToken, authLoading }: UseCloudSyncParams,
  setPlayer: React.Dispatch<React.SetStateAction<PlayerData>>,
  setStoryProgress: React.Dispatch<React.SetStateAction<StoryProgress>>,
  setDailyQuests: React.Dispatch<React.SetStateAction<DailyQuestData>>,
  huntSpeedRef: React.MutableRefObject<number>,
): UseCloudSyncReturn {
  const [isCloudLoading, setIsCloudLoading] = useState(!!userId);
  const [cloudValidated, setCloudValidated] = useState(false);
  const cloudLoadedRef = useRef(false);

  const cloudSessionReady = Boolean(userId && sessionAccessToken && !authLoading);
  const canWriteCloud = cloudSessionReady && cloudValidated;

  const {
    loadFromCloud,
    saveHeroesToCloud,
    removeHeroesFromCloud,
    saveStatsToCloud,
    syncHeroesSnapshotToCloud,
  } = useCloudSave(userId, canWriteCloud);

  // Reset flags when user changes
  useEffect(() => {
    cloudLoadedRef.current = false;
    setCloudValidated(false);

    if (!userId) {
      setIsCloudLoading(false);
      return;
    }

    setIsCloudLoading(true);
  }, [userId]);

  // Load from cloud on mount (connected users only)
  useEffect(() => {
    if (!userId) return;
    if (!cloudSessionReady) return;
    if (cloudLoadedRef.current) return;

    setIsCloudLoading(true);

    const CLOUD_LOAD_TIMEOUT = 3500;
    const RETRY_DELAY_MS = 400;
    const MAX_RETRIES = 0;

    const loadWithRetry = async (retryCount = 0): Promise<any> => {
      const timeoutPromise = new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), CLOUD_LOAD_TIMEOUT);
      });

      try {
        const data = await Promise.race([loadFromCloud(), timeoutPromise]);
        return data;
      } catch (err) {
        const error = err as Error & { code?: string };
        console.error('CLOUD_LOAD_ERROR', { code: error.code || 'UNKNOWN', message: error.message, retryCount });

        if (retryCount < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
          return loadWithRetry(retryCount + 1);
        }
        return null;
      }
    };

    let cancelled = false;
    loadWithRetry().then(data => {
      if (cancelled) return;
      const today = new Date().toISOString().split('T')[0];
      if (data) {
        setPlayer(data.playerData);
        setStoryProgress(data.storyProgress ?? { completedStages: [], currentRegion: 'forest', bossesDefeated: [], highestStage: 0, bossFirstClearRewards: [] });
        setDailyQuests(data.dailyQuests?.date === today ? data.dailyQuests : generateDailyQuests());
        const cloudSpeed = data.playerData.huntSpeed;
        if (cloudSpeed === 2 || cloudSpeed === 3) huntSpeedRef.current = cloudSpeed;
        setCloudValidated(true);
      } else {
        // Pas de save cloud -> nouvel utilisateur
        setPlayer(getDefaultPlayerData());
        setStoryProgress({ completedStages: [], currentRegion: 'forest', bossesDefeated: [], highestStage: 0, bossFirstClearRewards: [] });
        setDailyQuests(generateDailyQuests());
        setCloudValidated(true);
      }
      cloudLoadedRef.current = true;
    }).catch((err) => {
      if (cancelled) return;
      const error = err as Error & { code?: string };
      console.error('CLOUD_LOAD_UNEXPECTED_ERROR', { code: error.code || 'UNKNOWN', message: error.message });
      setCloudValidated(false);
      cloudLoadedRef.current = true;
      toast({ title: 'Cloud indisponible', description: 'Impossible de charger la sauvegarde. Réessaie.', duration: 4000 });
    }).finally(() => {
      if (!cancelled) setIsCloudLoading(false);
    });
    return () => { cancelled = true; };
  }, [userId, cloudSessionReady, loadFromCloud, setPlayer, setStoryProgress, setDailyQuests, huntSpeedRef]);

  return {
    canWriteCloud,
    isCloudLoading,
    loadFromCloud,
    saveHeroesToCloud,
    removeHeroesFromCloud,
    saveStatsToCloud,
    syncHeroesSnapshotToCloud,
  };
}
