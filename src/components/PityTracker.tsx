import React from 'react';
import { cn } from '@/lib/utils';

interface PityTrackerProps {
  pitiCounts: {
    rare: number;
    superRare: number;
    epic: number;
    legend: number;
  };
  thresholds?: {
    rare: number;
    superRare: number;
    epic: number;
    legend: number;
  };
}

const DEFAULT_THRESHOLDS = {
  rare: 10,
  superRare: 30,
  epic: 50,
  legend: 200,
};

interface RarityEntry {
  key: string;
  label: string;
  current: number;
  threshold: number;
  rarityClass: string;
  bgColor: string;
}

export function PityTracker({
  pitiCounts,
  thresholds = DEFAULT_THRESHOLDS,
}: PityTrackerProps) {
  const rarities: RarityEntry[] = [
    {
      key: 'rare',
      label: 'Rare',
      current: pitiCounts.rare,
      threshold: thresholds.rare,
      rarityClass: 'rarity-rare',
      bgColor: 'bg-[hsl(var(--game-rarity-rare))]',
    },
    {
      key: 'superRare',
      label: 'Super-Rare',
      current: pitiCounts.superRare,
      threshold: thresholds.superRare,
      rarityClass: 'rarity-super-rare',
      bgColor: 'bg-[hsl(var(--game-rarity-super-rare))]',
    },
    {
      key: 'epic',
      label: 'Épique',
      current: pitiCounts.epic,
      threshold: thresholds.epic,
      rarityClass: 'rarity-epic',
      bgColor: 'bg-[hsl(var(--game-rarity-epic))]',
    },
    {
      key: 'legend',
      label: 'Légendaire',
      current: pitiCounts.legend,
      threshold: thresholds.legend,
      rarityClass: 'rarity-legend',
      bgColor: 'bg-[hsl(var(--game-rarity-legend))]',
    },
  ];

  return (
    <div className="pixel-border bg-card p-3 space-y-2">
      <h4 className="font-pixel text-[8px] text-foreground mb-2">COMPTEUR PITY</h4>
      {rarities.map(({ key, label, current, threshold, bgColor }) => {
        const remaining = threshold - current;
        const pct = Math.min((current / threshold) * 100, 100);
        const isImminent = remaining <= 5;

        return (
          <div key={key} className="space-y-0.5">
            <div className="flex items-center justify-between">
              <span className="font-pixel text-[8px] text-foreground">{label}</span>
              <span
                className={cn(
                  'font-pixel text-[8px]',
                  isImminent ? 'text-orange-400' : 'text-muted-foreground',
                )}
              >
                Garanti dans {remaining} tirages
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-300',
                  isImminent ? 'bg-orange-500' : bgColor,
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default PityTracker;
