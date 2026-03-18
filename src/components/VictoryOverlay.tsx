import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Gem, Trophy, FastForward } from 'lucide-react';
import { overlayBackdrop, overlayContent } from '@/lib/animations';

interface VictoryOverlayProps {
  show: boolean;
  coinsEarned: number;
  shardsEarned?: number;
  chestsOpened: number;
  heroesActive: number;
  onContinue: () => void;
  onViewRewards?: () => void;
  onAutoFarm?: () => void;
}

export function VictoryOverlay({
  show,
  coinsEarned,
  shardsEarned,
  chestsOpened,
  heroesActive,
  onContinue,
  onViewRewards,
  onAutoFarm,
}: VictoryOverlayProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          variants={overlayBackdrop}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <motion.div
            className="pixel-border bg-card p-8 flex flex-col items-center gap-6 min-w-[280px] max-w-sm w-full mx-4"
            variants={overlayContent}
          >
            {/* Titre */}
            <h2
              className="font-pixel text-lg text-game-gold text-center"
              style={{
                textShadow: '0 0 12px hsl(var(--game-gold)), 0 0 24px hsl(var(--game-gold) / 0.5)',
              }}
            >
              VICTOIRE !
            </h2>

            {/* Stats */}
            <div className="w-full space-y-3">
              <div className="flex items-center justify-between px-2">
                <span className="font-pixel text-[9px] text-muted-foreground flex items-center gap-2">
                  <Coins size={14} className="text-game-gold" />
                  Coins gagnés
                </span>
                <span className="font-pixel text-[9px] text-game-gold">+{coinsEarned}</span>
              </div>

              {shardsEarned !== undefined && shardsEarned > 0 && (
                <div className="flex items-center justify-between px-2">
                  <span className="font-pixel text-[9px] text-muted-foreground flex items-center gap-2">
                    <Gem size={14} className="text-game-blue" />
                    Shards gagnés
                  </span>
                  <span className="font-pixel text-[9px] text-game-blue">+{shardsEarned}</span>
                </div>
              )}

              <div className="flex items-center justify-between px-2">
                <span className="font-pixel text-[9px] text-muted-foreground flex items-center gap-2">
                  <Trophy size={14} className="text-primary" />
                  Coffres ouverts
                </span>
                <span className="font-pixel text-[9px] text-foreground">{chestsOpened}</span>
              </div>

              <div className="flex items-center justify-between px-2">
                <span className="font-pixel text-[9px] text-muted-foreground flex items-center gap-2">
                  <span className="text-[12px]">⚔️</span>
                  Héros actifs
                </span>
                <span className="font-pixel text-[9px] text-foreground">{heroesActive}</span>
              </div>
            </div>

            {/* Boutons */}
            <div className="flex flex-col gap-2 w-full">
              {onViewRewards && (
                <button
                  onClick={onViewRewards}
                  className="pixel-btn pixel-btn-secondary w-full font-pixel text-[8px]"
                >
                  Voir les récompenses
                </button>
              )}
              {onAutoFarm && (
                <button
                  onClick={onAutoFarm}
                  className="pixel-btn pixel-btn-secondary font-pixel text-[8px] flex items-center justify-center gap-2 w-full"
                >
                  <FastForward size={12} /> AUTO-FARM
                </button>
              )}
              <button
                onClick={onContinue}
                className="pixel-btn pixel-btn-gold w-full font-pixel text-[8px]"
              >
                Continuer
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default VictoryOverlay;
