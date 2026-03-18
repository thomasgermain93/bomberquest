import React from 'react';
import { motion } from 'framer-motion';
import { Bomb, Swords, Users, Trophy } from 'lucide-react';
import SectionLabel from './SectionLabel';

import gameCombat from '@/assets/game-combat.jpg';
import gameMap from '@/assets/game-map.jpg';
import gameHeroes from '@/assets/game-heroes.jpg';
import gameBoss from '@/assets/game-boss.jpg';

const FEATURES = [
  {
    icon: <Bomb size={28} />,
    title: 'Pose des bombes',
    desc: 'Stratégie et timing pour exploser les blocs et trouver les trésors cachés dans chaque donjon.',
    img: gameCombat,
  },
  {
    icon: <Swords size={28} />,
    title: 'Mode Histoire',
    desc: '5 régions, 25 étapes et des boss épiques à vaincre. Chaque région offre ses propres mécaniques et défis.',
    img: gameMap,
  },
  {
    icon: <Users size={28} />,
    title: 'Collectionne des héros',
    desc: '6 raretés, des compétences uniques et un système de gacha. Fusionne et améliore tes héros préférés.',
    img: gameHeroes,
  },
  {
    icon: <Trophy size={28} />,
    title: 'Boss épiques',
    desc: 'Affronte des boss géants avec des patterns uniques ! Coordonne tes héros pour les éliminer.',
    img: gameBoss,
  },
];

const CoreFeatures: React.FC = () => (
  <section id="features" className="py-24 sm:py-32 px-4">
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-16 sm:mb-20"
      >
        <SectionLabel text="Découvre le jeu" />
        <h2 className="font-pixel text-sm sm:text-xl text-foreground leading-tight">
          EXPLORE, COMBAT,{' '}
          <span className="text-primary">COLLECTIONNE</span>
        </h2>
      </motion.div>

      <div className="space-y-24 sm:space-y-32">
        {FEATURES.map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
            className={`flex flex-col ${i % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'} gap-10 items-center`}
          >
            <div className="flex-1 w-full">
              <div className="pixel-border overflow-hidden glow-blue">
                <img
                  src={f.img}
                  alt={f.title}
                  className="w-full h-auto object-cover"
                  loading="lazy"
                />
              </div>
            </div>
            <div className="flex-1">
              <div className="text-primary mb-4">{f.icon}</div>
              <h3 className="font-pixel text-xs sm:text-sm text-foreground mb-4">{f.title}</h3>
              <p className="text-base text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default CoreFeatures;
