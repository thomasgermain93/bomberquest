import { useState, useEffect, useRef } from 'react';
import { Hero, PlayerData, Rarity, RARITY_CONFIG } from '@/game/types';
import { summonHero, generateHero } from '@/game/summoning';
import { trackSummon, trackRarityUnlock, trackHeroCount, AchievementDefinition } from '@/game/achievements';
import { DailyQuestData, updateQuestProgress } from '@/game/questSystem';
import { toast } from 'sonner';

interface UseSummonLogicParams {
  player: PlayerData;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerData>>;
  setDailyQuests: React.Dispatch<React.SetStateAction<DailyQuestData>>;
  canWriteCloud: boolean;
  saveHeroesToCloud: (heroes: Hero[]) => void;
  removeHeroesFromCloud: (ids: string[]) => void;
}

export interface UseSummonLogicReturn {
  /** Last individually summoned hero (for display) */
  lastSummoned: Hero | null;
  /** Batch of heroes from the last summon action */
  summonedBatch: Hero[];
  /** Brief flash flag for summon animation */
  showSummonFlash: boolean;
  /** Summon tab state */
  summonTab: 'coins' | 'shards';
  setSummonTab: React.Dispatch<React.SetStateAction<'coins' | 'shards'>>;
  /** Selected shard rarity for shard-based summon */
  selectedShardRarity: Rarity;
  setSelectedShardRarity: React.Dispatch<React.SetStateAction<Rarity>>;
  /** Summon via BomberCoins */
  handleSummon: (type: 'single' | 'x10' | 'x100') => void;
  /** Summon via Universal Shards */
  handleSummonShards: () => void;
  /** Shard cost table */
  SHARD_COSTS: Record<Rarity, number>;
}

const SHARD_COSTS: Record<Rarity, number> = {
  common: 10, rare: 50, 'super-rare': 150, epic: 400, legend: 1000, 'super-legend': 2500,
};

