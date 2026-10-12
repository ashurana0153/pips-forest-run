// Tiny WebAudio synth: sound effects + a gentle looping tune per world. No audio files.
let ctx = null, sfxGain = null, musicGain = null, timer = null;
let muted = false;
try { muted = localStorage.getItem('fd.mute') === '1'; } catch (e) {}

const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

function init() {
  if (ctx) return;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    sfxGain = ctx.createGain(); musicGain = ctx.createGain();
    sfxGain.gain.value = muted ? 0 : 0.9; musicGain.gain.value = muted ? 0 : 0.5;
    sfxGain.connect(ctx.destination); musicGain.connect(ctx.destination);
  } catch (e) { ctx = null; }
}
export function unlock() { init(); if (ctx && ctx.state === 'suspended') ctx.resume(); }
export function suspend() { if (ctx && ctx.state === 'running') ctx.suspend(); }
export function isMuted() { return muted; }
export function setMuted(m) {
  muted = m;
  try { localStorage.setItem('fd.mute', m ? '1' : '0'); } catch (e) {}
  if (sfxGain) { sfxGain.gain.value = m ? 0 : 0.9; musicGain.gain.value = m ? 0 : 0.5; }
}

function tone(freq, t0, dur, type = 'sine', vol = 0.14, to = null, dest = null) {
  if (!ctx) return;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t0);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(dest || sfxGain);
  o.start(t0); o.stop(t0 + dur + 0.03);
}
function noise(t0, dur, vol = 0.18, freq = 1800) {
  if (!ctx) return;
  const n = Math.floor(ctx.sampleRate * dur), buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = ctx.createBufferSource(); s.buffer = buf;
  const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq;
  const g = ctx.createGain(); g.gain.value = vol;
  s.connect(f); f.connect(g); g.connect(sfxGain); s.start(t0);
}
const arp = (notes, step, type = 'triangle', vol = 0.13) => { const t = ctx.currentTime; notes.forEach((m, i) => tone(mtof(m), t + i * step, step * 2.2, type, vol)); };

const SFX = {
  jump: () => { const t = ctx.currentTime; tone(330, t, 0.16, 'triangle', 0.13, 760); },
  coin: () => { const t = ctx.currentTime; tone(988, t, 0.07, 'square', 0.07); tone(1319, t + 0.07, 0.2, 'square', 0.07); },
  stomp: (combo = 1) => { const t = ctx.currentTime; tone(240 + combo * 40, t, 0.14, 'triangle', 0.18, 90); noise(t, 0.08, 0.1, 900); },
  bump: () => { const t = ctx.currentTime; tone(150, t, 0.1, 'sine', 0.2, 80); },
  break: () => { const t = ctx.currentTime; noise(t, 0.28, 0.22, 1400); tone(200, t, 0.12, 'square', 0.05, 70); },
  sprout: () => { const t = ctx.currentTime; tone(300, t, 0.5, 'sine', 0.1, 600); },
  powerup: () => arp([67, 71, 74, 79, 83, 86], 0.06),
  hurt: () => { const t = ctx.currentTime; tone(520, t, 0.35, 'sawtooth', 0.09, 140); },
  die: () => { const t = ctx.currentTime; [72, 67, 64, 60].forEach((m, i) => tone(mtof(m), t + 0.5 + i * 0.16, 0.3, 'triangle', 0.14)); },
  oneup: () => arp([72, 76, 79, 84, 88], 0.07, 'square', 0.07),
  checkpoint: () => arp([69, 76], 0.1),
  flag: () => arp([60, 64, 67, 72, 76, 79, 84], 0.09),
  complete: () => { const t = ctx.currentTime; [[72, 0], [72, 0.14], [72, 0.28], [76, 0.5], [79, 0.7], [84, 0.9]].forEach(([m, d]) => tone(mtof(m), t + d, 0.4, 'triangle', 0.15)); },
  over: () => { const t = ctx.currentTime; [67, 64, 60, 55].forEach((m, i) => tone(mtof(m), t + i * 0.28, 0.5, 'triangle', 0.14)); },
  croak: () => { const t = ctx.currentTime; tone(110, t, 0.12, 'sawtooth', 0.1, 70); tone(150, t + 0.14, 0.14, 'sawtooth', 0.1, 90); },
  bossjump: () => { const t = ctx.currentTime; tone(180, t, 0.3, 'triangle', 0.16, 520); noise(t, 0.12, 0.07, 700); },
  boom: () => { const t = ctx.currentTime; tone(110, t, 0.35, 'sine', 0.3, 38); noise(t, 0.3, 0.2, 400); },
  bosshit: () => { const t = ctx.currentTime; tone(420, t, 0.28, 'square', 0.08, 120); tone(260, t + 0.05, 0.3, 'triangle', 0.14, 80); noise(t, 0.12, 0.12, 1100); },
  bossdown: () => { const t = ctx.currentTime; tone(300, t, 0.9, 'sawtooth', 0.1, 50); noise(t, 0.6, 0.18, 600); [72, 76, 79, 84].forEach((m, i) => tone(mtof(m), t + 0.9 + i * 0.12, 0.4, 'triangle', 0.14)); },
  click: () => { const t = ctx.currentTime; tone(660, t, 0.06, 'sine', 0.09); },
};
export function sfx(name, arg) { if (!ctx || muted) return; try { SFX[name] && SFX[name](arg); } catch (e) {} }

