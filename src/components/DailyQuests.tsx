import React from 'react';
import { motion } from 'framer-motion';
import { DailyQuestData, ALL_CLAIMED_BONUS, ALL_CLAIMED_XP_BONUS } from '@/game/questSystem';
import { Coins, Gift, Check, Clock, Star } from 'lucide-react';
import DailyResetTimer from '@/components/DailyResetTimer';
import { cn } from '@/lib/utils';

interface DailyQuestsProps {
  quests: DailyQuestData;
  onClaim: (questId: string) => void;
  onClaimBonus: () => void;
}

const DailyQuests: React.FC<DailyQuestsProps> = ({ quests, onClaim, onClaimBonus }) => {
  const allClaimed = quests.quests.every(q => q.claimed);
  const allCompleted = quests.quests.every(q => q.completed);

  return (
    <div className="pixel-border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-pixel text-xs text-foreground flex items-center gap-2">
          <Clock size={16} className="text-primary" /> QUÊTES DU JOUR
        </h3>
        <div className="flex items-center gap-1.5 sm:gap-3">
          <DailyResetTimer />
          <span className="text-[9px] text-muted-foreground font-pixel tabular-nums">
            {quests.quests.filter(q => q.claimed).length}/{quests.quests.length}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {quests.quests.map((quest, i) => (
          <motion.div
            key={quest.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className={cn(
              'pixel-border p-3 transition-all',
              quest.claimed
                ? 'opacity-60 bg-muted/30'
                : quest.completed
                ? 'bg-primary/10'
                : 'bg-muted/50',
            )}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl mt-0.5">{quest.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-pixel text-[9px] text-foreground">{quest.label}</p>
                  <div className="flex items-center gap-1 shrink-0">
                    <Coins size={10} className="text-game-gold" />
                    <span className="font-pixel text-[9px] text-game-gold">+{quest.reward}</span>
                  </div>
                </div>
                <p className="font-pixel text-[7px] text-muted-foreground mt-0.5">{quest.description}</p>
                <div className="mt-2 flex items-center gap-2">
                  {/* Barre de progression pixel art */}
                  <div className="flex-1 h-2 bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${Math.min((quest.progress / quest.target) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="font-pixel text-[7px] text-muted-foreground tabular-nums min-w-[2.5rem] text-right">
                    {quest.progress}/{quest.target}
                  </span>
                </div>
              </div>
              <div className="shrink-0 mt-1">
                {quest.claimed ? (
                  <div className="w-7 h-7 bg-muted flex items-center justify-center">
                    <Check size={14} className="text-muted-foreground" />
                  </div>
                ) : quest.completed ? (
                  <button
                    onClick={() => onClaim(quest.id)}
                    className="pixel-btn pixel-btn-gold font-pixel text-[7px] flex items-center gap-1 px-2 py-1 min-h-0"
                  >
                    <Gift size={10} /> Récupérer
                  </button>
                ) : null}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Bonus journalier */}
      <motion.div
        className={cn(
          'mt-3 pixel-border p-3 text-center transition-all',
          quests.allClaimedBonus
            ? 'opacity-60 bg-muted/30'
            : allCompleted
            ? 'bg-game-gold/10'
            : 'bg-muted/30',
        )}
      >
        <div className="flex items-center justify-center gap-2 mb-1">
          <Star size={14} className={allCompleted && !quests.allClaimedBonus ? 'text-game-gold fill-current' : 'text-muted-foreground'} />
          <span className="font-pixel text-[9px] text-foreground">BONUS JOURNALIER</span>
          <Star size={14} className={allCompleted && !quests.allClaimedBonus ? 'text-game-gold fill-current' : 'text-muted-foreground'} />
        </div>
        <p className="font-pixel text-[7px] text-muted-foreground mb-2">
          Complète les 3 quêtes :{' '}
          <span className="text-game-gold">{ALL_CLAIMED_BONUS} BC</span>{' '}
          + <span className="text-primary">{ALL_CLAIMED_XP_BONUS} XP</span>
        </p>
        {allClaimed && !quests.allClaimedBonus && (
          <button
            onClick={onClaimBonus}
            className="pixel-btn pixel-btn-gold font-pixel text-[8px] flex items-center justify-center gap-1 mx-auto"
          >
            <Gift size={12} /> RÉCUPÉRER LE BONUS
          </button>
        )}
        {quests.allClaimedBonus && (
          <p className="font-pixel text-[9px] text-muted-foreground flex items-center justify-center gap-1">
            <Check size={12} /> Bonus récupéré !
          </p>
        )}
      </motion.div>
    </div>
  );
};

export default DailyQuests;
