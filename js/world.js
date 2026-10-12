import { TILE, ROWS, T } from './levels.js';

export const VW = 960, VH = 540;

// physics (px, seconds)
const G = 2400, JUMP = 880, FALL_MAX = 1050;
const WALK = 270, RUN = 400;

export const SMALL = { w: 34, h: 44 };
export const BIG = { w: 44, h: 64 };

const ENEMY = {
  beetle: { w: 38, h: 32, speed: 62, stomp: true },
  hopper: { w: 36, h: 34, speed: 0, stomp: true },
  burr: { w: 38, h: 38, speed: 48, stomp: false },
};
const STOMP_SCORE = [100, 200, 400, 800, 1000, 2000, 4000, 8000];

const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

export class World {
  constructor(level, opts = {}) {
    this.level = level;
    this.cols = level.cols;
    this.tiles = level.tiles.map(r => Uint8Array.from(r));
    this.contents = { ...level.contents };
    this.time = level.time;
    this.t = 0;
    this.coins = opts.coins || 0;
    this.score = opts.score || 0;
    this.startScore = this.score;
    this.events = [];
    this.parts = []; this.texts = []; this.bumps = []; this.pops = []; this.items = [];
    this.cam = 0;
    this.checkpointC = opts.checkpointC ?? null;

    this.pickups = level.coins.map(c => ({ x: (c.c + 0.5) * TILE, y: (c.r + 0.5) * TILE, got: false, ph: (c.c * 0.7) % 6 }));
    this.enemies = level.enemies.map(e => this.makeEnemy(e));
    this.posts = level.checkpoints.map(c => ({ c: c.c, x: (c.c + 0.5) * TILE, on: this.checkpointC === c.c }));

    const sc = this.checkpointC ?? level.spawn.c;
    this.p = {
      x: sc * TILE + (TILE - SMALL.w) / 2, y: (level.spawn.r + 1) * TILE - SMALL.h,
      w: SMALL.w, h: SMALL.h, vx: 0, vy: 0, big: false, onGround: true, face: 1,
      invuln: 0, coyote: 0, buf: 0, state: 'play', t: 0, anim: 0, squash: 0, combo: 0,
      jumpHeld: false, deadT: 0, prevBottom: 0, growT: 0, visible: true, skid: false,
    };
    this.poleX = level.flag * TILE + TILE / 2;
    this.doorX = (level.flag + 5) * TILE;
    this.flag = { slideY: 2 * TILE + 24, got: false, pts: 0 };
    this.cam = Math.max(0, Math.min(this.cols * TILE - VW, this.p.x - VW * 0.35));
  }

  ev(type, data) { this.events.push({ type, ...data }); }

  makeEnemy(e) {
    const d = ENEMY[e.type];
    return {
      type: e.type, w: d.w, h: d.h, speed: d.speed,
      x: e.c * TILE + (TILE - d.w) / 2, y: (e.r + 1) * TILE - d.h,
      vx: 0, vy: 0, dir: -1, state: 'walk', t: 0, onGround: false,
      hopT: 0.3 + Math.random() * 0.9, rot: 0, anim: Math.random() * 6,
    };
  }

  // ───────────── tiles & collision ─────────────
  tileAt(c, r) {
    if (c < 0 || c >= this.cols) return T.STONE;
    if (r < 0 || r >= ROWS) return 0;
    return this.tiles[r][c];
  }
  solid(t) { return t !== 0 && t !== T.LEAF; }

