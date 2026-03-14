import { Rarity } from './types';

export type AchievementCategory = 'invocation' | 'combat' | 'progression' | 'collection';

export interface AchievementReward {
  type: 'coins' | 'shards';
  amount: number;
  rarity?: string;
}

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  target: number;
  reward: AchievementReward;
  isHidden?: boolean;
}

export interface AchievementProgress {
  progress: number;
  unlocked: boolean;
  unlockedAt?: number;
  claimedAt?: number;
}

export type AchievementState = Record<string, AchievementProgress>;

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: 'first_summon',
    title: 'Première invocation',
    description: 'Effectuez votre première invocation',
    category: 'invocation',
    target: 1,
    reward: { type: 'coins', amount: 100 },
  },
  {
    id: 'summon_10',
    title: 'Apprenti invocateur',
    description: 'Effectuez 10 invocations',
    category: 'invocation',
    target: 10,
    reward: { type: 'coins', amount: 500 },
  },
  {
    id: 'summon_50',
    title: 'InvocateurEXPERT',
    description: 'Effectuez 50 invocations',
    category: 'invocation',
    target: 50,
    reward: { type: 'coins', amount: 2000 },
  },
  {
    id: 'summon_100',
    title: 'Maître invocateur',
    description: 'Effectuez 100 invocations',
    category: 'invocation',
    target: 100,
    reward: { type: 'shards', amount: 10, rarity: 'legend' },
  },
  {
    id: 'summon_500',
    title: 'Légende de l\'invocation',
    description: 'Effectuez 500 invocations',
    category: 'invocation',
    target: 500,
    reward: { type: 'shards', amount: 50, rarity: 'legend' },
  },
  {
    id: 'first_victory',
    title: 'Première victoire',
    description: 'Gagnez votre premier combat',
    category: 'combat',
    target: 1,
    reward: { type: 'coins', amount: 100 },
  },
  {
    id: 'combat_10',
    title: 'Combattant aguerri',
    description: 'Gagnez 10 combats',
    category: 'combat',
    target: 10,
    reward: { type: 'coins', amount: 500 },
  },
  {
    id: 'combat_50',
    title: 'Vétéran',
    description: 'Gagnez 50 combats',
    category: 'combat',
    target: 50,
    reward: { type: 'coins', amount: 2000 },
  },
  {
    id: 'combat_100',
    title: 'Guerrier vétéran',
    description: 'Gagnez 100 combats',
    category: 'combat',
    target: 100,
    reward: { type: 'shards', amount: 10, rarity: 'super-rare' },
  },
  {
    id: 'combat_500',
    title: 'Légende guerrière',
    description: 'Gagnez 500 combats',
    category: 'combat',
    target: 500,
    reward: { type: 'shards', amount: 50, rarity: 'legend' },
  },
  {
    id: 'first_boss',
    title: 'Tueur de boss',
    description: 'Vainquez votre premier boss',
    category: 'combat',
    target: 1,
    reward: { type: 'coins', amount: 500 },
  },
  {
    id: 'boss_5',
    title: 'Chasseur de boss',
    description: 'Vainquez 5 boss',
    category: 'combat',
    target: 5,
    reward: { type: 'shards', amount: 20, rarity: 'epic' },
  },
  {
    id: 'boss_25',
    title: 'Destructeur de boss',
    description: 'Vainquez 25 boss',
    category: 'combat',
    target: 25,
    reward: { type: 'shards', amount: 100, rarity: 'legend' },
  },
  {
    id: 'first_chest',
    title: 'Premier coffre',
    description: 'Ouvrez votre premier coffre',
    category: 'collection',
    target: 1,
    reward: { type: 'coins', amount: 50 },
  },
  {
    id: 'chest_25',
    title: 'Collectionneur',
    description: 'Ouvrez 25 coffres',
    category: 'collection',
    target: 25,
    reward: { type: 'coins', amount: 500 },
  },
  {
    id: 'chest_100',
    title: 'Maître du trésor',
    description: 'Ouvrez 100 coffres',
    category: 'collection',
    target: 100,
    reward: { type: 'shards', amount: 10, rarity: 'rare' },
  },
  {
    id: 'chest_500',
    title: 'Seigneur des coffres',
    description: 'Ouvrez 500 coffres',
    category: 'collection',
    target: 500,
    reward: { type: 'shards', amount: 30, rarity: 'super-rare' },
  },
  {
    id: 'hero_10',
    title: 'Éleveur de héros',
    description: 'Possédez 10 héros différents',
    category: 'collection',
    target: 10,
    reward: { type: 'coins', amount: 500 },
  },
  {
    id: 'hero_25',
    title: 'CollectionneurEXPERT',
    description: 'Possédez 25 héros différents',
    category: 'collection',
    target: 25,
    reward: { type: 'shards', amount: 15, rarity: 'rare' },
  },
  {
    id: 'hero_50',
    title: 'Maître collectionneur',
    description: 'Possédez 50 héros différents',
    category: 'collection',
    target: 50,
    reward: { type: 'shards', amount: 50, rarity: 'epic' },
  },
  {
    id: 'level_5',
    title: 'Niveau 5',
    description: 'Atteignez le niveau 5',
    category: 'progression',
    target: 5,
    reward: { type: 'coins', amount: 200 },
  },
  {
    id: 'level_10',
    title: 'Niveau 10',
    description: 'Atteignez le niveau 10',
    category: 'progression',
    target: 10,
    reward: { type: 'coins', amount: 500 },
  },
  {
    id: 'level_25',
    title: 'ExplorateurLvL',
    description: 'Atteignez le niveau 25',
    category: 'progression',
    target: 25,
    reward: { type: 'shards', amount: 10, rarity: 'rare' },
  },
  {
    id: 'level_50',
    title: 'Champion',
    description: 'Atteignez le niveau 50',
    category: 'progression',
    target: 50,
    reward: { type: 'shards', amount: 25, rarity: 'epic' },
  },
  {
    id: 'super_legend',
    title: 'Super Légende',
    description: 'Obtenez un héros Super Légende',
    category: 'collection',
    target: 1,
    reward: { type: 'shards', amount: 5, rarity: 'super-legend' },
  },
  {
    id: 'legend',
    title: 'Légende',
    description: 'Obtenez un héros Légende',
    category: 'collection',
    target: 1,
    reward: { type: 'shards', amount: 3, rarity: 'legend' },
  },
  {
    id: 'epic',
    title: 'Héros Épique',
    description: 'Obtenez un héros Épique',
    category: 'collection',
    target: 1,
    reward: { type: 'shards', amount: 5, rarity: 'epic' },
  },
  {
    id: 'all_common',
    title: 'Collectionneur commun',
    description: 'Obtenez un héros de chaque rareté commune',
    category: 'collection',
    target: 1,
    reward: { type: 'coins', amount: 300 },
  },
  {
    id: 'all_rare',
    title: 'Collectionneur rare',
    description: 'Obtenez 10 héros de rareté Rare ou supérieure',
    category: 'collection',
    target: 10,
    reward: { type: 'shards', amount: 10, rarity: 'rare' },
  },
];

