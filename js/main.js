import { LEVELS } from './levels.js';
import { World, VW, VH } from './world.js';
import { drawWorld, drawHero } from './render.js';
import { input, hooks, bindTouch, releaseAll } from './input.js';
import * as A from './audio.js';

const $ = id => document.getElementById(id);
const STEP = 1 / 60;

// ───────────── save ─────────────
const SAVE_KEY = 'fd.save.v1';
let save = { done: LEVELS.map(() => false), best: LEVELS.map(() => 0) };
try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s && Array.isArray(s.done)) save = { ...save, ...s }; } catch (e) {}
save.done = LEVELS.map((_, i) => !!save.done[i]); save.best = LEVELS.map((_, i) => +(save.best && save.best[i]) || 0);
const persist = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) {} };
const unlocked = i => i === 0 || save.done[i - 1];

// ───────────── canvas fit ─────────────
const app = $('app'), stage = $('stage'), cv = $('cv'), ctx = cv.getContext('2d');
let scale = 1;
function fit() {
  const aw = app.clientWidth, ah = app.clientHeight;
  const w = Math.floor(Math.min(aw, ah * 16 / 9)), h = Math.floor(w * 9 / 16);
  stage.style.width = w + 'px'; stage.style.height = h + 'px';
  stage.style.setProperty('--u', (w / 100) + 'px');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  scale = cv.width / VW;
}
new ResizeObserver(fit).observe(app); addEventListener('resize', fit); fit();

const isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
if (isTouch) document.body.classList.add('touch');
bindTouch($('touch'));

// ───────────── state ─────────────
let mode = 'menu';           // menu | ready | play | pause | done | over
let world = null, bgWorld = null, run = null;
let clock = 0, acc = 0, readyUntil = 0, menuIdx = 0;
const hudCache = {};
let bossHp = 3;
function setBossPips(hp) {
  [...$('bossBar').querySelectorAll('i')].forEach((el, i) => el.classList.toggle('off', i >= hp));
}
let wasHurt = 0;

const show = id => { for (const s of document.querySelectorAll('.screen')) s.classList.toggle('show', s.id === id); };
const hideScreens = () => show('');
const setText = (id, v) => { if (hudCache[id] !== v) { hudCache[id] = v; $(id).textContent = v; } };
const pad = (n, l) => String(Math.max(0, n)).padStart(l, '0');
const fmt = n => n.toLocaleString('en-US');

// ───────────── title ─────────────
const THUMB = [['#7fd16a', '#5fba7d'], ['#a5d05a', '#d29a6c'], ['#58b894', '#2c6b7a'], ['#55c29a', '#3f9a8a']];
const THUMB_SKY = ['linear-gradient(#79cbfb,#eaf8ff)', 'linear-gradient(#ffae82,#fff0d3)', 'linear-gradient(#161a44,#6a5aa8)', 'linear-gradient(#0b2236,#2f8f94)'];

function buildLevels() {
  const list = $('levelList');
  list.innerHTML = '';
  LEVELS.forEach((L, i) => {
    const ok = unlocked(i);
    const b = document.createElement('button');
    b.className = 'lvl'; b.type = 'button'; b.disabled = !ok; b.setAttribute('role', 'listitem');
    const chip = !ok ? '<span class="chip lock">Locked</span>' : save.done[i] ? `<span class="chip">★ ${fmt(save.best[i])}</span>` : '<span class="chip lock" style="background:rgba(242,121,43,.14);color:#c25a12">New</span>';
    b.innerHTML = `<div class="th" style="background:${THUMB_SKY[i]};--g:${THUMB[i][0]};--g2:${THUMB[i][1]}"></div><div class="meta"><span>World ${L.world}</span><b>${L.name}</b></div>${chip}`;
    b.onclick = () => { A.unlock(); A.sfx('click'); startRun(i); };
    list.appendChild(b);
  });
}

function showTitle() {
  mode = 'menu'; input.active = false; releaseAll(); A.stopMusic();
  menuIdx = (menuIdx + 1) % LEVELS.length;
  bgWorld = new World(LEVELS[menuIdx]);
  buildLevels();
  $('hud').hidden = true; $('touch').hidden = true;
  show('scTitle');
  const first = LEVELS.findIndex((_, i) => unlocked(i) && !save.done[i]);
  $('playBtn').textContent = save.done.some(Boolean) ? 'Continue' : 'Play';
  $('playBtn').dataset.idx = first < 0 ? 0 : first;
  setTimeout(() => $('playBtn').focus({ preventScroll: true }), 50);
}

