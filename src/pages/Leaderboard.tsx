import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLeaderboard, BoardType } from '@/hooks/useLeaderboard';
import { useAuth } from '@/contexts/AuthContext';
import { PixelLoader } from '@/components/PixelLoader';
import { EmptyState } from '@/components/EmptyState';

const RANK_COLORS: Record<number, string> = {
  1: 'text-game-gold',
  2: 'text-muted-foreground',
  3: 'text-[hsl(var(--game-rarity-rare))]',
};

const RANK_MEDALS: Record<number, string> = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
};

const TAB_LABELS: Record<BoardType, string> = {
  level: 'Niveau de compte',
  hunts: 'Chasses au trésor',
};

const VALUE_LABELS: Record<BoardType, string> = {
  level: 'Niveau',
  hunts: 'Chasses',
};

const Leaderboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<BoardType>('level');
  const { data, isLoading, isError } = useLeaderboard(activeTab);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="pixel-border bg-card p-4 flex items-center gap-4">
        <button
          onClick={() => navigate('/')}
          className="pixel-btn pixel-btn-secondary font-pixel text-[8px] px-3 py-2"
          aria-label="Retour à l'accueil"
        >
          ←
        </button>
        <h1 className="font-pixel text-[12px] text-foreground">LEADERBOARD</h1>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-6">
        {/* Tabs */}
        <div className="flex gap-2">
          {(Object.keys(TAB_LABELS) as BoardType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'pixel-btn font-pixel text-[8px]',
                activeTab === tab ? '' : 'pixel-btn-secondary'
              )}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading && (
          <div className="flex justify-center py-16">
            <PixelLoader size="lg" label="Chargement du classement..." />
          </div>
        )}

        {isError && (
          <EmptyState
            icon={AlertCircle}
            title="Erreur de chargement"
            description="Impossible de récupérer le classement. Réessaie plus tard."
          />
        )}

        {!isLoading && !isError && (!data || data.length === 0) && (
          <EmptyState
            icon={Trophy}
            title="Aucun joueur classé"
            description="Sois le premier à rejoindre le classement !"
            action={{ label: 'Jouer', onClick: () => navigate('/game') }}
          />
        )}

        {!isLoading && !isError && data && data.length > 0 && (
          <div className="pixel-border bg-card overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[48px_1fr_80px] gap-2 px-4 py-2 bg-muted/50 border-b border-border">
              <span className="font-pixel text-[7px] text-muted-foreground">Rang</span>
              <span className="font-pixel text-[7px] text-muted-foreground">Joueur</span>
              <span className="font-pixel text-[7px] text-muted-foreground text-right">{VALUE_LABELS[activeTab]}</span>
            </div>

            {/* Rows */}
            {data.map((entry, index) => {
              const isCurrentUser = user?.id === entry.user_id;
              const rankColor = RANK_COLORS[entry.rank] ?? 'text-foreground';
              const isEven = index % 2 === 0;

              return (
                <div
                  key={entry.user_id}
                  className={cn(
                    'grid grid-cols-[48px_1fr_80px] gap-2 px-4 py-2.5 items-center transition-colors',
                    isEven ? 'bg-muted/30' : '',
                    isCurrentUser ? 'bg-primary/10 border-l-2 border-primary' : ''
                  )}
                >
                  {/* Rang */}
                  <div className="flex items-center gap-1">
                    {RANK_MEDALS[entry.rank] ? (
                      <span className="text-[14px]">{RANK_MEDALS[entry.rank]}</span>
                    ) : (
                      <span className={cn('font-pixel text-[8px]', rankColor)}>#{entry.rank}</span>
                    )}
                  </div>

                  {/* Joueur */}
                  <div className="flex items-center gap-1 min-w-0">
                    <span className={cn(
                      'font-pixel text-[8px] truncate',
                      isCurrentUser ? 'text-primary' : 'text-foreground'
                    )}>
                      {entry.display_name}
                    </span>
                    {isCurrentUser && (
                      <span className="font-pixel text-[6px] text-primary shrink-0">(toi)</span>
                    )}
                  </div>

                  {/* Valeur */}
                  <div className="text-right">
                    <span className={cn('font-pixel text-[8px]', rankColor)}>
                      {entry.value.toLocaleString('fr-FR')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
