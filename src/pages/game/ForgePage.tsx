import React from 'react';
import { motion } from 'framer-motion';
import { pixelFade } from '@/lib/animations';
import { Sparkles, Zap, X } from 'lucide-react';
import { PlayerData, RARITY_CONFIG } from '@/game/types';
import { Hero } from '@/game/types';
import HeroAvatar from '@/components/HeroAvatar';
import HeroPickerBottomSheet from '@/components/HeroPickerBottomSheet';
import RecyclePanel from '@/components/RecyclePanel';
import { MERGE_RECIPES } from '@/hooks/useFusionLogic';

type ForgeTab = 'fusion' | 'recycle';

interface ForgePageProps {
  player: PlayerData;
  forgeTab: ForgeTab;
  setForgeTab: (tab: ForgeTab) => void;
  // Fusion state from useFusionLogic
  selectedRecipeIdx: number;
  setSelectedRecipeIdx: (idx: number) => void;
  fusionSlots: (Hero | null)[];
  lastFusedHero: Hero | null;
  setLastFusedHero: (hero: Hero | null) => void;
  isMerging: boolean;
  getAvailableForMerge: (rarity: string) => { maxed: number };
  executeFusionFromSlots: () => void;
  handleSlotClick: (slotIdx: number) => void;
  handleHeroSelect: (hero: Hero) => void;
  handleSlotClear: (slotIdx: number) => void;
  mergeAll: () => void;
  // Fusion picker state
  fusionPickerOpen: boolean;
  setFusionPickerOpen: (open: boolean) => void;
  fusionPickerSlot: number;
  setFusionPickerSlot: (slot: number) => void;
  fusionPickerHeroes: Hero[];
  setFusionPickerHeroes: (heroes: Hero[]) => void;
  // Recycle handlers
  handleRecycle: (ids: string[], shardsGained: number) => void;
  handleToggleLock: (heroId: string) => void;
}

