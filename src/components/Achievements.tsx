import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AchievementState, AchievementDefinition } from '@/game/achievements';
import { getUnlockedAchievements, getInProgressAchievements, getLockedAchievements } from '@/game/achievements';
import { Progress } from '@/components/ui/progress';
import { Check, Lock, Sparkles, Swords, Star, Trophy } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AchievementsProps {
  achievements: AchievementState;
  onClose?: () => void;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'invocation':
      return <Sparkles size={14} />;
    case 'combat':
      return <Swords size={14} />;
    case 'progression':
      return <Star size={14} />;
    case 'collection':
      return <Trophy size={14} />;
    default:
      return <Star size={14} />;
  }
};

const getCategoryLabel = (category: string) => {
  switch (category) {
    case 'invocation':
      return 'Invocation';
    case 'combat':
      return 'Combat';
    case 'progression':
      return 'Progression';
    case 'collection':
      return 'Collection';
    default:
      return category;
  }
};

interface AchievementItemProps {
  achievement: AchievementDefinition;
  progress: { progress: number; unlocked: boolean };
}

const AchievementItem: React.FC<AchievementItemProps> = ({ achievement, progress }) => {
  const percentage = Math.min((progress.progress / achievement.target) * 100, 100);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg p-3 border transition-all ${
        progress.unlocked
          ? 'bg-game-gold/10 border-game-gold/30'
          : 'bg-muted/50 border-border'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 ${progress.unlocked ? 'text-game-gold' : 'text-muted-foreground'}`}>
          {progress.unlocked ? <Check size={18} /> : <Lock size={18} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-pixel text-[10px] text-foreground">{achievement.title}</p>
            <div className="flex items-center gap-1 shrink-0 text-muted-foreground">
              {getCategoryIcon(achievement.category)}
              <span className="text-[9px]">{getCategoryLabel(achievement.category)}</span>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">{achievement.description}</p>
          {!achievement.isHidden && (
            <div className="mt-2 flex items-center gap-2">
              <Progress
                value={percentage}
                className="h-2 flex-1"
              />
              <span className="text-[9px] text-muted-foreground font-mono w-14 text-right tabular-nums min-w-[2.5rem]">
                {progress.progress}/{achievement.target}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const Achievements: React.FC<AchievementsProps> = ({ achievements, onClose }) => {
  const [activeTab, setActiveTab] = useState('all');
  
  const unlocked = getUnlockedAchievements(achievements);
  const inProgress = getInProgressAchievements(achievements);
  const locked = getLockedAchievements(achievements);
  
  const renderAchievements = (list: AchievementDefinition[], emptyMessage: string) => {
    if (list.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <p className="font-pixel text-[10px]">{emptyMessage}</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-2">
        {list.map((achievement, i) => (
          <AchievementItem
            key={achievement.id}
            achievement={achievement}
            progress={achievements[achievement.id] || { progress: 0, unlocked: false }}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="pixel-border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-pixel text-xs text-foreground flex items-center gap-2">
          <Trophy size={16} className="text-game-gold" /> SUCCÈS
        </h3>
        <span className="text-[9px] text-muted-foreground font-pixel tabular-nums">
          {unlocked.length}/{unlocked.length + inProgress.length + locked.length} débloqués
        </span>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-3">
          <TabsTrigger value="all" className="font-pixel text-[9px]">
            Tous ({unlocked.length + inProgress.length + locked.length})
          </TabsTrigger>
          <TabsTrigger value="unlocked" className="font-pixel text-[9px]">
            Débloqués ({unlocked.length})
          </TabsTrigger>
          <TabsTrigger value="progress" className="font-pixel text-[9px]">
            En cours ({inProgress.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          {renderAchievements([...unlocked, ...inProgress, ...locked], 'Aucun succès disponible')}
        </TabsContent>
        
        <TabsContent value="unlocked">
          {renderAchievements(unlocked, 'Aucun succès débloqué')}
        </TabsContent>
        
        <TabsContent value="progress">
          {renderAchievements(inProgress, 'Aucun succès en cours')}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Achievements;