// ───────────── run / level flow ─────────────
function startRun(idx) {
  run = { idx, lives: 3, coins: 0, score: 0, checkpointC: null, startCoins: 0, startScore: 0 };
  loadLevel();
}

function loadLevel() {
  const L = LEVELS[run.idx];
  world = new World(L, { coins: run.coins, score: run.score, checkpointC: run.checkpointC });
  mode = 'ready'; input.active = false; releaseAll(); acc = 0;
  $('rWorld').textContent = 'World ' + L.world; $('rName').textContent = L.name; $('rLives').textContent = '× ' + run.lives;
  $('rSub').textContent = L.sub; $('rSub').hidden = !L.sub;
  $('hWorld').textContent = L.world; $('hName').textContent = L.name;
  $('bossBar').hidden = !L.arena; bossHp = 3; setBossPips(3);
  $('hud').hidden = false; $('touch').hidden = !isTouch;
  show('scReady'); readyUntil = clock + 1.5;
  A.stopMusic();
}

function beginPlay() {
  mode = 'play'; hideScreens(); input.active = true; acc = 0;
  A.unlock(); A.playMusic(LEVELS[run.idx].theme);
}

function loseLife() {
  run.lives--; run.coins = world.coins; run.score = world.score; run.checkpointC = world.checkpointC;
  if (run.lives <= 0) {
    mode = 'over'; input.active = false; releaseAll();
    $('oText').textContent = `You scored ${fmt(world.score - run.startScore)} points in ${LEVELS[run.idx].name}. Pip needs a nap — try again?`;
    A.sfx('over'); show('scOver'); setTimeout(() => $('retryBtn').focus(), 350);
  } else loadLevel();
}

function finishLevel(ev) {
  mode = 'done'; input.active = false; releaseAll(); A.stopMusic();
  world.score += ev.bonus;
  const levelScore = world.score - run.startScore, i = run.idx;
  save.done[i] = true; save.best[i] = Math.max(save.best[i] || 0, levelScore); persist();
  run.coins = world.coins; run.score = world.score; run.checkpointC = null;
  const L = LEVELS[i], last = i === LEVELS.length - 1;
  $('dKick').textContent = `World ${L.world} · ${L.name}`;
  $('dTitle').textContent = L.arena ? 'Big Frog defeated!' : last ? 'You found every burrow!' : 'Level complete!';
  $('dCoins').textContent = fmt(world.coins);
  $('dTime').textContent = `${ev.timeLeft} × 10 = ${fmt(ev.bonus)}`;
  $('dScore').textContent = fmt(levelScore);
  $('dBest').textContent = fmt(save.best[i]);
  $('nextBtn').textContent = last ? 'Back to menu' : 'Next level';
  A.sfx('complete'); show('scDone'); setTimeout(() => $('nextBtn').focus(), 350);
}

function nextLevel() {
  if (run.idx >= LEVELS.length - 1) { showTitle(); return; }
  run.idx++; run.startCoins = run.coins; run.startScore = run.score; run.checkpointC = null; loadLevel();
}

function restartLevel() {
  run.coins = run.startCoins; run.score = run.startScore; run.checkpointC = null; loadLevel();
}

function pause() {
  if (mode !== 'play') return;
  mode = 'pause'; input.active = false; releaseAll(); A.suspend();
  $('soundBtn2').textContent = 'Sound: ' + (A.isMuted() ? 'off' : 'on');
  show('scPause'); setTimeout(() => $('resumeBtn').focus(), 50);
}
function resume() {
  if (mode !== 'pause') return;
  hideScreens(); mode = 'play'; input.active = true; acc = 0; A.unlock();
}
hooks.pause = () => { if (mode === 'play') pause(); else if (mode === 'pause') resume(); };
hooks.mute = () => toggleMute();

function toggleMute() {
  A.setMuted(!A.isMuted()); drawMute(); $('soundBtn2').textContent = 'Sound: ' + (A.isMuted() ? 'off' : 'on');
}
function drawMute() {
  const m = A.isMuted();
  $('muteBtn').innerHTML = m
    ? '<svg viewBox="0 0 20 20"><path d="M3 8v4h3l4 3.500v-11L6 8H3z" fill="currentColor"/><path d="M13.500 7.500l4 5M17.500 7.500l-4 5" stroke="currentColor" stroke-width="1.800" stroke-linecap="round"/></svg>'
    : '<svg viewBox="0 0 20 20"><path d="M3 8v4h3l4 3.500v-11L6 8H3z" fill="currentColor"/><path d="M13 7.200a4 4 0 010 5.600M15.300 5a7 7 0 010 10" fill="none" stroke="currentColor" stroke-width="1.800" stroke-linecap="round"/></svg>';
  $('muteBtn').setAttribute('aria-label', m ? 'Sound off' : 'Sound on');
}