const ForgePage: React.FC<ForgePageProps> = ({
  player,
  forgeTab,
  setForgeTab,
  selectedRecipeIdx,
  setSelectedRecipeIdx,
  fusionSlots,
  lastFusedHero,
  setLastFusedHero,
  isMerging,
  getAvailableForMerge,
  executeFusionFromSlots,
  handleSlotClick,
  handleHeroSelect,
  handleSlotClear,
  mergeAll,
  fusionPickerOpen,
  setFusionPickerOpen,
  fusionPickerSlot,
  setFusionPickerSlot,
  fusionPickerHeroes,
  setFusionPickerHeroes,
  handleRecycle,
  handleToggleLock,
}) => {
  return (
    <div className="w-1/6 h-full overflow-y-auto pb-nav md:pl-16">
      <div className="p-4 max-w-2xl mx-auto">
        {/* Sub-tabs Fusion | Recyclage */}
        <div className="flex gap-1 mb-4 sticky top-0 bg-background/95 backdrop-blur py-2 z-10">
          {(['fusion', 'recycle'] as const).map(tab => (
            <button key={tab} onClick={() => setForgeTab(tab)}
              className={`flex-1 font-pixel text-[8px] py-2 rounded transition-colors ${
                forgeTab === tab ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
              {tab === 'fusion' ? 'Fusion' : 'Recyclage'}
            </button>
          ))}
        </div>

        {/* Fusion */}
        {forgeTab === 'fusion' && (
          <motion.div variants={pixelFade} initial="hidden" animate="visible" className="space-y-4">

            {/* Sélecteur de recette — compact */}
            <div className="flex gap-2 flex-wrap">
              {MERGE_RECIPES.map((recipe, idx) => {
                const { maxed } = getAvailableForMerge(recipe.from);
                const canMerge = maxed >= recipe.count;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedRecipeIdx(idx)}
                    className={`pixel-border px-3 py-2 text-center transition-all flex-1 min-w-[80px] ${
                      selectedRecipeIdx === idx
                        ? 'ring-2 ring-primary bg-primary/10'
                        : canMerge
                          ? 'bg-muted hover:bg-muted/80'
                          : 'bg-muted/30 opacity-60'
                    }`}
                  >
                    <span className="font-pixel text-[7px]" style={{ color: `hsl(var(--game-rarity-${recipe.from}))` }}>
                      {RARITY_CONFIG[recipe.from].label}
                    </span>
                    <span className="font-pixel text-[7px] text-muted-foreground mx-1">→</span>
                    <span className="font-pixel text-[7px]" style={{ color: `hsl(var(--game-rarity-${recipe.to}))` }}>
                      {RARITY_CONFIG[recipe.to].label}
                    </span>
                    <p className="text-[7px] text-muted-foreground mt-0.5">{maxed}/{recipe.count}</p>
                  </button>
                );
              })}
            </div>

            {/* FORGE */}
            <div className="pixel-border bg-card p-4 space-y-5">

              {/* Slot Principal — héros à upgrader */}
              <div>
                <p className="font-pixel text-[8px] text-muted-foreground mb-2 flex items-center gap-1">
                  <span className="text-primary">▲</span> HÉROS À UPGRADER
                </p>
                <div className="flex justify-center">
                  <button
                    onClick={() => {
                      const recipe = MERGE_RECIPES[selectedRecipeIdx];
                      const alreadyIds = new Set(fusionSlots.slice(1).filter(Boolean).map(h => h!.id));
                      setFusionPickerHeroes(
                        player.heroes.filter(h =>
                          h.rarity === recipe.from &&
                          h.level >= RARITY_CONFIG[recipe.from].maxLevel &&
                          !alreadyIds.has(h.id)
                        )
                      );
                      handleSlotClick(0);
                      setFusionPickerSlot(0);
                      setFusionPickerOpen(true);
                    }}
                    className={`w-28 h-28 pixel-border transition-all flex flex-col items-center justify-center gap-2 ${
                      fusionSlots[0]
                        ? `bg-card rarity-${fusionSlots[0].rarity} hover:scale-105`
                        : 'bg-muted/30 border-dashed hover:bg-muted/50'
                    }`}
                  >
                    {fusionSlots[0] ? (
                      <>
                        <HeroAvatar heroId={fusionSlots[0].id} heroName={fusionSlots[0].name} rarity={fusionSlots[0].rarity} size={48} />
                        <p className="font-pixel text-[8px] text-foreground truncate max-w-[96px]">{fusionSlots[0].name.split(' ')[0]}</p>
                        <p className="font-pixel text-[7px]" style={{ color: `hsl(var(--game-rarity-${fusionSlots[0].rarity}))` }}>
                          {RARITY_CONFIG[fusionSlots[0].rarity].label} · niv.{fusionSlots[0].level}
                        </p>
                      </>
                    ) : (
                      <>
                        <span className="text-3xl text-muted-foreground/40">+</span>
                        <p className="font-pixel text-[7px] text-muted-foreground">Choisir</p>
                      </>
                    )}
                  </button>
                </div>
                {/* Flèche et résultat */}
                {fusionSlots[0] && (
                  <div className="text-center mt-2">
                    <p className="font-pixel text-[8px] text-muted-foreground">↓ fusionné en</p>
                    <p className="font-pixel text-[9px]" style={{ color: `hsl(var(--game-rarity-${MERGE_RECIPES[selectedRecipeIdx].to}))` }}>
                      {RARITY_CONFIG[MERGE_RECIPES[selectedRecipeIdx].to].label} · niv.{RARITY_CONFIG[MERGE_RECIPES[selectedRecipeIdx].from].maxLevel}
                    </p>
                  </div>
                )}
              </div>

              {/* Séparateur */}
              <div className="border-t border-border/50" />

              {/* Slots Nourriture */}
              <div>
                <p className="font-pixel text-[8px] text-muted-foreground mb-3 flex items-center gap-1">
                  <span className="text-destructive">▼</span> NOURRITURES ({fusionSlots.slice(1).filter(Boolean).length}/{MERGE_RECIPES[selectedRecipeIdx].count - 1})
                </p>
                <div className="flex flex-wrap gap-3 justify-center">
                  {Array.from({ length: MERGE_RECIPES[selectedRecipeIdx].count - 1 }).map((_, i) => {
                    const slotIdx = i + 1;
                    const hero = fusionSlots[slotIdx];
                    const alreadyIds = new Set([
                      fusionSlots[0]?.id,
                      ...fusionSlots.slice(1).filter((_, ii) => ii !== i).filter(Boolean).map(h => h!.id),
                    ].filter(Boolean) as string[]);
                    return (
                      <div key={slotIdx} className="relative">
                        <button
                          onClick={() => {
                            const recipe = MERGE_RECIPES[selectedRecipeIdx];
                            setFusionPickerHeroes(
                              player.heroes.filter(h =>
                                h.rarity === recipe.from &&
                                h.level >= RARITY_CONFIG[recipe.from].maxLevel &&
                                !alreadyIds.has(h.id) &&
                                !h.isLocked
                              )
                            );
                            handleSlotClick(slotIdx);
                            setFusionPickerSlot(slotIdx);
                            setFusionPickerOpen(true);
                          }}
                          className={`w-20 h-20 pixel-border transition-all flex flex-col items-center justify-center gap-1 ${
                            hero
                              ? `bg-card rarity-${hero.rarity} hover:scale-105`
                              : 'bg-muted/30 border-dashed hover:bg-muted/50'
                          }`}
                        >
                          {hero ? (
                            <>
                              <HeroAvatar heroId={hero.id} heroName={hero.name} rarity={hero.rarity} size={36} />
                              <p className="font-pixel text-[7px] text-foreground truncate max-w-[72px]">{hero.name.split(' ')[0]}</p>
                            </>
                          ) : (
                            <span className="text-2xl text-muted-foreground/40">+</span>
                          )}
                        </button>
                        {hero && (
                          <button
                            onClick={() => handleSlotClear(slotIdx)}
                            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive flex items-center justify-center"
                          >
                            <X size={10} className="text-white" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Résultat de fusion */}
              {lastFusedHero && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="pixel-border bg-card p-4 flex flex-col items-center gap-2 text-center"
                >
                  <p className="font-pixel text-[8px] text-game-gold">✨ FUSION RÉUSSIE !</p>
                  <HeroAvatar heroId={lastFusedHero.id} heroName={lastFusedHero.name} rarity={lastFusedHero.rarity} size={48} />
                  <p className="font-pixel text-[9px] text-foreground">{lastFusedHero.name}</p>
                  <button onClick={() => setLastFusedHero(null)} className="pixel-btn pixel-btn-secondary font-pixel text-[8px] px-3 py-1 min-h-0">
                    Continuer
                  </button>
                </motion.div>
              )}

              {/* Bouton fusionner */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={executeFusionFromSlots}
                  disabled={fusionSlots.filter(Boolean).length !== MERGE_RECIPES[selectedRecipeIdx].count}
                  className={`pixel-btn pixel-btn-gold w-full font-pixel text-xs flex items-center justify-center gap-2 min-h-[44px] ${
                    fusionSlots.filter(Boolean).length !== MERGE_RECIPES[selectedRecipeIdx].count ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <Sparkles size={16} /> FUSIONNER
                </button>
                <button onClick={mergeAll} disabled={isMerging} className="pixel-btn pixel-btn-secondary font-pixel text-[8px] flex items-center justify-center gap-2 w-full">
                  <Zap size={12} /> TOUT FUSIONNER
                </button>
              </div>
            </div>

            {/* Bottom sheet picker */}
            <HeroPickerBottomSheet
              open={fusionPickerOpen}
              heroes={fusionPickerHeroes}
              selectedIds={new Set(fusionSlots.filter(Boolean).map(h => h!.id))}
              onSelect={(hero) => {
                handleHeroSelect(hero);
                setFusionPickerOpen(false);
              }}
              onClose={() => setFusionPickerOpen(false)}
              title={fusionPickerSlot === 0 ? 'CHOISIR LE HÉROS À UPGRADER' : 'CHOISIR UNE NOURRITURE'}
            />

          </motion.div>
        )}

        {/* Recyclage */}
        {forgeTab === 'recycle' && (
          <motion.div variants={pixelFade} initial="hidden" animate="visible" className="space-y-4">
            <div className="pixel-border bg-card p-3 sm:p-4">
              <RecyclePanel
                heroes={player.heroes}
                universalShards={player.universalShards}
                onRecycle={handleRecycle}
                onToggleLock={handleToggleLock}
              />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ForgePage;
