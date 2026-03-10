import React from 'react';
import PixelIcon from '@/components/PixelIcon';
import { Hero, RARITY_CONFIG } from '@/game/types';
import { getUpgradeCost, getStatsAtLevel, getAscensionCost, MAX_STARS, countDuplicates } from '@/game/upgradeSystem';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Swords, Zap, Target, Bomb, Battery, Clover, Shield, Star, ArrowUp, Coins, TrendingUp, Lock, Sparkles, Users } from 'lucide-react';

interface HeroUpgradeModalProps {
  hero: Hero | null;
  coins: number;
  heroCount?: { rarity: string; count: number }[];
  allHeroes?: Hero[];
  onClose: () => void;
  onUpgrade: (heroId: string) => void;
  onAscend?: (heroId: string) => void;
}

const STAT_META: Record<string, { icon: React.ReactNode; label: string }> = {
  pwr: { icon: <Swords size={14} />, label: 'Puissance' },
  spd: { icon: <Zap size={14} />, label: 'Vitesse' },
  rng: { icon: <Target size={14} />, label: 'Portée' },
  bnb: { icon: <Bomb size={14} />, label: 'Bombes' },
  sta: { icon: <Battery size={14} />, label: 'Endurance' },
  lck: { icon: <Clover size={14} />, label: 'Chance' },
};