// ───────────── buttons ─────────────
const click = (id, fn) => $(id).addEventListener('click', () => { A.unlock(); A.sfx('click'); fn(); });
click('playBtn', () => startRun(+$('playBtn').dataset.idx || 0));
click('muteBtn', toggleMute);
click('fsBtn', () => { try { const r = document.fullscreenElement ? document.exitFullscreen() : app.requestFullscreen(); r && r.catch && r.catch(() => {}); } catch (e) {} });
click('pauseBtn', pause);
click('resumeBtn', resume);
click('restartBtn', restartLevel);
click('soundBtn2', toggleMute);
click('quitBtn', () => { A.unlock(); showTitle(); });
click('nextBtn', nextLevel);
click('replayBtn', () => { run.coins = run.startCoins; run.score = run.startScore; run.checkpointC = null; loadLevel(); });
click('menuBtn1', showTitle);
click('menuBtn2', showTitle);
click('retryBtn', () => { startRun(run.idx); });
drawMute();

document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
matchMedia('(orientation: portrait)').addEventListener?.('change', e => { if (e.matches && isTouch) pause(); });

// ───────────── events from the simulation ─────────────
function handleEvents() {
  for (const ev of world.events.splice(0)) {
    switch (ev.type) {
      case 'stomp': A.sfx('stomp', ev.combo); break;
      case 'die': A.stopMusic(); A.sfx('die'); break;
      case 'flag': A.stopMusic(); A.sfx('flag'); break;
      case 'oneup': run.lives++; A.sfx('oneup'); break;
      case 'complete': finishLevel(ev); break;
      case 'dead': loseLife(); return;
      default: A.sfx(ev.type);
    }
  }
}

function updateHud() {
  setText('hCoins', pad(world.coins, 2)); setText('hScore', pad(world.score, 6));
  const t = Math.ceil(world.time); setText('hTime', pad(t, 3)); $('hTimeP').classList.toggle('warn', t <= 30 && world.p.state === 'play');
  setText('hLives', String(run.lives));
  if (world.boss && world.boss.hp !== bossHp) {
    bossHp = world.boss.hp; setBossPips(bossHp);
    const bb = $('bossBar'); bb.classList.remove('hit'); void bb.offsetWidth; bb.classList.add('hit');
  }
}

// ───────────── main loop ─────────────
const heroCv = $('heroCv'), hctx = heroCv.getContext('2d');
const menuPip = { x: -17, y: -44, w: 34, h: 44, vx: 0, vy: 0, onGround: true, face: 1, anim: 0, squash: 0, invuln: 0, big: false, growT: 0, state: 'play', skid: false };

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000); last = now; clock += dt;

  if (mode === 'ready' && clock >= readyUntil) beginPlay();

  if (mode === 'play') {
    acc += dt; let n = 0;
    while (acc >= STEP && n < 6 && mode === 'play') { world.update(STEP, input); acc -= STEP; n++; handleEvents(); }
    if (n >= 6) acc = 0;
    if (mode === 'play') updateHud();
  } else if (mode === 'done') {
    world.updateMisc(dt);
  }

  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  if (mode === 'menu') {
    const span = Math.max(1, bgWorld.cols * 45 - VW - 400);
    const ph = (clock * 46) % (span * 2);
    bgWorld.cam = ph < span ? ph : span * 2 - ph;
    drawWorld(ctx, bgWorld, clock, { hideHero: true });
    hctx.setTransform(1, 0, 0, 1, 0, 0); hctx.clearRect(0, 0, heroCv.width, heroCv.height);
    hctx.save(); hctx.translate(130, 205); hctx.scale(4.2, 4.2); drawHero(hctx, menuPip, clock); hctx.restore();
  } else if (world) {
    drawWorld(ctx, world, clock);
  }
  requestAnimationFrame(frame);
}

showTitle();
requestAnimationFrame(frame);
window.__fd = { get world() { return world; }, get mode() { return mode; }, get run() { return run; }, input, startRun, LEVELS, save, pause, resume };
