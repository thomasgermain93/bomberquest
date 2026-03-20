import React from 'react';
import HeroAvatar from '@/components/HeroAvatar';
import { Hero, RARITY_CONFIG } from '@/game/types';
import { getStatsAtLevel, getAscensionCost, MAX_STARS, countDuplicates, getXpProgress, getMaxLevel, getUnlockedSkills } from '@/game/upgradeSystem';
import { Progress } from '@/components/ui/progress';
import { Swords, Zap, Target, Bomb, Battery, Clover, Shield, Star, ArrowUp, Coins, TrendingUp, Lock, Sparkles, Users, User, Calendar, Trophy, Gem } from 'lucide-react';

export const STAT_META: Record<string, { icon: React.ReactNode; label: string }> = {
  pwr: { icon: <Swords size={14} />, label: 'Puissance' },
  spd: { icon: <Zap size={14} />, label: 'Vitesse' },
  rng: { icon: <Target size={14} />, label: 'Portée' },
  bnb: { icon: <Bomb size={14} />, label: 'Bombes' },
  sta: { icon: <Battery size={14} />, label: 'Endurance' },
  lck: { icon: <Clover size={14} />, label: 'Chance' },
};

interface HeroDetailContentProps {
  hero: Hero;
  coins: number;
  allHeroes?: Hero[];
  activeTab: 'upgrade' | 'identity';
  onUpgrade: (heroId: string) => void;
  onAscend?: (heroId: string) => void;
  variant?: 'modal' | 'inline';
}