export const getAchievementDefinitions = () => ACHIEVEMENTS;

export const getAchievementById = (id: string): AchievementDefinition | undefined => 
  ACHIEVEMENTS.find(a => a.id === id);

export const getDefaultAchievementState = (): AchievementState => {
  const state: AchievementState = {};
  for (const achievement of ACHIEVEMENTS) {
    state[achievement.id] = { progress: 0, unlocked: false, claimedAt: undefined };
  }
  return state;
};

export const claimAchievementReward = (
  state: AchievementState,
  achievementId: string
): { newState: AchievementState; claimed: boolean; reward?: AchievementReward } => {
  const current = state[achievementId];
  const definition = getAchievementById(achievementId);
  
  if (!current || !current.unlocked || !definition) {
    return { newState: state, claimed: false };
  }
  
  if (current.claimedAt) {
    return { newState: state, claimed: false };
  }
  
  const newState = {
    ...state,
    [achievementId]: {
      ...current,
      claimedAt: Date.now(),
    },
  };
  
  return { newState, claimed: true, reward: definition.reward };
};

export const canClaimReward = (state: AchievementState, achievementId: string): boolean => {
  const current = state[achievementId];
  return !!(current && current.unlocked && !current.claimedAt);
};

export const checkAchievementProgress = (
  state: AchievementState,
  achievementId: string,
  newValue: number
): { progress: AchievementProgress; newlyUnlocked: boolean } => {
  const current = state[achievementId] || { progress: 0, unlocked: false };
  const definition = getAchievementById(achievementId);
  
  if (!definition) return { progress: current, newlyUnlocked: false };
  
  const newProgress = Math.min(newValue, definition.target);
  const newlyUnlocked = !current.unlocked && newProgress >= definition.target;
  
  const updatedProgress: AchievementProgress = {
    progress: newProgress,
    unlocked: current.unlocked || newlyUnlocked,
    unlockedAt: newlyUnlocked ? Date.now() : current.unlockedAt,
  };
  
  return { progress: updatedProgress, newlyUnlocked };
};

