import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Zap, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import TreasureHuntCanvas from './TreasureHuntCanvas';

const HeroSection: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden pt-12">
      <TreasureHuntCanvas />

      {/* Overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/55 via-background/40 to-background pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-transparent to-background/60 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center z-10 max-w-3xl mx-auto"
      >
        <h1 className="font-pixel text-3xl sm:text-5xl md:text-6xl text-foreground text-glow-red leading-tight">
          BOMBER<span className="text-primary">QUEST</span>
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-6 max-w-md mx-auto leading-relaxed">
          RPG idle pixel art — Collectionne des héros, pose des bombes, explore des donjons et vaincs des boss épiques.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-10 justify-center">
          {user ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/game')}
              className="pixel-btn pixel-btn-gold font-pixel text-xs sm:text-sm px-8 py-4 flex items-center gap-2"
            >
              <Zap size={18} /> JOUER MAINTENANT
            </motion.button>
          ) : (
            <>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/auth')}
                className="pixel-btn pixel-btn-gold font-pixel text-xs sm:text-sm px-8 py-4 flex items-center gap-2"
              >
                <Zap size={18} /> COMMENCER L'AVENTURE
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/game')}
                className="pixel-btn pixel-btn-secondary font-pixel text-[10px] sm:text-xs px-6 py-4 flex items-center gap-2 text-foreground border-border"
              >
                <Shield size={16} /> JOUER EN INVITÉ
              </motion.button>
            </>
          )}
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
