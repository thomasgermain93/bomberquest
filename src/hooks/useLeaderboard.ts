import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type BoardType = 'level' | 'hunts';

export interface LeaderboardEntry {
  rank: number;
  display_name: string;
  value: number;
  user_id: string;
}

export function useLeaderboard(boardType: BoardType) {
  return useQuery({
    queryKey: ['leaderboard', boardType],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_leaderboard' as never, {
        board_type: boardType,
        lim: 50,
      });
      if (error) throw error;
      return (data || []) as LeaderboardEntry[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
