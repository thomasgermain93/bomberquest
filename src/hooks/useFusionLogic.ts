import { useState, useEffect, useCallback } from 'react';
import { Hero, PlayerData, Rarity, RARITY_CONFIG } from '@/game/types';
import { generateHero } from '@/game/summoning';
import { toast } from 'sonner';

export const MERGE_RECIPES: { from: Rarity; to: Rarity; count: number }[] = [
  { from: 'common', to: 'rare', count: 2 },
  { from: 'rare', to: 'super-rare', count: 3 },
  { from: 'super-rare', to: 'epic', count: 4 },
  { from: 'epic', to: 'legend', count: 5 },
  { from: 'legend', to: 'super-legend', count: 6 },
];

interface UseFusionLogicParams {
  player: PlayerData;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerData>>;
  canWriteCloud: boolean;
  saveHeroesToCloud: (heroes: Hero[]) => void;
  removeHeroesFromCloud: (ids: string[]) => void;
}

export interface UseFusionLogicReturn {
  /** Currently selected merge recipe index */
  selectedRecipeIdx: number;
  setSelectedRecipeIdx: React.Dispatch<React.SetStateAction<number>>;
  /** Fusion slot contents */
  fusionSlots: (Hero | null)[];
  /** Last hero obtained through fusion */
  lastFusedHero: Hero | null;
  /** Hero picker modal open state */
  heroPickerOpen: boolean;
  setHeroPickerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  /** Which slot is active for hero picking */
  activeSlotIdx: number | null;
  /** Whether a batch merge is in progress */
  isMerging: boolean;
  /** Check if a hero is eligible for the given merge recipe */
  isHeroEligibleForMerge: (hero: Hero, rarity: Rarity, requiredCount: number) => { eligible: boolean; reason: string };
  /** Get count stats for a given rarity */
  getAvailableForMerge: (rarity: Rarity) => { total: number; maxed: number };
  /** Execute a single merge (quick merge) */
  handleMerge: (from: Rarity, to: Rarity, count: number) => void;
  /** Execute fusion from the slot UI */
  executeFusionFromSlots: () => void;
  /** Click a slot to open the hero picker */
  handleSlotClick: (index: number) => void;
  /** Select a hero from the picker into the active slot */
  handleHeroSelect: (hero: Hero) => void;
  /** Clear a slot */
  handleSlotClear: (index: number) => void;
  /** Merge all possible fusions at once */
  mergeAll: () => void;
  /** The recipes table */
  MERGE_RECIPES: typeof MERGE_RECIPES;
}

