import React from 'react';
import { Trophy, Map, Swords, Star, Gem, Users } from 'lucide-react';

interface PlayerStatsProps {
  mapsCompleted: number;
  heroesTotal: number;
  achievementsUnlocked: number;
  achievementsTotal: number;
  storyHighestStage: number;
  bossesDefeated: number;
  heroesAtMax: number;
}

const PlayerStats: React.FC<PlayerStatsProps> = ({
  mapsCompleted,
  heroesTotal,
  achievementsUnlocked,
  achievementsTotal,
  storyHighestStage,
  bossesDefeated,
  heroesAtMax,
}) => {
  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="pixel-border bg-card flex flex-col items-center gap-1 p-2">
        <Users size={12} className="text-primary" />
        <span className="font-pixel text-[11px] text-foreground tabular-nums">{heroesTotal}</span>
        <span className="font-pixel text-[6px] text-muted-foreground text-center">HÉROS</span>
      </div>

      <div className="pixel-border bg-card flex flex-col items-center gap-1 p-2">
        <Map size={12} className="text-primary" />
        <span className="font-pixel text-[11px] text-foreground tabular-nums">{mapsCompleted}</span>
        <span className="font-pixel text-[6px] text-muted-foreground text-center">CARTES</span>
      </div>

      <div className="pixel-border bg-card flex flex-col items-center gap-1 p-2">
        <Swords size={12} className="text-primary" />
        <span className="font-pixel text-[11px] text-foreground tabular-nums">{bossesDefeated}</span>
        <span className="font-pixel text-[6px] text-muted-foreground text-center">BOSS</span>
      </div>

      <div className="pixel-border bg-card flex flex-col items-center gap-1 p-2">
        <Star size={12} className="text-primary" />
        <span className="font-pixel text-[11px] text-foreground tabular-nums">
          {storyHighestStage === 0 ? '—' : storyHighestStage}
        </span>
        <span className="font-pixel text-[6px] text-muted-foreground text-center">STAGE MAX</span>
      </div>

      <div className="pixel-border bg-card flex flex-col items-center gap-1 p-2">
        <Trophy size={12} className="text-primary" />
        <span className="font-pixel text-[11px] text-foreground tabular-nums">
          {achievementsUnlocked}/{achievementsTotal}
        </span>
        <span className="font-pixel text-[6px] text-muted-foreground text-center">SUCCÈS</span>
      </div>

      <div className="pixel-border bg-card flex flex-col items-center gap-1 p-2">
        <Gem size={12} className="text-primary" />
        <span className="font-pixel text-[11px] text-foreground tabular-nums">{heroesAtMax}</span>
        <span className="font-pixel text-[6px] text-muted-foreground text-center">HÉROS MAX</span>
      </div>
    </div>
  );
};

export default PlayerStats;
