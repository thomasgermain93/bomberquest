import React, { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Hero, Rarity, RARITY_CONFIG, HERO_FAMILIES } from '@/game/types';
import HeroCard from '@/components/HeroCard';

interface HeroPickerModalProps {
  open: boolean;
  heroes: Hero[];
  selectedIds: Set<string>;
  onSelect: (hero: Hero) => void;
  onClose: () => void;
}

const HeroPickerModal: React.FC<HeroPickerModalProps> = ({
  open,
  heroes,
  selectedIds,
  onSelect,
  onClose,
}) => {
  const [rarityFilter, setRarityFilter] = useState<'all' | Rarity>('all');
  const [clanFilter, setClanFilter] = useState<'all' | string>('all');

  const filtered = useMemo(() => {
    return [...heroes]
      .filter(h => rarityFilter === 'all' || h.rarity === rarityFilter)
      .filter(h => clanFilter === 'all' || h.family === clanFilter)
      .sort((a, b) => b.level - a.level);
  }, [heroes, rarityFilter, clanFilter]);

  const isFull = selectedIds.size >= 6;

  return (
    <Dialog open={open} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-pixel text-[10px] uppercase">Choisir un héros</DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap gap-2 pb-3 border-b border-border">
          <select
            value={rarityFilter}
            onChange={e => setRarityFilter(e.target.value as 'all' | Rarity)}
            className="font-pixel text-[8px] bg-muted border border-border rounded px-2 py-1 text-foreground outline-none"
          >
            <option value="all">Toutes raretés</option>
            {(Object.keys(RARITY_CONFIG) as Rarity[]).map(r => (
              <option key={r} value={r}>{RARITY_CONFIG[r].label}</option>
            ))}
          </select>

          <select
            value={clanFilter}
            onChange={e => setClanFilter(e.target.value)}
            className="font-pixel text-[8px] bg-muted border border-border rounded px-2 py-1 text-foreground outline-none"
          >
            <option value="all">Tous les clans</option>
            {HERO_FAMILIES.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>

          <span className="font-pixel text-[8px] text-muted-foreground self-center ml-auto">
            {filtered.length} héros
          </span>
        </div>

        <div className="flex-1 overflow-y-auto py-3">
          {filtered.length === 0 ? (
            <p className="font-pixel text-[8px] text-muted-foreground text-center py-8">Aucun héros trouvé</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {filtered.map(hero => {
                const isSelected = selectedIds.has(hero.id);
                const disabled = isFull && !isSelected;
                return (
                  <div
                    key={hero.id}
                    className={disabled ? 'opacity-40 cursor-not-allowed' : ''}
                  >
                    <HeroCard
                      hero={hero}
                      compact
                      selected={isSelected}
                      onClick={disabled ? undefined : () => onSelect(hero)}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HeroPickerModal;
