import { Hero } from '@/game/types';
import { cn } from '@/lib/utils';

interface CombatHeroPanelProps {
  deployedHeroes: Hero[]; // Héros actifs dans le gameState
  playerHeroes: Hero[];   // Pour récupérer level/xp courant
}

// Couleurs par rareté
const RARITY_COLORS: Record<string, string> = {
  common: 'border-gray-400',
  rare: 'border-blue-400',
  'super-rare': 'border-purple-500',
  epic: 'border-orange-500',
  legend: 'border-yellow-400',
  'super-legend': 'border-red-500',
};

const RARITY_BG: Record<string, string> = {
  common: 'bg-gray-900',
  rare: 'bg-blue-950',
  'super-rare': 'bg-purple-950',
  epic: 'bg-orange-950',
  legend: 'bg-yellow-950',
  'super-legend': 'bg-red-950',
};

export default function CombatHeroPanel({ deployedHeroes, playerHeroes }: CombatHeroPanelProps) {
  if (!deployedHeroes || deployedHeroes.length === 0) return null;

  return (
    <div className="flex gap-1.5 flex-wrap justify-center px-2 py-1.5 bg-black/40 border-t border-white/10 rounded-b-lg">
      {deployedHeroes.map(hero => {
        const staminaPct = hero.maxStamina > 0
          ? Math.round((hero.currentStamina / hero.maxStamina) * 100)
          : 0;
        const isKO = staminaPct === 0;
        const isLow = staminaPct < 30 && !isKO;

        // Barre de stamina couleur
        const staminaColor = isKO
          ? 'bg-red-600'
          : isLow
            ? 'bg-orange-500'
            : 'bg-green-500';

        return (
          <div
            key={hero.id}
            className={cn(
              'flex flex-col items-center gap-0.5 rounded border px-1.5 py-1 min-w-[52px] transition-opacity',
              RARITY_COLORS[hero.rarity] || 'border-gray-500',
              RARITY_BG[hero.rarity] || 'bg-gray-900',
              isKO && 'opacity-40',
            )}
          >
            {/* Icône / état */}
            <div className="text-base leading-none">
              {isKO ? '💀' : hero.state === 'resting' ? '😴' : hero.state === 'retreating' ? '💨' : '⚔️'}
            </div>

            {/* Nom court */}
            <div className="text-[8px] text-white/80 font-pixel truncate max-w-[48px] text-center">
              {hero.name.split(' #')[0].slice(0, 8)}
            </div>

            {/* Niveau */}
            <div className="text-[7px] text-white/60">
              Niv.{hero.level}
            </div>

            {/* Barre de stamina */}
            <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', staminaColor)}
                style={{ width: `${staminaPct}%` }}
              />
            </div>

            {/* % stamina */}
            <div className={cn('text-[7px]', isKO ? 'text-red-400' : isLow ? 'text-orange-400' : 'text-green-400')}>
              {staminaPct}%
            </div>
          </div>
        );
      })}
    </div>
  );
}
