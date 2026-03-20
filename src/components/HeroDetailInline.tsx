import React, { useState } from 'react';
import PixelIcon from '@/components/PixelIcon';
import HeroAvatar from '@/components/HeroAvatar';
import { Hero, RARITY_CONFIG, MAX_LEVEL_BY_RARITY } from '@/game/types';
import { getStatsAtLevel, getAscensionCost, MAX_STARS, countDuplicates, getXpProgress, getMaxLevel, getUnlockedSkills } from '@/game/upgradeSystem';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Swords, Zap, Target, Bomb, Battery, Clover, Shield, Star, ArrowUp, Coins, TrendingUp, Lock, Sparkles, Users, User, Calendar, Trophy, Gem, ArrowLeft } from 'lucide-react';

interface HeroDetailInlineProps {
  hero: Hero;
  coins: number;
  allHeroes?: Hero[];
  onBack: () => void;
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

const HeroDetailInline: React.FC<HeroDetailInlineProps> = ({ hero, coins, allHeroes, onBack, onUpgrade, onAscend }) => {
  const [activeTab, setActiveTab] = useState<'upgrade' | 'identity'>('upgrade');

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

  return (
    <div className="space-y-4">
      {/* Bouton retour */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 font-pixel text-[8px] text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={12} /> Retour aux héros
      </button>

      {/* Header héros */}
      <div
        className="pixel-border bg-card p-5 pb-3 relative"
        style={{
          background: `linear-gradient(180deg, hsl(var(--game-rarity-${hero.rarity}) / 0.15) 0%, transparent 100%)`,
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <PixelIcon icon={hero.icon} size={24} rarity={hero.rarity} />
          <h2 className="font-pixel text-sm text-foreground">{hero.name}</h2>
        </div>
        <div className="flex items-center gap-2">
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
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('upgrade')}
          className={`flex-1 py-2 text-[10px] font-pixel transition-colors active:scale-[0.97] ${
            activeTab === 'upgrade'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Améliorer
        </button>
        <button
          onClick={() => setActiveTab('identity')}
          className={`flex-1 py-2 text-[10px] font-pixel transition-colors active:scale-[0.97] ${
            activeTab === 'identity'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Carte d'identité
        </button>
      </div>

      {/* Contenu des tabs */}
      <div className="space-y-4">
        {activeTab === 'identity' ? (
          <div className="space-y-5">
            <div className="flex flex-col items-center">
              <div
                className="w-20 h-20 rounded-xl flex items-center justify-center mb-3"
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

            <div className="bg-muted/30 rounded-lg p-3 space-y-2">
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
              <div className="bg-muted/30 rounded-lg p-3 flex flex-col items-center">
                <Coins size={16} className="text-game-gold mb-1" />
                <span className="text-lg font-bold text-foreground">{hero.progressionStats.chestsOpened}</span>
                <span className="text-[9px] text-muted-foreground text-center">Coffres ouverts</span>
              </div>
              <div className="bg-muted/30 rounded-lg p-3 flex flex-col items-center">
                <Swords size={16} className="text-destructive mb-1" />
                <span className="text-lg font-bold text-foreground">{hero.progressionStats.totalDamageDealt.toLocaleString('fr-FR')}</span>
                <span className="text-[9px] text-muted-foreground text-center">Dégâts infligés</span>
              </div>
              <div className="bg-muted/30 rounded-lg p-3 flex flex-col items-center">
                <Trophy size={16} className="text-game-energy-green mb-1" />
                <span className="text-lg font-bold text-foreground">{hero.progressionStats.battlesPlayed}</span>
                <span className="text-[9px] text-muted-foreground text-center">Combats joués</span>
              </div>
              <div className="bg-muted/30 rounded-lg p-3 flex flex-col items-center">
                <Sparkles size={16} className="text-yellow-500 mb-1" />
                <span className="text-lg font-bold text-foreground">{hero.progressionStats.victories}</span>
                <span className="text-[9px] text-muted-foreground text-center">Victoires ({winRate}%)</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <Gem size={14} className="text-accent" />
              <span className="text-[10px] text-muted-foreground">
                Héros collecté le {formattedDate}
              </span>
            </div>
          </div>
        ) : (
          <>
            <div>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                <span className="flex items-center gap-1"><Battery size={10} /> Endurance</span>
                <span>{Math.floor(hero.currentStamina)}/{hero.maxStamina}</span>
              </div>
              <Progress value={staPct} className="h-2" />
            </div>

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
                          <ArrowUp size={10} className={nextStarStats ? 'text-game-gold' : 'text-game-energy-green'} />
                          <span className={`font-bold tabular-nums ${nextStarStats ? 'text-game-gold' : 'text-game-energy-green'}`}>{nextVal}</span>
                          <span className={`text-[9px] tabular-nums ${nextStarStats ? 'text-game-gold' : 'text-game-energy-green'}`}>(+{key === 'lck' ? diff + '%' : diff})</span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {hero.skills.length > 0 && (
              <div className="space-y-1">
                <p className="font-pixel text-[9px] text-muted-foreground flex items-center gap-1">
                  <Zap size={10} /> COMPÉTENCES
                </p>
                {hero.skills.map((skill, i) => {
                  const unlockLevel = (i + 1) * 20;
                  const isUnlocked = hero.level >= unlockLevel;
                  return (
                    <div key={i} className={`bg-muted rounded px-2 py-1.5 text-[10px] ${!isUnlocked ? 'opacity-50' : ''}`}>
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

            <div className="pt-2 border-t border-border space-y-2">
              {!isMaxLevel && (
                <div className="bg-muted/50 rounded p-3 space-y-2">
                  <p className="font-pixel text-[9px] text-game-xp-blue flex items-center gap-1">
                    <Zap size={12} /> PROGRESSION XP
                  </p>
                  <div className="space-y-1">
                    <Progress value={xpProgress.percentage} className="h-3" />
                    <p className="text-[10px] text-muted-foreground text-center">
                      {xpProgress.current.toLocaleString()} / {xpProgress.required.toLocaleString()} XP
                    </p>
                  </div>
                  <p className="text-[9px] text-muted-foreground">
                    Joue pour gagner de l'XP! Pose des bombes, détruis des blocs et ouvre des coffres.
                  </p>
                </div>
              )}

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

              {isMaxLevel && isMaxStars && (
                <div className="text-center py-3">
                  <p className="font-pixel text-[10px] text-game-gold flex items-center justify-center gap-1">
                    <Sparkles size={14} className="fill-current" />
                    HÉROS MAXIMUM ★★★
                    <Sparkles size={14} className="fill-current" />
                  </p>
                  <p className="text-[9px] text-muted-foreground mt-1">Niveau {maxLevel} • Ascension complète • Prêt pour fusion</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HeroDetailInline;
