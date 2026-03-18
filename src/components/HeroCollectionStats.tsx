import { Hero, Rarity } from '@/game/types';

// Valeurs de recyclage en shards universels par rareté (cohérent avec saveSystem.ts)
const RECYCLE_VALUES: Record<Rarity, number> = {
  common: 1,
  rare: 2,
  'super-rare': 4,
  epic: 10,
  legend: 25,
  'super-legend': 100,
};

interface HeroCollectionStatsProps {
  heroes: Hero[];
}

export default function HeroCollectionStats({ heroes }: HeroCollectionStatsProps) {
  // Calcul des doublons (même nom de base, ex: "Blaze #2" → base "Blaze")
  const nameCounts = new Map<string, number>();
  heroes.forEach(h => {
    const baseName = h.name.split(' #')[0];
    nameCounts.set(baseName, (nameCounts.get(baseName) || 0) + 1);
  });
  const duplicateCount = heroes.filter(h => (nameCounts.get(h.name.split(' #')[0]) || 0) > 1).length;

  // Potentiel shards si on recycle les doublons non lockés
  const recyclableDuplicates = heroes.filter(h =>
    !h.isLocked && (nameCounts.get(h.name.split(' #')[0]) || 0) > 1
  );
  const recyclableShards = recyclableDuplicates.reduce(
    (acc, h) => acc + (RECYCLE_VALUES[h.rarity] || 1),
    0
  );

  return (
    <div className="grid grid-cols-3 gap-2 text-xs">
      <div className="rounded-md bg-card/50 p-2 text-center">
        <div className="font-pixel text-foreground">{heroes.length}</div>
        <div className="text-muted-foreground">Héros total</div>
      </div>
      <div className="rounded-md bg-card/50 p-2 text-center">
        <div className="font-pixel text-orange-400">{duplicateCount}</div>
        <div className="text-muted-foreground">Doublons</div>
      </div>
      <div className="rounded-md bg-card/50 p-2 text-center">
        <div className="font-pixel text-cyan-400">+{recyclableShards}💎</div>
        <div className="text-muted-foreground">Recyclables</div>
      </div>
    </div>
  );
}