export function useSummonLogic({
  player,
  setPlayer,
  setDailyQuests,
  canWriteCloud,
  saveHeroesToCloud,
  removeHeroesFromCloud,
}: UseSummonLogicParams): UseSummonLogicReturn {
  const [lastSummoned, setLastSummoned] = useState<Hero | null>(null);
  const [summonedBatch, setSummonedBatch] = useState<Hero[]>([]);
  const [showSummonFlash, setShowSummonFlash] = useState(false);
  const [summonTab, setSummonTab] = useState<'coins' | 'shards'>('coins');
  const [selectedShardRarity, setSelectedShardRarity] = useState<Rarity>('rare');
  const prevSummonedBatchRef = useRef<Hero[]>([]);

  // Flash effect on new batch
  useEffect(() => {
    if (summonedBatch.length > 0 && summonedBatch !== prevSummonedBatchRef.current) {
      prevSummonedBatchRef.current = summonedBatch;
      setShowSummonFlash(true);
      const t = setTimeout(() => setShowSummonFlash(false), 200);
      return () => clearTimeout(t);
    }
  }, [summonedBatch]);

  const handleSummon = (type: 'single' | 'x10' | 'x100') => {
    const cost = type === 'single' ? 1000 : type === 'x10' ? 9000 : 80000;
    if (player.bomberCoins < cost) return;

    const count = type === 'single' ? 1 : type === 'x10' ? 10 : 100;
    let currentPity = { ...player.pityCounters };
    let newCoins = player.bomberCoins - cost;
    const newHeroes = [...player.heroes];
    const batch: Hero[] = [];

    for (let i = 0; i < count; i++) {
      const { hero, updatedPity } = summonHero(currentPity);
      currentPity = updatedPity;
      newHeroes.push(hero);
      batch.push(hero);
    }

    const mergedHeroes = newHeroes;

    setLastSummoned(batch[batch.length - 1]);
    setSummonedBatch(batch);

    const newTotalSummons = player.totalHeroesOwned + count;
    const newAchievements = { ...player.achievements };
    const newAchievementUnlocks: AchievementDefinition[] = [];

    const { newState: summonState, unlocked: summonUnlocks } = trackSummon(player.achievements, newTotalSummons);
    Object.assign(newAchievements, summonState);
    newAchievementUnlocks.push(...summonUnlocks);

    const hasLegend = batch.some(h => h.rarity === 'legend');
    const hasSuperLegend = batch.some(h => h.rarity === 'super-legend');
    const hasEpic = batch.some(h => h.rarity === 'epic');
    if (hasSuperLegend) {
      const { newState, unlocked } = trackRarityUnlock(player.achievements, 'super-legend');
      Object.assign(newAchievements, newState);
      newAchievementUnlocks.push(...unlocked);
    } else if (hasLegend) {
      const { newState, unlocked } = trackRarityUnlock(player.achievements, 'legend');
      Object.assign(newAchievements, newState);
      newAchievementUnlocks.push(...unlocked);
    } else if (hasEpic) {
      const { newState, unlocked } = trackRarityUnlock(player.achievements, 'epic');
      Object.assign(newAchievements, newState);
      newAchievementUnlocks.push(...unlocked);
    }

    const { newState: heroCountState, unlocked: heroCountUnlocks } = trackHeroCount(player.achievements, mergedHeroes.length);
    Object.assign(newAchievements, heroCountState);
    newAchievementUnlocks.push(...heroCountUnlocks);

    setPlayer(prev => ({
      ...prev,
      bomberCoins: newCoins,
      heroes: mergedHeroes,
      pityCounters: currentPity,
      totalHeroesOwned: mergedHeroes.length,
      achievements: newAchievements,
    }));

    for (const achievement of newAchievementUnlocks) {
      toast({
        title: 'Succès débloqué!',
        description: achievement.title,
      });
    }

    if (canWriteCloud) {
      const addedHeroes = mergedHeroes.filter(h => !player.heroes.some(existing => existing.id === h.id));
      const removedExistingHeroIds = player.heroes
        .filter(h => !mergedHeroes.some(m => m.id === h.id))
        .map(h => h.id);

      if (addedHeroes.length > 0) saveHeroesToCloud(addedHeroes);
      if (removedExistingHeroIds.length > 0) removeHeroesFromCloud(removedExistingHeroIds);
    }
    setDailyQuests(prev => updateQuestProgress(prev, 'summon_heroes', count));
  };

  const handleSummonShards = () => {
    const cost = SHARD_COSTS[selectedShardRarity];
    if (player.universalShards < cost) {
      toast({ title: 'Fragments insuffisants', description: `Il te faut ${cost} Fragments pour cette invocation.` });
      return;
    }

    const newHero = generateHero(selectedShardRarity);
    const newHeroes = [...player.heroes, newHero];

    setLastSummoned(newHero);
    setSummonedBatch([newHero]);

    const newTotalSummons = player.totalHeroesOwned + 1;
    const newAchievements = { ...player.achievements };
    const newAchievementUnlocks: AchievementDefinition[] = [];

    const { newState: summonState, unlocked: summonUnlocks } = trackSummon(player.achievements, newTotalSummons);
    Object.assign(newAchievements, summonState);
    newAchievementUnlocks.push(...summonUnlocks);

    const { newState: heroCountState, unlocked: heroCountUnlocks } = trackHeroCount(player.achievements, newHeroes.length);
    Object.assign(newAchievements, heroCountState);
    newAchievementUnlocks.push(...heroCountUnlocks);

    setPlayer(prev => ({
      ...prev,
      heroes: newHeroes,
      totalHeroesOwned: newHeroes.length,
      achievements: newAchievements,
      universalShards: prev.universalShards - cost,
    }));

    for (const achievement of newAchievementUnlocks) {
      toast({ title: 'Succès débloqué!', description: achievement.title });
    }

    if (canWriteCloud) {
      saveHeroesToCloud([newHero]);
    }
    setDailyQuests(prev => updateQuestProgress(prev, 'summon_heroes', 1));
  };

  return {
    lastSummoned,
    summonedBatch,
    showSummonFlash,
    summonTab,
    setSummonTab,
    selectedShardRarity,
    setSelectedShardRarity,
    handleSummon,
    handleSummonShards,
    SHARD_COSTS,
  };
}
