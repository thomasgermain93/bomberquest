import React from 'react';
import { Hero, RARITY_CONFIG } from '@/game/types';
import PixelIcon from '@/components/PixelIcon';
import { X, AlertCircle } from 'lucide-react';

interface FusionSlotProps {
  hero: Hero | null;
  index: number;
  onClick: () => void;
  onClear?: () => void;
  isEligible?: boolean;
  ineligibleReason?: string;
}

const FusionSlot: React.FC<FusionSlotProps> = ({ 
  hero, 
  index, 
  onClick, 
  onClear,
  isEligible = true,
  ineligibleReason 
}) => {
  if (!hero) {
    return (
      <button
        onClick={onClick}
        className="w-16 h-16 sm:w-20 sm:h-20 pixel-border bg-card/50 hover:bg-card hover:scale-105 transition-all flex flex-col items-center justify-center gap-1 border-dashed"
      >
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
          <span className="font-pixel text-lg text-muted-foreground/50">{index + 1}</span>
        </div>
      </button>
    );
  }

  const config = RARITY_CONFIG[hero.rarity];
  const maxLevel = config.maxLevel;
  const isMaxed = hero.level >= maxLevel;

  return (
    <button
      onClick={onClick}
      className={`w-16 h-16 sm:w-20 sm:h-20 pixel-border bg-card transition-all flex flex-col items-center justify-center relative group ${
        isEligible 
          ? isMaxed
            ? 'ring-2 ring-game-energy-green/50 hover:ring-game-energy-green/80'
            : 'ring-2 ring-destructive/30 hover:ring-destructive/60'
          : 'opacity-50 grayscale'
      }`}
    >
      {onClear && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
        >
          <X size={12} className="text-destructive-foreground" />
        </button>
      )}

      <div 
        className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center"
        style={{ boxShadow: `0 0 12px hsl(var(--game-rarity-${hero.rarity}) / 0.4)` }}
      >
        <PixelIcon icon={hero.icon} size={24} rarity={hero.rarity} />
      </div>

      <div className="mt-1 text-center">
        <p className="font-pixel text-[7px] text-foreground truncate max-w-[60px]">{hero.name}</p>
        <div className="flex items-center justify-center gap-1">
          <span 
            className="font-pixel text-[6px]" 
            style={{ color: isMaxed ? 'hsl(var(--game-energy-green))' : `hsl(var(--game-rarity-${hero.rarity}))` }}
          >
            {hero.level}/{maxLevel}
          </span>
          {isMaxed && (
            <span className="text-[8px] text-game-energy-green">★</span>
          )}
        </div>
      </div>

      {!isEligible && ineligibleReason && (
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <p className="text-[8px] text-destructive flex items-center gap-0.5 bg-destructive/10 px-1 rounded">
            <AlertCircle size={8} /> {ineligibleReason}
          </p>
        </div>
      )}
    </button>
  );
};

export default FusionSlot;
