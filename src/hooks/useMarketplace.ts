import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Rarity } from '@/game/types';

export interface MarketplaceHeroSnapshot {
  name: string;
  rarity: Rarity;
  level: number;
  stars: number;
  xp: number;
  stats: Record<string, number>;
  skills: unknown[];
  currentStamina: number;
  maxStamina: number;
  houseLevel: number;
  icon: string;
  family?: string;
}

export interface MarketplaceListing {
  id: string;
  seller_id: string;
  hero_id: string;
  hero_snapshot: MarketplaceHeroSnapshot;
  price: number;
  status: string;
  buyer_id: string | null;
  created_at: string;
  sold_at: string | null;
  cancelled_at: string | null;
}

export interface MarketplaceFilters {
  rarity?: Rarity;
  sortBy?: 'price_asc' | 'price_desc' | 'newest';
}

export function useListings(filters?: MarketplaceFilters) {
  return useQuery({
    queryKey: ['marketplace', 'listings', filters],
    queryFn: async () => {
      let query = supabase
        .from('marketplace_listings')
        .select('*')
        .eq('status', 'active');

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      let listings = (data || []) as MarketplaceListing[];

      // Filtre rareté côté client (hero_snapshot est JSONB)
      if (filters?.rarity) {
        listings = listings.filter(
          (l) => (l.hero_snapshot as MarketplaceHeroSnapshot).rarity === filters.rarity,
        );
      }

      // Tri
      if (filters?.sortBy === 'price_asc') {
        listings = listings.sort((a, b) => a.price - b.price);
      } else if (filters?.sortBy === 'price_desc') {
        listings = listings.sort((a, b) => b.price - a.price);
      }

      return listings;
    },
    staleTime: 30 * 1000, // 30 secondes
  });
}

export function useMyListings(userId: string | undefined) {
  return useQuery({
    queryKey: ['marketplace', 'myListings', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('marketplace_listings')
        .select('*')
        .eq('seller_id', userId)
        .in('status', ['active', 'sold'])
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as MarketplaceListing[];
    },
    enabled: !!userId,
    staleTime: 30 * 1000,
  });
}

export function useCreateListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      sellerId,
      heroId,
      price,
    }: {
      sellerId: string;
      heroId: string;
      price: number;
    }) => {
      const { data, error } = await supabase.rpc('list_hero_for_sale' as never, {
        p_seller_id: sellerId,
        p_hero_id: heroId,
        p_price: price,
      });
      if (error) throw error;
      const result = data as { success: boolean; error?: string; listing_id?: string };
      if (!result.success) throw new Error(result.error || 'Erreur lors de la mise en vente.');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace'] });
    },
  });
}

export function useBuyHero() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      listingId,
      buyerId,
    }: {
      listingId: string;
      buyerId: string;
    }) => {
      const { data, error } = await supabase.rpc('buy_hero' as never, {
        p_listing_id: listingId,
        p_buyer_id: buyerId,
      });
      if (error) throw error;
      const result = data as { success: boolean; error?: string; new_hero_id?: string; price_paid?: number };
      if (!result.success) throw new Error(result.error || "Erreur lors de l'achat.");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace'] });
    },
  });
}

export function useCancelListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      listingId,
      sellerId,
    }: {
      listingId: string;
      sellerId: string;
    }) => {
      const { data, error } = await supabase.rpc('cancel_listing' as never, {
        p_listing_id: listingId,
        p_seller_id: sellerId,
      });
      if (error) throw error;
      const result = data as { success: boolean; error?: string };
      if (!result.success) throw new Error(result.error || "Erreur lors de l'annulation.");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace'] });
    },
  });
}