const HeroDetailContent: React.FC<HeroDetailContentProps> = ({
  hero,
  coins,
  allHeroes,
  activeTab,
  onUpgrade,
  onAscend,
  variant = 'modal',
}) => {
  const config = RARITY_CONFIG[hero.rarity];
  const maxLevel = getMaxLevel(hero.rarity);
  const isMaxLevel = hero.level >= maxLevel;
  const isMaxStars = hero.stars >= MAX_STARS;
  const xpProgress = getXpProgress(hero);

  const nextLevelStats = isMaxLevel ? null : getStatsAtLevel(hero.rarity, hero.level + 1, hero.stars);
  const ascensionInfo = isMaxLevel && !isMaxStars ? getAscensionCost(hero.stars) : null;
  const nextStarStats = ascensionInfo ? getStatsAtLevel(hero.rarity, hero.level, hero.stars + 1) : null;
  const duplicates = allHeroes ? countDuplicates(allHeroes, hero.id, hero.rarity) : 0;
  const canAscend = ascensionInfo ? coins >= ascensionInfo.cost && duplicates >= ascensionInfo.duplicates : false;
  const nextStats = nextLevelStats || nextStarStats;
  const staPct = hero.maxStamina > 0 ? Math.min(100, (hero.currentStamina / hero.maxStamina) * 100) : 0;

  const obtainedDate = new Date(hero.progressionStats.obtainedAt);
  const formattedDate = obtainedDate.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const winRate = hero.progressionStats.battlesPlayed > 0
    ? Math.round((hero.progressionStats.victories / hero.progressionStats.battlesPlayed) * 100)
    : 0;

  // Classes conditionnelles selon le variant
  const cardClass = variant === 'modal'
    ? 'pixel-border bg-muted/30 p-3'
    : 'bg-muted/30 rounded-lg p-3';
  const statCardClass = variant === 'modal'
    ? 'pixel-border bg-muted/30 p-3 flex flex-col items-center'
    : 'bg-muted/30 rounded-lg p-3 flex flex-col items-center';
  const skillCardClass = variant === 'modal'
    ? 'pixel-border bg-muted px-2 py-1.5 text-[10px]'
    : 'bg-muted rounded px-2 py-1.5 text-[10px]';
  const xpCardClass = variant === 'modal'
    ? 'pixel-border bg-muted/50 p-3 space-y-2'
    : 'bg-muted/50 rounded p-3 space-y-2';
  const ascensionCardClass = variant === 'modal'
    ? 'pixel-border bg-muted/50 p-3 space-y-2'
    : 'bg-muted/50 rounded p-3 space-y-2';
  const greenClass = variant === 'modal' ? 'text-game-green' : 'text-game-energy-green';

  if (activeTab === 'identity') {
    return (
      <div className="space-y-5">
        <div className="flex flex-col items-center">
          <div
            className={`w-20 h-20 ${variant === 'inline' ? 'rounded-xl' : ''} flex items-center justify-center mb-3`}
            style={{
              boxShadow: `0 0 20px hsl(var(--game-rarity-${hero.rarity}) / 0.4)`,
              background: `linear-gradient(135deg, hsl(var(--game-rarity-${hero.rarity}) / 0.2) 0%, hsl(var(--game-rarity-${hero.rarity}) / 0.05) 100%)`,
            }}
          >
            <HeroAvatar heroId={hero.id} heroName={hero.name} rarity={hero.rarity} size={80} />
          </div>
          <h3 className="font-pixel text-xs text-foreground">{hero.name}</h3>
          <span
            className="text-[10px] font-pixel mt-1"
            style={{ color: `hsl(var(--game-rarity-${hero.rarity}))` }}
          >
            {config.label}
          </span>
        </div>

        <div className={`${cardClass} space-y-2`}>
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-2 text-muted-foreground">
              <User size={12} /> ID Unique
            </span>
            <span className="font-mono text-foreground/80 text-[9px]">{hero.id}</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Calendar size={12} /> Obtenu le
            </span>
            <span className="text-foreground">{formattedDate}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className={statCardClass}>
            <Coins size={16} className="text-game-gold mb-1" />
            <span className="text-lg font-bold text-foreground">{hero.progressionStats.chestsOpened}</span>
            <span className={`${variant === 'modal' ? 'font-pixel text-[7px]' : 'text-[9px]'} text-muted-foreground text-center`}>Coffres ouverts</span>
          </div>
          <div className={statCardClass}>
            <Swords size={16} className="text-destructive mb-1" />
            <span className="text-lg font-bold text-foreground">{hero.progressionStats.totalDamageDealt.toLocaleString('fr-FR')}</span>
            <span className={`${variant === 'modal' ? 'font-pixel text-[7px]' : 'text-[9px]'} text-muted-foreground text-center`}>Dégâts infligés</span>
          </div>
          <div className={statCardClass}>
            <Trophy size={16} className={`${greenClass} mb-1`} />
            <span className="text-lg font-bold text-foreground">{hero.progressionStats.battlesPlayed}</span>
            <span className={`${variant === 'modal' ? 'font-pixel text-[7px]' : 'text-[9px]'} text-muted-foreground text-center`}>Combats joués</span>
          </div>
          <div className={statCardClass}>
            <Sparkles size={16} className={`${variant === 'modal' ? 'text-game-gold' : 'text-yellow-500'} mb-1`} />
            <span className="text-lg font-bold text-foreground">{hero.progressionStats.victories}</span>
            <span className={`${variant === 'modal' ? 'font-pixel text-[7px]' : 'text-[9px]'} text-muted-foreground text-center`}>Victoires ({winRate}%)</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 pt-2">
          <Gem size={14} className="text-accent" />
          <span className={`${variant === 'modal' ? 'font-pixel text-[8px]' : 'text-[10px]'} text-muted-foreground`}>
            Héros collecté le {formattedDate}
          </span>
        </div>
      </div>
    );
  }

  // Tab "upgrade"
  return (
    <>
      {/* Barre stamina */}
      <div>
        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
          <span className="flex items-center gap-1"><Battery size={10} /> Endurance</span>
          <span>{Math.floor(hero.currentStamina)}/{hero.maxStamina}</span>
        </div>
        {variant === 'modal' ? (
          <div className="h-2 bg-muted overflow-hidden">
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${staPct}%`,
                backgroundColor: staPct > 50 ? 'hsl(var(--game-energy-green))' : staPct > 25 ? 'hsl(var(--game-energy-low))' : 'hsl(var(--destructive))',
              }}
            />
          </div>
        ) : (
          <Progress value={staPct} className="h-2" />
        )}
      </div>

      {/* Statistiques */}
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
                <span className="font-bold text-foreground w-8 text-right tabular-nums">{val}</span>
                {nextVal !== null && diff > 0 && (
                  <>
                    <ArrowUp size={10} className={nextStarStats ? 'text-game-gold' : greenClass} />
                    <span className={`font-bold tabular-nums ${nextStarStats ? 'text-game-gold' : greenClass}`}>{nextVal}</span>
                    <span className={`text-[9px] tabular-nums ${nextStarStats ? 'text-game-gold' : greenClass}`}>(+{key === 'lck' ? diff + '%' : diff})</span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Compétences */}
      {hero.skills.length > 0 && (
        <div className="space-y-1">
          <p className="font-pixel text-[9px] text-muted-foreground flex items-center gap-1">
            <Zap size={10} /> COMPÉTENCES
          </p>
          {hero.skills.map((skill, i) => {
            const unlockLevel = (i + 1) * 20;
            const isUnlocked = hero.level >= unlockLevel;
            return (
              <div key={i} className={`${skillCardClass} ${!isUnlocked ? 'opacity-50' : ''}`}>
                <p className={`font-medium flex items-center gap-1 ${isUnlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {isUnlocked ? <Zap size={9} className="text-accent" /> : <Lock size={9} />} {skill.name}
                </p>
                {isUnlocked ? (
                  <p className="text-muted-foreground mt-0.5">{skill.description}</p>
                ) : (
                  <p className="text-muted-foreground mt-0.5">Débloqué niveau {unlockLevel}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Progression XP / Ascension */}
      <div className="pt-2 border-t border-border space-y-2">
        {!isMaxLevel && (
          <div className={xpCardClass}>
            <p className="font-pixel text-[9px] flex items-center gap-1" style={{ color: 'hsl(var(--game-xp-blue))' }}>
              <Zap size={12} /> PROGRESSION XP
            </p>
            <div className="space-y-1">
              {variant === 'modal' ? (
                <div className="h-3 bg-muted overflow-hidden">
                  <div
                    className="h-full transition-all duration-300"
                    style={{ width: `${xpProgress.percentage}%`, backgroundColor: 'hsl(var(--game-xp-blue))' }}
                  />
                </div>
              ) : (
                <Progress value={xpProgress.percentage} className="h-3" />
              )}
              <p className={`${variant === 'modal' ? 'font-pixel text-[8px]' : 'text-[10px]'} text-muted-foreground text-center`}>
                {xpProgress.current.toLocaleString()} / {xpProgress.required.toLocaleString()} XP
              </p>
            </div>
            <p className={`${variant === 'modal' ? 'font-pixel text-[7px]' : 'text-[9px]'} text-muted-foreground`}>
              Joue pour gagner de l'XP! Pose des bombes, détruis des blocs et ouvre des coffres.
            </p>
          </div>
        )}

        {isMaxLevel && !isMaxStars && ascensionInfo && (
          <div className="space-y-2">
            <div className={ascensionCardClass}>
              <p className="font-pixel text-[9px] text-game-gold flex items-center gap-1">
                <Sparkles size={12} /> ASCENSION — ÉTOILE {hero.stars + 1}/{MAX_STARS}
              </p>
              <p className={`${variant === 'modal' ? 'font-pixel text-[7px]' : 'text-[10px]'} text-muted-foreground`}>
                L'ascension augmente toutes les stats de +{((hero.stars + 1) * 20)}% et renforce ton héros au-delà du niveau max.
              </p>
              <div className="flex items-center gap-4 text-[10px]">
                <div className="flex items-center gap-1">
                  <Coins size={12} className="text-game-gold" />
                  <span className={coins >= ascensionInfo.cost ? greenClass : 'text-destructive'}>
                    {ascensionInfo.cost.toLocaleString()} BC
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Users size={12} className="text-primary" />
                  <span className={duplicates >= ascensionInfo.duplicates ? greenClass : 'text-destructive'}>
                    {duplicates}/{ascensionInfo.duplicates} doublons {config.label}
                  </span>
                </div>
              </div>
            </div>
            {variant === 'modal' ? (
              <button
                onClick={() => onAscend?.(hero.id)}
                disabled={!canAscend}
                className="pixel-btn pixel-btn-gold w-full font-pixel text-[10px] flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
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
              </button>
            ) : (
              <button
                onClick={() => onAscend?.(hero.id)}
                disabled={!canAscend}
                className="w-full font-pixel text-[10px] flex items-center justify-center gap-2 px-4 py-2 bg-game-gold/90 hover:bg-game-gold text-background disabled:opacity-40 disabled:cursor-not-allowed transition-colors rounded"
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
              </button>
            )}
          </div>
        )}

        {isMaxLevel && isMaxStars && (
          <div className="text-center py-3">
            <p className="font-pixel text-[10px] text-game-gold flex items-center justify-center gap-1">
              <Sparkles size={14} className="fill-current" />
              HÉROS MAXIMUM ★★★
              <Sparkles size={14} className="fill-current" />
            </p>
            <p className={`${variant === 'modal' ? 'font-pixel text-[8px]' : 'text-[9px]'} text-muted-foreground mt-1`}>
              Niveau {maxLevel} • Ascension complète • Prêt pour fusion
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default HeroDetailContent;
