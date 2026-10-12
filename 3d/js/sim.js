// Pure game logic for the 3D run (no three.js, no DOM) so it can be tested headlessly.
export const G = 30, JUMP = 11, WALK = 4.6, RUN = 7.2, HW = 0.3, HH = 0.9, DEATH_Y = -14;

const ENEMY = { beetle: { r: 0.45, h: 0.55, speed: 1.7 }, hopper: { r: 0.42, h: 0.7, speed: 0 } };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export class Sim {
  constructor(level, opts = {}) {
    this.level = level;
    this.boxes = level.plats.map(p => ({ x0: p.x - p.w / 2, x1: p.x + p.w / 2, z0: p.z - p.d / 2, z1: p.z + p.d / 2, y0: p.y - 4, y1: p.y }));
    this.coins = level.coins.map((c, i) => ({ ...c, got: !!(opts.got && opts.got.has(i)) }));
    this.enemies = level.enemies.map(e => this.makeEnemy(e));
    this.posts = level.checkpoints.map(c => ({ ...c, on: !!(opts.checkpoint && opts.checkpoint.x === c.x && opts.checkpoint.z === c.z) }));
    this.checkpoint = opts.checkpoint || null;
    this.goal = level.goal;
    this.events = []; this.t = 0; this.score = opts.score || 0; this.coinCount = opts.coins || 0;
    this.p = { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, yaw: 0, onGround: false, coyote: 0, buf: 0, hearts: 3, invuln: 0, state: 'play', deadT: 0, squash: 0, combo: 0, anim: 0, jumpHeld: false };
    this.place();
    this.bonus = 0;
  }

  ev(type, data) { this.events.push({ type, ...data }); }

  place() {
    const p = this.p, s = this.checkpoint || this.level.start;
    p.x = s.x; p.y = s.y; p.z = s.z; p.vx = p.vy = p.vz = 0; p.onGround = true;
    if (s.yaw !== undefined) p.yaw = s.yaw;
  }

  makeEnemy(e) {
    const d = ENEMY[e.type];
    const o = { type: e.type, r: d.r, h: d.h, hx: e.x, hz: e.z, x: e.x, y: e.y, z: e.z, y0: e.y, ax: e.ax || 0, az: e.az || 0, range: e.range || 0, dir: e.dir || 1, s: 0, vx: 0, vy: 0, vz: 0, state: 'walk', t: 0, hop: 0.6 + Math.random() * 0.8, anim: Math.random() * 6, yaw: 0 };
    if (e.type === 'hopper') { const b = this.boxes[e.plat]; o.bnd = { x0: b.x0 + 0.5, x1: b.x1 - 0.5, z0: b.z0 + 0.5, z1: b.z1 - 0.5 }; }
    return o;
  }

  // ───────────── collision ─────────────
  overlaps(p, b) { return p.x - HW < b.x1 && p.x + HW > b.x0 && p.z - HW < b.z1 && p.z + HW > b.z0 && p.y < b.y1 && p.y + HH > b.y0; }

  move(axis, d) {
    const p = this.p; p[axis] += d;
    for (const b of this.boxes) {
      if (!this.overlaps(p, b)) continue;
      if (axis === 'y') {
        if (d <= 0) { p.y = b.y1; p.onGround = true; p.landed = true; } else { p.y = b.y0 - HH; if (p.vy > 0) p.vy = 0; }
      } else {
        const lift = b.y1 - p.y;
        if (lift > 0 && lift <= 0.32) { p.y = b.y1; continue; } // small step: walk up it
        if (axis === 'x') p.x = d > 0 ? b.x0 - HW : b.x1 + HW; else p.z = d > 0 ? b.z0 - HW : b.z1 + HW;
        p[axis === 'x' ? 'vx' : 'vz'] = 0;
      }
    }
  }

  // ───────────── step ─────────────
  update(dt, inp) {
    this.t += dt; const p = this.p;
    if (p.state === 'play') this.updatePlay(dt, inp);
    else if (p.state === 'dying') { p.deadT -= dt; p.vy -= G * dt; p.y += p.vy * dt; if (p.deadT <= 0) { p.state = 'over'; this.ev('over'); } }
    this.updateEnemies(dt);
    if (p.state === 'play') { this.updateCoins(); this.updatePosts(); this.updateGoal(); }
  }

  updatePlay(dt, inp) {
    const p = this.p;
    const len = Math.min(1, Math.hypot(inp.dx, inp.dz));
    const maxV = (inp.run ? RUN : WALK) * len;
    const tx = len > 0.01 ? (inp.dx / Math.hypot(inp.dx, inp.dz)) * maxV : 0, tz = len > 0.01 ? (inp.dz / Math.hypot(inp.dx, inp.dz)) * maxV : 0;
    const acc = (len > 0.01 ? (p.onGround ? 48 : 22) : (p.onGround ? 60 : 5)) * dt;
    const ddx = tx - p.vx, ddz = tz - p.vz, dd = Math.hypot(ddx, ddz);
    if (dd <= acc) { p.vx = tx; p.vz = tz; } else { p.vx += (ddx / dd) * acc; p.vz += (ddz / dd) * acc; }
    const sp = Math.hypot(p.vx, p.vz);
    if (sp > 0.6) p.yaw = Math.atan2(p.vx, p.vz);
    p.anim += sp * dt * 1.6;

    p.jumpHeld = !!inp.jump;
    p.buf = inp.jumpEdge ? 0.12 : p.buf - dt; inp.jumpEdge = false;
    p.coyote = p.onGround ? 0.1 : p.coyote - dt;
    if (p.invuln > 0) p.invuln -= dt;
    if (p.buf > 0 && (p.onGround || p.coyote > 0)) {
      p.vy = JUMP + sp * 0.06; p.onGround = false; p.coyote = 0; p.buf = 0; p.squash = -0.25; this.ev('jump');
    }
    let g = G; if (p.vy > 0 && !p.jumpHeld) g *= 2.4; else if (p.vy < 0) g *= 1.1;
    p.vy = Math.max(p.vy - g * dt, -34);

    const was = p.onGround; p.onGround = false; p.landed = false;
    this.move('x', p.vx * dt); this.move('z', p.vz * dt); this.move('y', p.vy * dt);
    if (p.landed) { p.vy = 0; if (!was) { p.combo = 0; p.squash = 0.22; this.ev('land'); } }
    p.squash *= Math.exp(-dt * 12);
    if (p.y < DEATH_Y) this.fall();

    // enemies
    for (const e of this.enemies) {
      if (e.state !== 'walk') continue;
      if (Math.hypot(p.x - e.x, p.z - e.z) >= HW + e.r || p.y >= e.y + e.h || p.y + HH <= e.y) continue;
      if (p.vy < -1 && p.y > e.y + e.h * 0.45) {
        e.state = 'squash'; e.t = 0.4; p.vy = p.jumpHeld ? 13 : 9.5; p.combo++;
        const pts = [100, 200, 400, 800][Math.min(3, p.combo - 1)]; this.score += pts;
        this.ev('stomp', { x: e.x, y: e.y + e.h, z: e.z, pts });
      } else if (p.invuln <= 0) { this.hurt(e.x, e.z); if (p.state !== 'play') return; }
    }
  }

  hurt(fx, fz) {
    const p = this.p; p.hearts--; this.ev('hurt');
    if (p.hearts <= 0) { this.die(); return; }
    p.invuln = 1.8;
    const dx = p.x - fx, dz = p.z - fz, d = Math.hypot(dx, dz) || 1;
    p.vx = (dx / d) * 6; p.vz = (dz / d) * 6; p.vy = 7; p.onGround = false;
  }

  die() { const p = this.p; p.state = 'dying'; p.deadT = 1.3; p.vy = 9; p.vx = p.vz = 0; this.ev('die'); }

  fall() {
    const p = this.p; p.hearts--; this.ev('fall');
    if (p.hearts <= 0) { p.y = DEATH_Y; this.die(); return; }
    this.place(); p.invuln = 1.6;
  }

  updateEnemies(dt) {
    const p = this.p;
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i]; e.anim += dt;
      if (e.state === 'squash') { e.t -= dt; if (e.t <= 0) this.enemies.splice(i, 1); continue; }
      if (e.type === 'beetle') {
        e.s += e.dir * ENEMY.beetle.speed * dt;
        if (e.s > e.range) { e.s = e.range; e.dir = -1; } else if (e.s < -e.range) { e.s = -e.range; e.dir = 1; }
        e.x = e.hx + e.ax * e.s; e.z = e.hz + e.az * e.s; e.yaw = Math.atan2(e.ax * e.dir, e.az * e.dir);
      } else {
        const near = p.state === 'play' && Math.hypot(p.x - e.x, p.z - e.z) < 9 && Math.abs(p.y - e.y0) < 3;
        if (e.y <= e.y0 && e.vy <= 0) {
          e.y = e.y0; e.vx = e.vz = 0; e.hop -= dt;
          if (e.hop <= 0) {
            e.hop = 0.9 + Math.random() * 0.7; e.vy = 7.2;
            if (near) { const dx = p.x - e.x, dz = p.z - e.z, d = Math.hypot(dx, dz) || 1; e.vx = (dx / d) * 3.4; e.vz = (dz / d) * 3.4; e.yaw = Math.atan2(dx, dz); }
          }
        } else {
          e.vy -= G * 0.8 * dt; e.y += e.vy * dt; e.x += e.vx * dt; e.z += e.vz * dt;
          e.x = clamp(e.x, e.bnd.x0, e.bnd.x1); e.z = clamp(e.z, e.bnd.z0, e.bnd.z1);
          if (e.y <= e.y0 && e.vy < 0) { e.y = e.y0; e.vy = 0; e.hop = 0.5 + Math.random() * 0.6; }
        }
      }
    }
  }

  updateCoins() {
    const p = this.p;
    for (const c of this.coins) {
      if (c.got) continue;
      if (Math.hypot(c.x - p.x, c.z - p.z) < 0.9 && Math.abs(c.y - (p.y + 0.45)) < 0.9) {
        c.got = true; this.coinCount++; this.score += 100; this.ev('coin', { x: c.x, y: c.y, z: c.z });
      }
    }
  }

  updatePosts() {
    const p = this.p;
    for (const c of this.posts) {
      if (!c.on && Math.hypot(c.x - p.x, c.z - p.z) < 1.6 && Math.abs(c.y - p.y) < 2) {
        c.on = true; this.checkpoint = { x: c.x, y: c.y, z: c.z + 0.0, yaw: p.yaw }; this.ev('checkpoint', { x: c.x, y: c.y, z: c.z });
      }
    }
  }

  updateGoal() {
    const p = this.p, g = this.goal;
    if (Math.hypot(g.x - p.x, g.z - p.z) < 1.5 && Math.abs(g.y - p.y) < 2) {
      p.state = 'done'; p.vx = p.vz = 0; p.vy = 0;
      this.bonus = Math.max(0, 240 - Math.floor(this.t)) * 10; this.score += this.bonus;
      this.ev('complete', { bonus: this.bonus, time: this.t });
    }
  }
}
