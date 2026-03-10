import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Bomb, Swords, Trophy, Users, Sparkles, Shield, ChevronDown, Zap, Crown, Star, BookOpen, Clock, ChevronRight } from 'lucide-react';
import PixelIcon from '@/components/PixelIcon';
import { GUIDE_ARTICLES } from '@/data/guides';

import gameCombat from '@/assets/game-combat.jpg';
import gameHeroes from '@/assets/game-heroes.jpg';
import gameBoss from '@/assets/game-boss.jpg';
import gameMap from '@/assets/game-map.jpg';

const FEATURES = [
  { icon: <Bomb size={28} />, title: 'Pose des bombes', desc: 'Stratégie et timing pour exploser les blocs et trouver les trésors.', img: gameCombat },
  { icon: <Swords size={28} />, title: 'Mode Histoire', desc: '5 régions, 25 étapes et des boss épiques à vaincre.', img: gameMap },
  { icon: <Users size={28} />, title: 'Collectionne des héros', desc: '6 raretés, des compétences uniques et un système de gacha.', img: gameHeroes },
  { icon: <Trophy size={28} />, title: 'Boss épiques', desc: 'Affronte des boss géants avec des patterns uniques !', img: gameBoss },
];

const RARITIES = [
  { label: 'Common', color: 'hsl(0,0%,60%)', glow: false },
  { label: 'Rare', color: 'hsl(210,80%,55%)', glow: false },
  { label: 'Super Rare', color: 'hsl(280,70%,55%)', glow: true },
  { label: 'Epic', color: 'hsl(30,90%,55%)', glow: true },
  { label: 'Legend', color: 'hsl(15,90%,55%)', glow: true },
  { label: 'Super Legend', color: 'hsl(300,100%,70%)', glow: true },
];

