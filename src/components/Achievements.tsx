import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { AchievementState, AchievementDefinition, ACHIEVEMENTS } from '@/game/achievements';
import { getUnlockedAchievements, getInProgressAchievements, getLockedAchievements } from '@/game/achievements';
import { Check, Lock, Sparkles, Swords, Star, Trophy, Coins, Gem, Award } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import EmptyState from '@/components/EmptyState';

interface AchievementsProps {
  achievements: AchievementState;
  onClose?: () => void;
  onClaimReward?: (achievementId: string) => void;
  onClaimAll?: (ids: string[]) => void;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'invocation': return <Sparkles size={12} />;
    case 'combat': return <Swords size={12} />;
    case 'progression': return <Star size={12} />;
    case 'collection': return <Trophy size={12} />;
    default: return <Star size={12} />;
  }
};

const getCategoryLabel = (category: string) => {
  switch (category) {
    case 'invocation': return 'Invocation';
    case 'combat': return 'Combat';
    case 'progression': return 'Progression';
    case 'collection': return 'Collection';
    default: return category;
  }
};

interface AchievementItemProps {
  achievement: AchievementDefinition;
  progress: { progress: number; unlocked: boolean; claimedAt?: number };
  onClaim?: (achievementId: string) => void;
}

const getRewardIcon = (type: string) => {
  if (type === 'coins') return <Coins size={11} className="text-game-gold" />;
  if (type === 'shards') return <Gem size={11} className="text-primary" />;
  return null;
};

const AchievementItem: React.FC<AchievementItemProps> = ({ achievement, progress, onClaim }) => {
  const percentage = Math.min((progress.progress / achievement.target) * 100, 100);
  const canClaim = progress.unlocked && !progress.claimedAt;
  const isClaimed = !!progress.claimedAt;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'pixel-border p-3 transition-all',
        progress.unlocked ? 'bg-game-gold/10' : 'bg-muted/50',
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn('mt-0.5 shrink-0', progress.unlocked ? 'text-game-gold' : 'text-muted-foreground')}>
          {isClaimed
            ? <Check size={16} className="text-primary" />
            : progress.unlocked
            ? <Check size={16} />
            : <Lock size={16} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-pixel text-[9px] text-foreground">{achievement.title}</p>
            <div className="flex items-center gap-1 shrink-0 text-muted-foreground">
              {getCategoryIcon(achievement.category)}
              <span className="font-pixel text-[7px]">{getCategoryLabel(achievement.category)}</span>
            </div>
          </div>
          <p className="font-pixel text-[7px] text-muted-foreground mt-0.5">{achievement.description}</p>
          <div className="mt-2 flex items-center justify-between">
            {!achievement.isHidden && (
              <div className="flex items-center gap-2 flex-1">
                {/* Barre de progression pixel art */}
                <div className="flex-1 h-1.5 bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="font-pixel text-[7px] text-muted-foreground tabular-nums min-w-[2.5rem] text-right">
                  {progress.progress}/{achievement.target}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 shrink-0 ml-2">
              <div className="flex items-center gap-1 font-pixel text-[8px] bg-muted/50 px-2 py-1">
                {getRewardIcon(achievement.reward.type)}
                <span className="text-foreground tabular-nums">{achievement.reward.amount}</span>
                {achievement.reward.rarity && (
                  <span
                    className="font-pixel text-[7px]"
                    style={{ color: `hsl(var(--game-rarity-${achievement.reward.rarity}))` }}
                  >
                    {achievement.reward.rarity}
                  </span>
                )}
              </div>
              {canClaim && onClaim && (
                <button
                  onClick={() => onClaim(achievement.id)}
                  className="pixel-btn pixel-btn-gold font-pixel text-[7px] px-2 py-1 min-h-0"
                >
                  CLAIM
                </button>
              )}
              {isClaimed && (
                <span className="font-pixel text-[7px] text-primary">OK ✓</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const Achievements: React.FC<AchievementsProps> = ({ achievements, onClose, onClaimReward, onClaimAll }) => {
  const [activeTab, setActiveTab] = useState('all');

  const { unlocked, inProgress, locked, claimableIds } = useMemo(() => ({
    unlocked: getUnlockedAchievements(achievements),
    inProgress: getInProgressAchievements(achievements),
    locked: getLockedAchievements(achievements),
    claimableIds: ACHIEVEMENTS
      .filter(a => achievements[a.id]?.unlocked && !achievements[a.id]?.claimedAt)
      .map(a => a.id),
  }), [achievements]);

  const renderAchievements = (list: AchievementDefinition[], emptyMessage: string, emptyDescription?: string) => {
    if (list.length === 0) {
      return (
        <EmptyState
          icon={Award}
          title={emptyMessage}
          description={emptyDescription}
          className="py-4"
        />
      );
    }
    return (
      <div className="space-y-2">
        {list.map((achievement) => (
          <AchievementItem
            key={achievement.id}
            achievement={achievement}
            progress={achievements[achievement.id] || { progress: 0, unlocked: false, claimedAt: undefined }}
            onClaim={onClaimReward}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="pixel-border bg-card p-4">
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <h3 className="font-pixel text-xs text-foreground flex items-center gap-2">
          <Trophy size={16} className="text-game-gold" /> SUCCÈS
        </h3>
        <div className="flex items-center gap-2">
          {claimableIds.length > 1 && onClaimAll && (
            <button
              onClick={() => onClaimAll(claimableIds)}
              className="pixel-btn pixel-btn-gold font-pixel text-[7px] px-2 py-1 min-h-0 flex items-center gap-1"
            >
              <Check size={10} /> Tout récupérer ({claimableIds.length})
            </button>
          )}
          <span className="font-pixel text-[9px] text-muted-foreground tabular-nums">
            {unlocked.length}/{unlocked.length + inProgress.length + locked.length}
          </span>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-3">
          <TabsTrigger value="all" className="font-pixel text-[8px]">
            Tous ({unlocked.length + inProgress.length + locked.length})
          </TabsTrigger>
          <TabsTrigger value="unlocked" className="font-pixel text-[8px]">
            Débloqués ({unlocked.length})
          </TabsTrigger>
          <TabsTrigger value="progress" className="font-pixel text-[8px]">
            En cours ({inProgress.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {renderAchievements([...unlocked, ...inProgress, ...locked], 'Aucun succès disponible', 'Complète des défis pour débloquer des succès')}
        </TabsContent>
        <TabsContent value="unlocked">
          {renderAchievements(unlocked, 'Aucun succès débloqué', 'Continue d\'explorer et de combattre pour débloquer des succès')}
        </TabsContent>
        <TabsContent value="progress">
          {renderAchievements(inProgress, 'Aucun succès en cours', 'Commence par explorer ou combattre')}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Achievements;
