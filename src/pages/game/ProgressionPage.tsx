import React from 'react';
import { motion } from 'framer-motion';
import { pixelFade } from '@/lib/animations';
import { Trophy } from 'lucide-react';
import { PlayerData, MAX_LEVEL_BY_RARITY } from '@/game/types';
import { DailyQuestData } from '@/game/questSystem';
import { StoryProgress } from '@/game/storyTypes';
import { claimAchievementReward, ACHIEVEMENTS } from '@/game/achievements';
import PlayerStats from '@/components/PlayerStats';
import DailyQuests from '@/components/DailyQuests';
import Achievements from '@/components/Achievements';
import { toast } from 'sonner';

interface ProgressionPageProps {
  player: PlayerData;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerData>>;
  dailyQuests: DailyQuestData;
  setDailyQuests: React.Dispatch<React.SetStateAction<DailyQuestData>>;
  storyProgress: StoryProgress;
  handleClaimQuest: (questId: string) => void;
  handleClaimDailyBonus: () => void;
}

const ProgressionPage: React.FC<ProgressionPageProps> = ({
  player,
  setPlayer,
  dailyQuests,
  storyProgress,
  handleClaimQuest,
  handleClaimDailyBonus,
}) => {
  return (
    <div className="w-1/6 h-full overflow-y-auto pb-nav md:pl-16">
      <div className="p-4 max-w-2xl mx-auto space-y-6">
        {/* Player Stats */}
        <PlayerStats
          mapsCompleted={player.mapsCompleted}
          heroesTotal={player.heroes.length}
          achievementsUnlocked={ACHIEVEMENTS.filter(a => player.achievements[a.id]?.unlocked).length}
          achievementsTotal={ACHIEVEMENTS.length}
          storyHighestStage={storyProgress.highestStage}
          bossesDefeated={storyProgress.bossesDefeated?.length ?? 0}
          heroesAtMax={player.heroes.filter(h => h.level >= MAX_LEVEL_BY_RARITY[h.rarity]).length}
        />

        {/* Daily Quests */}
        <DailyQuests
          quests={dailyQuests}
          onClaim={handleClaimQuest}
          onClaimBonus={handleClaimDailyBonus}
        />

        {/* Achievements */}
        <motion.div variants={pixelFade} initial="hidden" animate="visible" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-pixel text-xs text-foreground flex items-center gap-2">
              <Trophy size={16} /> SUCCÈS
            </h2>
          </div>
          <Achievements
            achievements={player.achievements}
            onClaimReward={(achievementId: string) => {
              const { newState, claimed, reward } = claimAchievementReward(player.achievements, achievementId);
              if (claimed && reward) {
                setPlayer(prev => ({
                  ...prev,
                  bomberCoins: reward.type === 'coins' ? prev.bomberCoins + reward.amount : prev.bomberCoins,
                  universalShards: reward.type === 'shards' && !reward.rarity
                    ? (prev.universalShards || 0) + reward.amount
                    : (prev.universalShards || 0),
                  shards: reward.type === 'shards' && reward.rarity
                    ? {
                        ...prev.shards,
                        [reward.rarity as keyof typeof prev.shards]: (prev.shards[reward.rarity as keyof typeof prev.shards] || 0) + reward.amount,
                      }
                    : prev.shards,
                  achievements: newState,
                }));
                toast('Récompense réclamée!', {
                  description: `${reward.amount} ${reward.type === 'coins' ? 'pièces' : reward.rarity ? `shards ${reward.rarity}` : 'shards universels'}`,
                });
              }
            }}
            onClaimAll={(ids: string[]) => {
              let currentAchievements = player.achievements;
              let totalCoins = 0;
              let totalShards = 0;
              for (const id of ids) {
                const { newState, claimed, reward } = claimAchievementReward(currentAchievements, id);
                if (claimed && reward) {
                  currentAchievements = newState;
                  if (reward.type === 'coins') totalCoins += reward.amount;
                  else totalShards += reward.amount;
                }
              }
              setPlayer(prev => ({
                ...prev,
                bomberCoins: prev.bomberCoins + totalCoins,
                universalShards: (prev.universalShards || 0) + totalShards,
                achievements: currentAchievements,
              }));
              toast(`${ids.length} succès récupérés !`, {
                description: [
                  totalCoins > 0 ? `${totalCoins} pièces` : '',
                  totalShards > 0 ? `${totalShards} shards` : '',
                ].filter(Boolean).join(' · '),
              });
            }}
          />
        </motion.div>
      </div>
    </div>
  );
};

export default ProgressionPage;
