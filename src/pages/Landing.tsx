import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Bomb, Swords, Trophy, Users, Sparkles, Shield, ChevronDown, Zap, Crown, Star, BookOpen, Clock, ChevronRight, History, Bug, Plus } from 'lucide-react';
import PixelIcon from '@/components/PixelIcon';
import { GUIDE_ARTICLES } from '@/data/guides';

import gameCombat from '@/assets/game-combat.jpg';
import gameHeroes from '@/assets/game-heroes.jpg';
import gameBoss from '@/assets/game-boss.jpg';
import gameMap from '@/assets/game-map.jpg';

const DEMO_TILE = 32;
const DEMO_MAP = [
  [1,1,1,1,1,1,1,1,1],
  [1,0,0,2,0,2,0,0,1],
  [1,0,1,0,1,0,1,0,1],
  [1,2,0,0,0,0,0,2,1],
  [1,0,1,0,1,0,1,0,1],
  [1,0,0,2,0,2,0,0,1],
  [1,1,1,1,1,1,1,1,1],
];
// Hero path keyframes: [frameInLoop, col, row]
const HERO_PATH = [[0,1,1],[25,3,1],[45,3,3],[58,2,3],[80,1,3],[120,1,1],[200,1,1]];
const LOOP_FRAMES = 200;

const GameDemoCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const T = DEMO_TILE;
    let frame = 0;
    let lastTime = 0;
    let rafId = 0;

    function getHeroPos(f: number) {
      const t = f % LOOP_FRAMES;
      for (let i = 0; i < HERO_PATH.length - 1; i++) {
        const [fa, xa, ya] = HERO_PATH[i];
        const [fb, xb, yb] = HERO_PATH[i + 1];
        if (t >= fa && t <= fb) {
          const pct = (t - fa) / (fb - fa);
          return { x: xa + (xb - xa) * pct, y: ya + (yb - ya) * pct };
        }
      }
      return { x: 1, y: 1 };
    }

    function render(f: number) {
      const frameInLoop = f % LOOP_FRAMES;
      const showBomb = frameInLoop >= 45 && frameInLoop < 110;
      const showExplosion = frameInLoop >= 110 && frameInLoop < 140;
      const bombTimer = showBomb ? (frameInLoop - 45) / 65 : 0;
      const explodeProgress = showExplosion ? (frameInLoop - 110) / 30 : 0;

      ctx.fillStyle = '#080c12';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let row = 0; row < DEMO_MAP.length; row++) {
        for (let col = 0; col < DEMO_MAP[row].length; col++) {
          const px = col * T, py = row * T;
          const type = DEMO_MAP[row][col];
          if (type === 1) {
            ctx.fillStyle = '#181828';
            ctx.fillRect(px, py, T, T);
            ctx.fillStyle = '#121222';
            ctx.fillRect(px + 2, py + 2, T - 4, T - 4);
            ctx.fillStyle = '#22223a';
            ctx.fillRect(px + 2, py + 2, T - 4, 2);
            ctx.fillRect(px + 2, py + 2, 2, T - 4);
          } else if (type === 2) {
            ctx.fillStyle = '#1e1208';
            ctx.fillRect(px, py, T, T);
            ctx.strokeStyle = '#503820';
            ctx.lineWidth = 2;
            ctx.strokeRect(px + 2, py + 2, T - 4, T - 4);
            ctx.beginPath();
            ctx.moveTo(px + T / 2, py + 3); ctx.lineTo(px + T / 2, py + T - 3);
            ctx.moveTo(px + 3, py + T / 2); ctx.lineTo(px + T - 3, py + T / 2);
            ctx.stroke();
          } else {
            ctx.fillStyle = (row + col) % 2 === 0 ? '#0c1018' : '#0a0e14';
            ctx.fillRect(px, py, T, T);
          }
        }
      }

      if (showBomb) {
        const bx = 3 * T + T / 2, by = 3 * T + T / 2;
        ctx.fillStyle = '#0a0a0a';
        ctx.beginPath();
        ctx.arc(bx, by + 3, T / 3 - 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(bx - 4, by - 2, 4, 0, Math.PI * 2);
        ctx.fill();
        const fuseOn = Math.floor(f / 3) % 2 === 0;
        ctx.strokeStyle = fuseOn ? '#ff8800' : '#ffcc00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bx - 1, by - T / 3 + 3);
        ctx.quadraticCurveTo(bx + 8, by - T / 2, bx + 4, by - T / 2 - 6);
        ctx.stroke();
        const hue = Math.round(120 - bombTimer * 120);
        ctx.strokeStyle = `hsl(${hue},100%,55%)`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(bx, by + 3, T / 3 + 2, -Math.PI / 2, -Math.PI / 2 + (1 - bombTimer) * Math.PI * 2);
        ctx.stroke();
      }

      if (showExplosion) {
        const alpha = explodeProgress < 0.5 ? explodeProgress * 2 : 2 - explodeProgress * 2;
        const dirs = [[0,0],[1,0],[2,0],[-1,0],[-2,0],[0,1],[0,2],[0,-1],[0,-2]];
        dirs.forEach(([dx, dy]) => {
          const mx = 3 + dx, my = 3 + dy;
          if (my < 0 || my >= DEMO_MAP.length || mx < 0 || mx >= DEMO_MAP[0].length) return;
          if (DEMO_MAP[my][mx] === 1) return;
          const dist = Math.abs(dx) + Math.abs(dy);
          ctx.globalAlpha = Math.max(0, Math.min(1, alpha * (1 - dist * 0.15)));
          const phase = Math.floor(explodeProgress * 6) % 3;
          ctx.fillStyle = ['#ff4400','#ff8800','#ffcc00'][phase];
          const m = 2 + dist;
          ctx.fillRect(mx * T + m, my * T + m, T - m * 2, T - m * 2);
          if (dist === 0) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(mx * T + T / 2 - 4, my * T + T / 2 - 4, 8, 8);
          }
        });
        ctx.globalAlpha = 1;
      }

      const { x: hx, y: hy } = getHeroPos(f);
      const hpx = hx * T + 4, hpy = hy * T + 4;
      const s = T - 8;
      ctx.fillStyle = '#4a9eff';
      ctx.fillRect(hpx, hpy, s, s);
      ctx.fillStyle = '#7ab8ff';
      ctx.fillRect(hpx, hpy, s, 3);
      ctx.fillRect(hpx, hpy, 3, s);
      ctx.fillStyle = '#fff';
      ctx.fillRect(hpx + 4, hpy + 5, 5, 5);
      ctx.fillRect(hpx + s - 9, hpy + 5, 5, 5);
      ctx.fillStyle = '#000';
      ctx.fillRect(hpx + 6, hpy + 7, 2, 2);
      ctx.fillRect(hpx + s - 7, hpy + 7, 2, 2);
      ctx.fillStyle = '#000';
      ctx.fillRect(hpx + 5, hpy + s - 8, 3, 2);
      ctx.fillRect(hpx + s - 8, hpy + s - 8, 3, 2);
    }

    function animate(time: number) {
      if (time - lastTime >= 50) {
        render(frame);
        frame++;
        lastTime = time;
      }
      rafId = requestAnimationFrame(animate);
    }

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={9 * DEMO_TILE}
      height={7 * DEMO_TILE}
      className="pixel-border"
      style={{ imageRendering: 'pixelated', display: 'block' }}
    />
  );
};