// ── music ──
const SONGS = {
  meadow: {
    bpm: 116,
    mel: [72, 0, 76, 0, 79, 0, 76, 0, 74, 0, 72, 0, 69, 0, 67, 0, 69, 0, 72, 0, 76, 0, 74, 0, 72, 0, 67, 0, 69, 0, 0, 0],
    bass: [48, 0, 0, 0, 55, 0, 0, 0, 53, 0, 0, 0, 55, 0, 0, 0, 45, 0, 0, 0, 52, 0, 0, 0, 53, 0, 0, 0, 55, 0, 0, 0],
  },
  canopy: {
    bpm: 98,
    mel: [69, 0, 72, 0, 76, 0, 72, 0, 74, 0, 76, 0, 72, 0, 69, 0, 67, 0, 69, 0, 72, 0, 69, 0, 64, 0, 67, 0, 69, 0, 0, 0],
    bass: [45, 0, 0, 0, 52, 0, 0, 0, 43, 0, 0, 0, 50, 0, 0, 0, 41, 0, 0, 0, 48, 0, 0, 0, 40, 0, 0, 0, 52, 0, 0, 0],
  },
  grove: {
    bpm: 84,
    mel: [76, 0, 0, 72, 0, 0, 69, 0, 71, 0, 0, 67, 0, 0, 64, 0, 69, 0, 0, 72, 0, 0, 76, 0, 74, 0, 0, 71, 0, 0, 0, 0],
    bass: [45, 0, 0, 0, 0, 0, 0, 0, 43, 0, 0, 0, 0, 0, 0, 0, 41, 0, 0, 0, 0, 0, 0, 0, 40, 0, 0, 0, 0, 0, 0, 0],
  },
  pond: {
    bpm: 132,
    mel: [69, 0, 69, 72, 0, 69, 0, 67, 65, 0, 65, 69, 0, 65, 0, 64, 62, 0, 62, 65, 0, 62, 0, 64, 67, 0, 69, 0, 71, 0, 72, 0],
    bass: [45, 0, 45, 0, 45, 0, 45, 0, 41, 0, 41, 0, 41, 0, 41, 0, 38, 0, 38, 0, 38, 0, 38, 0, 40, 0, 40, 0, 43, 0, 43, 0],
  },
};
let song = null, step = 0, nextT = 0;
function schedule() {
  if (!ctx || !song) return;
  const s = SONGS[song], dur = 60 / s.bpm / 2;
  while (nextT < ctx.currentTime + 0.3) {
    const i = step % 32;
    if (s.mel[i]) tone(mtof(s.mel[i]), nextT, dur * 2.2, 'triangle', 0.05, null, musicGain);
    if (s.bass[i]) tone(mtof(s.bass[i]), nextT, dur * 3.6, 'sine', 0.075, null, musicGain);
    step++; nextT += dur;
  }
}
export function playMusic(name) {
  init(); if (!ctx) return;
  stopMusic(); song = name; step = 0; nextT = ctx.currentTime + 0.15;
  timer = setInterval(schedule, 90);
}
export function stopMusic() { if (timer) clearInterval(timer); timer = null; song = null; }
