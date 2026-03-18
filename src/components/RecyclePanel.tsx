import { useState } from 'react';
import { Hero } from '@/game/types';
import { getRecycleValue } from '@/game/recycleSystem';
import { Button } from '@/components/ui/button';
import { Trash2, Lock, Unlock, RefreshCw } from 'lucide-react';

interface RecyclePanelProps {
  heroes: Hero[];
  universalShards: number;
  onRecycle: (ids: string[], shardsGained: number) => void;
  onToggleLock: (heroId: string) => void;
}

export default function RecyclePanel({ heroes, universalShards, onRecycle, onToggleLock }: RecyclePanelProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showConfirm, setShowConfirm] = useState(false);

  const toggleSelect = (id: string) => {
    const hero = heroes.find(h => h.id === id);
    if (hero?.isLocked) return; // Pas de sélection des héros lockés
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedHeroes = heroes.filter(h => selectedIds.has(h.id));
  const totalShards = selectedHeroes.reduce((acc, h) => acc + getRecycleValue(h), 0);

  const handleConfirmRecycle = () => {
    onRecycle([...selectedIds], totalShards);
    setSelectedIds(new Set());
    setShowConfirm(false);
  };

  // Sélectionner tous les doublons non-lockés
  const selectAllDuplicates = () => {
    const seen = new Map<string, number>();
    heroes.forEach(h => seen.set(h.name.split(' #')[0], (seen.get(h.name.split(' #')[0]) || 0) + 1));
    const duplicateIds = heroes
      .filter(h => !h.isLocked && (seen.get(h.name.split(' #')[0]) || 0) > 1)
      .map(h => h.id);
    setSelectedIds(new Set(duplicateIds));
  };

  const rarityColors: Record<string, string> = {
    common: 'border-gray-500',
    rare: 'border-blue-500',
    'super-rare': 'border-purple-500',
    epic: 'border-orange-500',
    legend: 'border-yellow-500',
    'super-legend': 'border-red-500',
  };

  return (
    <div className="space-y-3">
      {/* Header stats */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">💎 {universalShards} Shards Universels</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={selectAllDuplicates}>
            <RefreshCw className="w-3 h-3 mr-1" />
            Sélec. doublons
          </Button>
          {selectedIds.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowConfirm(true)}
            >
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
            Recycler {selectedIds.size} héros pour {totalShards} Shards Universels ?
          </p>
          <p className="text-xs text-muted-foreground">Cette action est irréversible.</p>
          <div className="flex gap-2">
            <Button variant="destructive" size="sm" onClick={handleConfirmRecycle}>Confirmer</Button>
            <Button variant="outline" size="sm" onClick={() => setShowConfirm(false)}>Annuler</Button>
          </div>
        </div>
      )}

      {/* Grille de héros */}
      <div className="grid grid-cols-4 gap-2 max-h-80 overflow-y-auto">
        {heroes.map(hero => {
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
              <div className="text-xs text-center text-muted-foreground">
                +{recycleVal}💎
              </div>
              {/* Lock button */}
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

      {/* Table des taux */}
      <div className="text-xs text-muted-foreground border-t pt-2">
        <span className="font-medium">Taux : </span>
        Common=1💎 · Rare=3💎 · Super-Rare=8💎 · Epic=20💎 · Legend=50💎 · Super-Legend=150💎
        <span className="ml-1">(+1💎/10 levels)</span>
      </div>
    </div>
  );
}
