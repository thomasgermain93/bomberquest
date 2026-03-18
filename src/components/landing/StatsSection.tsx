import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Sparkles, Crown } from 'lucide-react';
import SectionLabel from './SectionLabel';
import { LandingKpis, formatKpi } from '@/hooks/useKpis';

interface StatsSectionProps {
  kpis: LandingKpis;
  kpisLoading: boolean;
}

/**
 * Hook pour animer un compteur (count-up).
 * Lance l'animation quand isActive passe à true.
 */
function useCountUp(target: number, duration = 1500, isActive = false) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isActive || target === 0 || target === null) return;

    const start = Date.now();
    let animationFrameId: number;

    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);

      // Easing: ease-out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(target * easeProgress));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(tick);
      } else {
        setCount(target);
      }
    };

    animationFrameId = requestAnimationFrame(tick);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [target, duration, isActive]);

  return count;
}

/**
 * Composant carte stat unique avec icône et animation.
 */
interface StatCardProps {
  icon: React.ReactNode;
  iconColor: string;
  title: string;
  value: string | null;
  isLoading: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  icon,
  iconColor,
  title,
  value,
  isLoading,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5 }}
    className="pixel-border bg-card p-6 sm:p-8 text-center"
  >
    <div className={`mb-4 flex justify-center ${iconColor}`}>{icon}</div>

    {isLoading ? (
      <>
        <div className="h-8 w-16 bg-muted animate-pulse mx-auto mb-2" aria-hidden="true" />
        <div className="h-4 w-20 bg-muted animate-pulse mx-auto" aria-hidden="true" />
      </>
    ) : value !== null ? (
      <>
        <p className="font-pixel text-xl sm:text-2xl text-game-gold mb-1">{value}</p>
        <p className="font-pixel text-[8px] text-muted-foreground tracking-widest">{title}</p>
      </>
    ) : (
      <>
        <p className="font-pixel text-xl sm:text-2xl text-muted mb-1">—</p>
        <p className="font-pixel text-[8px] text-muted-foreground tracking-widest">{title}</p>
      </>
    )}
  </motion.div>
);

/**
 * Composant section des stats principales du jeu.
 * Affiche 3 stats avec animation count-up au scroll.
 */
const StatsSection: React.FC<StatsSectionProps> = ({ kpis, kpisLoading }) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Count-up pour chaque stat
  const playerCount = useCountUp(kpis.players ?? 0, 1500, isInView && !kpisLoading);
  const invocationCount = useCountUp(
    kpis.totalInvocations ?? 0,
    1500,
    isInView && !kpisLoading
  );

  const stats: StatCardProps[] = [
    {
      icon: <Users size={32} />,
      iconColor: 'text-game-green',
      title: 'JOUEURS INSCRITS',
      value: kpisLoading ? null : formatKpi(playerCount),
      isLoading: kpisLoading,
    },
    {
      icon: <Sparkles size={32} />,
      iconColor: 'text-game-gold',
      title: 'HÉROS INVOQUÉS',
      value: kpisLoading ? null : formatKpi(invocationCount),
      isLoading: kpisLoading,
    },
    {
      icon: <Crown size={32} />,
      iconColor: 'text-rarity-super-legend',
      title: 'DERNIER SUPER-LÉGENDE',
      value: kpisLoading ? null : kpis.lastSuperLegend ?? 'Bientôt...',
      isLoading: kpisLoading,
    },
  ];

  return (
    <section ref={sectionRef} className="py-24 sm:py-32 px-4 bg-background">
      <div className="max-w-6xl mx-auto">
        {/* Titre de section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <SectionLabel text="Chiffres clés" />
          <h2 className="font-pixel text-sm sm:text-xl text-foreground leading-tight">
            L'IMPACT DE{' '}
            <span className="text-game-gold">BOMBERQUEST</span>
          </h2>
        </motion.div>

        {/* Grille des 3 stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {stats.map((stat, i) => (
            <StatCard key={i} {...stat} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