  moveX(e, dx) {
    e.x += dx;
    if (dx === 0) return false;
    const c0 = Math.floor(e.x / TILE), c1 = Math.floor((e.x + e.w - 0.01) / TILE);
    const r0 = Math.floor(e.y / TILE), r1 = Math.floor((e.y + e.h - 0.01) / TILE);
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        if (this.solid(this.tileAt(c, r))) {
          e.x = dx > 0 ? c * TILE - e.w : (c + 1) * TILE;
          return true;
        }
      }
    }
    return false;
  }

  moveY(e, dy, isPlayer) {
    const prevBottom = e.y + e.h;
    e.y += dy;
    const c0 = Math.floor(e.x / TILE), c1 = Math.floor((e.x + e.w - 0.01) / TILE);
    if (dy >= 0) {
      const r = Math.floor((e.y + e.h) / TILE);
      for (let c = c0; c <= c1; c++) {
        const t = this.tileAt(c, r);
        if (t === 0) continue;
        const top = r * TILE;
        if (t === T.LEAF && prevBottom > top + 1) continue;
        e.y = top - e.h; e.onGround = true; return 'land';
      }
    } else {
      const r = Math.floor(e.y / TILE);
      let best = -1, bd = 1e9;
      const cx = e.x + e.w / 2;
      for (let c = c0; c <= c1; c++) {
        if (this.solid(this.tileAt(c, r))) {
          const d = Math.abs((c + 0.5) * TILE - cx);
          if (d < bd) { bd = d; best = c; }
        }
      }
      if (best >= 0) {
        e.y = (r + 1) * TILE;
        if (isPlayer) this.bump(best, r);
        return 'ceil';
      }
    }
    return null;
  }

  // ───────────── blocks ─────────────
  bump(c, r) {
    const t = this.tiles[r][c], key = c + ',' + r;
    if (t === T.Q || (t === T.BRICK && this.contents[key])) {
      this.hitBlock(c, r);
    } else if (t === T.BRICK) {
      if (this.p.big) this.breakBrick(c, r);
      else { this.bumps.push({ c, r, t: 0 }); this.ev('bump'); this.bumpEnemies(c, r); }
    } else {
      this.ev('bump');
    }
  }

  hitBlock(c, r) {
    const key = c + ',' + r;
    const content = this.contents[key] || 'coin';
    delete this.contents[key];
    this.tiles[r][c] = T.USED;
    this.bumps.push({ c, r, t: 0 });
    this.bumpEnemies(c, r);
    if (content === 'acorn') {
      this.items.push({
        type: 'acorn', x: c * TILE + (TILE - 34) / 2, y: r * TILE, w: 34, h: 34,
        vx: 0, vy: 0, emerge: 0, fromY: r * TILE, toY: (r - 1) * TILE + (TILE - 34), onGround: false,
      });
      this.ev('sprout');
    } else {
      this.coins++; this.score += 100;
      this.pops.push({ x: (c + 0.5) * TILE, y: r * TILE, vy: -620, t: 0 });
      this.addText((c + 0.5) * TILE, r * TILE - 20, '+100', '#ffd54a');
      this.ev('coin');
      this.checkOneUp();
    }
  }

  breakBrick(c, r) {
    this.tiles[r][c] = 0;
    this.score += 50;
    for (let i = 0; i < 4; i++) {
      this.parts.push({
        x: (c + (i % 2 ? 0.72 : 0.28)) * TILE, y: (r + (i < 2 ? 0.28 : 0.72)) * TILE,
        vx: (i % 2 ? 1 : -1) * (90 + Math.random() * 90), vy: -420 - Math.random() * 220,
        life: 1.2, size: 10, color: 'brick', g: 1700, spin: (Math.random() - 0.5) * 12, rot: 0,
      });
    }
    this.ev('break');
    this.bumpEnemies(c, r);
  }

  bumpEnemies(c, r) {
    const top = r * TILE, l = c * TILE, rgt = l + TILE;
    for (const e of this.enemies) {
      if (e.state !== 'walk') continue;
      if (Math.abs(e.y + e.h - top) < 8 && e.x + e.w > l && e.x < rgt) this.flipEnemy(e);
    }
  }

  flipEnemy(e) {
    e.state = 'dead'; e.vy = -520; e.vx = (e.x + e.w / 2 < this.p.x + this.p.w / 2 ? -1 : 1) * 90;
    this.score += 100;
    this.addText(e.x + e.w / 2, e.y - 10, '+100', '#fff');
    this.ev('stomp', { combo: 1 });
  }

  checkOneUp() {
    if (this.coins >= 100) { this.coins -= 100; this.ev('oneup'); this.addText(this.p.x + this.p.w / 2, this.p.y - 20, '1UP', '#7dff7a'); }
  }

  addText(x, y, txt, color = '#fff') { this.texts.push({ x, y, txt, t: 0, color }); }

  // ───────────── player state ─────────────
  grow() {
    const p = this.p;
    if (p.big) { this.score += 1000; this.addText(p.x + p.w / 2, p.y - 10, '+1000', '#ffd54a'); this.ev('powerup'); return; }
    p.big = true; p.y -= BIG.h - p.h; p.w = BIG.w; p.h = BIG.h; p.x -= (BIG.w - SMALL.w) / 2;
    p.growT = 0.5; this.score += 1000;
    this.addText(p.x + p.w / 2, p.y - 10, '+1000', '#ffd54a');
    this.ev('powerup');
  }

  shrink() {
    const p = this.p;
    p.big = false; p.y += BIG.h - SMALL.h; p.h = SMALL.h; p.x += (BIG.w - SMALL.w) / 2; p.w = SMALL.w;
    p.invuln = 1.8; this.ev('hurt');
  }

  kill(reason) {
    const p = this.p;
    if (p.state !== 'play') return;
    if (p.big) { p.y += p.h - SMALL.h; p.x += (p.w - SMALL.w) / 2; p.w = SMALL.w; p.h = SMALL.h; }
    p.state = 'dying'; p.deadT = reason === 'pit' ? 0.5 : 0; p.vx = 0; p.vy = 0; p.big = false;
    this.ev('die', { reason });
  }

  // ───────────── main step ─────────────
  update(dt, inp) {
    this.t += dt;
    const p = this.p;
    p.prevBottom = p.y + p.h;

    if (p.state === 'play') {
      this.time -= dt;
      if (this.time <= 0) { this.time = 0; this.kill('time'); }
    }

    switch (p.state) {
      case 'play': this.updatePlay(dt, inp); break;
      case 'dying': this.updateDying(dt); break;
      case 'flag': this.updateFlag(dt); break;
      case 'walk': this.updateWalk(dt); break;
    }

    if (p.state === 'play' || p.state === 'walk') this.updateEnemies(dt); else this.updateEnemies(dt, true);
    this.updateItems(dt);
    this.updateMisc(dt);
    this.updateCamera(dt);
  }

  updatePlay(dt, inp) {
    const p = this.p;
    const dir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
    const maxV = inp.run ? RUN : WALK;
    p.jumpHeld = inp.jump;
    p.buf = inp.jumpEdge ? 0.12 : p.buf - dt;
    inp.jumpEdge = false;
    p.coyote = p.onGround ? 0.1 : p.coyote - dt;
    if (p.growT > 0) p.growT -= dt;
    if (p.invuln > 0) p.invuln -= dt;

    // horizontal
    if (dir) {
      const prev = Math.abs(p.vx);
      const turning = p.vx * dir < -30;
      const a = (p.onGround ? 2400 : 1600) * (turning ? 1.8 : 1);
      if (prev <= maxV || p.vx * dir < 0) p.vx += dir * a * dt;
      if (Math.abs(p.vx) > maxV && prev <= maxV) p.vx = Math.sign(p.vx) * maxV;
      else if (Math.abs(p.vx) > maxV && p.vx * dir > 0) p.vx -= Math.sign(p.vx) * Math.min(Math.abs(p.vx) - maxV, 1200 * dt);
      p.face = dir;
      p.skid = turning && p.onGround && Math.abs(p.vx) > 120;
    } else {
      const f = (p.onGround ? 2600 : 500) * dt;
      p.vx = Math.abs(p.vx) <= f ? 0 : p.vx - Math.sign(p.vx) * f;
      p.skid = false;
    }
    if (p.skid && Math.random() < 0.5) this.dust(p.x + p.w / 2, p.y + p.h, 1);

    // jump
    if (p.buf > 0 && (p.onGround || p.coyote > 0)) {
      p.vy = -JUMP - Math.abs(p.vx) * 0.06;
      p.onGround = false; p.coyote = 0; p.buf = 0; p.squash = -0.28;
      this.dust(p.x + p.w / 2, p.y + p.h, 3);
      this.ev('jump');
    }

    let g = G;
    if (p.vy < 0 && !p.jumpHeld) g *= 2.6; else if (p.vy > 0) g *= 1.12;
    p.vy = Math.min(p.vy + g * dt, FALL_MAX);

    if (this.moveX(p, p.vx * dt)) p.vx = 0;
    if (p.x < 0) { p.x = 0; p.vx = 0; }
    const was = p.onGround, landV = p.vy;
    p.onGround = false;
    const res = this.moveY(p, p.vy * dt, true);
    if (res === 'land') {
      p.vy = 0;
      if (!was) { p.combo = 0; p.squash = Math.min(0.3, landV / 3200); if (landV > 350) this.dust(p.x + p.w / 2, p.y + p.h, 4); }
    } else if (res === 'ceil') p.vy = Math.max(p.vy, 0);

    p.anim += Math.abs(p.vx) * dt * 0.05;
    p.squash *= Math.exp(-dt * 12);
    p.t += dt;

    if (p.y > VH + 60) this.kill('pit');

    // enemies
    for (const e of this.enemies) {
      if (e.state !== 'walk' || !overlap(p, e)) continue;
      const d = ENEMY[e.type];
      const above = p.vy > 40 && p.y + p.h < e.y + e.h * 0.75 + 6;
      if (d.stomp && above) {
        e.state = 'squash'; e.t = 0.35;
        p.vy = p.jumpHeld ? -760 : -500; p.y = e.y - p.h; p.combo++;
        const pts = STOMP_SCORE[Math.min(p.combo - 1, STOMP_SCORE.length - 1)];
        this.score += pts; this.addText(e.x + e.w / 2, e.y - 6, '+' + pts, '#fff');
        for (let i = 0; i < 6; i++) this.parts.push({ x: e.x + e.w / 2, y: e.y + e.h * 0.5, vx: (Math.random() - 0.5) * 360, vy: -Math.random() * 280, life: 0.5, size: 5, color: 'star', g: 900 });
        this.ev('stomp', { combo: p.combo });
      } else if (p.invuln <= 0) {
        if (p.big) this.shrink(); else this.kill('enemy');
        if (p.state !== 'play') return;
      }
    }

    // coins
    for (const c of this.pickups) {
      if (c.got) continue;
      const dx = c.x - (p.x + p.w / 2), dy = c.y - (p.y + p.h / 2);
      if (dx * dx + dy * dy < (24 + p.w * 0.4) ** 2) {
        c.got = true; this.coins++; this.score += 100;
        for (let i = 0; i < 5; i++) this.parts.push({ x: c.x, y: c.y, vx: (Math.random() - 0.5) * 240, vy: -Math.random() * 260, life: 0.4, size: 4, color: 'spark', g: 600 });
        this.ev('coin'); this.checkOneUp();
      }
    }

    // checkpoints
    for (const post of this.posts) {
      if (!post.on && Math.abs(post.x - (p.x + p.w / 2)) < 36) {
        post.on = true; this.checkpointC = post.c; this.addText(post.x, p.y - 30, 'Checkpoint', '#fff'); this.ev('checkpoint');
      }
    }

    // flag pole
    const poleBox = { x: this.poleX - 10, y: 2 * TILE, w: 20, h: 8 * TILE };
    if (overlap(p, poleBox)) this.startFlag();
  }

  startFlag() {
    const p = this.p, f = this.flag;
    p.state = 'flag'; p.t = 0; p.vx = 0; p.vy = 0; p.x = this.poleX - p.w + 8; p.face = 1;
    const top = 2 * TILE, ground = 10 * TILE;
    const frac = Math.max(0, Math.min(1, (ground - (p.y + p.h)) / (ground - top)));
    const table = [100, 400, 800, 2000, 5000];
    f.pts = table[Math.min(4, Math.floor(frac * 5))];
    f.got = true; f.pause = 0.15;
    this.score += f.pts; this.addText(this.poleX + 30, p.y, '+' + f.pts, '#ffd54a');
    this.ev('flag');
  }

  updateFlag(dt) {
    const p = this.p, f = this.flag;
    p.t += dt; p.anim = 0;
    if (f.pause > 0) { f.pause -= dt; return; }
    const ground = 10 * TILE;
    if (p.y + p.h < ground) {
      p.y = Math.min(ground - p.h, p.y + 300 * dt);
      f.slideY = Math.min(ground - 40, f.slideY + 300 * dt);
    } else {
      f.wait = (f.wait || 0) + dt;
      if (f.wait > 0.35) { p.state = 'walk'; p.face = 1; p.x = this.poleX + 14; p.vy = 0; p.onGround = true; }
    }
  }

  updateWalk(dt) {
    const p = this.p;
    p.vx = 150; p.face = 1;
    p.vy = Math.min(p.vy + G * dt, FALL_MAX);
    this.moveX(p, p.vx * dt);
    p.onGround = false;
    if (this.moveY(p, p.vy * dt, false) === 'land') p.vy = 0;
    p.anim += p.vx * dt * 0.05; p.t += dt;
    if (p.x + p.w / 2 > this.doorX) {
      p.state = 'done'; p.visible = false;
      this.ev('complete', { bonus: Math.ceil(this.time) * 10, timeLeft: Math.ceil(this.time) });
    }
  }

  updateDying(dt) {
    const p = this.p;
    p.deadT += dt;
    if (p.deadT < 0.5) return;
    if (!p.hopped) { p.hopped = true; p.vy = p.y > VH ? 0 : -720; }
    p.vy += G * 0.8 * dt; p.y += p.vy * dt;
    if (p.deadT > 2.1 && !p.reported) { p.reported = true; this.ev('dead'); }
  }

  // ───────────── enemies, items ─────────────
  updateEnemies(dt, freeze) {
    const p = this.p;
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (e.state === 'dead') {
        e.vy += G * 0.8 * dt; e.y += e.vy * dt; e.x += e.vx * dt;
        if (e.y > VH + 100) this.enemies.splice(i, 1);
        continue;
      }
      if (e.state === 'squash') { e.t -= dt; if (e.t <= 0) this.enemies.splice(i, 1); continue; }
      if (freeze) continue;
      if (e.x + e.w < this.cam - 220 || e.x > this.cam + VW + 220) continue;
      e.anim += dt * 8;
      e.vy = Math.min(e.vy + G * dt, 900);

      if (e.type === 'hopper') {
        if (e.onGround) {
          e.vx = 0; e.hopT -= dt;
          if (e.hopT <= 0) {
            e.dir = p.x + p.w / 2 < e.x + e.w / 2 ? -1 : 1;
            e.vy = -640; e.vx = e.dir * 130; e.hopT = 1.1 + Math.random() * 0.5; e.onGround = false;
          }
        }
        if (this.moveX(e, e.vx * dt)) e.vx = 0;
      } else {
        if (this.moveX(e, e.dir * e.speed * dt)) e.dir *= -1;
        e.rot += e.dir * e.speed * dt * 0.06;
        if (e.onGround) {
          const probeX = e.dir > 0 ? e.x + e.w + 2 : e.x - 2;
          const tt = this.tileAt(Math.floor(probeX / TILE), Math.floor((e.y + e.h + 4) / TILE));
          if (tt === 0) e.dir *= -1;
        }
      }
      e.onGround = false;
      if (this.moveY(e, e.vy * dt, false) === 'land') e.vy = 0;
      if (e.y > VH + 100) this.enemies.splice(i, 1);
    }
  }

  updateItems(dt) {
    const p = this.p;
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      if (it.emerge < 1) {
        it.emerge = Math.min(1, it.emerge + dt / 0.55);
        it.y = it.fromY + (it.toY - it.fromY) * it.emerge;
        if (it.emerge >= 1) it.vx = 110;
        continue;
      }
      it.vy = Math.min(it.vy + G * dt, 900);
      if (this.moveX(it, it.vx * dt)) it.vx *= -1;
      it.onGround = false;
      if (this.moveY(it, it.vy * dt, false) === 'land') it.vy = 0;
      if (it.y > VH + 60) { this.items.splice(i, 1); continue; }
      if (p.state === 'play' && overlap(p, it)) { this.items.splice(i, 1); this.grow(); }
    }
  }

  updateMisc(dt) {
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const q = this.parts[i];
      q.life -= dt; if (q.life <= 0) { this.parts.splice(i, 1); continue; }
      q.vy += (q.g ?? 900) * dt; q.x += q.vx * dt; q.y += q.vy * dt;
      if (q.spin) q.rot += q.spin * dt;
    }
    for (let i = this.texts.length - 1; i >= 0; i--) { const t = this.texts[i]; t.t += dt; t.y -= 40 * dt; if (t.t > 0.9) this.texts.splice(i, 1); }
    for (let i = this.bumps.length - 1; i >= 0; i--) { this.bumps[i].t += dt; if (this.bumps[i].t > 0.18) this.bumps.splice(i, 1); }
    for (let i = this.pops.length - 1; i >= 0; i--) { const c = this.pops[i]; c.t += dt; c.vy += 2600 * dt; c.y += c.vy * dt; if (c.t > 0.5) this.pops.splice(i, 1); }
  }

  dust(x, y, n) {
    for (let i = 0; i < n; i++) this.parts.push({ x: x + (Math.random() - 0.5) * 18, y: y - 2, vx: (Math.random() - 0.5) * 120, vy: -Math.random() * 60, life: 0.35, size: 4 + Math.random() * 3, color: 'dust', g: 40 });
  }

  updateCamera(dt) {
    const p = this.p;
    if (p.state === 'dying' && p.y > VH) return;
    const look = Math.max(-60, Math.min(110, p.vx * 0.22));
    const target = p.x + p.w / 2 - VW * 0.42 + look;
    this.cam += (target - this.cam) * (1 - Math.exp(-dt * 7));
    this.cam = Math.max(0, Math.min(this.cols * TILE - VW, this.cam));
  }

  bumpAt(c, r) {
    for (const b of this.bumps) if (b.c === c && b.r === r) return -Math.sin((b.t / 0.18) * Math.PI) * 11;
    return 0;
  }
}
