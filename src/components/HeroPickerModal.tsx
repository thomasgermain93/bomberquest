import React from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Hero, RARITY_CONFIG } from '@/game/types';
import PixelIcon from '@/components/PixelIcon';
import { X, AlertCircle, Check, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import EmptyState from '@/components/EmptyState';
import { pixelPop } from '@/lib/animations';

interface HeroPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (hero: Hero) => void;
  heroes: Hero[];
  requiredRarity: string;
  requiredCount: number;
  alreadySelectedIds: string[];
}

interface HeroEligibility {
  hero: Hero;
  isEligible: boolean;
  reason: string;
}

const HeroPickerModal: React.FC<HeroPickerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  heroes,
  requiredRarity,
  requiredCount,
  alreadySelectedIds,
}) => {
  const requiredRarityConfig = RARITY_CONFIG[requiredRarity as keyof typeof RARITY_CONFIG];
  const maxLevel = requiredRarityConfig?.maxLevel ?? 20;

  const getEligibility = (hero: Hero): HeroEligibility => {
    if (alreadySelectedIds.includes(hero.id)) {
      return { hero, isEligible: false, reason: 'Déjà assigné' };
    }
    if (hero.rarity !== requiredRarity) {
      return { hero, isEligible: false, reason: `Rareté ${RARITY_CONFIG[hero.rarity as keyof typeof RARITY_CONFIG]?.label ?? hero.rarity} requise` };
    }
    if (hero.level < maxLevel) {
      return { hero, isEligible: false, reason: `Niveau ${maxLevel} requis (${hero.level}/${maxLevel})` };
    }
    return { hero, isEligible: true, reason: '' };
  };

  const eligibleHeroes = heroes.filter(h => getEligibility(h).isEligible);
  const ineligibleHeroes = heroes.filter(h => !getEligibility(h).isEligible);

  const sortedHeroes = [...eligibleHeroes, ...ineligibleHeroes];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b">
          <div>
            <h2 className="font-pixel text-[10px] text-foreground flex items-center gap-2 uppercase">
              Choisir un héros
            </h2>
            <p className="font-pixel text-[8px] text-muted-foreground mt-1">
              {requiredCount}× {requiredRarityConfig?.label ?? requiredRarity} niv. {maxLevel} requis(s)
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          {sortedHeroes.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Aucun héros disponible"
              description={`Besoin d'héros ${requiredRarityConfig?.label ?? requiredRarity} niveau ${maxLevel}.`}
              className="py-4"
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              <AnimatePresence>
                {sortedHeroes.map((hero) => {
                  const eligibility = getEligibility(hero);
                  return (
                    <motion.button
                      key={hero.id}
                      variants={pixelPop}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      onClick={() => eligibility.isEligible && onSelect(hero)}
                      disabled={!eligibility.isEligible}
                      className={`pixel-border p-3 flex flex-col items-center gap-2 transition-all relative ${
                        eligibility.isEligible
                          ? 'bg-card hover:bg-card hover:scale-105 cursor-pointer ring-2 ring-game-energy-green/30'
                          : 'bg-muted/30 cursor-not-allowed opacity-60 grayscale'
                      }`}
                    >
                      {eligibility.isEligible && (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-game-energy-green flex items-center justify-center">
                          <Check size={10} className="text-background" />
                        </div>
                      )}

                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{ 
                          boxShadow: eligibility.isEligible 
                            ? `0 0 12px hsl(var(--game-rarity-${hero.rarity}) / 0.4)` 
                            : 'none'
                        }}
                      >
                        <PixelIcon icon={hero.icon} size={28} rarity={hero.rarity} />
                      </div>

                      <div className="text-center">
                        <p className="font-pixel text-[8px] text-foreground truncate w-full">{hero.name}</p>
                        <div className="flex items-center justify-center gap-1 mt-0.5">
                          <span 
                            className="font-pixel text-[7px]" 
                            style={{ 
                              color: hero.level >= maxLevel 
                                ? 'hsl(var(--game-energy-green))' 
                                : `hsl(var(--game-rarity-${hero.rarity}))` 
                            }}
                          >
                            {hero.level}/{maxLevel}
                          </span>
                          {hero.level >= maxLevel && (
                            <span className="text-[8px] text-game-energy-green">★</span>
                          )}
                        </div>
                      </div>

                      {!eligibility.isEligible && (
                        <p className="text-[8px] text-destructive flex items-center gap-0.5 mt-1">
                          <AlertCircle size={8} /> {eligibility.reason}
                        </p>
                      )}
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        <div className="pt-4 border-t flex items-center justify-between">
          <div className="font-pixel text-[8px] text-muted-foreground">
            <span className="text-game-energy-green">{eligibleHeroes.length}</span> éligible(s)
            {' • '}
            <span>{ineligibleHeroes.length}</span> non éligible(s)
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HeroPickerModal;
