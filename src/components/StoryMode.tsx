import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StoryRegion, StoryStage, StoryProgress } from '@/game/storyTypes';
import { STORY_REGIONS } from '@/game/storyData';
import { Hero, PlayerData } from '@/game/types';
import { ChevronLeft, ChevronRight, Lock, Star, Swords, Trophy, Coins, Shield, Skull, Crown, Users, Check } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import HeroCard from '@/components/HeroCard';
import PixelIcon from '@/components/PixelIcon';

interface StoryModeProps {
  player: PlayerData;
  storyProgress: StoryProgress;
  selectedHeroes: Set<string>;
  onToggleHero: (id: string) => void;
  onStartStage: (stage: StoryStage) => void;
  selectedRegionIdx: number;
  onRegionChange: (idx: number) => void;
}

const StoryMode: React.FC<StoryModeProps> = ({
  player,
  storyProgress,
  selectedHeroes,
  onToggleHero,
  onStartStage,
  selectedRegionIdx,
  onRegionChange,
}) => {
  const [selectedStage, setSelectedStage] = useState<StoryStage | null>(null);

  const region = STORY_REGIONS[selectedRegionIdx];
  const prevRegion = selectedRegionIdx > 0 ? STORY_REGIONS[selectedRegionIdx - 1] : null;
  const prevRegionBossStage = prevRegion?.stages.find(s => s.isBoss);
  const prevRegionBossComplete = !prevRegionBossStage || storyProgress.completedStages.includes(prevRegionBossStage.id);
  const isRegionLocked = !prevRegionBossComplete || player.accountLevel < region.unlockLevel;

  const completedInRegion = region.stages.filter(s => storyProgress.completedStages.includes(s.id)).length;
  const regionProgress = (completedInRegion / region.stages.length) * 100;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Header */}
      <div className="text-center py-4">
        <h2 className="font-pixel text-sm sm:text-lg text-foreground text-glow-red mb-1 flex items-center justify-center gap-2">
          <Swords size={20} /> MODE HISTOIRE
        </h2>
        <p className="text-xs text-muted-foreground">Combats les ennemis et vaincs les boss !</p>
      </div>

      {/* Region Navigator */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onRegionChange(Math.max(0, selectedRegionIdx - 1))}
          disabled={selectedRegionIdx === 0}
          className="pixel-btn pixel-btn-secondary font-pixel text-[8px] p-2 disabled:opacity-30"
        >
          <ChevronLeft size={14} />
        </button>
        
        <div
          className="flex-1 pixel-border p-4 text-center relative overflow-hidden"
          style={{ background: isRegionLocked ? 'hsl(var(--muted))' : region.bgColor }}
        >
          {isRegionLocked && (
            <div className="absolute inset-0 bg-background/70 flex items-center justify-center z-10">
              <div className="text-center">
                <Lock size={24} className="mx-auto mb-1 text-muted-foreground" />
                {!prevRegionBossComplete
                  ? <p className="font-pixel text-[8px] text-muted-foreground">Vaincre le boss de {prevRegion?.name}</p>
                  : <p className="font-pixel text-[8px] text-muted-foreground">Niveau {region.unlockLevel} requis</p>
                }
              </div>
            </div>
          )}
          <div className="flex justify-center mb-2">
            <PixelIcon icon={region.icon} size={36} color="hsl(var(--foreground))" />
          </div>
          <h3 className="font-pixel text-xs text-foreground">{region.name}</h3>
          <p className="text-[10px] text-muted-foreground mt-1">{region.description}</p>
          <div className="mt-2 flex items-center gap-2 justify-center">
            <Progress value={regionProgress} className="w-32 h-2" />
            <span className="font-pixel text-[8px] text-muted-foreground">{completedInRegion}/{region.stages.length}</span>
          </div>
        </div>

        <button
          onClick={() => onRegionChange(Math.min(STORY_REGIONS.length - 1, selectedRegionIdx + 1))}
          disabled={selectedRegionIdx === STORY_REGIONS.length - 1}
          className="pixel-btn pixel-btn-secondary font-pixel text-[8px] p-2 disabled:opacity-30"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Region dots */}
      <div className="flex justify-center gap-2">
        {STORY_REGIONS.map((r, i) => (
          <button
            key={r.id}
            onClick={() => onRegionChange(i)}
            className={`w-3 h-3 rounded-full transition-all ${
              i === selectedRegionIdx ? 'bg-primary scale-125' : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
            }`}
          />
        ))}
      </div>

      {/* Stage Selection */}
      {!isRegionLocked && !selectedStage && (
        <div className="pixel-border bg-card p-4">
          <h3 className="font-pixel text-[10px] text-foreground mb-3 flex items-center gap-2">
            <Skull size={14} /> ÉTAPES
          </h3>
          <div className="space-y-2">
            {region.stages.map((stage, i) => {
              const isCompleted = storyProgress.completedStages.includes(stage.id);
              const prevCompleted = i === 0 || storyProgress.completedStages.includes(region.stages[i - 1].id);
              const isLocked = !prevCompleted || player.accountLevel < stage.unlockLevel;

              return (
                <button
                  key={stage.id}
                  onClick={() => !isLocked && setSelectedStage(stage)}
                  disabled={isLocked}
                  className={`w-full pixel-border p-3 text-left transition-all relative ${
                    isLocked
                      ? 'bg-muted/50 opacity-50 cursor-not-allowed'
                      : isCompleted
                      ? 'bg-primary/10 hover:bg-primary/15'
                      : 'bg-muted hover:bg-muted/80 hover:scale-[1.01]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded flex items-center justify-center bg-muted/50">
                        <PixelIcon icon={stage.icon} size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-pixel text-[8px] text-foreground">{stage.stageNumber}. {stage.name}</p>
                          {stage.isBoss && (
                            <span className="font-pixel text-[7px] px-1.5 py-0.5 rounded bg-destructive/20 text-destructive flex items-center gap-1">
                              <Crown size={8} /> BOSS
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                            <Shield size={9} /> {stage.enemies.reduce((s, e) => s + e.count, 0)} ennemis
                          </span>
                          <span className="text-[9px] text-game-gold flex items-center gap-1">
                            <Coins size={9} /> {stage.reward} BC
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isCompleted && <Check size={16} className="text-primary" />}
                      {isLocked && <Lock size={14} className="text-muted-foreground" />}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Stage Detail / Launch */}
      {!isRegionLocked && selectedStage && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          <button
            onClick={() => setSelectedStage(null)}
            className="pixel-btn pixel-btn-secondary font-pixel text-[8px] flex items-center gap-1"
          >
            <ChevronLeft size={12} /> Retour aux étapes
          </button>

          <div className="pixel-border bg-card p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                <PixelIcon icon={selectedStage.icon} size={28} />
              </div>
              <div>
                <h3 className="font-pixel text-xs text-foreground">{selectedStage.name}</h3>
                <p className="text-[10px] text-muted-foreground">{region.name} • Étape {selectedStage.stageNumber}</p>
              </div>
              {selectedStage.isBoss && (
                <span className="font-pixel text-[8px] px-2 py-1 rounded bg-destructive/20 text-destructive flex items-center gap-1 ml-auto">
                  <Crown size={10} /> BOSS
                </span>
              )}
            </div>

            {/* Stage info */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="pixel-border bg-muted p-2 text-center">
                <Shield size={14} className="mx-auto mb-1 text-destructive" />
                <p className="font-pixel text-[8px] text-foreground">
                  {selectedStage.enemies.reduce((s, e) => s + e.count, 0)} ennemis
                </p>
                <p className="text-[8px] text-muted-foreground">
                  {selectedStage.enemies.map(e => `${e.count}× ${e.type}`).join(', ')}
                </p>
              </div>
              <div className="pixel-border bg-muted p-2 text-center">
                <Coins size={14} className="mx-auto mb-1 text-game-gold" />
                <p className="font-pixel text-[8px] text-game-gold">{selectedStage.reward} BC</p>
                <p className="text-[8px] text-muted-foreground">+{selectedStage.xpReward} XP</p>
              </div>
            </div>

            {selectedStage.isBoss && selectedStage.boss && (
              <div className="pixel-border bg-destructive/10 p-3 mb-4 text-center">
                <p className="font-pixel text-[8px] text-destructive mb-1 flex items-center justify-center gap-1">
                  <Skull size={12} /> PUZZLE BOSS
                </p>
                <p className="text-[9px] text-muted-foreground">
                  Patterns spéciaux : charge, invincibilité, invocation de minions
                </p>
              </div>
            )}

            {/* Hero selection */}
            <p className="font-pixel text-[8px] text-muted-foreground mb-2 flex items-center gap-1.5">
              <Users size={12} /> Sélectionne tes héros ({selectedHeroes.size}/6) :
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
              {player.heroes.map(hero => (
                <HeroCard
                  key={hero.id}
                  hero={hero}
                  compact
                  selected={selectedHeroes.has(hero.id)}
                  onClick={() => onToggleHero(hero.id)}
                />
              ))}
            </div>

            <button
              onClick={() => onStartStage(selectedStage)}
              className="pixel-btn pixel-btn-gold w-full font-pixel text-xs flex items-center justify-center gap-2"
            >
              <Swords size={16} /> LANCER LE COMBAT !
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default StoryMode;
