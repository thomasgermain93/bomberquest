import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sword, DoorOpen } from 'lucide-react';
import { Hero } from '@/game/types';

interface DefeatOverlayProps {
  show: boolean;
  heroesKO: Hero[];
  onRetry: () => void;
  onQuit: () => void;
}

export function DefeatOverlay({
  show,
  heroesKO,
  onRetry,
  onQuit,
}: DefeatOverlayProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-destructive/20 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="pixel-border bg-card p-6 flex flex-col items-center gap-4 max-w-sm w-full mx-4 space-y-4"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
          >
            {/* Titre */}
            <h2 className="font-pixel text-lg text-destructive">
              💀 DÉFAITE
            </h2>

            {/* Sous-titre */}
            <p className="font-pixel text-[9px] text-muted-foreground text-center">
              Tes héros sont tombés au combat...
            </p>

            {/* Liste des héros KO */}
            {heroesKO.length > 0 && (
              <div className="w-full space-y-1 px-2">
                {heroesKO.map((hero) => (
                  <p
                    key={hero.id}
                    className="font-pixel text-[8px] opacity-60 text-foreground text-center"
                  >
                    {hero.name}
                  </p>
                ))}
              </div>
            )}

            {/* Boutons */}
            <div className="flex flex-col gap-2 w-full">
              <button
                onClick={onRetry}
                className="pixel-btn w-full font-pixel text-[8px] flex items-center justify-center gap-2"
              >
                <Sword size={14} /> Réessayer
              </button>
              <button
                onClick={onQuit}
                className="pixel-btn pixel-btn-secondary w-full font-pixel text-[8px] flex items-center justify-center gap-2"
              >
                <DoorOpen size={14} /> Quitter
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default DefeatOverlay;
