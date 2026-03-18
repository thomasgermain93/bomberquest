import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface LandingKpis {
  players: number | null;
  totalInvocations: number | null;
  lastSuperLegend: string | null;
}

const KPI_TIMEOUT_MS = 8000;
const KPI_RETRY_DELAY_MS = 1000;
const KPI_MAX_RETRIES = 1;

const KPI_FALLBACK: LandingKpis = {
  players: null,
  totalInvocations: null,
  lastSuperLegend: null,
};

const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('KPI timeout')), ms)
    ),
  ]);
};

const withRetry = async <T,>(
  fn: () => Promise<T>,
  maxRetries: number,
  delayMs: number
): Promise<T> => {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  throw lastError;
};

export const formatKpi = (value: number | null): string => {
  if (value === null) return '—';
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  return new Intl.NumberFormat('fr-FR').format(value);
};

const fetchKpisViaRpc = async (): Promise<LandingKpis> => {
  const { data, error } = await supabase.rpc('get_landing_stats');
  if (error) {
    throw new Error(`KPI RPC failed: ${error.message}`);
  }
  const stats = data as Record<string, unknown> | null;
  return {
    players: typeof stats?.players === 'number' ? stats.players : null,
    totalInvocations: typeof stats?.totalInvocations === 'number' ? stats.totalInvocations : null,
    lastSuperLegend: typeof stats?.lastSuperLegend === 'string' ? stats.lastSuperLegend : null,
  };
};

const fetchKpisViaQueries = async (): Promise<LandingKpis> => {
  const [playersRes, heroesRes, legendRes] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('player_heroes').select('id', { count: 'exact', head: true }),
    supabase
      .from('player_heroes')
      .select('user_id, created_at')
      .eq('rarity', 'super-legend')
      .order('created_at', { ascending: false })
      .limit(1),
  ]);

  let lastSuperLegend: string | null = null;
  if (legendRes.data && legendRes.data.length > 0) {
    const legendUserId = legendRes.data[0].user_id;
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('user_id', legendUserId)
      .single();
    lastSuperLegend = profile?.display_name ?? null;
  }

  return {
    players: playersRes.count ?? null,
    totalInvocations: heroesRes.count ?? null,
    lastSuperLegend,
  };
};

export const useKpis = () => {
  const [kpis, setKpis] = useState<LandingKpis>(KPI_FALLBACK);
  const [kpisLoading, setKpisLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: ReturnType<typeof setTimeout>;

    const loadKpis = async () => {
      setKpisLoading(true);
      try {
        timeoutId = setTimeout(() => {
          if (isMounted) {
            setKpis(KPI_FALLBACK);
            setKpisLoading(false);
          }
        }, KPI_TIMEOUT_MS);

        let result: LandingKpis | null = null;

        try {
          result = await withRetry(
            () => withTimeout(fetchKpisViaRpc(), KPI_TIMEOUT_MS),
            KPI_MAX_RETRIES,
            KPI_RETRY_DELAY_MS,
          );
        } catch (rpcErr) {
          console.warn('[KPI] RPC unavailable, falling back to direct queries:', rpcErr);
          result = await withTimeout(fetchKpisViaQueries(), KPI_TIMEOUT_MS);
        }

        clearTimeout(timeoutId);
        if (!isMounted) return;
        setKpis(result ?? KPI_FALLBACK);
      } catch (err) {
        if (!isMounted) return;
        const error = err instanceof Error ? err : new Error(String(err));
        console.error('[KPI] Load failed:', { message: error.message, timestamp: new Date().toISOString() });
        setKpis(KPI_FALLBACK);
      } finally {
        clearTimeout(timeoutId);
        if (isMounted) setKpisLoading(false);
      }
    };

    loadKpis();
    return () => { isMounted = false; clearTimeout(timeoutId); };
  }, []);

  return { kpis, kpisLoading };
};
