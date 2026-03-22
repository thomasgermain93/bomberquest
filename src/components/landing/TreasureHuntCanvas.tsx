import React, { useEffect, useRef } from 'react';

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
    const canvasMaybeNull = canvasRef.current;
    if (!canvasMaybeNull) return;
    const ctxMaybeNull = canvasMaybeNull.getContext('2d');
    if (!ctxMaybeNull) return;
    // Non-null after guards above; rename so inner closures retain narrowed type
    const canvas: HTMLCanvasElement = canvasMaybeNull;
    const ctx: CanvasRenderingContext2D = ctxMaybeNull;

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

export default TreasureHuntCanvas;