const Landing: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handle = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handle);
    return () => window.removeEventListener('scroll', handle);
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Top nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur border-b border-border px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PixelIcon icon="bomb" size={18} color="hsl(var(--primary))" />
          <span className="font-pixel text-[9px] text-foreground">BOMBERQUEST</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/wiki" className="font-pixel text-[7px] text-muted-foreground hover:text-foreground transition-colors">WIKI</Link>
          <Link to="/guides" className="font-pixel text-[7px] text-muted-foreground hover:text-foreground transition-colors">GUIDES</Link>
          <Link to="/changelog" className="font-pixel text-[7px] text-muted-foreground hover:text-foreground transition-colors">CHANGELOG</Link>
          {user ? (
            <button onClick={() => navigate('/game')} className="pixel-btn pixel-btn-gold font-pixel text-[7px] px-3 py-1.5">
              JOUER
            </button>
          ) : (
            <button onClick={() => navigate('/auth')} className="pixel-btn font-pixel text-[7px] px-3 py-1.5">
              CONNEXION
            </button>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden pt-12">
        {/* Animated background grid */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(hsl(var(--border)) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
            transform: `translateY(${scrollY * 0.1}px)`,
          }} />
        </div>

        {/* Floating pixel decorations */}
        <motion.div animate={{ y: [0, -20, 0], rotate: [0, 5, -5, 0] }} transition={{ duration: 4, repeat: Infinity }} className="absolute top-24 left-[10%] opacity-20">
          <PixelIcon icon="bomb" size={48} color="hsl(var(--game-neon-red))" />
        </motion.div>
        <motion.div animate={{ y: [0, 15, 0], rotate: [0, -5, 5, 0] }} transition={{ duration: 5, repeat: Infinity, delay: 1 }} className="absolute top-36 right-[15%] opacity-20">
          <PixelIcon icon="crown" size={40} color="hsl(var(--game-gold))" />
        </motion.div>
        <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity, delay: 0.5 }} className="absolute bottom-40 left-[20%] opacity-15">
          <PixelIcon icon="gem" size={36} color="hsl(var(--game-rarity-super-rare))" />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center z-10">
          <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }} className="flex items-center justify-center mb-6">
            <PixelIcon icon="bomb" size={48} color="hsl(var(--primary))" />
          </motion.div>
          <h1 className="font-pixel text-2xl sm:text-4xl md:text-5xl text-foreground text-glow-red leading-tight">
            BOMBER<span className="text-primary">QUEST</span>
          </h1>
          <p className="font-pixel text-[10px] sm:text-xs text-game-gold mt-4 text-glow-gold">
            IDLE BOMBER • COLLECT & UPGRADE
          </p>
          <p className="text-sm sm:text-base text-muted-foreground mt-6 max-w-md mx-auto leading-relaxed">
            Collectionne des héros, pose des bombes, explore des donjons et vaincs des boss épiques dans ce RPG idle pixel art !
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-10 justify-center">
            {user ? (
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/game')}
                className="pixel-btn pixel-btn-gold font-pixel text-xs sm:text-sm px-8 py-4 flex items-center gap-2">
                <Zap size={18} /> JOUER MAINTENANT
              </motion.button>
            ) : (
              <>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/auth')}
                  className="pixel-btn pixel-btn-gold font-pixel text-xs sm:text-sm px-8 py-4 flex items-center gap-2">
                  <Zap size={18} /> COMMENCER L'AVENTURE
                </motion.button>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/auth?mode=login')}
                  className="pixel-btn pixel-btn-secondary font-pixel text-[10px] sm:text-xs px-6 py-4 flex items-center gap-2">
                  <Shield size={16} /> SE CONNECTER
                </motion.button>
              </>
            )}
          </div>
        </motion.div>

        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }} className="absolute bottom-8">
          <ChevronDown size={28} className="text-muted-foreground" />
        </motion.div>
      </section>

      {/* Game Screenshots Showcase */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.h2 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="font-pixel text-sm sm:text-lg text-center text-foreground text-glow-red mb-4">
            <Sparkles size={20} className="inline mr-2" />
            DÉCOUVRE LE JEU
          </motion.h2>
          <p className="text-sm text-muted-foreground text-center mb-12">Explore les donjons, collectionne les héros et vaincs les boss !</p>

          <div className="space-y-16">
            {FEATURES.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className={`flex flex-col ${i % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'} gap-8 items-center`}
              >
                {/* Image */}
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
                {/* Text */}
                <div className="flex-1">
                  <div className="text-primary mb-3">{f.icon}</div>
                  <h3 className="font-pixel text-xs sm:text-sm text-foreground mb-3">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Rarity showcase */}
      <section className="py-20 px-4 bg-card/50">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="font-pixel text-sm sm:text-lg text-foreground text-glow-gold mb-4">
            <Crown size={20} className="inline mr-2" /> SYSTÈME DE RARETÉS
          </motion.h2>
          <p className="text-sm text-muted-foreground mb-10">Invoque des héros de différentes raretés et fais-les monter en puissance !</p>
          <div className="flex flex-wrap justify-center gap-4">
            {RARITIES.map((r, i) => (
              <motion.div key={r.label} initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="pixel-border p-4 w-28 text-center"
                style={{ borderColor: r.color, boxShadow: r.glow ? `0 0 15px ${r.color}40, 0 0 30px ${r.color}20` : undefined }}>
                <Star size={24} className="mx-auto mb-2" style={{ color: r.color }} />
                <p className="font-pixel text-[7px] text-foreground">{r.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Story Regions */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="font-pixel text-sm sm:text-lg text-foreground text-glow-red mb-4">
            <Swords size={20} className="inline mr-2" /> 5 RÉGIONS À EXPLORER
          </motion.h2>
          <p className="text-sm text-muted-foreground mb-10">De la Forêt Enchantée à l'Enfer Ardent, 25 étapes t'attendent !</p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { name: 'Forêt Enchantée', color: 'hsl(120,30%,15%)', icon: 'forest' },
              { name: 'Cavernes Maudites', color: 'hsl(30,20%,12%)', icon: 'caves' },
              { name: 'Ruines Anciennes', color: 'hsl(270,20%,12%)', icon: 'ruins' },
              { name: 'Forteresse Orc', color: 'hsl(15,25%,12%)', icon: 'fortress' },
              { name: 'Enfer Ardent', color: 'hsl(0,30%,12%)', icon: 'inferno' },
            ].map((r, i) => (
              <motion.div key={r.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="pixel-border p-4" style={{ background: r.color }}>
                <div className="flex justify-center mb-2">
                  <PixelIcon icon={r.icon} size={32} color="hsl(var(--foreground))" />
                </div>
                <p className="font-pixel text-[6px] sm:text-[7px] text-foreground">{r.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Guides / Blog Section */}
      <section className="py-20 px-4 bg-card/50">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-10">
            <h2 className="font-pixel text-sm sm:text-lg text-foreground text-glow-gold mb-4">
              <BookOpen size={20} className="inline mr-2" /> GUIDES & ASTUCES
            </h2>
            <p className="text-sm text-muted-foreground">Apprends les meilleures stratégies pour progresser rapidement !</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {GUIDE_ARTICLES.slice(0, 3).map((article, i) => (
              <motion.div key={article.slug} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <Link to={`/guides/${article.slug}`}
                  className="pixel-border bg-card p-5 block hover:bg-muted hover:glow-blue transition-all group h-full">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-pixel text-[6px] px-2 py-0.5 rounded bg-primary/15 text-primary">{article.category}</span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock size={10} /> {article.readTime}
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded bg-muted flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                    <PixelIcon icon={article.icon} size={20} color="hsl(var(--primary))" />
                  </div>
                  <h3 className="font-pixel text-[8px] text-foreground group-hover:text-primary transition-colors mb-2">{article.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">{article.subtitle}</p>
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link to="/guides"
              className="pixel-btn pixel-btn-secondary font-pixel text-[8px] inline-flex items-center gap-2">
              VOIR TOUS LES GUIDES <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-lg mx-auto">
          <h2 className="font-pixel text-sm sm:text-lg text-foreground text-glow-gold mb-4">PRÊT À JOUER ?</h2>
          <p className="text-sm text-muted-foreground mb-8">
            Crée ton compte gratuitement et commence à collectionner des héros dès maintenant !
          </p>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate(user ? '/game' : '/auth')}
            className="pixel-btn pixel-btn-gold font-pixel text-xs px-10 py-4 flex items-center gap-2 mx-auto">
            <Zap size={18} /> {user ? 'JOUER' : 'CRÉER MON COMPTE'}
          </motion.button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <PixelIcon icon="bomb" size={16} color="hsl(var(--primary))" />
            <span className="font-pixel text-[8px] text-foreground">BOMBERQUEST</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/wiki" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Wiki</Link>
            <Link to="/wiki/glossaire" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Glossaire</Link>
            <Link to="/guides" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Guides</Link>
            <Link to="/changelog" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Changelog</Link>
            <Link to="/auth" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Connexion</Link>
          </div>
          <p className="text-[10px] text-muted-foreground">© 2026 BomberQuest — Idle Bomber RPG</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