const CHANGELOG = [
  {
    version: '0.9.3',
    date: '08 Mar 2026',
    entries: [
      { type: 'fix', text: 'Correction du bug de pity counter Legend au-delà de 200 invocations' },
      { type: 'fix', text: 'Stabilisation de la sauvegarde cloud lors des déconnexions fréquentes' },
      { type: 'improve', text: 'Fluidité du rendu améliorée sur les grandes cartes (17×13)' },
    ],
  },
  {
    version: '0.9.2',
    date: '01 Mar 2026',
    entries: [
      { type: 'new', text: 'Quêtes quotidiennes : 3 missions générées chaque jour' },
      { type: 'new', text: 'Boss Citadelle : pattern "Pluie de bombes" ajouté' },
      { type: 'improve', text: 'IA ennemie plus réactive en difficulté avancée' },
    ],
  },
  {
    version: '0.9.1',
    date: '18 Fév 2026',
    entries: [
      { type: 'new', text: 'Ascension des héros jusqu\'au rang S (niveau 100)' },
      { type: 'new', text: 'Région Volcan : 5 étapes avec le Dragon de Lave' },
      { type: 'fix', text: 'Fix de la génération de carte bloquée en mode Chasse au Trésor' },
    ],
  },
];

const CHANGELOG_ICON = {
  new: <Plus size={10} className="text-green-400" />,
  fix: <Bug size={10} className="text-red-400" />,
  improve: <Zap size={10} className="text-blue-400" />,
};

const CHANGELOG_LABEL = {
  new: { text: 'NOUVEAU', color: 'bg-green-500/15 text-green-400' },
  fix: { text: 'FIX', color: 'bg-red-500/15 text-red-400' },
  improve: { text: 'AMÉLIORÉ', color: 'bg-blue-500/15 text-blue-400' },
};

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

        {/* Animated game preview */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-10 z-10 flex flex-col items-center gap-2"
        >
          <p className="font-pixel text-[7px] text-muted-foreground tracking-widest">APERÇU DU JEU</p>
          <div className="relative" style={{ filter: 'drop-shadow(0 0 16px hsl(var(--primary) / 0.4))' }}>
            <GameDemoCanvas />
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

      {/* Changelog Section */}
      <section className="py-20 px-4 bg-card/50">
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-10">
            <h2 className="font-pixel text-sm sm:text-lg text-foreground text-glow-gold mb-4">
              <History size={20} className="inline mr-2" /> DERNIÈRES MISES À JOUR
            </h2>
            <p className="text-sm text-muted-foreground">Le jeu évolue régulièrement — corrections, nouvelles fonctionnalités et améliorations.</p>
          </motion.div>

          <div className="space-y-4">
            {CHANGELOG.map((release, i) => (
              <motion.div
                key={release.version}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="pixel-border bg-card p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="font-pixel text-[9px] text-primary">v{release.version}</span>
                  <span className="font-pixel text-[7px] text-muted-foreground flex items-center gap-1">
                    <Clock size={10} /> {release.date}
                  </span>
                </div>
                <ul className="space-y-2">
                  {release.entries.map((entry, j) => (
                    <li key={j} className="flex items-start gap-3">
                      <span className={`font-pixel text-[6px] px-1.5 py-0.5 rounded flex items-center gap-1 mt-0.5 shrink-0 ${CHANGELOG_LABEL[entry.type].color}`}>
                        {CHANGELOG_ICON[entry.type]} {CHANGELOG_LABEL[entry.type].text}
                      </span>
                      <span className="text-xs text-muted-foreground leading-relaxed">{entry.text}</span>
                    </li>
                  ))}
                </ul>
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
            <Link to="/auth" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Connexion</Link>
          </div>
          <p className="text-[10px] text-muted-foreground">© 2026 BomberQuest — Idle Bomber RPG</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
