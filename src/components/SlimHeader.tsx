import React from 'react';
import { Coins, Gem, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import PixelIcon from '@/components/PixelIcon';

interface SlimHeaderProps {
  bomberCoins: number;
  universalShards: number;
  accountLevel: number;
  accountXp?: number;
  xpToNextLevel?: number;
  title?: string;
}

export function SlimHeader({
  bomberCoins,
  universalShards,
  accountLevel,
  accountXp = 0,
  xpToNextLevel = 100,
  title,
}: SlimHeaderProps) {
  const xpPercent = xpToNextLevel > 0
    ? Math.min(100, Math.round((accountXp / xpToNextLevel) * 100))
    : 0;

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 md:left-16 z-40',
        'h-12 bg-card/95 backdrop-blur border-b border-border',
        'flex flex-col',
      )}
    >
      <div className="flex items-center justify-between flex-1 px-3">
        {/* Gauche : logo + titre */}
        <div className="flex items-center gap-2 min-w-0">
          <PixelIcon icon="bomb" size={18} />
          {title && (
            <span className="text-sm font-semibold truncate text-foreground">
              {title}
            </span>
          )}
        </div>

        {/* Droite : niveau + ressources */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 text-xs font-medium text-foreground" title={`${accountXp} / ${xpToNextLevel} XP`}>
            <Crown size={13} className="text-primary" />
            <span className="text-[11px]">{accountLevel}</span>
            <span className="text-[9px] text-muted-foreground hidden sm:inline">XP</span>
          </div>
          <div className="flex items-center gap-1 text-xs font-medium text-foreground">
            <Coins size={14} className="text-yellow-400" />
            <span>{bomberCoins.toLocaleString('fr-FR')}</span>
          </div>
          <div className="flex items-center gap-1 text-xs font-medium text-foreground">
            <Gem size={14} className="text-blue-400" />
            <span>{universalShards.toLocaleString('fr-FR')}</span>
          </div>
        </div>
      </div>

      {/* Barre XP fine en bas du header */}
      <div className="h-1.5 w-full bg-border relative group">
        <div
          className="absolute inset-y-0 left-0 bg-primary transition-all duration-500"
          style={{ width: `${xpPercent}%` }}
        />
        {/* Label XP au survol */}
        <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[7px] font-pixel text-primary">{xpPercent}%</span>
        </div>
      </div>
    </header>
  );
}

export default SlimHeader;
