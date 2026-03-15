import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Bomb, Swords, Trophy, Users, Sparkles, Shield, ChevronDown, Zap, Crown, Star, BookOpen, Clock, ChevronRight, History, Bug, Plus, Menu, X } from 'lucide-react';
import PixelIcon from '@/components/PixelIcon';
import { GUIDE_ARTICLES } from '@/data/guides';
import { CHANGELOG as APP_CHANGELOG } from '@/data/changelog';
import { supabase } from '@/integrations/supabase/client';

import gameCombat from '@/assets/game-combat.jpg';
import gameHeroes from '@/assets/game-heroes.jpg';
import gameBoss from '@/assets/game-boss.jpg';
import gameMap from '@/assets/game-map.jpg';

const BG_TILE = 48;
const BG_HERO_COLORS = [
  { body: '#3a8ee8', hi: '#6aaeff' },
  { body: '#e84a3a', hi: '#ff7a6a' },
  { body: '#3ac860', hi: '#6affa0' },
  { body: '#c8b830', hi: '#ffe07a' },
];

interface BgBomb { col: number; row: number; timer: number; }
interface BgExplosion { tiles: [number, number][]; timer: number; }
interface BgHero {
  px: number; py: number;
  col: number; row: number;
  targetCol: number; targetRow: number;
  speed: number;
  moving: boolean;
  colorIdx: number;
  cooldown: number;
}

function buildBgMap(cols: number, rows: number): number[][] {
  // 0=floor, 1=wall, 2=crate, 3=chest
  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => {
      const border = r === 0 || r === rows - 1 || c === 0 || c === cols - 1;
      const pillar = r % 2 === 0 && c % 2 === 0;
      const safe = (r <= 2 && c <= 2) || (r <= 2 && c >= cols - 3) ||
                   (r >= rows - 3 && c <= 2) || (r >= rows - 3 && c >= cols - 3);
      if (border || pillar) return 1;
      if (safe) return 0;
      const rnd = Math.random();
      if (rnd < 0.08) return 3;
      if (rnd < 0.42) return 2;
      return 0;
    })
  );
}

const TreasureHuntCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const T = BG_TILE;
    let map: number[][];
    let heroes: BgHero[] = [];
    let bombs: BgBomb[] = [];
    let explosions: BgExplosion[] = [];
    let frame = 0;
    let lastTime = 0;
    let rafId = 0;

    function canWalk(c: number, r: number) {
      if (r < 0 || r >= map.length || c < 0 || c >= map[0].length) return false;
      const t = map[r][c];
      return t === 0 || t === 3;
    }

    function init() {
      const cols = Math.ceil(canvas.width / T) + 2;
      const rows = Math.ceil(canvas.height / T) + 2;
      map = buildBgMap(cols, rows);
      bombs = [];
      explosions = [];
      const corners: [number, number][] = [[1,1],[cols-2,1],[1,rows-2],[cols-2,rows-2]];
      heroes = BG_HERO_COLORS.map((_, i) => {
        const [c, r] = corners[i % 4];
        return { px: c*T, py: r*T, col: c, row: r, targetCol: c, targetRow: r, speed: 2+Math.random()*0.8, moving: false, colorIdx: i, cooldown: 40+i*30 };
      });
    }

    function pickTarget(h: BgHero): [number, number] {
      const dirs: [number,number][] = [[0,-1],[0,1],[-1,0],[1,0]];
      const shuffled = dirs.sort(() => Math.random()-0.5);
      for (const [dc, dr] of shuffled) {
        const nc = h.col+dc, nr = h.row+dr;
        if (canWalk(nc, nr)) return [nc, nr];
      }
      return [h.col, h.row];
    }

    function explode(col: number, row: number) {
      const range = 2;
      const tiles: [number,number][] = [[col, row]];
      [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dc, dr]) => {
        for (let d = 1; d <= range; d++) {
          const nc = col+dc*d, nr = row+dr*d;
          if (nr < 0 || nr >= map.length || nc < 0 || nc >= map[0].length) break;
          if (map[nr][nc] === 1) break;
          tiles.push([nc, nr]);
          if (map[nr][nc] === 2 || map[nr][nc] === 3) { map[nr][nc] = 0; break; }
        }
      });
      explosions.push({ tiles, timer: 18 });
    }

    function update() {
      heroes.forEach(h => {
        h.cooldown--;
        if (!h.moving) {
          if (map[h.row]?.[h.col] === 3) map[h.row][h.col] = 0;
          if (h.cooldown <= 0 && bombs.length < 4) {
            bombs.push({ col: h.col, row: h.row, timer: 55 });
            h.cooldown = 100 + Math.random()*80;
          }
          const [tc, tr] = pickTarget(h);
          h.targetCol = tc; h.targetRow = tr;
          if (tc !== h.col || tr !== h.row) h.moving = true;
        } else {
          const tx = h.targetCol*T, ty = h.targetRow*T;
          const dx = tx-h.px, dy = ty-h.py;
          const dist = Math.sqrt(dx*dx+dy*dy);
          if (dist <= h.speed) { h.px=tx; h.py=ty; h.col=h.targetCol; h.row=h.targetRow; h.moving=false; }
          else { h.px+=dx/dist*h.speed; h.py+=dy/dist*h.speed; }
        }
      });
      bombs = bombs.filter(b => { b.timer--; if (b.timer<=0) { explode(b.col,b.row); return false; } return true; });
      explosions = explosions.filter(e => { e.timer--; return e.timer>0; });
      frame++;
    }

    function drawTile(c: number, r: number) {
      const type = map[r]?.[c] ?? 0;
      const px = c*T, py = r*T;
      if (type === 1) {
        ctx.fillStyle = '#12121f'; ctx.fillRect(px,py,T,T);
        ctx.fillStyle = '#0c0c18'; ctx.fillRect(px+2,py+2,T-4,T-4);
        ctx.fillStyle = '#1e1e32'; ctx.fillRect(px+2,py+2,T-4,2); ctx.fillRect(px+2,py+2,2,T-4);
      } else if (type === 2) {
        ctx.fillStyle = '#1a0e06'; ctx.fillRect(px,py,T,T);
        ctx.strokeStyle = '#4a2e10'; ctx.lineWidth = 2;
        ctx.strokeRect(px+2,py+2,T-4,T-4);
        ctx.beginPath();
        ctx.moveTo(px+T/2,py+3); ctx.lineTo(px+T/2,py+T-3);
        ctx.moveTo(px+3,py+T/2); ctx.lineTo(px+T-3,py+T/2);
        ctx.stroke();
      } else if (type === 3) {
        ctx.fillStyle = '#0f0c00'; ctx.fillRect(px,py,T,T);
        ctx.fillStyle = '#1a1400'; ctx.fillRect(px+3,py+3,T-6,T-6);
        ctx.fillStyle = '#c8960a'; ctx.fillRect(px+6,py+8,T-12,T-16);
        ctx.fillStyle = '#ffd700'; ctx.fillRect(px+6,py+6,T-12,6);
        ctx.fillStyle = '#ffe94d'; ctx.fillRect(px+6,py+6,T-12,2);
      } else {
        ctx.fillStyle = (c+r)%2===0 ? '#0c0f14' : '#0a0d11';
        ctx.fillRect(px,py,T,T);
      }
    }

    function drawBomb(b: BgBomb) {
      const progress = b.timer / 55;
      const px = b.col*T+T/2, py = b.row*T+T/2;
      ctx.fillStyle = '#0a0a0a';
      ctx.beginPath(); ctx.arc(px,py+3,T/3,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#222';
      ctx.beginPath(); ctx.arc(px-5,py-4,5,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle = frame%6<3 ? '#ff8800' : '#ffcc00'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(px-2,py-T/3+3); ctx.quadraticCurveTo(px+10,py-T/2+2,px+5,py-T/2-6); ctx.stroke();
      ctx.strokeStyle = `hsl(${Math.round(120-120*(1-progress))},100%,55%)`; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(px,py+3,T/3+3,-Math.PI/2,-Math.PI/2+progress*Math.PI*2); ctx.stroke();
    }

    function drawExplosion(e: BgExplosion) {
      const a = e.timer/18;
      e.tiles.forEach(([tc,tr],i) => {
        ctx.globalAlpha = a*0.85;
        ctx.fillStyle = ['#ff4400','#ff8800','#ffcc00'][(frame+i)%3];
        ctx.fillRect(tc*T+3,tr*T+3,T-6,T-6);
        if (i===0) { ctx.fillStyle='#fff'; ctx.fillRect(tc*T+T/2-5,tr*T+T/2-5,10,10); }
      });
      ctx.globalAlpha = 1;
    }

    function drawHero(h: BgHero) {
      const { body, hi } = BG_HERO_COLORS[h.colorIdx];
      const px = h.px+5, py = h.py+5, s = T-10;
      ctx.fillStyle = body; ctx.fillRect(px,py,s,s);
      ctx.fillStyle = hi; ctx.fillRect(px,py,s,4); ctx.fillRect(px,py,4,s);
      ctx.fillStyle = '#fff'; ctx.fillRect(px+5,py+6,6,7); ctx.fillRect(px+s-11,py+6,6,7);
      ctx.fillStyle = '#000'; ctx.fillRect(px+7,py+8,3,4); ctx.fillRect(px+s-9,py+8,3,4);
      ctx.fillRect(px+5,py+s-10,4,2); ctx.fillRect(px+s-9,py+s-10,4,2);
    }

    function render() {
      ctx.fillStyle = '#080c10';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const cols = Math.ceil(canvas.width/T)+2, rows = Math.ceil(canvas.height/T)+2;
      for (let r=0; r<rows; r++) for (let c=0; c<cols; c++) drawTile(c,r);
      explosions.forEach(e => drawExplosion(e));
      bombs.forEach(b => drawBomb(b));
      heroes.forEach(h => drawHero(h));
    }

    function animate(time: number) {
      if (time - lastTime >= 50) { update(); render(); lastTime = time; }
      rafId = requestAnimationFrame(animate);
    }

    function resize() {
      const p = canvas.parentElement;
      if (p) { canvas.width = p.offsetWidth; canvas.height = p.offsetHeight; }
      init();
    }

    resize();
    window.addEventListener('resize', resize);
    rafId = requestAnimationFrame(animate);
    return () => { cancelAnimationFrame(rafId); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ imageRendering: 'pixelated' }} />;
};

