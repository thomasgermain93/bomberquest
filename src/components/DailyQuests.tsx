import React from 'react';
import { motion } from 'framer-motion';
import { DailyQuestData, ALL_CLAIMED_BONUS, ALL_CLAIMED_XP_BONUS } from '@/game/questSystem';
import { Coins, Gift, Check, Clock, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import DailyResetTimer from '@/components/DailyResetTimer';

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
            className={`rounded-lg p-3 border transition-all ${
              quest.claimed
                ? 'bg-muted/30 border-border opacity-60'
                : quest.completed
                ? 'bg-primary/10 border-primary/30 shadow-sm'
                : 'bg-muted/50 border-border'
            }`}
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
                <p className="text-[10px] text-muted-foreground mt-0.5">{quest.description}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Progress
                    value={(quest.progress / quest.target) * 100}
                    className="h-1.5 flex-1"
                  />
                  <span className="text-[9px] text-muted-foreground font-mono w-14 text-right tabular-nums min-w-[2.5rem]">
                    {quest.progress}/{quest.target}
                  </span>
                </div>
              </div>
              <div className="shrink-0 mt-1">
                {quest.claimed ? (
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                    <Check size={14} className="text-muted-foreground" />
                  </div>
                ) : quest.completed ? (
                  <Button
                    size="sm"
                    onClick={() => onClaim(quest.id)}
                    className="font-pixel text-[8px] h-7 px-2 gap-1"
                  >
                    <Gift size={12} /> Récupérer
                  </Button>
                ) : null}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* All quests bonus */}
      <motion.div
        className={`mt-3 rounded-lg p-3 border text-center transition-all ${
          quests.allClaimedBonus
            ? 'bg-muted/30 border-border opacity-60'
            : allCompleted
            ? 'bg-game-gold/10 border-game-gold/30 shadow-md'
            : 'bg-muted/30 border-dashed border-border'
        }`}
      >
        <div className="flex items-center justify-center gap-2 mb-1">
          <Star size={14} className={allCompleted && !quests.allClaimedBonus ? 'text-game-gold fill-current' : 'text-muted-foreground'} />
          <span className="font-pixel text-[9px] text-foreground">BONUS JOURNALIER</span>
          <Star size={14} className={allCompleted && !quests.allClaimedBonus ? 'text-game-gold fill-current' : 'text-muted-foreground'} />
        </div>
        <p className="text-[10px] text-muted-foreground mb-2">
          Complète les 3 quêtes pour obtenir un bonus de{' '}
          <span className="text-game-gold font-bold">{ALL_CLAIMED_BONUS} BC</span> +{' '}
          <span className="text-primary font-bold">{ALL_CLAIMED_XP_BONUS} XP</span>
        </p>
        {allClaimed && !quests.allClaimedBonus && (
          <Button
            onClick={onClaimBonus}
            className="font-pixel text-[9px] gap-1 bg-game-gold/90 hover:bg-game-gold text-background"
          >
            <Gift size={14} /> RÉCUPÉRER LE BONUS
          </Button>
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