const HeroUpgradeModal: React.FC<HeroUpgradeModalProps> = ({ hero, coins, allHeroes, onClose, onUpgrade, onAscend }) => {
  if (!hero) return null;

  const config = RARITY_CONFIG[hero.rarity];
  const isMaxLevel = hero.level >= 10;
  const isMaxStars = hero.stars >= MAX_STARS;
  const cost = isMaxLevel ? Infinity : getUpgradeCost(hero.level);
  const canAfford = coins >= cost;

  // For level up: show next level stats
  const nextLevelStats = isMaxLevel ? null : getStatsAtLevel(hero.rarity, hero.level + 1, hero.stars);

  // For ascension: show next star stats
  const ascensionInfo = isMaxLevel && !isMaxStars ? getAscensionCost(hero.stars) : null;
  const nextStarStats = ascensionInfo ? getStatsAtLevel(hero.rarity, hero.level, hero.stars + 1) : null;
  const duplicates = allHeroes ? countDuplicates(allHeroes, hero.id, hero.rarity) : 0;
  const canAscend = ascensionInfo ? coins >= ascensionInfo.cost && duplicates >= ascensionInfo.duplicates : false;

  // Choose which "next stats" to display
  const nextStats = nextLevelStats || nextStarStats;

  const staPct = (hero.currentStamina / hero.maxStamina) * 100;

  return (
    <Dialog open={!!hero} onOpenChange={() => onClose()}>
      <DialogContent className="pixel-border bg-card border-border max-w-md p-0 overflow-hidden rounded-none sm:rounded-lg max-h-[90vh]">
        {/* Header with rarity gradient */}
        <div
          className="p-5 pb-3 relative"
          style={{
            background: `linear-gradient(180deg, hsl(var(--game-rarity-${hero.rarity}) / 0.15) 0%, transparent 100%)`,
          }}
        >
          <DialogHeader>
            <DialogTitle className="font-pixel text-sm text-foreground flex items-center gap-2">
              <PixelIcon icon={hero.icon} size={24} rarity={hero.rarity} />
              {hero.name}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2 mt-1">
              <span
                className="font-pixel text-[10px] px-2 py-0.5 rounded"
                style={{
                  color: `hsl(var(--game-rarity-${hero.rarity}))`,
                  backgroundColor: `hsl(var(--game-rarity-${hero.rarity}) / 0.15)`,
                }}
              >
                {config.label}
              </span>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Shield size={10} /> Niv. {hero.level}
              </span>
              <span className="flex items-center gap-0.5">
                {Array.from({ length: hero.stars }).map((_, i) => (
                  <Star key={i} size={12} className="text-game-gold fill-current" />
                ))}
                {Array.from({ length: MAX_STARS - hero.stars }).map((_, i) => (
                  <Star key={`e${i}`} size={12} className="text-muted-foreground" />
                ))}
              </span>
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-5 pb-5 space-y-4">
          {/* Stamina bar */}
          <div>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
              <span className="flex items-center gap-1"><Battery size={10} /> Endurance</span>
              <span>{Math.floor(hero.currentStamina)}/{hero.maxStamina}</span>
            </div>
            <Progress value={staPct} className="h-2" />
          </div>

          {/* Stats comparison */}
          <div className="space-y-1.5">
            <p className="font-pixel text-[9px] text-muted-foreground flex items-center gap-1">
              <TrendingUp size={10} /> STATISTIQUES
            </p>
            {Object.entries(hero.stats).map(([key, val]) => {
              const meta = STAT_META[key];
              const nextVal = nextStats ? nextStats[key as keyof typeof nextStats] : null;
              const diff = nextVal ? nextVal - val : 0;
              return (
                <div key={key} className="flex items-center gap-2 text-[11px]">
                  <div className="flex items-center gap-1.5 w-24 text-muted-foreground">
                    {meta.icon}
                    <span>{meta.label}</span>
                  </div>
                  <div className="flex-1 flex items-center gap-2">
                    <span className="font-bold text-foreground w-8 text-right">{val}</span>
                    {nextVal !== null && diff > 0 && (
                      <>
                        <ArrowUp size={10} className={nextStarStats ? 'text-game-gold' : 'text-game-energy-green'} />
                        <span className={`font-bold ${nextStarStats ? 'text-game-gold' : 'text-game-energy-green'}`}>{nextVal}</span>
                        <span className={`text-[9px] ${nextStarStats ? 'text-game-gold' : 'text-game-energy-green'}`}>(+{key === 'lck' ? diff + '%' : diff})</span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Skills */}
          {hero.skills.length > 0 && (
            <div className="space-y-1">
              <p className="font-pixel text-[9px] text-muted-foreground flex items-center gap-1">
                <Zap size={10} /> COMPÉTENCES
              </p>
              {hero.skills.map((skill, i) => (
                <div key={i} className="bg-muted rounded px-2 py-1.5 text-[10px]">
                  <p className="text-foreground font-medium flex items-center gap-1">
                    <Zap size={9} className="text-accent" /> {skill.name}
                  </p>
                  <p className="text-muted-foreground mt-0.5">{skill.description}</p>
                </div>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-2 border-t border-border space-y-2">
            {/* Level Up */}
            {!isMaxLevel && (
              <Button
                onClick={() => onUpgrade(hero.id)}
                disabled={!canAfford}
                className="w-full font-pixel text-[10px] gap-2"
                variant={canAfford ? 'default' : 'secondary'}
              >
                {canAfford ? (
                  <>
                    <ArrowUp size={14} />
                    AMÉLIORER AU NIV. {hero.level + 1}
                    <span className="flex items-center gap-1 ml-1 opacity-80">
                      <Coins size={12} /> {cost.toLocaleString()} BC
                    </span>
                  </>
                ) : (
                  <>
                    <Lock size={14} />
                    {cost.toLocaleString()} BC REQUIS
                    <span className="text-destructive ml-1">(manque {(cost - coins).toLocaleString()})</span>
                  </>
                )}
              </Button>
            )}

            {/* Ascension */}
            {isMaxLevel && !isMaxStars && ascensionInfo && (
              <div className="space-y-2">
                <div className="bg-muted/50 rounded p-3 space-y-2">
                  <p className="font-pixel text-[9px] text-game-gold flex items-center gap-1">
                    <Sparkles size={12} /> ASCENSION — ÉTOILE {hero.stars + 1}/{MAX_STARS}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    L'ascension augmente toutes les stats de +{((hero.stars + 1) * 20)}% et renforce ton héros au-delà du niveau max.
                  </p>
                  <div className="flex items-center gap-4 text-[10px]">
                    <div className="flex items-center gap-1">
                      <Coins size={12} className="text-game-gold" />
                      <span className={coins >= ascensionInfo.cost ? 'text-game-energy-green' : 'text-destructive'}>
                        {ascensionInfo.cost.toLocaleString()} BC
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users size={12} className="text-primary" />
                      <span className={duplicates >= ascensionInfo.duplicates ? 'text-game-energy-green' : 'text-destructive'}>
                        {duplicates}/{ascensionInfo.duplicates} doublons {config.label}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => onAscend?.(hero.id)}
                  disabled={!canAscend}
                  className="w-full font-pixel text-[10px] gap-2 bg-game-gold/90 hover:bg-game-gold text-background"
                  variant="default"
                >
                  {canAscend ? (
                    <>
                      <Sparkles size={14} />
                      ASCENSION ★{hero.stars + 1}
                    </>
                  ) : (
                    <>
                      <Lock size={14} />
                      RESSOURCES INSUFFISANTES
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Fully maxed */}
            {isMaxLevel && isMaxStars && (
              <div className="text-center py-3">
                <p className="font-pixel text-[10px] text-game-gold flex items-center justify-center gap-1">
                  <Sparkles size={14} className="fill-current" />
                  HÉROS MAXIMUM ★★★
                  <Sparkles size={14} className="fill-current" />
                </p>
                <p className="text-[9px] text-muted-foreground mt-1">Niveau 10 • Ascension complète</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HeroUpgradeModal;