const CHANGELOG = APP_CHANGELOG.slice(0, 3).map((entry) => ({
  version: entry.version,
  date: entry.date,
  entries: entry.changes.slice(0, 3).map((change) => ({
    type: change.type === 'fix' ? 'fix' : change.type === 'feature' ? 'new' : 'improve',
    text: change.description,
  })),
}));

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

interface LandingKpis {
  players: number | null;
  totalInvocations: number | null;
  lastSuperLegend: string | null;
}

const KPI_TIMEOUT_MS = 8000;
const KPI_RETRY_DELAY_MS = 1000;
const KPI_MAX_RETRIES = 1;

const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('KPI timeout')), ms)
    ),
  ]);
};

const withRetry = async <T,>(
  fn: () => Promise<T>,
  maxRetries: number,
  delayMs: number
): Promise<T> => {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  throw lastError;
};

const KPI_FALLBACK: LandingKpis = {
  players: null,
  totalInvocations: null,
  lastSuperLegend: null,
};

const formatKpi = (value: number | null) => {
  if (value === null) return '—';
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  return new Intl.NumberFormat('fr-FR').format(value);
};

const Landing: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [kpis, setKpis] = useState<LandingKpis>(KPI_FALLBACK);
  const [kpisLoading, setKpisLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: ReturnType<typeof setTimeout>;

    const loadKpis = async () => {
      setKpisLoading(true);
      try {
        const kpiRequest = async () => {
          const { data, error } = await supabase.rpc('get_landing_stats');
          
          if (error) {
            console.error('[KPI] RPC error:', {
              code: error.code,
              message: error.message,
              details: error.details,
              hint: error.hint
            });
            throw new Error(`KPI RPC failed: ${error.message}`);
          }

          if (!isMounted) return null;

          return {
            players: data?.players ?? null,
            totalInvocations: data?.totalInvocations ?? null,
            lastSuperLegend: data?.lastSuperLegend ?? null,
          };
        };

        timeoutId = setTimeout(() => {
          if (isMounted) {
            setKpis(KPI_FALLBACK);
            setKpisLoading(false);
          }
        }, KPI_TIMEOUT_MS);

        const result = await withRetry(
          () => withTimeout(kpiRequest(), KPI_TIMEOUT_MS),
          KPI_MAX_RETRIES,
          KPI_RETRY_DELAY_MS
        );
        clearTimeout(timeoutId);

        if (!isMounted) return;

        if (result) {
          setKpis(result);
        } else {
          setKpis(KPI_FALLBACK);
        }
      } catch (err) {
        if (!isMounted) return;
        const error = err instanceof Error ? err : new Error(String(err));
        console.error('[KPI] Load failed:', {
          message: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString()
        });
        setKpis(KPI_FALLBACK);
      } finally {
        clearTimeout(timeoutId);
        if (isMounted) setKpisLoading(false);
      }
    };

    loadKpis();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  const closeMenuAndNavigate = (path: string) => {
    setMobileMenuOpen(false);
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Top nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur border-b border-border px-4 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PixelIcon icon="bomb" size={18} color="hsl(var(--primary))" />
            <span className="font-pixel text-[9px] text-foreground">BOMBERQUEST</span>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/wiki" className="font-pixel text-[7px] text-muted-foreground hover:text-foreground transition-colors">WIKI</Link>
            <Link to="/guides" className="font-pixel text-[7px] text-muted-foreground hover:text-foreground transition-colors">GUIDES</Link>
            <Link to="/changelog" className="font-pixel text-[7px] text-muted-foreground hover:text-foreground transition-colors">CHANGELOG</Link>
            {user ? (
              <button onClick={() => navigate('/game')} className="pixel-btn pixel-btn-gold font-pixel text-[7px] px-3 py-1.5 min-h-[44px]">
                JOUER
              </button>
            ) : (
              <button onClick={() => navigate('/auth')} className="pixel-btn font-pixel text-[7px] px-3 py-1.5 min-h-[44px]">
                CONNEXION
              </button>
            )}
          </div>

          <button
            onClick={() => setMobileMenuOpen(prev => !prev)}
            className="md:hidden pixel-btn pixel-btn-secondary p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Ouvrir le menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden mt-2 pt-2 border-t border-border flex flex-col gap-1.5">
            <Link onClick={() => setMobileMenuOpen(false)} to="/wiki" className="font-pixel text-[8px] text-muted-foreground hover:text-foreground transition-colors px-2 py-2.5 min-h-[44px] flex items-center">WIKI</Link>
            <Link onClick={() => setMobileMenuOpen(false)} to="/guides" className="font-pixel text-[8px] text-muted-foreground hover:text-foreground transition-colors px-2 py-2.5 min-h-[44px] flex items-center">GUIDES</Link>
            <Link onClick={() => setMobileMenuOpen(false)} to="/changelog" className="font-pixel text-[8px] text-muted-foreground hover:text-foreground transition-colors px-2 py-2.5 min-h-[44px] flex items-center">CHANGELOG</Link>
            {user ? (
              <button onClick={() => closeMenuAndNavigate('/game')} className="pixel-btn pixel-btn-gold font-pixel text-[8px] px-3 py-2.5 min-h-[44px] mt-1">
                JOUER
              </button>
            ) : (
              <button onClick={() => closeMenuAndNavigate('/auth')} className="pixel-btn font-pixel text-[8px] px-3 py-2.5 min-h-[44px] mt-1">
                CONNEXION
              </button>
            )}
          </div>
        )}
      </nav>

      {/* Hero Section — canvas gameplay as full background */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden pt-12">
        {/* Live treasure-hunt gameplay canvas — fills the entire hero section */}
        <TreasureHuntCanvas />

        {/* Dark gradient overlay so text stays legible */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/55 via-background/40 to-background pointer-events-none" />
        {/* Vignette sides */}
        <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-transparent to-background/60 pointer-events-none" />

        {/* Badge "CHASSE AU TRÉSOR EN DIRECT" */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="absolute top-20 right-6 z-10"
        >
          <span className="font-pixel text-[6px] bg-primary/20 border border-primary/40 text-primary px-2 py-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            CHASSE AU TRÉSOR EN DIRECT
          </span>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center z-10">
          <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }} className="flex items-center justify-center mb-6">
            <PixelIcon icon="bomb" size={48} color="hsl(var(--primary))" />
          </motion.div>
          <h1 className="font-pixel text-2xl sm:text-4xl md:text-5xl text-foreground text-glow-red leading-tight">
            BOMBER<span className="text-primary">QUEST</span>
          </h1>
          <p className="font-pixel text-[10px] sm:text-xs text-game-gold mt-4 text-glow-gold">
            IDLE BOMBER • COLLECTER & AMÉLIORER
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
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/game')}
                  className="pixel-btn pixel-btn-secondary font-pixel text-[10px] sm:text-xs px-6 py-4 flex items-center gap-2 text-foreground border-border">
                  JOUER EN INVITÉ
                </motion.button>
              </>
            )}
          </div>
        </motion.div>

        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }} className="absolute bottom-8 z-10">
          <ChevronDown size={28} className="text-muted-foreground" />
        </motion.div>
      </section>

      {/* Chiffres clés */}
      <section className="py-14 sm:py-16 px-4 bg-card/40 border-y border-border/40">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-8 sm:mb-10">
            <h2 className="font-pixel text-sm sm:text-lg text-foreground text-glow-gold mb-3">CHIFFRES CLÉS</h2>
            <p className="text-sm text-muted-foreground">Un aperçu en temps réel de l'activité sur BomberQuest.</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                label: 'Joueurs inscrits',
                value: formatKpi(kpis.players),
                loading: kpisLoading,
                hint: 'Comptes créés',
              },
              {
                label: 'Invocations totales',
                value: formatKpi(kpis.totalInvocations),
                loading: kpisLoading,
                hint: 'Toutes raretés confondues',
              },
              {
                label: 'Dernière Super-Légende',
                value: kpis.lastSuperLegend ?? 'Aucune pour le moment',
                loading: kpisLoading,
                hint: 'Dernier héros super-légende obtenu',
              },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="pixel-border bg-card p-5 min-h-[140px] flex flex-col justify-between"
              >
                <p className="font-pixel text-[8px] text-muted-foreground">{item.label}</p>
                <div className="min-h-[44px] mt-3 flex items-center">
                  {item.loading ? (
                    <div className="h-6 w-3/4 rounded bg-muted animate-pulse" aria-hidden="true" />
                  ) : (
                    <p className="font-pixel text-sm sm:text-base text-foreground break-words">{item.value}</p>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">{item.hint}</p>
              </motion.div>
            ))}
          </div>
        </div>
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
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate(user ? '/game' : '/auth')}
              className="pixel-btn pixel-btn-gold font-pixel text-xs px-10 py-4 flex items-center gap-2 mx-auto">
              <Zap size={18} /> {user ? 'JOUER' : 'CRÉER MON COMPTE'}
            </motion.button>
            {!user && (
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/game')}
                className="pixel-btn pixel-btn-secondary font-pixel text-[10px] px-8 py-4 flex items-center gap-2 mx-auto text-foreground border-border">
                JOUER EN INVITÉ
              </motion.button>
            )}
          </div>
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
          <p className="text-[10px] text-muted-foreground">© 2026 BomberQuest — RPG Idle Bomber</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
