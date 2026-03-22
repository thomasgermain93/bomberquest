import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useListings,
  useMyListings,
  useCreateListing,
  useBuyHero,
  useCancelListing,
} from '@/hooks/useMarketplace';

// Mock Supabase — la factory ne peut PAS référencer des variables externes (hoisting)
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(),
  },
}));

// Import après le mock pour récupérer les références mockées
import { supabase } from '@/integrations/supabase/client';

const mockRpc = supabase.rpc as ReturnType<typeof vi.fn>;
const mockFrom = supabase.from as ReturnType<typeof vi.fn>;

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

const mockListing = {
  id: 'listing-1',
  seller_id: 'user-1',
  hero_id: 'hero-1',
  hero_snapshot: {
    name: 'Blaze',
    rarity: 'rare',
    level: 10,
    stars: 1,
    xp: 500,
    stats: { pwr: 10, spd: 8 },
    skills: [],
    currentStamina: 100,
    maxStamina: 100,
    houseLevel: 1,
    icon: 'blaze',
    family: 'ember-clan',
  },
  price: 500,
  status: 'active',
  buyer_id: null,
  created_at: '2026-01-01T00:00:00Z',
  sold_at: null,
  cancelled_at: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

// Helper pour mock la chaîne supabase.from(...).select(...).eq(...).order(...)
function mockFromChain(resolvedValue: { data: unknown; error: unknown }) {
  const orderMock = vi.fn().mockResolvedValue(resolvedValue);
  const eqMock = vi.fn().mockReturnValue({ order: orderMock });
  const inMock = vi.fn().mockReturnValue({ order: orderMock });
  const selectMock = vi.fn().mockReturnValue({ eq: eqMock, in: inMock });
  mockFrom.mockReturnValue({ select: selectMock });
  return { orderMock, eqMock, selectMock };
}

describe('useListings', () => {
  it('retourne les annonces actives depuis Supabase', async () => {
    mockFromChain({ data: [mockListing], error: null });

    const { result } = renderHook(() => useListings(), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0].id).toBe('listing-1');
  });

  it('retourne un tableau vide si aucune annonce', async () => {
    mockFromChain({ data: [], error: null });

    const { result } = renderHook(() => useListings(), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it('lève une erreur si Supabase échoue', async () => {
    mockFromChain({ data: null, error: new Error('DB error') });

    const { result } = renderHook(() => useListings(), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });

  it('filtre par rareté côté client', async () => {
    const rareListing = { ...mockListing, id: 'listing-rare', hero_snapshot: { ...mockListing.hero_snapshot, rarity: 'rare' } };
    const epicListing = { ...mockListing, id: 'listing-epic', hero_snapshot: { ...mockListing.hero_snapshot, rarity: 'epic' } };
    mockFromChain({ data: [rareListing, epicListing], error: null });

    const { result } = renderHook(() => useListings({ rarity: 'epic' }), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0].id).toBe('listing-epic');
  });

  it('trie par prix croissant avec sortBy price_asc', async () => {
    const cheap = { ...mockListing, id: 'cheap', price: 100 };
    const expensive = { ...mockListing, id: 'expensive', price: 1000 };
    mockFromChain({ data: [expensive, cheap], error: null });

    const { result } = renderHook(() => useListings({ sortBy: 'price_asc' }), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data![0].id).toBe('cheap');
    expect(result.current.data![1].id).toBe('expensive');
  });

  it('trie par prix décroissant avec sortBy price_desc', async () => {
    const cheap = { ...mockListing, id: 'cheap', price: 100 };
    const expensive = { ...mockListing, id: 'expensive', price: 1000 };
    mockFromChain({ data: [cheap, expensive], error: null });

    const { result } = renderHook(() => useListings({ sortBy: 'price_desc' }), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data![0].id).toBe('expensive');
    expect(result.current.data![1].id).toBe('cheap');
  });
});

describe('useMyListings', () => {
  it("retourne les annonces de l'utilisateur connecté", async () => {
    const orderMock = vi.fn().mockResolvedValue({ data: [mockListing], error: null });
    const inMock = vi.fn().mockReturnValue({ order: orderMock });
    const eqMock = vi.fn().mockReturnValue({ in: inMock });
    const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
    mockFrom.mockReturnValue({ select: selectMock });

    const { result } = renderHook(() => useMyListings('user-1'), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
  });

  it('ne déclenche pas de requête si userId est undefined', async () => {
    const { result } = renderHook(() => useMyListings(undefined), { wrapper: makeWrapper() });

    // La query est désactivée (enabled: !!userId) → pas d'appel Supabase
    expect(mockFrom).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it('lève une erreur si Supabase échoue', async () => {
    const orderMock = vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') });
    const inMock = vi.fn().mockReturnValue({ order: orderMock });
    const eqMock = vi.fn().mockReturnValue({ in: inMock });
    const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
    mockFrom.mockReturnValue({ select: selectMock });

    const { result } = renderHook(() => useMyListings('user-1'), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useCreateListing', () => {
  it('expose une fonction mutate', () => {
    const { result } = renderHook(() => useCreateListing(), { wrapper: makeWrapper() });
    expect(typeof result.current.mutate).toBe('function');
    expect(typeof result.current.mutateAsync).toBe('function');
  });

  it('appelle supabase.rpc list_hero_for_sale avec les bons paramètres', async () => {
    mockRpc.mockResolvedValue({ data: { success: true, listing_id: 'listing-new' }, error: null });

    const { result } = renderHook(() => useCreateListing(), { wrapper: makeWrapper() });

    result.current.mutate({ sellerId: 'user-1', heroId: 'hero-1', price: 500 });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockRpc).toHaveBeenCalledWith('list_hero_for_sale', {
      p_seller_id: 'user-1',
      p_hero_id: 'hero-1',
      p_price: 500,
    });
  });

  it('lève une erreur si Supabase retourne une erreur', async () => {
    mockRpc.mockResolvedValue({ data: null, error: new Error('RPC error') });

    const { result } = renderHook(() => useCreateListing(), { wrapper: makeWrapper() });

    result.current.mutate({ sellerId: 'user-1', heroId: 'hero-1', price: 500 });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('lève une erreur si le RPC retourne success: false', async () => {
    mockRpc.mockResolvedValue({ data: { success: false, error: 'Hero already listed' }, error: null });

    const { result } = renderHook(() => useCreateListing(), { wrapper: makeWrapper() });

    result.current.mutate({ sellerId: 'user-1', heroId: 'hero-1', price: 500 });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toBe('Hero already listed');
  });
});

describe('useBuyHero', () => {
  it('expose une fonction mutate', () => {
    const { result } = renderHook(() => useBuyHero(), { wrapper: makeWrapper() });
    expect(typeof result.current.mutate).toBe('function');
  });

  it('appelle supabase.rpc buy_hero avec les bons paramètres', async () => {
    mockRpc.mockResolvedValue({
      data: { success: true, new_hero_id: 'hero-new', price_paid: 500 },
      error: null,
    });

    const { result } = renderHook(() => useBuyHero(), { wrapper: makeWrapper() });

    result.current.mutate({ listingId: 'listing-1', buyerId: 'user-2' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockRpc).toHaveBeenCalledWith('buy_hero', {
      p_listing_id: 'listing-1',
      p_buyer_id: 'user-2',
    });
  });

  it('lève une erreur si le RPC retourne success: false', async () => {
    mockRpc.mockResolvedValue({
      data: { success: false, error: 'Insufficient funds' },
      error: null,
    });

    const { result } = renderHook(() => useBuyHero(), { wrapper: makeWrapper() });

    result.current.mutate({ listingId: 'listing-1', buyerId: 'user-2' });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toBe('Insufficient funds');
  });

  it('lève une erreur si Supabase retourne une erreur', async () => {
    mockRpc.mockResolvedValue({ data: null, error: new Error('Network error') });

    const { result } = renderHook(() => useBuyHero(), { wrapper: makeWrapper() });

    result.current.mutate({ listingId: 'listing-1', buyerId: 'user-2' });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useCancelListing', () => {
  it('expose une fonction mutate', () => {
    const { result } = renderHook(() => useCancelListing(), { wrapper: makeWrapper() });
    expect(typeof result.current.mutate).toBe('function');
  });

  it('appelle supabase.rpc cancel_listing avec les bons paramètres', async () => {
    mockRpc.mockResolvedValue({ data: { success: true }, error: null });

    const { result } = renderHook(() => useCancelListing(), { wrapper: makeWrapper() });

    result.current.mutate({ listingId: 'listing-1', sellerId: 'user-1' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockRpc).toHaveBeenCalledWith('cancel_listing', {
      p_listing_id: 'listing-1',
      p_seller_id: 'user-1',
    });
  });

  it('lève une erreur si le RPC retourne success: false', async () => {
    mockRpc.mockResolvedValue({
      data: { success: false, error: 'Not your listing' },
      error: null,
    });

    const { result } = renderHook(() => useCancelListing(), { wrapper: makeWrapper() });

    result.current.mutate({ listingId: 'listing-1', sellerId: 'user-1' });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toBe('Not your listing');
  });

  it('lève une erreur si Supabase retourne une erreur', async () => {
    mockRpc.mockResolvedValue({ data: null, error: new Error('DB error') });

    const { result } = renderHook(() => useCancelListing(), { wrapper: makeWrapper() });

    result.current.mutate({ listingId: 'listing-1', sellerId: 'user-1' });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
