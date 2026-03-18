import { Hero } from '@/game/types';
import { getActiveClanSkills } from '@/game/clanSystem';
import { cn } from '@/lib/utils';

interface CombatHeroPanelProps {
  deployedHeroes: Hero[];
  playerHeroes: Hero[];
}

const RARITY_BORDER: Record<string, string> = {
  common: 'border-gray-400',
  rare: 'border-blue-400',
  'super-rare': 'border-purple-500',
  epic: 'border-orange-500',
  legend: 'border-yellow-400',
  'super-legend': 'border-red-500',
};

export default function CombatHeroPanel({ deployedHeroes }: CombatHeroPanelProps) {
  if (!deployedHeroes || deployedHeroes.length === 0) return null;

  const activeSynergies = getActiveClanSkills(deployedHeroes);

  return (
    <div className="w-full bg-black/50 border-t border-white/10 rounded-b-lg">
      {/* Grille héros : 3 colonnes mobile, 6 desktop */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 p-2">
        {deployedHeroes.map(hero => {
          const staminaPct = hero.maxStamina > 0
            ? Math.round((hero.currentStamina / hero.maxStamina) * 100)
            : 0;
          const isKO = staminaPct === 0;
          const isLow = staminaPct < 30 && !isKO;
          const isResting = hero.state === 'resting';

          const staminaColor = isKO
            ? 'bg-red-600'
            : isLow
              ? 'bg-orange-500'
              : 'bg-green-500';

          const stateIcon = isKO ? '💀' : isResting ? '💤' : hero.state === 'retreating' ? '💨' : '⚔️';

          return (
            <div
              key={hero.id}
              className={cn(
                'flex flex-col items-center gap-1 rounded-lg border-2 px-2 py-2 bg-black/60 transition-opacity',
                RARITY_BORDER[hero.rarity] ?? 'border-gray-500',
                isKO && 'opacity-40',
              )}
            >
              {/* Icône état */}
              <div className="text-lg leading-none">{stateIcon}</div>

              {/* Nom */}
              <div className="font-pixel text-[7px] text-white/90 truncate w-full text-center leading-tight">
                {hero.name.split(' #')[0].slice(0, 10)}
              </div>

              {/* Niveau */}
              <div className="font-pixel text-[6px] text-white/50">Niv.{hero.level}</div>

              {/* Barre stamina */}
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-300', staminaColor)}
                  style={{ width: `${staminaPct}%` }}
                />
              </div>

              {/* % stamina */}
              <div className={cn(
                'font-pixel text-[6px]',
                isKO ? 'text-red-400' : isLow ? 'text-orange-400' : 'text-green-400',
              )}>
                {staminaPct}%
              </div>
            </div>
          );
        })}
      </div>

      {/* Synergies de clan actives */}
      {activeSynergies.length > 0 && (
        <div className="border-t border-white/10 px-2 pb-2 pt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 items-center">
          <span className="font-pixel text-[7px] text-yellow-400">✨ SYNERGIES :</span>
          {activeSynergies.map((skill, i) => (
            <span key={i} className="font-pixel text-[6px] text-white/70">
              ▸ {skill.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
