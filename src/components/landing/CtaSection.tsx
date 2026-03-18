import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const CtaSection: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <section className="py-24 sm:py-32 px-4 text-center">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-2xl mx-auto"
      >
        <h2 className="font-pixel text-sm sm:text-xl text-foreground text-glow-gold mb-4">
          PRÊT À JOUER ?
        </h2>
        <p className="text-sm text-muted-foreground mb-10">
          Crée ton compte gratuit et commence à collectionner des héros dès maintenant.
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(user ? '/game' : '/auth')}
          className="pixel-btn pixel-btn-gold font-pixel text-xs px-10 py-4 inline-flex items-center gap-2"
        >
          <Zap size={18} /> {user ? 'JOUER' : 'CRÉER MON COMPTE'}
        </motion.button>
      </motion.div>
    </section>
  );
};

export default CtaSection;
