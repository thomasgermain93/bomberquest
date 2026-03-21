import React from 'react';
import { Coins, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import HeroAvatar from '@/components/HeroAvatar';
import { MarketplaceListing, MarketplaceHeroSnapshot } from '@/hooks/useMarketplace';
import { RARITY_CONFIG, Rarity } from '@/game/types';

interface ListingCardProps {
  listing: MarketplaceListing;
  currentUserId?: string;
  playerCoins: number;
  onBuy: (listing: MarketplaceListing) => void;
  onCancel: (listing: MarketplaceListing) => void;
}

export default function ListingCard({
  listing,
  currentUserId,
  playerCoins,
  onBuy,
  onCancel,
}: ListingCardProps) {
  const hero = listing.hero_snapshot as MarketplaceHeroSnapshot;
  const isOwn = currentUserId === listing.seller_id;
  const canAfford = playerCoins >= listing.price;
  const rarityConfig = RARITY_CONFIG[hero.rarity as Rarity];

  return (
    <div
      className={cn(
        'pixel-border p-3 flex flex-col gap-2 bg-card/80 hover:bg-card transition-colors',
        `rarity-${hero.rarity}`,
      )}
    >
      {/* Avatar + infos héros */}
      <div className="flex items-center gap-3">
        <HeroAvatar
          heroName={hero.name.toLowerCase().split(' #')[0]}
          rarity={hero.rarity as Rarity}
          size={48}
          className="shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-wrap">
            <span className="font-pixel text-[8px] truncate">{hero.name}</span>
            <span
              className="font-pixel text-[6px] px-1 rounded"
              style={{ background: `hsl(var(--game-rarity-${hero.rarity}))`, color: '#000' }}
            >
              {rarityConfig?.label ?? hero.rarity}
            </span>
          </div>
          <div className="font-pixel text-[7px] text-muted-foreground">
            Niv. {hero.level} · {hero.stars}★
          </div>
          {listing.status === 'active' && isOwn && (
            <div className="font-pixel text-[6px] text-yellow-400">Votre annonce</div>
          )}
        </div>
      </div>

      {/* Prix */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 font-pixel text-[8px] text-game-gold">
          <Coins size={12} className="text-game-gold" />
          {listing.price.toLocaleString()}
        </div>

        {listing.status === 'active' && (
          isOwn ? (
            <button
              onClick={() => onCancel(listing)}
              className="pixel-btn pixel-btn-secondary font-pixel text-[7px] flex items-center gap-1 px-2 py-1 min-h-0"
            >
              <X size={10} /> Annuler
            </button>
          ) : currentUserId ? (
            <button
              onClick={() => onBuy(listing)}
              disabled={!canAfford}
              className={cn(
                'pixel-btn font-pixel text-[7px] px-2 py-1 min-h-0',
                !canAfford && 'opacity-50 cursor-not-allowed',
              )}
            >
              Acheter
            </button>
          ) : null
        )}
      </div>
    </div>
  );
}