export const updateAchievement = (
  state: AchievementState,
  achievementId: string,
  newValue: number
): AchievementState => {
  const { progress, newlyUnlocked } = checkAchievementProgress(state, achievementId, newValue);
  return {
    ...state,
    [achievementId]: progress,
  };
};

export const getUnlockedAchievements = (state: AchievementState): AchievementDefinition[] => {
  return ACHIEVEMENTS.filter(a => state[a.id]?.unlocked);
};

export const getInProgressAchievements = (state: AchievementState): AchievementDefinition[] => {
  return ACHIEVEMENTS.filter(a => {
    const progress = state[a.id];
    return progress && !progress.unlocked && progress.progress > 0;
  });
};

export const getLockedAchievements = (state: AchievementState): AchievementDefinition[] => {
  return ACHIEVEMENTS.filter(a => {
    const progress = state[a.id];
    return !progress || (progress.progress === 0 && !progress.unlocked);
  });
};

export const getAchievementsByCategory = (state: AchievementState, category: AchievementCategory): AchievementDefinition[] => {
  return ACHIEVEMENTS.filter(a => a.category === category);
};

export const trackSummon = (state: AchievementState, totalSummons: number): { newState: AchievementState; unlocked: AchievementDefinition[] } => {
  const newState = { ...state };
  const unlocked: AchievementDefinition[] = [];
  
  const updates = [
    { id: 'first_summon', value: totalSummons },
    { id: 'summon_10', value: totalSummons },
    { id: 'summon_50', value: totalSummons },
    { id: 'summon_100', value: totalSummons },
    { id: 'summon_500', value: totalSummons },
  ];
  
  for (const update of updates) {
    const { progress, newlyUnlocked } = checkAchievementProgress(newState, update.id, update.value);
    newState[update.id] = progress;
    if (newlyUnlocked) {
      const def = getAchievementById(update.id);
      if (def) unlocked.push(def);
    }
  }
  
  return { newState, unlocked };
};

export const trackCombatVictory = (state: AchievementState, totalWins: number): { newState: AchievementState; unlocked: AchievementDefinition[] } => {
  const newState = { ...state };
  const unlocked: AchievementDefinition[] = [];
  
  const updates = [
    { id: 'first_victory', value: totalWins },
    { id: 'combat_10', value: totalWins },
    { id: 'combat_50', value: totalWins },
    { id: 'combat_100', value: totalWins },
    { id: 'combat_500', value: totalWins },
  ];
  
  for (const update of updates) {
    const { progress, newlyUnlocked } = checkAchievementProgress(newState, update.id, update.value);
    newState[update.id] = progress;
    if (newlyUnlocked) {
      const def = getAchievementById(update.id);
      if (def) unlocked.push(def);
    }
  }
  
  return { newState, unlocked };
};