export function useFusionLogic({
  player,
  setPlayer,
  canWriteCloud,
  saveHeroesToCloud,
  removeHeroesFromCloud,
}: UseFusionLogicParams): UseFusionLogicReturn {
  const [selectedRecipeIdx, setSelectedRecipeIdx] = useState<number>(0);
  const [fusionSlots, setFusionSlots] = useState<(Hero | null)[]>([null, null]);
  const [lastFusedHero, setLastFusedHero] = useState<Hero | null>(null);
  const [heroPickerOpen, setHeroPickerOpen] = useState(false);
  const [activeSlotIdx, setActiveSlotIdx] = useState<number | null>(null);
  const [isMerging, setIsMerging] = useState(false);

  // Reset fusion slots when recipe changes
  useEffect(() => {
    setFusionSlots(Array(MERGE_RECIPES[selectedRecipeIdx].count).fill(null));
  }, [selectedRecipeIdx]);

  const isHeroEligibleForMerge = (hero: Hero, rarity: Rarity, requiredCount: number): { eligible: boolean; reason: string } => {
    const maxLevel = RARITY_CONFIG[rarity].maxLevel;
    if (hero.rarity !== rarity) {
      return { eligible: false, reason: `Rareté ${RARITY_CONFIG[rarity].label} requise` };
    }
    if (hero.level < maxLevel) {
      return { eligible: false, reason: `Niveau ${maxLevel} requis (${hero.level}/${maxLevel})` };
    }
    return { eligible: true, reason: '' };
  };

  const getAvailableForMerge = (rarity: Rarity): { total: number; maxed: number } => {
    const heroesOfRarity = player.heroes.filter(h => h.rarity === rarity);
    const maxLevel = RARITY_CONFIG[rarity].maxLevel;
    const maxed = heroesOfRarity.filter(h => h.level >= maxLevel).length;
    return { total: heroesOfRarity.length, maxed };
  };

  const handleMerge = (from: Rarity, to: Rarity, count: number) => {
    const maxLevel = RARITY_CONFIG[from].maxLevel;
    const available = player.heroes.filter(h => h.rarity === from && h.level >= maxLevel);
    if (available.length < count) {
      toast("Fusion impossible", { description: `Vous avez besoin de ${count} héros ${RARITY_CONFIG[from].label} niveau ${maxLevel}` });
      return;
    }

    const toRemove = new Set(available.slice(0, count).map(h => h.id));
    const removedIds = Array.from(toRemove);
    const newHero = generateHero(to);
    newHero.level = RARITY_CONFIG[from].maxLevel;
    const mergedHeroes = [...player.heroes.filter(h => !toRemove.has(h.id)), newHero];

    setPlayer(prev => ({
      ...prev,
      heroes: mergedHeroes,
      totalHeroesOwned: mergedHeroes.length,
    }));

    if (canWriteCloud) {
      saveHeroesToCloud([newHero]);
      removeHeroesFromCloud(removedIds);
    }

    toast("Fusion réussie!", { description: `${RARITY_CONFIG[from].label} → ${RARITY_CONFIG[to].label}` });
  };

  const executeFusionFromSlots = () => {
    const recipe = MERGE_RECIPES[selectedRecipeIdx];
    const filledSlots = fusionSlots.filter(s => s !== null) as Hero[];

    if (filledSlots.length !== recipe.count) {
      toast("Slots incomplets", { description: `Vous devez remplir ${recipe.count} slots` });
      return;
    }

    const toRemove = new Set(filledSlots.map(h => h.id));
    const removedIds = Array.from(toRemove);
    const newHero = generateHero(recipe.to);
    newHero.level = RARITY_CONFIG[recipe.from].maxLevel;
    const mergedHeroes = [...player.heroes.filter(h => !toRemove.has(h.id)), newHero];

    setPlayer(prev => ({
      ...prev,
      heroes: mergedHeroes,
      totalHeroesOwned: mergedHeroes.length,
    }));

    if (canWriteCloud) {
      saveHeroesToCloud([newHero]);
      removeHeroesFromCloud(removedIds);
    }

    setLastFusedHero(newHero);

    toast("Fusion réussie!", { description: `${RARITY_CONFIG[recipe.from].label} → ${RARITY_CONFIG[recipe.to].label}` });

    // Reset slots
    setFusionSlots(Array(recipe.count).fill(null));
  };

  const handleSlotClick = (index: number) => {
    setActiveSlotIdx(index);
    setHeroPickerOpen(true);
  };

  const handleHeroSelect = (hero: Hero) => {
    if (activeSlotIdx !== null) {
      const newSlots = [...fusionSlots];
      newSlots[activeSlotIdx] = hero;
      setFusionSlots(newSlots);
    }
    setHeroPickerOpen(false);
    setActiveSlotIdx(null);
  };

  const handleSlotClear = (index: number) => {
    const newSlots = [...fusionSlots];
    newSlots[index] = null;
    setFusionSlots(newSlots);
  };

  const mergeAll = useCallback(() => {
    if (isMerging) return;
    setIsMerging(true);

    let mergeCount = 0;
    let currentHeroes = [...player.heroes];
    let madeProgress = true;

    while (madeProgress) {
      madeProgress = false;
      for (const recipe of MERGE_RECIPES) {
        const maxLevel = RARITY_CONFIG[recipe.from].maxLevel;
        const available = currentHeroes.filter(h => h.rarity === recipe.from && h.level >= maxLevel);
        if (available.length >= recipe.count) {
          const toRemove = new Set(available.slice(0, recipe.count).map(h => h.id));
          const newHero = generateHero(recipe.to);
          newHero.level = RARITY_CONFIG[recipe.from].maxLevel;
          currentHeroes = [...currentHeroes.filter(h => !toRemove.has(h.id)), newHero];
          mergeCount++;
          madeProgress = true;
          break;
        }
      }
    }

    if (mergeCount > 0) {
      setPlayer(prev => ({ ...prev, heroes: currentHeroes, totalHeroesOwned: currentHeroes.length }));

      if (canWriteCloud) {
        const addedHeroes = currentHeroes.filter(h => !player.heroes.some(existing => existing.id === h.id));
        const removedHeroIds = player.heroes
          .filter(h => !currentHeroes.some(ch => ch.id === h.id))
          .map(h => h.id);

        if (addedHeroes.length > 0) saveHeroesToCloud(addedHeroes);
        if (removedHeroIds.length > 0) removeHeroesFromCloud(removedHeroIds);
      }

      toast("Fusion terminée", { description: `${mergeCount} fusion(s) effectuée(s)` });
    } else {
      toast("Aucune fusion possible", { description: "Vous n'avez pas assez de héros pour fusionner" });
    }

    setIsMerging(false);
  }, [player.heroes, isMerging, canWriteCloud, saveHeroesToCloud, removeHeroesFromCloud]);

  return {
    selectedRecipeIdx,
    setSelectedRecipeIdx,
    fusionSlots,
    lastFusedHero,
    heroPickerOpen,
    setHeroPickerOpen,
    activeSlotIdx,
    isMerging,
    isHeroEligibleForMerge,
    getAvailableForMerge,
    handleMerge,
    executeFusionFromSlots,
    handleSlotClick,
    handleHeroSelect,
    handleSlotClear,
    mergeAll,
    MERGE_RECIPES,
  };
}
