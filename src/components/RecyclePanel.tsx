import { useState, useMemo } from 'react';
import { Hero, Rarity } from '@/game/types';
import { getRecycleValue } from '@/game/recycleSystem';
import { Button } from '@/components/ui/button';
import { Trash2, Lock, Unlock, RefreshCw } from 'lucide-react';

const RARITY_RANK: Record<Rarity, number> = {
  common: 0, rare: 1, 'super-rare': 2, epic: 3, legend: 4, 'super-legend': 5,
};

interface RecyclePanelProps {
  heroes: Hero[];
  universalShards: number;
  onRecycle: (ids: string[], shardsGained: number) => void;
  onToggleLock: (heroId: string) => void;
}

export default function RecyclePanel({ heroes, universalShards, onRecycle, onToggleLock }: RecyclePanelProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showConfirm, setShowConfirm] = useState(false);

  // Grouper les héros par nom de base et ne garder que les groupes avec 2+ exemplaires
  const duplicateHeroes = useMemo(() => {
    const groups = new Map<string, Hero[]>();
    heroes.forEach(h => {
      const base = h.name.split(' #')[0];
      if (!groups.has(base)) groups.set(base, []);
      groups.get(base)!.push(h);
    });
    // Retourner uniquement les héros faisant partie d'un groupe avec duplicata
    return heroes.filter(h => (groups.get(h.name.split(' #')[0]) || []).length > 1);
  }, [heroes]);

  const toggleSelect = (id: string) => {
    const hero = heroes.find(h => h.id === id);
    if (hero?.isLocked) return;
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Sélectionner les doublons en gardant le meilleur exemplaire de chaque héros
  const selectAllKeepingBest = () => {
    const groups = new Map<string, Hero[]>();
    duplicateHeroes.forEach(h => {
      const base = h.name.split(' #')[0];
      if (!groups.has(base)) groups.set(base, []);
      groups.get(base)!.push(h);
    });

    const toSelect = new Set<string>();
    groups.forEach(group => {
      // Trier par rareté décroissante puis niveau décroissant → le premier est le meilleur
      const sorted = [...group].sort((a, b) => {
        const rarityDiff = (RARITY_RANK[b.rarity as Rarity] ?? 0) - (RARITY_RANK[a.rarity as Rarity] ?? 0);
        if (rarityDiff !== 0) return rarityDiff;
        return b.level - a.level;
      });
      // Sélectionner tous sauf le meilleur (non-lockés)
      sorted.slice(1).forEach(h => { if (!h.isLocked) toSelect.add(h.id); });
    });
    setSelectedIds(toSelect);
  };

  const selectedHeroes = duplicateHeroes.filter(h => selectedIds.has(h.id));
  const totalShards = selectedHeroes.reduce((acc, h) => acc + getRecycleValue(h), 0);

  const handleConfirmRecycle = () => {
    onRecycle([...selectedIds], totalShards);
    setSelectedIds(new Set());
    setShowConfirm(false);
  };

  const rarityColors: Record<string, string> = {
    common: 'border-gray-500',
    rare: 'border-blue-500',
    'super-rare': 'border-purple-500',
    epic: 'border-orange-500',
    legend: 'border-yellow-500',
    'super-legend': 'border-red-500',
  };

  if (duplicateHeroes.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground text-sm">
        Aucun doublon à recycler.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header stats */}
      <div className="flex items-center justify-between text-sm flex-wrap gap-2">
        <span className="text-muted-foreground">💎 {universalShards} Shards · {duplicateHeroes.length} doublons</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={selectAllKeepingBest}>
            <RefreshCw className="w-3 h-3 mr-1" />
            Garder le meilleur
          </Button>
          {selectedIds.size > 0 && (
            <Button variant="destructive" size="sm" onClick={() => setShowConfirm(true)}>
              <Trash2 className="w-3 h-3 mr-1" />
              Recycler {selectedIds.size} (+{totalShards} 💎)
            </Button>
          )}
        </div>
      </div>

      {/* Confirmation */}
      {showConfirm && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 space-y-2">
          <p className="text-sm text-destructive font-medium">
            Recycler {selectedIds.size} héros pour {totalShards} 💎 Shards ?
          </p>
          <p className="text-xs text-muted-foreground">Cette action est irréversible.</p>
          <div className="flex gap-2">
            <Button variant="destructive" size="sm" onClick={handleConfirmRecycle}>Confirmer</Button>
            <Button variant="outline" size="sm" onClick={() => setShowConfirm(false)}>Annuler</Button>
          </div>
        </div>
      )}

      {/* Grille de doublons uniquement */}
      <div className="grid grid-cols-4 gap-2 max-h-80 overflow-y-auto">
        {duplicateHeroes.map(hero => {
          const selected = selectedIds.has(hero.id);
          const recycleVal = getRecycleValue(hero);
          return (
            <div
              key={hero.id}
              className={`relative border-2 rounded-md p-1.5 cursor-pointer transition-all ${
                rarityColors[hero.rarity] || 'border-gray-500'
              } ${selected ? 'bg-destructive/20 scale-95' : 'bg-card/50 hover:bg-card'} ${
                hero.isLocked ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              onClick={() => toggleSelect(hero.id)}
            >
              <div className="text-xs text-center truncate">{hero.name.split(' #')[0]}</div>
              <div className="text-[10px] text-center text-muted-foreground">Niv.{hero.level}</div>
              <div className="text-xs text-center text-cyan-400">+{recycleVal}💎</div>
              <button
                className="absolute top-0.5 right-0.5 p-0.5 rounded hover:bg-white/10"
                onClick={e => { e.stopPropagation(); onToggleLock(hero.id); }}
              >
                {hero.isLocked
                  ? <Lock className="w-2.5 h-2.5 text-yellow-400" />
                  : <Unlock className="w-2.5 h-2.5 text-muted-foreground" />
                }
              </button>
            </div>
          );
        })}
      </div>

      <div className="text-xs text-muted-foreground border-t pt-2">
        <span className="font-medium">Taux : </span>
        Common=1💎 · Rare=3💎 · Super-Rare=8💎 · Epic=20💎 · Legend=50💎 · Super-Legend=150💎
        <span className="ml-1">(+1💎/10 levels)</span>
      </div>
    </div>
  );
}
