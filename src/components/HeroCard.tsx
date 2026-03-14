import React from 'react';
import { Hero, RARITY_CONFIG, MAX_LEVEL_BY_RARITY } from '@/game/types';
import { getXpProgress } from '@/game/upgradeSystem';
import { Swords, Zap, Target, Bomb, Battery, Clover, Shield, Star, Moon, Check, Sparkles } from 'lucide-react';
import PixelIcon from '@/components/PixelIcon';

interface HeroCardProps {
  hero: Hero;
  compact?: boolean;
  onClick?: () => void;
  selected?: boolean;
}

const STAT_ICONS: Record<string, React.ReactNode> = {
  pwr: <Swords size={10} />,
  spd: <Zap size={10} />,
  rng: <Target size={10} />,
  bnb: <Bomb size={10} />,
  sta: <Battery size={10} />,
  lck: <Clover size={10} />,
};

const HeroCard: React.FC<HeroCardProps> = ({ hero, compact, onClick, selected }) => {
  const config = RARITY_CONFIG[hero.rarity];
  const staPct = (hero.currentStamina / hero.maxStamina) * 100;
  const maxLevel = MAX_LEVEL_BY_RARITY[hero.rarity];
  const xpProgress = getXpProgress(hero);
  const isMaxLevel = hero.level >= maxLevel;

  const rarityBorderClass = `rarity-${hero.rarity}`;

  if (compact) {
    return (
      <button
        onClick={onClick}
        className={`pixel-border p-2.5 flex items-center gap-2.5 w-full transition-all relative group ${rarityBorderClass} ${
          selected 
            ? 'bg-primary/15 ring-2 ring-primary/60 scale-[1.02]' 
            : 'bg-card hover:bg-muted hover:scale-[1.01]'
        }`}
      >
        {selected && (
          <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-md z-10">
            <Check size={12} className="text-primary-foreground" />
          </div>
        )}

        <div className={`w-10 h-10 rounded flex items-center justify-center shrink-0 ${
          selected ? 'bg-primary/20' : 'bg-muted'
        }`} style={{
          boxShadow: selected ? `0 0 10px hsl(var(--game-rarity-${hero.rarity}) / 0.4)` : 'none'
        }}>
          <PixelIcon icon={hero.icon} size={22} rarity={hero.rarity} />
        </div>

        <div className="text-left flex-1 min-w-0">
          <p className="font-pixel text-[8px] text-foreground truncate max-w-[80px]">{hero.name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[9px] font-pixel" style={{ color: `hsl(var(--game-rarity-${hero.rarity}))` }}>
              {config.label}
            </span>
            <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
              {isMaxLevel ? <Sparkles size={8} className="text-game-gold" /> : <Shield size={8} />} Lv.{hero.level}
              {isMaxLevel && <span className="text-game-gold">/{maxLevel}</span>}
            </span>
          </div>
        </div>

        <div className="w-14 shrink-0">
          {!isMaxLevel && (
            <>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-1">
                <div
                  className="h-full transition-all rounded-full bg-game-xp-blue"
                  style={{ width: `${xpProgress.percentage}%` }}
                />
              </div>
            </>
          )}
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full transition-all rounded-full"
              style={{
                width: `${staPct}%`,
                backgroundColor: staPct > 50 ? 'hsl(var(--game-energy-green))' : staPct > 25 ? 'hsl(var(--game-energy-low))' : 'hsl(var(--destructive))',
              }}
            />
          </div>
          <p className="text-[8px] text-muted-foreground text-center mt-0.5 tabular-nums">
            {Math.floor(hero.currentStamina)}/{hero.maxStamina}
          </p>
        </div>
      </button>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`pixel-border p-3 bg-card cursor-pointer transition-all hover:scale-[1.03] group relative ${rarityBorderClass} ${selected ? 'ring-2 ring-primary/60' : ''}`}
    >
      <div className="absolute inset-0 opacity-[0.06] rounded pointer-events-none"
        style={{ background: `radial-gradient(circle at 50% 30%, hsl(var(--game-rarity-${hero.rarity})), transparent 70%)` }}
      />

      <div className="text-center mb-2 relative">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-lg bg-muted mb-1 group-hover:scale-110 transition-transform"
          style={{ boxShadow: `0 0 15px hsl(var(--game-rarity-${hero.rarity}) / 0.3)` }}>
          <PixelIcon icon={hero.icon} size={32} rarity={hero.rarity} />
        </div>
        <h3 className="font-pixel text-[9px] text-foreground">{hero.name}</h3>
        <span className="text-[10px] font-pixel" style={{ color: `hsl(var(--game-rarity-${hero.rarity}))` }}>
          {config.label}
        </span>
      </div>

      <div className="space-y-1.5 text-[10px]">
        <div className="flex justify-between items-center text-muted-foreground">
          <span className="flex items-center gap-1">
            {isMaxLevel ? <Sparkles size={10} className="text-game-gold" /> : <Shield size={10} />} 
            Niv. {hero.level}{!isMaxLevel && `/${maxLevel}`}
          </span>
          <span className="flex items-center gap-0.5">
            {Array.from({ length: hero.stars }).map((_, i) => (
              <Star key={i} size={10} className="text-game-gold fill-current" />
            ))}
            {Array.from({ length: 3 - hero.stars }).map((_, i) => (
              <Star key={`e${i}`} size={10} className="text-muted-foreground" />
            ))}
          </span>
        </div>

        {!isMaxLevel && (
          <div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full transition-all rounded-full bg-game-xp-blue"
                style={{ width: `${xpProgress.percentage}%` }}
              />
            </div>
            <p className="text-[8px] text-muted-foreground text-center mt-0.5">
              {xpProgress.current}/{xpProgress.required} XP
            </p>
          </div>
        )}

        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full transition-all rounded-full"
            style={{
              width: `${staPct}%`,
              backgroundColor: staPct > 50 ? 'hsl(var(--game-energy-green))' : 'hsl(var(--game-energy-low))',
            }}
          />
        </div>
        <p className="text-muted-foreground text-center flex items-center justify-center gap-1 tabular-nums">
          <Battery size={10} /> {Math.floor(hero.currentStamina)}/{hero.maxStamina} STA
        </p>

        <div className="grid grid-cols-3 gap-1 mt-2 text-[9px]">
          {Object.entries(hero.stats).map(([key, val]) => (
            <div key={key} className="bg-muted rounded px-1 py-1 flex items-center justify-center gap-1">
              {STAT_ICONS[key]}
              <span className="text-muted-foreground uppercase">{key}</span>
              <span className="text-foreground font-bold">{val}</span>
            </div>
          ))}
        </div>

        {hero.skills.length > 0 && (
          <div className="mt-2 space-y-0.5">
            {hero.skills.map((skill, i) => (
              <p key={i} className="text-[8px] text-accent truncate flex items-center gap-1" title={skill.description}>
                <Zap size={8} /> {skill.name}
              </p>
            ))}
          </div>
        )}
      </div>

      <div className="mt-2 text-[9px] text-center text-muted-foreground flex items-center justify-center gap-1">
        {hero.state === 'resting' ? (
          <><Moon size={10} /> Au repos</>
        ) : hero.isActive ? (
          <><Zap size={10} className="text-game-energy-green" /> Actif</>
        ) : (
          <>Inactif</>
        )}
      </div>
    </div>
  );
};

export default HeroCard;
