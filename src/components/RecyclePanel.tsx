import { useState, useMemo } from 'react';
import { Hero, Rarity } from '@/game/types';
import { getRecycleValue } from '@/game/recycleSystem';
import { Trash2, Lock, Unlock, RefreshCw, Gem } from 'lucide-react';
import { cn } from '@/lib/utils';

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

  const duplicateHeroes = useMemo(() => {
    const groups = new Map<string, Hero[]>();
    heroes.forEach(h => {
      const base = h.name.split(' #')[0];
      if (!groups.has(base)) groups.set(base, []);
      groups.get(base)!.push(h);
    });
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

  const selectAllKeepingBest = () => {
    const groups = new Map<string, Hero[]>();
    duplicateHeroes.forEach(h => {
      const base = h.name.split(' #')[0];
      if (!groups.has(base)) groups.set(base, []);
      groups.get(base)!.push(h);
    });
    const toSelect = new Set<string>();
    groups.forEach(group => {
      const sorted = [...group].sort((a, b) => {
        const rarityDiff = (RARITY_RANK[b.rarity as Rarity] ?? 0) - (RARITY_RANK[a.rarity as Rarity] ?? 0);
        if (rarityDiff !== 0) return rarityDiff;
        return b.level - a.level;
      });
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

  if (duplicateHeroes.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="font-pixel text-[8px] text-muted-foreground">Aucun doublon à recycler.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header stats */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="font-pixel text-[8px] text-muted-foreground flex items-center gap-1">
          <Gem size={12} className="text-game-blue" /> {universalShards} Shards · {duplicateHeroes.length} doublons
        </span>
        <div className="flex gap-2">
          <button
            onClick={selectAllKeepingBest}
            className="pixel-btn pixel-btn-secondary font-pixel text-[7px] flex items-center gap-1 px-2 py-1 min-h-0"
          >
            <RefreshCw size={10} /> Garder le meilleur
          </button>
          {selectedIds.size > 0 && (
            <button
              onClick={() => setShowConfirm(true)}
              className="pixel-btn font-pixel text-[7px] flex items-center gap-1 px-2 py-1 min-h-0"
              style={{ background: 'hsl(var(--destructive))', borderColor: 'hsl(var(--destructive))' }}
            >
              <Trash2 size={10} /> Recycler {selectedIds.size} (+{totalShards})
            </button>
          )}
        </div>
      </div>

      {/* Confirmation */}
      {showConfirm && (
        <div className="pixel-border bg-destructive/10 p-3 space-y-2">
          <p className="font-pixel text-[8px] text-destructive flex items-center gap-1">
            Recycler {selectedIds.size} héros pour {totalShards} <Gem size={10} className="text-game-blue" /> Shards ?
          </p>
          <p className="font-pixel text-[7px] text-muted-foreground">Cette action est irréversible.</p>
          <div className="flex gap-2">
            <button
              onClick={handleConfirmRecycle}
              className="pixel-btn font-pixel text-[7px] px-2 py-1 min-h-0"
              style={{ background: 'hsl(var(--destructive))', borderColor: 'hsl(var(--destructive))' }}
            >
              Confirmer
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="pixel-btn pixel-btn-secondary font-pixel text-[7px] px-2 py-1 min-h-0"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Grille de doublons */}
      <div className="grid grid-cols-4 gap-2 max-h-80 overflow-y-auto">
        {duplicateHeroes.map(hero => {
          const selected = selectedIds.has(hero.id);
          const recycleVal = getRecycleValue(hero);
          return (
            <div
              key={hero.id}
              className={cn(
                'relative pixel-border p-1.5 cursor-pointer transition-all',
                `rarity-${hero.rarity}`,
                selected ? 'bg-destructive/20 scale-95' : 'bg-card/50 hover:bg-card',
                hero.isLocked && 'opacity-50 cursor-not-allowed',
              )}
              onClick={() => toggleSelect(hero.id)}
            >
              <div className="font-pixel text-[7px] text-center truncate">{hero.name.split(' #')[0]}</div>
              <div className="font-pixel text-[6px] text-center text-muted-foreground">Niv.{hero.level}</div>
              <div className="font-pixel text-[7px] text-center text-game-blue flex items-center justify-center gap-0.5">
                +{recycleVal}<Gem size={8} className="text-game-blue" />
              </div>
              <button
                className="absolute top-0.5 right-0.5 p-0.5 hover:bg-white/10"
                onClick={e => { e.stopPropagation(); onToggleLock(hero.id); }}
              >
                {hero.isLocked
                  ? <Lock className="w-2.5 h-2.5 text-game-gold" />
                  : <Unlock className="w-2.5 h-2.5 text-muted-foreground" />
                }
              </button>
            </div>
          );
        })}
      </div>

      <div className="font-pixel text-[7px] text-muted-foreground border-t border-border pt-2">
        <span className="text-foreground">Taux : </span>
        Common=1 · Rare=3 · SR=8 · Epic=20 · Legend=50 · SL=150 (+1/10 niveaux)
      </div>
    </div>
  );
}
