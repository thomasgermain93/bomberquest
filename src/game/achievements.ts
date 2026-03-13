import { Rarity } from './types';

export type AchievementCategory = 'invocation' | 'combat' | 'progression' | 'collection';

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  target: number;
  isHidden?: boolean;
}

export interface AchievementProgress {
  progress: number;
  unlocked: boolean;
  unlockedAt?: number;
}

export type AchievementState = Record<string, AchievementProgress>;

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: 'first_summon',
    title: 'Première invocation',
    description: 'Effectuez votre première invocation',
    category: 'invocation',
    target: 1,
  },
  {
    id: 'summon_10',
    title: 'Apprenti invocateur',
    description: 'Effectuez 10 invocations',
    category: 'invocation',
    target: 10,
  },
  {
    id: 'summon_100',
    title: 'Maître invocateur',
    description: 'Effectuez 100 invocations',
    category: 'invocation',
    target: 100,
  },
  {
    id: 'first_victory',
    title: 'Première victoire',
    description: 'Gagnez votre premier combat',
    category: 'combat',
    target: 1,
  },
  {
    id: 'combat_10',
    title: 'Combattant aguerri',
    description: 'Gagnez 10 combats',
    category: 'combat',
    target: 10,
  },
  {
    id: 'combat_50',
    title: 'Vétéran',
    description: 'Gagnez 50 combats',
    category: 'combat',
    target: 50,
  },
  {
    id: 'level_5',
    title: 'Niveau 5',
    description: 'Atteignez le niveau 5',
    category: 'progression',
    target: 5,
  },
  {
    id: 'level_10',
    title: 'Niveau 10',
    description: 'Atteignez le niveau 10',
    category: 'progression',
    target: 10,
  },
  {
    id: 'super_legend',
    title: 'Super Légende',
    description: 'Obtenez un héros Super Légende',
    category: 'collection',
    target: 1,
  },
  {
    id: 'legend',
    title: 'Légende',
    description: 'Obtenez un héros Légende',
    category: 'collection',
    target: 1,
  },
];

export const getAchievementDefinitions = () => ACHIEVEMENTS;

export const getAchievementById = (id: string): AchievementDefinition | undefined => 
  ACHIEVEMENTS.find(a => a.id === id);

export const getDefaultAchievementState = (): AchievementState => {
  const state: AchievementState = {};
  for (const achievement of ACHIEVEMENTS) {
    state[achievement.id] = { progress: 0, unlocked: false };
  }
  return state;
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
  let newState = { ...state };
  const unlocked: AchievementDefinition[] = [];
  
  const updates = [
    { id: 'first_summon', value: totalSummons },
    { id: 'summon_10', value: totalSummons },
    { id: 'summon_100', value: totalSummons },
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
  let newState = { ...state };
  const unlocked: AchievementDefinition[] = [];
  
  const updates = [
    { id: 'first_victory', value: totalWins },
    { id: 'combat_10', value: totalWins },
    { id: 'combat_50', value: totalWins },
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
  let newState = { ...state };
  const unlocked: AchievementDefinition[] = [];
  
  const updates = [
    { id: 'level_5', value: newLevel },
    { id: 'level_10', value: newLevel },
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
  let newState = { ...state };
  const unlocked: AchievementDefinition[] = [];
  
  let updateId: string | null = null;
  if (rarity === 'legend') updateId = 'legend';
  if (rarity === 'super-legend') updateId = 'super_legend';
  
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