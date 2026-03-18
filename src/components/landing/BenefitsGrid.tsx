import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Star, Swords, Users, Layers, Skull } from 'lucide-react';
import SectionLabel from './SectionLabel';
import { LandingKpis, formatKpi } from '@/hooks/useKpis';

interface BenefitsGridProps {
  kpis: LandingKpis;
  kpisLoading: boolean;
}

interface BenefitCard {
  icon: React.ReactNode;
  iconColor: string;
  title: string;
  description: string;
  kpiValue?: string | null;
  kpiLoading?: boolean;
}

const BenefitsGrid: React.FC<BenefitsGridProps> = ({ kpis, kpisLoading }) => {
  const cards: BenefitCard[] = [
    {
      icon: <Clock size={24} />,
      iconColor: 'text-game-blue',
      title: 'Mode Idle',
      description: 'Tes héros progressent même quand tu n\'es pas connecté. Reviens récolter tes récompenses.',
    },
    {
      icon: <Star size={24} />,
      iconColor: 'text-game-gold',
      title: 'Système de Raretés',
      description: '6 niveaux de rareté — de Common à Super Legend. Chaque rareté apporte des compétences uniques.',
    },
    {
      icon: <Swords size={24} />,
      iconColor: 'text-primary',
      title: '5 Régions',
      description: 'Forêt, Cavernes, Ruines, Forteresse, Enfer — 25 étapes avec des boss à chaque fin de région.',
    },
    {
      icon: <Users size={24} />,
      iconColor: 'text-game-green',
      title: 'Joueurs actifs',
      description: 'Une communauté grandissante de joueurs.',
      kpiValue: kpis.players !== null ? formatKpi(kpis.players) : null,
      kpiLoading: kpisLoading,
    },
    {
      icon: <Layers size={24} />,
      iconColor: 'text-rarity-super-rare',
      title: 'Collection',
      description: 'Invoque, améliore et fusionne des dizaines de héros aux capacités variées.',
      kpiValue: kpis.totalInvocations !== null ? formatKpi(kpis.totalInvocations) + ' invocations' : null,
      kpiLoading: kpisLoading,
    },
    {
      icon: <Skull size={24} />,
      iconColor: 'text-rarity-epic',
      title: 'Boss Épiques',
      description: 'Des boss géants avec des patterns tactiques uniques — chaque victoire débloque de nouvelles récompenses.',
    },
  ];

  return (
    <section className="py-24 sm:py-32 px-4 bg-card/30">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <SectionLabel text="Le jeu en bref" />
          <h2 className="font-pixel text-sm sm:text-xl text-foreground leading-tight">
            TOUT CE QUI FAIT{' '}
            <span className="text-game-gold">BOMBERQUEST</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="pixel-border bg-card p-6"
            >
              <div className={`mb-4 ${card.iconColor}`}>{card.icon}</div>
              <h3 className="font-pixel text-[9px] text-foreground mb-2">{card.title}</h3>
              {card.kpiLoading ? (
                <div className="h-5 w-1/2 bg-muted animate-pulse mb-2" aria-hidden="true" />
              ) : card.kpiValue ? (
                <p className="font-pixel text-sm text-game-gold mb-2">{card.kpiValue}</p>
              ) : null}
              <p className="text-base text-muted-foreground leading-relaxed">{card.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsGrid;