export const trackLevelUp = (state: AchievementState, newLevel: number): { newState: AchievementState; unlocked: AchievementDefinition[] } => {
  const newState = { ...state };
  const unlocked: AchievementDefinition[] = [];
  
  const updates = [
    { id: 'level_5', value: newLevel },
    { id: 'level_10', value: newLevel },
    { id: 'level_25', value: newLevel },
    { id: 'level_50', value: newLevel },
  ];
  
  for (const update of updates) {
    const { progress, newlyUnlocked } = checkAchievementProgress(newState, update.id, update.value);
    newState[update.id] = progress;
    if (newlyUnlocked) {
      const def = getAchievementById(update.id);
      if (def) unlocked.push(def);
    }
  }
  
  return { newState, unlocked };
};

export const trackRarityUnlock = (state: AchievementState, rarity: Rarity): { newState: AchievementState; unlocked: AchievementDefinition[] } => {
  const newState = { ...state };
  const unlocked: AchievementDefinition[] = [];
  
  let updateId: string | null = null;
  if (rarity === 'legend') updateId = 'legend';
  if (rarity === 'super-legend') updateId = 'super_legend';
  if (rarity === 'epic') updateId = 'epic';
  
  if (updateId) {
    const { progress, newlyUnlocked } = checkAchievementProgress(newState, updateId, 1);
    newState[updateId] = progress;
    if (newlyUnlocked) {
      const def = getAchievementById(updateId);
      if (def) unlocked.push(def);
    }
  }
  
  return { newState, unlocked };
};

export const trackChestsOpened = (state: AchievementState, totalChests: number): { newState: AchievementState; unlocked: AchievementDefinition[] } => {
  const newState = { ...state };
  const unlocked: AchievementDefinition[] = [];
  
  const updates = [
    { id: 'first_chest', value: totalChests },
    { id: 'chest_25', value: totalChests },
    { id: 'chest_100', value: totalChests },
    { id: 'chest_500', value: totalChests },
  ];
  
  for (const update of updates) {
    const { progress, newlyUnlocked } = checkAchievementProgress(newState, update.id, update.value);
    newState[update.id] = progress;
    if (newlyUnlocked) {
      const def = getAchievementById(update.id);
      if (def) unlocked.push(def);
    }
  }
  
  return { newState, unlocked };
};

export const trackBossDefeated = (state: AchievementState, totalBosses: number): { newState: AchievementState; unlocked: AchievementDefinition[] } => {
  const newState = { ...state };
  const unlocked: AchievementDefinition[] = [];
  
  const updates = [
    { id: 'first_boss', value: totalBosses },
    { id: 'boss_5', value: totalBosses },
    { id: 'boss_25', value: totalBosses },
  ];
  
  for (const update of updates) {
    const { progress, newlyUnlocked } = checkAchievementProgress(newState, update.id, update.value);
    newState[update.id] = progress;
    if (newlyUnlocked) {
      const def = getAchievementById(update.id);
      if (def) unlocked.push(def);
    }
  }
  
  return { newState, unlocked };
};

export const trackHeroCount = (state: AchievementState, uniqueHeroes: number): { newState: AchievementState; unlocked: AchievementDefinition[] } => {
  const newState = { ...state };
  const unlocked: AchievementDefinition[] = [];
  
  const updates = [
    { id: 'hero_10', value: uniqueHeroes },
    { id: 'hero_25', value: uniqueHeroes },
    { id: 'hero_50', value: uniqueHeroes },
  ];
  
  for (const update of updates) {
    const { progress, newlyUnlocked } = checkAchievementProgress(newState, update.id, update.value);
    newState[update.id] = progress;
    if (newlyUnlocked) {
      const def = getAchievementById(update.id);
      if (def) unlocked.push(def);
    }
  }
  
  return { newState, unlocked };
};