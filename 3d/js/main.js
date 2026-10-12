import { LEVEL } from './level.js';
import { Sim } from './sim.js';
import { View } from './view.js';
import * as A from './audio.js';
import { inp, hooks, bindInput, releaseAll, captureMouse } from './input.js';

const $ = id => document.getElementById(id);
const STEP = 1 / 60;
const fmt = n => n.toLocaleString('en-US');
const app = $('app'), cvs = $('gl');
const isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
if (isTouch) document.body.classList.add('touch');

let view;
try { view = new View(cvs); } catch (e) { document.body.classList.add('nogl'); throw e; }
view.loadLevel(LEVEL);
bindInput(app, $('touch'));

function fit() { const w = app.clientWidth, h = app.clientHeight; view.resize(w, h); app.style.setProperty('--u', (Math.min(w, h * 16 / 9) / 100) + 'px'); }
new ResizeObserver(fit).observe(app); addEventListener('resize', fit); fit();

// ───────────── state ─────────────
let mode = 'menu', sim = new Sim(LEVEL), clock = 0, acc = 0;
const cam = { yaw: 0, pitch: 0.5, dist: 6.6 };
let best = 0; try { best = +localStorage.getItem('f3.best') || 0; } catch (e) {}
const show = id => { for (const s of document.querySelectorAll('.screen')) s.classList.toggle('show', s.id === id); };
const cache = {}; const setText = (id, v) => { if (cache[id] !== v) { cache[id] = v; $(id).textContent = v; } };

function startGame(opts) {
  sim = new Sim(LEVEL, opts); view.enemyViews.forEach(v => view.levelGroup.remove(v.root)); view.enemyViews.clear();
  mode = 'play'; releaseAll(); acc = 0; show(''); $('hud').hidden = false; $('touch').hidden = false;
  const y = sim.p.yaw; cam.yaw = y + Math.PI; cam.pitch = 0.5; snapCam = true; if (!isTouch) captureMouse();
  A.unlock(); A.playMusic('meadow'); updateHud(true);
}
let snapCam = true;

function toMenu() {
  mode = 'menu'; releaseAll(); freeMouse(); A.stopMusic(); sim = new Sim(LEVEL); show('scTitle'); $('hud').hidden = true; $('touch').hidden = true;
  $('bestLine').textContent = best ? `Best score ${fmt(best)}` : ''; setTimeout(() => $('playBtn').focus({ preventScroll: true }), 50);
}
function freeMouse() { try { if (document.pointerLockElement) document.exitPointerLock(); } catch (e) {} }
function pause() { if (mode !== 'play') return; mode = 'pause'; releaseAll(); freeMouse(); A.suspend(); show('scPause'); $('soundBtn').textContent = 'Sound: ' + (A.isMuted() ? 'off' : 'on'); }
function resume() { if (mode !== 'pause') return; mode = 'play'; acc = 0; show(''); A.unlock(); if (!isTouch) captureMouse(); }
hooks.pause = () => { if (mode === 'play') pause(); else if (mode === 'pause') resume(); };
hooks.mute = () => toggleMute();
function toggleMute() { A.setMuted(!A.isMuted()); drawMute(); $('soundBtn').textContent = 'Sound: ' + (A.isMuted() ? 'off' : 'on'); }
function drawMute() {
  const m = A.isMuted();
  $('muteBtn').innerHTML = m
    ? '<svg viewBox="0 0 20 20"><path d="M3 8v4h3l4 3.5v-11L6 8H3z" fill="currentColor"/><path d="M13.5 7.5l4 5M17.5 7.5l-4 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>'
    : '<svg viewBox="0 0 20 20"><path d="M3 8v4h3l4 3.5v-11L6 8H3z" fill="currentColor"/><path d="M13 7.2a4 4 0 010 5.6M15.3 5a7 7 0 010 10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
}
const click = (id, fn) => $(id).addEventListener('click', () => { A.unlock(); A.sfx('click'); fn(); });
click('playBtn', () => startGame());
click('muteBtn', toggleMute); click('soundBtn', toggleMute);
click('pauseBtn', pause); click('resumeBtn', resume);
click('restartBtn', () => startGame());
click('quitBtn', toMenu); click('menuBtn', toMenu); click('menuBtn2', toMenu);
click('againBtn', () => startGame());
click('retryBtn', () => startGame({ checkpoint: sim.checkpoint, coins: sim.coinCount, score: sim.score, got: new Set(sim.coins.map((c, i) => c.got ? i : -1).filter(i => i >= 0)) }));
drawMute();
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });

// ───────────── events ─────────────
function handleEvents() {
  for (const ev of sim.events.splice(0)) {
    view.handle(ev);
    switch (ev.type) {
      case 'stomp': A.sfx('stomp', 1); break;
      case 'fall': A.sfx('hurt'); break;
      case 'die': A.stopMusic(); A.sfx('die'); break;
      case 'complete': finish(ev); break;
      case 'over': mode = 'over'; releaseAll(); freeMouse(); $('oText').textContent = sim.checkpoint ? 'Pip needs a short nap. You will restart from the lantern.' : 'Pip needs a short nap. Try again from the start?'; A.sfx('over'); show('scOver'); setTimeout(() => $('retryBtn').focus(), 300); break;
      case 'land': break;
      default: A.sfx(ev.type);
    }
  }
}

function finish(ev) {
  mode = 'done'; releaseAll(); freeMouse(); A.stopMusic(); A.sfx('complete');
  const secs = Math.floor(ev.time), tm = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
  best = Math.max(best, sim.score); try { localStorage.setItem('f3.best', String(best)); } catch (e) {}
  $('dCoins').textContent = `${sim.coinCount} / ${sim.coins.length}`; $('dTime').textContent = tm; $('dBonus').textContent = fmt(ev.bonus); $('dScore').textContent = fmt(sim.score); $('dBest').textContent = fmt(best);
  show('scDone'); setTimeout(() => $('againBtn').focus(), 350);
}

function updateHud(force) {
  setText('hCoins', String(sim.coinCount).padStart(2, '0')); setText('hScore', String(sim.score).padStart(6, '0'));
  const s = Math.floor(sim.t); setText('hTime', `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`);
  const hs = document.querySelectorAll('#hearts i'); hs.forEach((h, i) => h.classList.toggle('off', i >= sim.p.hearts));
}

// ───────────── camera ─────────────
const shortest = a => Math.atan2(Math.sin(a), Math.cos(a));
function updateCamera(dt) {
  const p = sim.p;
  cam.yaw -= inp.camDX * 0.0058; cam.pitch = Math.max(0.1, Math.min(1.2, cam.pitch + inp.camDY * 0.0042));
  if (inp.camDX || inp.camDY) inp.camIdle = 0; else inp.camIdle += dt;
  inp.camDX = inp.camDY = 0;
  if (inp.camKey) { cam.yaw += inp.camKey * 1.9 * dt; inp.camIdle = 0; }
  const sp = Math.hypot(p.vx, p.vz);
  if (mode === 'play' && p.state === 'play' && inp.camIdle > 0.9 && sp > 2.5 && inp.my > 0.55 && Math.abs(inp.mx) < 0.45) {
    const target = Math.atan2(-p.vx, -p.vz); cam.yaw += shortest(target - cam.yaw) * Math.min(1, dt * 1.3);
  }
}

// ───────────── loop ─────────────
const T = { maxDt: 0.1, maxSteps: 6, manual: false };
let last = performance.now();
function update(dt) {
  clock += dt;
  if (mode === 'play') {
    updateCamera(dt);
    acc += dt; let n = 0;
    const f = { x: -Math.sin(cam.yaw), z: -Math.cos(cam.yaw) }, r = { x: Math.cos(cam.yaw), z: -Math.sin(cam.yaw) };
    while (acc >= STEP && n < T.maxSteps && mode === 'play') {
      sim.update(STEP, { dx: f.x * inp.my + r.x * inp.mx, dz: f.z * inp.my + r.z * inp.mx, run: inp.run, jump: inp.jump, jumpEdge: inp.jumpEdge });
      inp.jumpEdge = false; acc -= STEP; n++; handleEvents();
    }
    if (n >= T.maxSteps) acc = 0;
    if (mode === 'play') updateHud();
  }
  if (mode === 'menu') {
    cam.yaw += dt * 0.18; view.sync(sim, dt);
    view.setCamera({ x: 0, y: 0, z: -9 }, cam.yaw + 0.5, 0.34, 17, dt, true);
  } else {
    view.sync(sim, dt);
    const p = sim.p; view.setCamera({ x: p.x, y: p.state === 'dying' ? Math.max(p.y, -10) : p.y, z: p.z }, cam.yaw, cam.pitch, cam.dist, dt, snapCam); snapCam = false;
  }
}
function frame(now) {
  const dt = Math.min(T.maxDt, (now - last) / 1000); last = now;
  if (!T.manual) { update(dt); view.render(); }
  requestAnimationFrame(frame);
}

toMenu();
requestAnimationFrame(frame);
hooks.lockLost = () => { if (mode === 'play') pause(); };
window.__g = { T, tick(sec) { for (let t = 0; t < sec; t += 1 / 60) update(1 / 60); view.render(); }, get sim() { return sim; }, get mode() { return mode; }, view, cam, inp, startGame, LEVEL };
