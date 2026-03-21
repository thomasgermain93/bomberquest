import React, { useState } from 'react';
import { Store, Tag, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { PlayerData, Rarity, RARITY_CONFIG } from '@/game/types';
import {
  useListings,
  useMyListings,
  useCreateListing,
  useBuyHero,
  useCancelListing,
  MarketplaceListing,
  MarketplaceFilters,
} from '@/hooks/useMarketplace';
import ListingCard from './ListingCard';
import BuyConfirmModal from './BuyConfirmModal';
import CreateListingModal from './CreateListingModal';

type Tab = 'browse' | 'my';
type User = { id: string } | null;

const SELLABLE_RARITIES: Rarity[] = ['epic', 'legend', 'super-legend'];

interface MarketplacePageProps {
  player: PlayerData;
  user: User;
  onTransactionComplete: () => void;
}

export default function MarketplacePage({ player, user, onTransactionComplete }: MarketplacePageProps) {
  const [tab, setTab] = useState<Tab>('browse');
  const [filters, setFilters] = useState<MarketplaceFilters>({ sortBy: 'newest' });
  const [buyTarget, setBuyTarget] = useState<MarketplaceListing | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const { data: listings = [], isLoading: loadingListings, refetch: refetchListings } = useListings(filters);
  const { data: myListings = [], isLoading: loadingMy, refetch: refetchMy } = useMyListings(user?.id);
  const createListing = useCreateListing();
  const buyHero = useBuyHero();
  const cancelListing = useCancelListing();

  const handleBuy = (listing: MarketplaceListing) => setBuyTarget(listing);

  const handleConfirmBuy = async () => {
    if (!buyTarget || !user) return;
    try {
      const result = await buyHero.mutateAsync({ listingId: buyTarget.id, buyerId: user.id });
      toast.success(`Héros acheté ! (${result.price_paid?.toLocaleString()} coins dépensés)`);
      setBuyTarget(null);
      onTransactionComplete();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'achat.");
    }
  };

  const handleCancel = async (listing: MarketplaceListing) => {
    if (!user) return;
    try {
      await cancelListing.mutateAsync({ listingId: listing.id, sellerId: user.id });
      toast.success('Annonce annulée. Héros retourné dans votre collection.');
      onTransactionComplete();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'annulation.");
    }
  };

  const handleCreateListing = async (heroId: string, price: number) => {
    if (!user) return;
    try {
      await createListing.mutateAsync({ sellerId: user.id, heroId, price });
      toast.success('Héros mis en vente avec succès !');
      setCreateOpen(false);
      onTransactionComplete();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la mise en vente.');
    }
  };

  if (!user) {
    return (
      <div className="p-4 max-w-2xl mx-auto flex flex-col items-center justify-center gap-4 min-h-[40vh]">
        <Store size={40} className="text-muted-foreground" />
        <p className="font-pixel text-[9px] text-center text-muted-foreground">
          Connectez-vous pour accéder au Marché des héros.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-pixel text-[11px] flex items-center gap-2">
          <Store size={16} /> Marché
        </h2>
        <button
          onClick={() => { refetchListings(); refetchMy(); }}
          className="pixel-btn pixel-btn-secondary font-pixel text-[7px] flex items-center gap-1 px-2 py-1 min-h-0"
        >
          <RefreshCw size={10} /> Actualiser
        </button>
      </div>

      {/* Onglets */}
      <div className="flex gap-1 sticky top-0 bg-background/95 backdrop-blur py-2 z-10">
        {(['browse', 'my'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'flex-1 font-pixel text-[8px] py-2 rounded transition-colors',
              tab === t ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
            )}
          >
            {t === 'browse' ? 'Parcourir' : 'Mes annonces'}
          </button>
        ))}
      </div>

      {/* Onglet Parcourir */}
      {tab === 'browse' && (
        <div className="space-y-3">
          {/* Filtres rareté */}
          <div className="flex gap-1 flex-wrap">
            <button
              onClick={() => setFilters((f) => ({ ...f, rarity: undefined }))}
              className={cn(
                'font-pixel text-[7px] px-2 py-1 pixel-border transition-colors',
                !filters.rarity ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
              )}
            >
              Tous
            </button>
            {SELLABLE_RARITIES.map((r) => (
              <button
                key={r}
                onClick={() => setFilters((f) => ({ ...f, rarity: f.rarity === r ? undefined : r }))}
                className={cn(
                  'font-pixel text-[7px] px-2 py-1 pixel-border transition-colors',
                  filters.rarity === r ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                )}
              >
                {RARITY_CONFIG[r].label}
              </button>
            ))}
          </div>

          {/* Tri */}
          <div className="flex gap-1 flex-wrap">
            {([
              ['newest', 'Récents'],
              ['price_asc', 'Prix ↑'],
              ['price_desc', 'Prix ↓'],
            ] as [MarketplaceFilters['sortBy'], string][]).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setFilters((f) => ({ ...f, sortBy: val }))}
                className={cn(
                  'font-pixel text-[7px] px-2 py-1 pixel-border transition-colors',
                  filters.sortBy === val ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {loadingListings ? (
            <p className="font-pixel text-[8px] text-muted-foreground text-center py-8">Chargement...</p>
          ) : listings.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <Tag size={32} className="mx-auto text-muted-foreground" />
              <p className="font-pixel text-[8px] text-muted-foreground">Aucune annonce disponible.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  currentUserId={user.id}
                  playerCoins={player.bomberCoins}
                  onBuy={handleBuy}
                  onCancel={handleCancel}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Onglet Mes annonces */}
      {tab === 'my' && (
        <div className="space-y-3">
          <button
            onClick={() => setCreateOpen(true)}
            className="w-full pixel-btn font-pixel text-[8px] flex items-center justify-center gap-2 py-2"
          >
            <Tag size={12} /> Mettre un héros en vente
          </button>

          {loadingMy ? (
            <p className="font-pixel text-[8px] text-muted-foreground text-center py-8">Chargement...</p>
          ) : myListings.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <Store size={32} className="mx-auto text-muted-foreground" />
              <p className="font-pixel text-[8px] text-muted-foreground">Vous n'avez aucune annonce.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {myListings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  currentUserId={user.id}
                  playerCoins={player.bomberCoins}
                  onBuy={handleBuy}
                  onCancel={handleCancel}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <BuyConfirmModal
        listing={buyTarget}
        playerCoins={player.bomberCoins}
        isLoading={buyHero.isPending}
        onConfirm={handleConfirmBuy}
        onClose={() => setBuyTarget(null)}
      />

      <CreateListingModal
        open={createOpen}
        heroes={player.heroes}
        isLoading={createListing.isPending}
        onConfirm={handleCreateListing}
        onClose={() => setCreateOpen(false)}
      />
    </div>
  );
}
