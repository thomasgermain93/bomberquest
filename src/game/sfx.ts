// Chiptune SFX engine using Web Audio API
let audioCtx: AudioContext | null = null;
let _muted = localStorage.getItem('bomberquest_muted') === 'true';

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

export function isMuted(): boolean { return _muted; }
export function setMuted(v: boolean): void {
  _muted = v;
  localStorage.setItem('bomberquest_muted', String(v));
}

function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = 'square',
  volume = 0.15,
  freqEnd?: number,
  delay = 0
) {
  if (_muted) return;
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
  if (freqEnd !== undefined) {
    osc.frequency.linearRampToValueAtTime(freqEnd, ctx.currentTime + delay + duration);
  }
  gain.gain.setValueAtTime(volume, ctx.currentTime + delay);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(ctx.currentTime + delay);
  osc.stop(ctx.currentTime + delay + duration);
}

// Noise burst for explosions
function playNoise(duration: number, volume = 0.12, delay = 0) {
  if (_muted) return;
  const ctx = getCtx();
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, ctx.currentTime + delay);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
  source.connect(gain).connect(ctx.destination);
  source.start(ctx.currentTime + delay);
}

export const SFX = {
  // Bomb placed: short descending boop
  bombPlace() {
    playTone(300, 0.08, 'square', 0.1);
    playTone(200, 0.06, 'square', 0.08, undefined, 0.06);
  },

  // Explosion: noise + low rumble
  explosion() {
    playNoise(0.25, 0.15);
    playTone(80, 0.2, 'sawtooth', 0.12, 30);
    playTone(120, 0.15, 'square', 0.06, 40, 0.05);
  },

  // Enemy hit: sharp zap
  enemyHit() {
    playTone(600, 0.06, 'square', 0.1, 200);
    playNoise(0.05, 0.06, 0.03);
  },

  // Enemy killed: satisfying burst
  enemyKill() {
    playTone(400, 0.08, 'square', 0.12, 800);
    playTone(600, 0.06, 'triangle', 0.08, 1000, 0.06);
    playNoise(0.08, 0.06, 0.04);
  },

  // Boss hit: heavy impact
  bossHit() {
    playTone(150, 0.12, 'sawtooth', 0.14, 60);
    playNoise(0.1, 0.1);
    playTone(300, 0.08, 'square', 0.06, 100, 0.08);
  },

  // Victory fanfare: ascending arpeggio
  victory() {
    const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
    notes.forEach((n, i) => {
      playTone(n, 0.2, 'square', 0.12, undefined, i * 0.12);
      playTone(n, 0.25, 'triangle', 0.06, undefined, i * 0.12);
    });
    // Final chord
    playTone(1047, 0.5, 'square', 0.1, undefined, 0.5);
    playTone(784, 0.5, 'triangle', 0.08, undefined, 0.5);
    playTone(523, 0.6, 'sawtooth', 0.05, undefined, 0.5);
  },

  // Summon capsule: rising sparkle
  summon() {
    playTone(200, 0.1, 'triangle', 0.08, 600);
    playTone(400, 0.12, 'square', 0.06, 900, 0.1);
    playTone(800, 0.15, 'triangle', 0.08, 1200, 0.2);
  },

  // Coin pickup: quick high bling
  coin() {
    playTone(1200, 0.06, 'square', 0.08);
    playTone(1600, 0.08, 'square', 0.06, undefined, 0.05);
  },

  // Chest open: two-tone unlock
  chestOpen() {
    playTone(400, 0.08, 'square', 0.08);
    playTone(600, 0.1, 'triangle', 0.08, undefined, 0.08);
    playTone(800, 0.12, 'square', 0.06, undefined, 0.15);
  },

  // UI click
  click() {
    playTone(800, 0.03, 'square', 0.06);
  },
};
