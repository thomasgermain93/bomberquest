import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

interface XpBarProps {
  xp: number;
  accountLevel: number;
}

export default function XpBar({ xp, accountLevel }: XpBarProps) {
  let xpRemaining = xp;
  let lvl = 1;
  let xpForLevel = 100;
  while (xpRemaining >= xpForLevel) {
    xpRemaining -= xpForLevel;
    lvl++;
    xpForLevel = lvl * 100;
  }
  const nextLevelXp = lvl * 100;
  const pct = Math.round((xpRemaining / nextLevelXp) * 100);

  return (
    <div className="pixel-border bg-card p-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-pixel text-[9px] text-foreground flex items-center gap-1">
          <Star size={12} className="text-game-gold" /> Niveau {accountLevel}
        </span>
        <span className="font-pixel text-[8px] text-muted-foreground">
          {xpRemaining} / {nextLevelXp} XP
        </span>
      </div>
      <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-primary to-game-gold rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );
}
