import React, { useState } from 'react';
import { Coins } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import HeroAvatar from '@/components/HeroAvatar';
import { Hero, RARITY_CONFIG, Rarity } from '@/game/types';
import { cn } from '@/lib/utils';

const SELLABLE_RARITIES: Rarity[] = ['epic', 'legend', 'super-legend'];

interface CreateListingModalProps {
  open: boolean;
  heroes: Hero[];
  isLoading: boolean;
  onConfirm: (heroId: string, price: number, hero: Hero) => void;
  onClose: () => void;
}

export default function CreateListingModal({
  open,
  heroes,
  isLoading,
  onConfirm,
  onClose,
}: CreateListingModalProps) {
  const [selectedHeroId, setSelectedHeroId] = useState<string | null>(null);
  const [price, setPrice] = useState<number>(1000);

  const sellableHeroes = heroes.filter(
    (h) => SELLABLE_RARITIES.includes(h.rarity as Rarity) && !h.isLocked,
  );

  const selectedHero = sellableHeroes.find((h) => h.id === selectedHeroId) ?? null;

  const handleConfirm = () => {
    if (!selectedHeroId || !selectedHero || price < 100) return;
    onConfirm(selectedHeroId, price, selectedHero);
    setSelectedHeroId(null);
    setPrice(1000);
  };

  const handleClose = () => {
    setSelectedHeroId(null);
    setPrice(1000);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="pixel-border bg-card max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-pixel text-[10px]">Mettre un héros en vente</DialogTitle>
        </DialogHeader>

        {sellableHeroes.length === 0 ? (
          <p className="font-pixel text-[8px] text-muted-foreground text-center py-4">
            Aucun héros Epic, Legend ou Super-Legend non verrouillé disponible.
          </p>
        ) : (
          <>
            {/* Picker héros */}
            <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
              {sellableHeroes.map((hero) => {
                const isSelected = selectedHeroId === hero.id;
                const rarityConfig = RARITY_CONFIG[hero.rarity as Rarity];
                return (
                  <button
                    key={hero.id}
                    onClick={() => setSelectedHeroId(hero.id)}
                    className={cn(
                      'w-full flex items-center gap-3 p-2 pixel-border text-left transition-all',
                      `rarity-${hero.rarity}`,
                      isSelected ? 'ring-2 ring-primary bg-primary/10' : 'bg-card/50 hover:bg-card',
                    )}
                  >
                    <HeroAvatar
                      heroName={hero.name.toLowerCase().split(' #')[0]}
                      rarity={hero.rarity as Rarity}
                      size={36}
                      className="shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-pixel text-[8px] truncate">{hero.name}</div>
                      <div className="font-pixel text-[6px] text-muted-foreground">
                        {rarityConfig?.label} · Niv. {hero.level} · {hero.stars}★
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Preview héros sélectionné */}
            {selectedHero && (
              <div className={cn('flex items-center gap-3 p-2 pixel-border', `rarity-${selectedHero.rarity}`)}>
                <HeroAvatar
                  heroName={selectedHero.name.toLowerCase().split(' #')[0]}
                  rarity={selectedHero.rarity as Rarity}
                  size={48}
                  animated
                />
                <div>
                  <div className="font-pixel text-[9px]">{selectedHero.name}</div>
                  <div className="font-pixel text-[7px] text-muted-foreground">
                    Niv. {selectedHero.level} · {selectedHero.stars}★
                  </div>
                </div>
              </div>
            )}

            {/* Prix */}
            <div className="space-y-1">
              <label className="font-pixel text-[8px] text-muted-foreground flex items-center gap-1">
                <Coins size={11} /> Prix (100 – 999 999)
              </label>
              <input
                type="number"
                min={100}
                max={999999}
                value={price}
                onChange={(e) => setPrice(Math.max(100, Math.min(999999, Number(e.target.value))))}
                className="w-full pixel-border bg-background font-pixel text-[9px] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </>
        )}

        <DialogFooter className="gap-2">
          <button
            onClick={handleClose}
            className="pixel-btn pixel-btn-secondary font-pixel text-[7px] px-3 py-2"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedHeroId || price < 100 || isLoading || sellableHeroes.length === 0}
            className={cn(
              'pixel-btn font-pixel text-[7px] px-3 py-2',
              (!selectedHeroId || price < 100 || isLoading) && 'opacity-50 cursor-not-allowed',
            )}
          >
            {isLoading ? '...' : 'Mettre en vente'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
