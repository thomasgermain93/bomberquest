import React from 'react';
import { Coins } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import HeroAvatar from '@/components/HeroAvatar';
import { MarketplaceListing, MarketplaceHeroSnapshot } from '@/hooks/useMarketplace';
import { RARITY_CONFIG, Rarity } from '@/game/types';
import { cn } from '@/lib/utils';

interface BuyConfirmModalProps {
  listing: MarketplaceListing | null;
  playerCoins: number;
  isLoading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function BuyConfirmModal({
  listing,
  playerCoins,
  isLoading,
  onConfirm,
  onClose,
}: BuyConfirmModalProps) {
  if (!listing) return null;

  const hero = listing.hero_snapshot as MarketplaceHeroSnapshot;
  const afterBalance = playerCoins - listing.price;
  const canAfford = afterBalance >= 0;
  const rarityConfig = RARITY_CONFIG[hero.rarity as Rarity];

  return (
    <Dialog open={!!listing} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="pixel-border bg-card max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-pixel text-[10px]">Confirmer l'achat</DialogTitle>
        </DialogHeader>

        {/* Hero preview */}
        <div className={cn('flex items-center gap-3 p-3 pixel-border', `rarity-${hero.rarity}`)}>
          <HeroAvatar
            heroName={hero.name.toLowerCase().split(' #')[0]}
            rarity={hero.rarity as Rarity}
            size={56}
            className="shrink-0"
          />
          <div>
            <div className="font-pixel text-[9px]">{hero.name}</div>
            <div
              className="font-pixel text-[7px] inline-block px-1 rounded mt-0.5"
              style={{ background: `hsl(var(--game-rarity-${hero.rarity}))`, color: '#000' }}
            >
              {rarityConfig?.label ?? hero.rarity}
            </div>
            <div className="font-pixel text-[7px] text-muted-foreground mt-0.5">
              Niv. {hero.level} · {hero.stars}★
            </div>
          </div>
        </div>

        {/* Résumé financier */}
        <div className="space-y-1.5 font-pixel text-[8px]">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Prix</span>
            <span className="flex items-center gap-1 text-game-gold">
              <Coins size={11} /> {listing.price.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Votre solde</span>
            <span className="flex items-center gap-1">
              <Coins size={11} /> {playerCoins.toLocaleString()}
            </span>
          </div>
          <div className={cn('flex justify-between border-t border-border pt-1', canAfford ? 'text-green-400' : 'text-destructive')}>
            <span>Solde après achat</span>
            <span className="flex items-center gap-1">
              <Coins size={11} /> {afterBalance.toLocaleString()}
            </span>
          </div>
        </div>

        {!canAfford && (
          <p className="font-pixel text-[7px] text-destructive text-center">
            Fonds insuffisants.
          </p>
        )}

        <DialogFooter className="gap-2">
          <button
            onClick={onClose}
            className="pixel-btn pixel-btn-secondary font-pixel text-[7px] px-3 py-2"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={!canAfford || isLoading}
            className={cn(
              'pixel-btn font-pixel text-[7px] px-3 py-2',
              (!canAfford || isLoading) && 'opacity-50 cursor-not-allowed',
            )}
          >
            {isLoading ? '...' : 'Confirmer'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
