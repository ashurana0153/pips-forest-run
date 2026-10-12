import { TILE, ROWS, T } from './levels.js';
import { VW, VH } from './world.js';

export const THEMES = {
  meadow: {
    skyTop: '#79cbfb', skyBot: '#eaf8ff', sun: '#fff3b8', cloud: '#ffffff',
    far: '#bde4d1', hill1: '#a5dbb4', hill2: '#8fd0a1', treeA: '#5fba7d', treeB: '#49a56a', trunk: '#8a6a52',
    grass: '#7fd16a', grassD: '#5cb54c', grassL: '#a2e48c', dirt: '#c98f5e', dirtD: '#b27a4c', dirtDot: '#a96f43',
    brick: '#e0895a', brickD: '#bf6d41', brickL: '#f2a577', q: '#ffc94a', qD: '#e5a420', qL: '#ffe595',
    used: '#bfae9a', usedD: '#9d8c78', stone: '#a7b4c6', stoneD: '#8896ab', stoneL: '#c9d3e1',
    leaf: '#70d06e', leafD: '#4cae5a', logC: '#c98a52', logD: '#a56d3c', logL: '#e3aa72', vig: 0.12,
  },
  canopy: {
    skyTop: '#ffae82', skyBot: '#fff0d3', sun: '#fff0b0', cloud: '#fff6e8',
    far: '#efc6a2', hill1: '#e4ad84', hill2: '#d29a6c', treeA: '#99bb5a', treeB: '#7ca449', trunk: '#7a5740',
    grass: '#a5d05a', grassD: '#83b346', grassL: '#c4e485', dirt: '#bb7a52', dirtD: '#a4663f', dirtDot: '#965a37',
    brick: '#e07a5c', brickD: '#bd5d42', brickL: '#f39b7e', q: '#ffc94a', qD: '#e5a420', qL: '#ffe595',
    used: '#c2ac96', usedD: '#a08a75', stone: '#b3a9b8', stoneD: '#948a9b', stoneL: '#d2cad6',
    leaf: '#9bd05a', leafD: '#79b043', logC: '#b97a49', logD: '#96602f', logL: '#d89c66', vig: 0.16,
  },
  grove: {
    night: true,
    skyTop: '#161a44', skyBot: '#6a5aa8', sun: '#f4f1ff', cloud: '#7f78c8',
    far: '#3d4082', hill1: '#30356f', hill2: '#272b5c', treeA: '#2c6b7a', treeB: '#225868', trunk: '#3a3050',
    grass: '#58b894', grassD: '#3f9a7a', grassL: '#7fd4b2', dirt: '#5b4a78', dirtD: '#493a64', dirtDot: '#3f3159',
    brick: '#c86d86', brickD: '#a5546c', brickL: '#e68ba2', q: '#ffd55c', qD: '#e8ab26', qL: '#fff0a0',
    used: '#8d83a3', usedD: '#736a89', stone: '#7d86b5', stoneD: '#656e9c', stoneL: '#9ea7d0',
    leaf: '#58c8a0', leafD: '#3ea682', logC: '#8a6a8f', logD: '#6f5274', logL: '#a78aad', vig: 0.28,
  },
  pond: {
    night: true,
    skyTop: '#0b2236', skyBot: '#2f8f94', sun: '#e9fbff', cloud: '#5fb3b8',
    far: '#1f5f70', hill1: '#194c5e', hill2: '#133f50', treeA: '#1f6f6a', treeB: '#185a5c', trunk: '#25384a',
    grass: '#55c29a', grassD: '#3aa07f', grassL: '#82dcb8', dirt: '#3f5a6b', dirtD: '#324b5b', dirtDot: '#2a4150',
    brick: '#d97b8f', brickD: '#b45f73', brickL: '#f19db0', q: '#ffd55c', qD: '#e8ab26', qL: '#fff0a0',
    used: '#8aa0ad', usedD: '#6f8693', stone: '#7e9bb8', stoneD: '#66829f', stoneL: '#a2bcd4',
    leaf: '#6fe0b0', leafD: '#45b98a', logC: '#6f8a8f', logD: '#587277', logL: '#8fa9ad', vig: 0.3,
  },
};

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Rounded", "SF Pro Display", Inter, system-ui, sans-serif';
const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

function rr(ctx, x, y, w, h, r) {
  const [tl, tr, br, bl] = Array.isArray(r) ? r : [r, r, r, r];
  ctx.beginPath();
  ctx.moveTo(x + tl, y);
  ctx.lineTo(x + w - tr, y); ctx.arcTo(x + w, y, x + w, y + tr, tr);
  ctx.lineTo(x + w, y + h - br); ctx.arcTo(x + w, y + h, x + w - br, y + h, br);
  ctx.lineTo(x + bl, y + h); ctx.arcTo(x, y + h, x, y + h - bl, bl);
  ctx.lineTo(x, y + tl); ctx.arcTo(x, y, x + tl, y, tl);
  ctx.closePath();
}
function circle(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); }
function ell(ctx, x, y, rx, ry, rot = 0) { ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), rot, 0, Math.PI * 2); }

// ───────────────────────── background ─────────────────────────
const hillY = (wx, base, amp, f) => base + Math.sin(wx * f) * amp + Math.sin(wx * f * 2.3 + 1.7) * amp * 0.4;

function hills(ctx, off, base, amp, f, color) {
  ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, VH);
  for (let x = 0; x <= VW + 16; x += 16) ctx.lineTo(x, hillY(x + off, base, amp, f));
  ctx.lineTo(VW, VH); ctx.closePath(); ctx.fill();
}

function cloud(ctx, x, y, s, color) {
  ctx.fillStyle = color;
  circle(ctx, x, y, 18 * s); ctx.fill();
  circle(ctx, x + 24 * s, y - 10 * s, 24 * s); ctx.fill();
  circle(ctx, x + 52 * s, y - 2 * s, 20 * s); ctx.fill();
  rr(ctx, x - 18 * s, y, 92 * s, 20 * s, 10 * s); ctx.fill();
}

function tree(ctx, th, x, y, s, kind, col) {
  ctx.fillStyle = th.trunk; rr(ctx, x - 4 * s, y - 30 * s, 8 * s, 32 * s, 2 * s); ctx.fill();
  ctx.fillStyle = col;
  if (kind < 0.5) {
    circle(ctx, x, y - 52 * s, 24 * s); ctx.fill();
    circle(ctx, x - 17 * s, y - 40 * s, 17 * s); ctx.fill();
    circle(ctx, x + 17 * s, y - 40 * s, 17 * s); ctx.fill();
  } else {
    for (let i = 0; i < 3; i++) {
      const w = (30 - i * 6) * s, top = y - (78 - i * 20) * s;
      ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x + w, top + 34 * s); ctx.lineTo(x - w, top + 34 * s); ctx.closePath(); ctx.fill();
    }
  }
}

export function drawBackground(ctx, th, cam, t) {
  const g = ctx.createLinearGradient(0, 0, 0, VH * 0.85);
  g.addColorStop(0, th.skyTop); g.addColorStop(1, th.skyBot);
  ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);

  if (th.night) {
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 46; i++) {
      const x = (hash(i) * VW * 1.4 - cam * 0.03) % VW, y = hash(i + 50) * 260;
      ctx.globalAlpha = 0.35 + 0.65 * Math.abs(Math.sin(t * (0.6 + hash(i + 9)) + i));
      circle(ctx, (x + VW) % VW, y, 0.8 + hash(i + 3) * 1.4); ctx.fill();
    }
    ctx.globalAlpha = 1;
    const mx = 740 - cam * 0.02;
    const mg = ctx.createRadialGradient(mx, 110, 20, mx, 110, 120); mg.addColorStop(0, 'rgba(240,240,255,.35)'); mg.addColorStop(1, 'rgba(240,240,255,0)');
    ctx.fillStyle = mg; ctx.fillRect(mx - 130, 0, 260, 260);
    ctx.fillStyle = th.sun; circle(ctx, mx, 110, 40); ctx.fill();
    ctx.fillStyle = 'rgba(160,160,210,.35)'; circle(ctx, mx - 12, 100, 9); ctx.fill(); circle(ctx, mx + 14, 124, 6); ctx.fill();
  } else {
    const sx = 760 - cam * 0.02, sg = ctx.createRadialGradient(sx, 100, 20, sx, 100, 170);
    sg.addColorStop(0, 'rgba(255,248,200,.85)'); sg.addColorStop(1, 'rgba(255,248,200,0)');
    ctx.fillStyle = sg; ctx.fillRect(sx - 180, 0, 360, 330);
    ctx.fillStyle = th.sun; circle(ctx, sx, 100, 44); ctx.fill();
  }

  // clouds
  ctx.globalAlpha = th.night ? 0.35 : 0.95;
  const co = cam * 0.12 + t * 9;
  for (let i = Math.floor(co / 330) - 1; i < Math.floor((co + VW) / 330) + 2; i++) {
    cloud(ctx, i * 330 + hash(i) * 120 - co, 50 + hash(i + 7) * 110, 0.7 + hash(i + 3) * 0.6, th.cloud);
  }
  ctx.globalAlpha = 1;

  hills(ctx, cam * 0.14, 330, 42, 0.0045, th.far);
  hills(ctx, cam * 0.26, 372, 30, 0.0062, th.hill1);

  // trees on the mid hills
  const to = cam * 0.4, spacing = 150;
  for (let i = Math.floor(to / spacing) - 1; i < Math.floor((to + VW) / spacing) + 2; i++) {
    const wx = i * spacing + hash(i + 21) * 70, x = wx - to;
    const y = hillY(wx + 0, 410, 22, 0.0072) + 8;
    tree(ctx, th, x, y, 0.85 + hash(i + 11) * 0.5, hash(i + 31), hash(i + 41) > 0.5 ? th.treeA : th.treeB);
  }
  hills(ctx, cam * 0.5, 424, 20, 0.0072, th.hill2);

  if (th.night) {
    for (let i = 0; i < 18; i++) {
      const x = (hash(i + 70) * VW + Math.sin(t * 0.5 + i * 2) * 60 + VW - cam * 0.08) % VW;
      const y = 250 + hash(i + 80) * 190 + Math.sin(t * 0.9 + i) * 18;
      const a = 0.45 + 0.55 * Math.abs(Math.sin(t * 1.3 + i * 1.7));
      ctx.fillStyle = `rgba(200,255,150,${0.16 * a})`; circle(ctx, x, y, 9); ctx.fill();
      ctx.fillStyle = `rgba(230,255,170,${a})`; circle(ctx, x, y, 2); ctx.fill();
    }
  }
}

// ───────────────────────── tiles ─────────────────────────
function drawTile(ctx, w, th, c, r, t) {
  const id = w.tiles[r][c];
  if (!id) return;
  const x = c * TILE, y = r * TILE + w.bumpAt(c, r);
  const solidAt = (cc, rr2) => { const k = w.tileAt(cc, rr2); return k !== 0 && k !== T.LEAF; };

  if (id === T.GROUND) {
    const top = r === 0 || !solidAt(c, r - 1);
    const lAir = c > 0 && !solidAt(c - 1, r), rAir = c < w.cols - 1 && !solidAt(c + 1, r);
    ctx.fillStyle = r === 10 ? th.dirt : th.dirtD;
    ctx.fillRect(x, y, TILE + 1, TILE + 1);
    ctx.fillStyle = th.dirtDot;
    for (let i = 0; i < 3; i++) { ell(ctx, x + 8 + hash(c * 7 + r * 3 + i) * 30, y + 20 + hash(c + r * 11 + i * 5) * 20, 3.2, 2.2, hash(i + c) * 3); ctx.fill(); }
    if (lAir) { ctx.fillStyle = th.dirtD; ctx.fillRect(x, y + 12, 5, TILE); }
    if (rAir) { ctx.fillStyle = th.dirtD; ctx.fillRect(x + TILE - 4, y + 12, 5, TILE); }
    if (top) {
      ctx.fillStyle = th.grass;
      rr(ctx, x - (lAir ? 2 : 0), y - 1, TILE + 1 + (lAir ? 2 : 0) + (rAir ? 2 : 0), 14, [lAir ? 7 : 0, rAir ? 7 : 0, 0, 0]); ctx.fill();
      for (let i = 0; i < 3; i++) { circle(ctx, x + 8 + i * 15 + hash(c + i) * 4, y + 12, 6); ctx.fill(); }
      ctx.fillStyle = th.grassL; ctx.fillRect(x + (lAir ? 5 : 0), y, TILE + 1 - (lAir ? 5 : 0) - (rAir ? 5 : 0), 3);
      ctx.fillStyle = th.grassD; ctx.fillRect(x, y + 12, TILE + 1, 2);
    }
  } else if (id === T.BRICK) {
    ctx.fillStyle = th.brickD; rr(ctx, x + 1, y + 1, TILE - 2, TILE - 2, 6); ctx.fill();
    ctx.fillStyle = th.brick; rr(ctx, x + 1, y + 1, TILE - 2, TILE - 5, 6); ctx.fill();
    ctx.strokeStyle = th.brickD; ctx.lineWidth = 2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x + 4, y + 15); ctx.lineTo(x + TILE - 4, y + 15); ctx.moveTo(x + 4, y + 29); ctx.lineTo(x + TILE - 4, y + 29);
    ctx.moveTo(x + 22, y + 4); ctx.lineTo(x + 22, y + 15); ctx.moveTo(x + 12, y + 15); ctx.lineTo(x + 12, y + 29); ctx.moveTo(x + 33, y + 15); ctx.lineTo(x + 33, y + 29); ctx.moveTo(x + 22, y + 29); ctx.lineTo(x + 22, y + 40); ctx.stroke();
    ctx.fillStyle = th.brickL; rr(ctx, x + 5, y + 4, TILE - 10, 3, 1.5); ctx.fill();
  } else if (id === T.Q) {
    const pulse = 0.5 + 0.5 * Math.sin(t * 4 + c);
    ctx.fillStyle = th.qD; rr(ctx, x + 1, y + 1, TILE - 2, TILE - 2, 9); ctx.fill();
    ctx.fillStyle = th.q; rr(ctx, x + 1, y + 1, TILE - 2, TILE - 5, 9); ctx.fill();
    ctx.fillStyle = th.qL; ctx.globalAlpha = 0.5 + pulse * 0.4; rr(ctx, x + 5, y + 4, TILE - 10, 4, 2); ctx.fill(); ctx.globalAlpha = 1;
    ctx.fillStyle = th.qD;
    for (const [dx, dy] of [[7, 7], [TILE - 7, 7], [7, TILE - 10], [TILE - 7, TILE - 10]]) { circle(ctx, x + dx, y + dy, 1.8); ctx.fill(); }
    ctx.font = `800 27px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = th.qD; ctx.fillText('?', x + TILE / 2, y + TILE / 2 + 2);
    ctx.fillStyle = '#fff8dc'; ctx.fillText('?', x + TILE / 2, y + TILE / 2);
  } else if (id === T.USED) {
    ctx.fillStyle = th.usedD; rr(ctx, x + 1, y + 1, TILE - 2, TILE - 2, 9); ctx.fill();
    ctx.fillStyle = th.used; rr(ctx, x + 1, y + 1, TILE - 2, TILE - 5, 9); ctx.fill();
    ctx.fillStyle = th.usedD; circle(ctx, x + TILE / 2, y + TILE / 2 - 1, 4); ctx.fill();
  } else if (id === T.STONE) {
    ctx.fillStyle = th.stoneD; rr(ctx, x + 1, y + 1, TILE - 2, TILE - 2, 7); ctx.fill();
    ctx.fillStyle = th.stone; rr(ctx, x + 1, y + 1, TILE - 2, TILE - 6, 7); ctx.fill();
    ctx.fillStyle = th.stoneL; rr(ctx, x + 6, y + 5, TILE - 12, 4, 2); ctx.fill();
    ctx.fillStyle = th.stoneD; ctx.globalAlpha = 0.5; rr(ctx, x + 12, y + 16, TILE - 24, TILE - 30, 5); ctx.fill(); ctx.globalAlpha = 1;
  } else if (id === T.LEAF) {
    ctx.fillStyle = th.leafD; rr(ctx, x + 1, y + 6, TILE - 2, 12, 6); ctx.fill();
    ctx.fillStyle = th.leaf; rr(ctx, x + 1, y, TILE - 2, 12, 6); ctx.fill();
    ctx.strokeStyle = th.leafD; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x + 7, y + 6); ctx.lineTo(x + TILE - 7, y + 6); ctx.stroke();
  } else if (id === T.LOG) {
    const lN = w.tileAt(c - 1, r) === T.LOG, rN = w.tileAt(c + 1, r) === T.LOG, tN = w.tileAt(c, r - 1) === T.LOG;
    ctx.fillStyle = th.logC; ctx.fillRect(x, y, TILE + 1, TILE + 1);
    ctx.fillStyle = th.logD; ctx.fillRect(x + 9, y, 3, TILE + 1); ctx.fillRect(x + 25, y, 3, TILE + 1); ctx.fillRect(x + 38, y, 2, TILE + 1);
    ctx.fillStyle = th.logL; ctx.fillRect(x + 14, y, 2, TILE + 1); ctx.fillRect(x + 30, y, 2, TILE + 1);
    if (!lN) { ctx.fillStyle = th.logD; ctx.fillRect(x, y, 4, TILE + 1); }
    if (!rN) { ctx.fillStyle = th.logD; ctx.fillRect(x + TILE - 3, y, 4, TILE + 1); }
    if (!tN) {
      ctx.fillStyle = th.logD; rr(ctx, x - (lN ? 0 : 4), y - 3, TILE + 1 + (lN ? 0 : 4) + (rN ? 0 : 4), 13, [lN ? 0 : 6, rN ? 0 : 6, 0, 0]); ctx.fill();
      ctx.fillStyle = th.logL; rr(ctx, x + (lN ? 0 : 1), y - 1, TILE + 1 - (lN ? 0 : 1) - (rN ? 0 : 1), 5, 2); ctx.fill();
    }
  }
}

// ───────────────────────── props ─────────────────────────
function drawCoin(ctx, x, y, spin, a = 1) {
  const sx = Math.max(0.12, Math.abs(Math.cos(spin)));
  ctx.globalAlpha = a;
  ctx.fillStyle = '#e0a21c'; ell(ctx, x, y, 11 * sx, 13); ctx.fill();
  ctx.fillStyle = '#ffd54a'; ell(ctx, x, y - 0.5, 9 * sx, 11); ctx.fill();
  ctx.fillStyle = '#ffe98d'; ell(ctx, x, y - 0.5, 5.5 * sx, 7.5); ctx.fill();
  ctx.fillStyle = '#ffd54a'; ell(ctx, x, y - 0.5, 3 * sx, 5); ctx.fill();
  ctx.globalAlpha = 1;
}

function drawAcorn(ctx, it, t) {
  const cx = it.x + it.w / 2, cy = it.y + it.h / 2;
  const g = ctx.createRadialGradient(cx, cy, 4, cx, cy, 30);
  g.addColorStop(0, 'rgba(255,230,120,.55)'); g.addColorStop(1, 'rgba(255,230,120,0)');
  ctx.fillStyle = g; ctx.fillRect(cx - 32, cy - 32, 64, 64);
  ctx.save(); ctx.translate(cx, cy + 2); ctx.rotate(Math.sin(t * 6) * 0.06);
  ctx.fillStyle = '#d99a47'; ctx.beginPath(); ctx.moveTo(-12, -2); ctx.quadraticCurveTo(-13, 15, 0, 17); ctx.quadraticCurveTo(13, 15, 12, -2); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#f2bd6b'; ell(ctx, -4, 4, 3, 7, 0.2); ctx.fill();
  ctx.fillStyle = '#7a4b2a'; ctx.beginPath(); ctx.moveTo(-15, -2); ctx.quadraticCurveTo(-15, -17, 0, -17); ctx.quadraticCurveTo(15, -17, 15, -2); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#5d3719'; ctx.lineWidth = 1.4;
  ctx.beginPath(); for (let i = -9; i <= 9; i += 6) { ctx.moveTo(i, -14); ctx.lineTo(i * 1.15, -3); } ctx.moveTo(-14, -8); ctx.lineTo(14, -8); ctx.stroke();
  ctx.fillStyle = '#5d3719'; rr(ctx, -2, -23, 4, 8, 2); ctx.fill();
  ctx.restore();
}

function drawPole(ctx, th, w, t) {
  const px = w.poleX, top = 2 * TILE - 14;
  ctx.fillStyle = '#d8dde6'; rr(ctx, px - 3, top, 6, 10 * TILE - top, 3); ctx.fill();
  ctx.fillStyle = '#b4bcc9'; ctx.fillRect(px + 1, top + 6, 2, 10 * TILE - top - 6);
  ctx.fillStyle = '#ffd54a'; circle(ctx, px, top - 3, 8); ctx.fill();
  ctx.fillStyle = '#fff3b0'; circle(ctx, px - 2, top - 5, 3); ctx.fill();
  const fy = w.flag.slideY, wave = Math.sin(t * 5) * 3;
  ctx.fillStyle = '#4fbf6e';
  ctx.beginPath(); ctx.moveTo(px - 3, fy); ctx.quadraticCurveTo(px - 28, fy + 4 + wave, px - 50, fy + 18 + wave); ctx.quadraticCurveTo(px - 28, fy + 26, px - 3, fy + 34); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#e9fff0';
  ctx.beginPath(); ctx.moveTo(px - 12, fy + 24); ctx.quadraticCurveTo(px - 18, fy + 8, px - 34, fy + 14 + wave * 0.6); ctx.quadraticCurveTo(px - 26, fy + 26, px - 12, fy + 24); ctx.fill();
}

function drawDoor(ctx, th, w) {
  const x = w.doorX, y = 10 * TILE;
  ctx.fillStyle = th.grassD; ctx.beginPath(); ctx.ellipse(x, y + 4, 78, 82, 0, Math.PI, 0); ctx.fill();
  ctx.fillStyle = th.grass; ctx.beginPath(); ctx.ellipse(x, y + 4, 78, 76, 0, Math.PI, 0); ctx.fill();
  ctx.fillStyle = th.dirtDot; rr(ctx, x - 22, y - 56, 44, 60, [22, 22, 0, 0]); ctx.fill();
  ctx.fillStyle = '#4a2f1d'; rr(ctx, x - 18, y - 52, 36, 56, [18, 18, 0, 0]); ctx.fill();
  ctx.fillStyle = '#ffd98a'; circle(ctx, x + 8, y - 24, 3); ctx.fill();
  ctx.fillStyle = 'rgba(255,214,120,.9)'; circle(ctx, x - 52, y - 40, 6); ctx.fill(); circle(ctx, x + 56, y - 34, 5); ctx.fill();
}

function drawPost(ctx, post, t) {
  const x = post.x, y = 10 * TILE;
  ctx.fillStyle = '#6d4c38'; rr(ctx, x - 3, y - 62, 6, 62, 2); ctx.fill();
  ctx.fillStyle = '#6d4c38'; rr(ctx, x - 12, y - 74, 24, 6, 3); ctx.fill();
  if (post.on) {
    const g = ctx.createRadialGradient(x, y - 54, 2, x, y - 54, 46);
    g.addColorStop(0, 'rgba(255,214,110,.75)'); g.addColorStop(1, 'rgba(255,214,110,0)');
    ctx.fillStyle = g; ctx.fillRect(x - 50, y - 100, 100, 100);
  }
  ctx.fillStyle = post.on ? '#ffd45a' : '#9aa5b6'; rr(ctx, x - 9, y - 66, 18, 20, 7); ctx.fill();
  ctx.fillStyle = post.on ? '#fff4b8' : '#c3ccd9'; rr(ctx, x - 5, y - 63, 6, 10, 3); ctx.fill();
  ctx.fillStyle = '#6d4c38'; rr(ctx, x - 11, y - 70, 22, 6, 3); ctx.fill();
}

// ───────────────────────── characters ─────────────────────────
function eyes(ctx, x, y, gap, r, look = 1) {
  ctx.fillStyle = '#fff'; circle(ctx, x - gap, y, r); ctx.fill(); circle(ctx, x + gap, y, r); ctx.fill();
  ctx.fillStyle = '#26201b'; circle(ctx, x - gap + look * 1.2, y + 0.8, r * 0.55); ctx.fill(); circle(ctx, x + gap + look * 1.2, y + 0.8, r * 0.55); ctx.fill();
}

function drawBeetle(ctx, e, th, t) {
  const cx = e.x + e.w / 2, by = e.y + e.h;
  ctx.save(); ctx.translate(cx, by);
  if (e.state === 'dead') { ctx.translate(0, -e.h / 2); ctx.rotate(Math.PI); ctx.translate(0, e.h / 2); }
  if (e.state === 'squash') {
    ctx.fillStyle = '#2f8581'; ell(ctx, 0, -5, 20, 5); ctx.fill();
    ctx.fillStyle = '#fff'; circle(ctx, -6, -6, 2.4); ctx.fill(); circle(ctx, 6, -6, 2.4); ctx.fill();
    ctx.restore(); return;
  }
  const sw = Math.sin(e.anim) * 3;
  ctx.fillStyle = '#244d56';
  for (const lx of [-12, 0, 12]) { rr(ctx, lx - 3 + (lx === 0 ? -sw : sw), -7, 6, 7, 3); ctx.fill(); }
  ctx.scale(e.dir > 0 ? -1 : 1, 1);
  ctx.fillStyle = '#2f8581'; ctx.beginPath(); ctx.ellipse(0, -9, 19, 22, 0, Math.PI, 0); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#4bb5ae'; ctx.beginPath(); ctx.ellipse(0, -11, 15, 17, 0, Math.PI * 1.05, Math.PI * 1.95); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#2f8581'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -28); ctx.lineTo(0, -9); ctx.moveTo(-9, -24); ctx.lineTo(-11, -9); ctx.moveTo(9, -24); ctx.lineTo(11, -9); ctx.stroke();
  ctx.fillStyle = '#e9f8f6'; circle(ctx, -8, -20, 2.2); ctx.fill(); circle(ctx, 8, -20, 2.2); ctx.fill();
  ctx.fillStyle = '#f3dcc0'; rr(ctx, -15, -12, 30, 9, 4.5); ctx.fill();
  eyes(ctx, -2, -8, 6, 3.2, -1);
  ctx.strokeStyle = '#3a2a22'; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-11, -14); ctx.lineTo(-4, -12); ctx.moveTo(7, -12); ctx.lineTo(13, -14); ctx.stroke();
  ctx.restore();
}

function drawBurr(ctx, e, t) {
  const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
  ctx.save(); ctx.translate(cx, cy);
  if (e.state === 'dead') ctx.rotate(Math.PI);
  ctx.save(); ctx.rotate(e.rot);
  ctx.fillStyle = '#5b3a22';
  for (let i = 0; i < 12; i++) {
    ctx.save(); ctx.rotate((i / 12) * Math.PI * 2);
    ctx.beginPath(); ctx.moveTo(-4.5, -13); ctx.lineTo(0, -25); ctx.lineTo(4.5, -13); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  ctx.fillStyle = '#8c5b34'; circle(ctx, 0, 0, 17); ctx.fill();
  ctx.fillStyle = '#a8764a'; circle(ctx, -4, -5, 8); ctx.fill();
  ctx.restore();
  eyes(ctx, 0, -1, 6, 3.6, e.dir);
  ctx.strokeStyle = '#2b1b12'; ctx.lineWidth = 2; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-9, -8); ctx.lineTo(-3, -5.5); ctx.moveTo(9, -8); ctx.lineTo(3, -5.5); ctx.moveTo(-4, 9); ctx.quadraticCurveTo(0, 6, 4, 9); ctx.stroke();
  ctx.restore();
}

function drawHopper(ctx, e, t) {
  const cx = e.x + e.w / 2, by = e.y + e.h;
  ctx.save(); ctx.translate(cx, by);
  if (e.state === 'dead') { ctx.translate(0, -e.h / 2); ctx.rotate(Math.PI); ctx.translate(0, e.h / 2); }
  if (e.state === 'squash') {
    ctx.fillStyle = '#4fae44'; ell(ctx, 0, -5, 20, 5); ctx.fill();
    ctx.fillStyle = '#fff'; circle(ctx, -7, -7, 2.4); ctx.fill(); circle(ctx, 7, -7, 2.4); ctx.fill();
    ctx.restore(); return;
  }
  const air = !e.onGround, sq = e.onGround && e.hopT < 0.25 ? 0.88 : 1;
  ctx.scale(e.dir > 0 ? -1 : 1, air ? 1.1 : sq);
  ctx.fillStyle = '#4fae44';
  if (air) { ell(ctx, 13, -4, 12, 4, 0.5); ctx.fill(); ell(ctx, -3, -3, 8, 4, -0.3); ctx.fill(); }
  else { ell(ctx, 10, -5, 9, 6); ctx.fill(); ell(ctx, -5, -4, 6, 4); ctx.fill(); }
  ctx.fillStyle = '#74d05b'; ell(ctx, 0, -17, 18, 15); ctx.fill();
  ctx.fillStyle = '#b6ef9e'; ell(ctx, -1, -12, 12, 8); ctx.fill();
  ctx.fillStyle = '#74d05b'; circle(ctx, -9, -29, 8); ctx.fill(); circle(ctx, 8, -29, 8); ctx.fill();
  eyes(ctx, -0.5, -29, 8.5, 5, -1);
  ctx.strokeStyle = '#2f7f2a'; ctx.lineWidth = 2; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-8, -13); ctx.quadraticCurveTo(-2, -8, 6, -13); ctx.stroke();
  ctx.restore();
}

export function drawHero(ctx, p, t) {
  ctx.save();
  ctx.translate(p.x + p.w / 2, p.y + p.h);
  let s = p.big ? 1.45 : 1;
  if (p.growT > 0) s *= 1 + Math.sin((p.growT / 0.5) * Math.PI) * 0.14;
  const sq = p.squash || 0;
  ctx.scale(p.face * s * (1 + sq * 0.55), s * (1 - sq));
  if (p.invuln > 0 && Math.floor(t * 18) % 2) ctx.globalAlpha = 0.45;

  const dead = p.state === 'dying', air = (!p.onGround && p.state === 'play') || dead;
  const moving = p.onGround && Math.abs(p.vx) > 25 && p.state !== 'flag';
  const ph = p.anim, bob = !moving && !air ? Math.sin(t * 3) * 0.6 : 0;
  if (p.skid) ctx.rotate(-0.12);

  // tail
  const sw = moving ? Math.sin(ph * 1.2) * 0.2 : Math.sin(t * 2.4) * 0.07;
  ctx.save(); ctx.translate(-11, -15 + bob); ctx.rotate(-0.8 + sw - (air ? 0.25 : 0));
  ctx.fillStyle = '#e07a2c'; ell(ctx, -11, 0, 14, 8); ctx.fill();
  ctx.fillStyle = '#fff1d6'; ell(ctx, -21, 0, 6, 6.6); ctx.fill();
  ctx.restore();

  // back leg + front leg
  const legs = (x, off, up) => { ctx.fillStyle = '#7b3f1c'; rr(ctx, x - 4.5 + off, -8 - up, 9, 8 + up * 0.3, 4); ctx.fill(); };
  if (air) { legs(-6, -3, 3); legs(8, 4, 5); }
  else if (moving) { legs(-6, Math.sin(ph) * 7, Math.max(0, Math.cos(ph)) * 4); legs(8, -Math.sin(ph) * 7, Math.max(0, -Math.cos(ph)) * 4); }
  else { legs(-6, 0, 0); legs(8, 0, 0); }

  // body
  ctx.fillStyle = '#f2903f'; ell(ctx, 0, -17 + bob, 15, 13); ctx.fill();
  ctx.fillStyle = '#ffe9c8'; ell(ctx, 4, -14 + bob, 9, 8); ctx.fill();
  if (p.big) {
    ctx.fillStyle = '#4fbf6e'; rr(ctx, -9, -26 + bob, 22, 6, 3); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-8, -23 + bob); ctx.quadraticCurveTo(-16 - (moving ? 3 : 0), -20, -18, -12 + bob + Math.sin(t * 5) * 1.5); ctx.quadraticCurveTo(-11, -17, -4, -21 + bob); ctx.fill();
  }

  // head
  const hy = -28 + bob;
  ctx.fillStyle = '#e07a2c';
  ctx.beginPath(); ctx.moveTo(-8, hy - 8); ctx.lineTo(-5, hy - 22); ctx.lineTo(4, hy - 10); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(4, hy - 10); ctx.lineTo(11, hy - 22); ctx.lineTo(16, hy - 6); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#7b3f1c';
  ctx.beginPath(); ctx.moveTo(-6, hy - 10); ctx.lineTo(-5, hy - 18); ctx.lineTo(1, hy - 11); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(7, hy - 11); ctx.lineTo(11, hy - 18); ctx.lineTo(13, hy - 9); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#f2903f'; ell(ctx, 4, hy, 15.5, 12.5); ctx.fill();
  ctx.fillStyle = '#ffe9c8'; ell(ctx, 11, hy + 4, 8.5, 6.5); ctx.fill();
  ctx.fillStyle = 'rgba(255,120,120,.4)'; circle(ctx, 4, hy + 5, 3.2); ctx.fill();
  // eyes
  const ey = hy - 2, big = dead || air && p.vy < -200;
  ctx.fillStyle = '#26201b'; ell(ctx, 4, ey, 2.6, big ? 4.6 : 3.8); ctx.fill(); ell(ctx, 12, ey, 2.6, big ? 4.6 : 3.8); ctx.fill();
  ctx.fillStyle = '#fff'; circle(ctx, 4.9, ey - 1.5, 1.1); ctx.fill(); circle(ctx, 12.9, ey - 1.5, 1.1); ctx.fill();
  ctx.fillStyle = '#26201b'; ell(ctx, 18, hy + 2, 2.6, 2.1); ctx.fill();
  ctx.strokeStyle = '#26201b'; ctx.lineWidth = 1.3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(14.5, hy + 6.5); ctx.quadraticCurveTo(17, hy + (air ? 10 : 8.5), 19.5, hy + 6.5); ctx.stroke();
  ctx.restore();
}

// ── night ghost: a pale wisp. Shy (faded, hands over its eyes) while the hero looks at it. ──
function drawGhost(ctx, e, t, w) {
  const cx = e.x + e.w / 2, cy = e.y + e.h / 2 + Math.sin(e.bob) * 4;
  const p = w.p, face = (p.x + p.w / 2) > cx ? 1 : -1;
  const shy = e.shy, a = e.state === 'dead' ? 0.5 : (shy ? 0.5 : 0.95);
  ctx.save(); ctx.translate(cx, cy); ctx.globalAlpha = a;
  // glow
  const gl = ctx.createRadialGradient(0, 0, 4, 0, 0, 40);
  gl.addColorStop(0, shy ? 'rgba(170,215,255,.25)' : 'rgba(170,215,255,.5)'); gl.addColorStop(1, 'rgba(170,215,255,0)');
  ctx.fillStyle = gl; circle(ctx, 0, 0, 40); ctx.fill();
  const wob = Math.sin(e.anim * 5) * 3;
  // body: teardrop head with a wavy wisp tail
  ctx.fillStyle = '#cfe6ff';
  ctx.beginPath();
  ctx.moveTo(-16, 2);
  ctx.bezierCurveTo(-18, -22, 18, -22, 16, 2);
  ctx.bezierCurveTo(16, 10, 18, 16 + wob * 0.3, 11, 19);
  ctx.quadraticCurveTo(7, 12 + wob, 3, 19);
  ctx.quadraticCurveTo(-1, 12 - wob, -5, 19);
  ctx.quadraticCurveTo(-9, 12 + wob, -13, 18);
  ctx.bezierCurveTo(-18, 14, -16, 8, -16, 2);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#eaf4ff'; ell(ctx, -3, -7, 9, 7, -0.3); ctx.fill();
  // curly wisp on top
  ctx.strokeStyle = '#cfe6ff'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, -17); ctx.quadraticCurveTo(-2, -26, 5, -26 + wob * 0.3); ctx.quadraticCurveTo(9, -26, 8, -22); ctx.stroke();
  // cheeks
  ctx.fillStyle = 'rgba(255,160,190,.45)'; circle(ctx, -10 + face * 2, 2, 3); ctx.fill(); circle(ctx, 10 + face * 2, 2, 3); ctx.fill();
  const ex = face * 2;
  if (shy) {
    // little hands over the eyes
    ctx.fillStyle = '#b9d6f7'; circle(ctx, -6 + ex, -4, 6); ctx.fill(); circle(ctx, 6 + ex, -4, 6); ctx.fill();
    ctx.strokeStyle = '#7ea6d6'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(-9 + ex, -4); ctx.lineTo(-3 + ex, -4); ctx.moveTo(3 + ex, -4); ctx.lineTo(9 + ex, -4); ctx.stroke();
  } else {
    // sleepy-wide eyes + small "o" mouth
    ctx.fillStyle = '#243455';
    ell(ctx, -6 + ex, -4, 3, 4.2); ctx.fill(); ell(ctx, 6 + ex, -4, 3, 4.2); ctx.fill();
    ctx.fillStyle = '#fff'; circle(ctx, -5.2 + ex, -5.4, 1.1); ctx.fill(); circle(ctx, 6.8 + ex, -5.4, 1.1); ctx.fill();
    ctx.fillStyle = '#243455'; ell(ctx, ex, 6, 2.4, 3); ctx.fill();
  }
  ctx.restore();
}

// ── Big Frog ──
function drawBoss(ctx, b, w, t) {
  const cx = b.x + b.w / 2, ground = 10 * TILE, by = b.y + b.h;
  const dead = b.state === 'dead', air = b.state === 'air', stunned = b.state === 'stunned';
  const p = w.p, flash = b.hurt > 0 && !stunned && Math.floor(t * 16) % 2 === 0, rage = b.hp === 1;
  // shadow
  if (!dead) {
    const up = Math.max(0, ground - by), k = Math.max(0.45, 1 - up / 260);
    ctx.fillStyle = 'rgba(5,20,30,.32)'; ell(ctx, cx, ground - 2, 62 * k, 8 * k); ctx.fill();
  }
  ctx.save();
  if (dead) { ctx.translate(cx, b.y + b.h / 2); ctx.rotate(b.rot); ctx.translate(0, b.h / 2); } else ctx.translate(cx, by);
  let sq = b.squash || 0;
  if (b.state === 'land') sq = Math.max(sq, 0.2 * Math.max(0, Math.min(1, (b.t - 0.6) / 0.3)));
  const st = air ? Math.max(-0.3, Math.min(1, -b.vy / 1000)) * 0.12 : 0;
  ctx.scale(1 + sq * 0.6 - st * 0.6, 1 - sq + st);
  const C = (n, f) => flash ? f : n;
  const body = C('#3aa86e', '#f1fff6'), dark = C('#2a8a56', '#d8f5e4'), belly = C('#c9f0a8', '#ffffff');
  // back legs
  ctx.fillStyle = dark;
  for (const sx of [-1, 1]) { ell(ctx, sx * 48, -17, 26, 17, sx * -0.25); ctx.fill(); ell(ctx, sx * 62, -5, 21, 7); ctx.fill(); }
  // body
  ctx.fillStyle = body; ell(ctx, 0, -46, 62, 44); ctx.fill();
  ctx.fillStyle = dark; ctx.globalAlpha = 0.35;
  ell(ctx, -26, -68, 9, 6, -0.3); ctx.fill(); ell(ctx, 22, -72, 7, 5, 0.3); ctx.fill(); ell(ctx, 4, -62, 5, 4); ctx.fill(); ell(ctx, -44, -48, 6, 4.5); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = belly; ell(ctx, 0, -32, 42, 28); ctx.fill();
  if (b.state === 'crouch' || b.state === 'land') { const pf = 4 + Math.sin(t * 40) * 2; ctx.fillStyle = C('#e2f9c8', '#fff'); ell(ctx, 0, -30, 22 + pf, 13 + pf * 0.5); ctx.fill(); }
  // front arms
  ctx.fillStyle = body;
  for (const sx of [-1, 1]) { ell(ctx, sx * 36, -13, 11, 15); ctx.fill(); ell(ctx, sx * 38, -3, 14, 5); ctx.fill(); }
  // eye bumps
  for (const sx of [-1, 1]) { ctx.fillStyle = body; circle(ctx, sx * 34, -84, 19); ctx.fill(); }
  // eyes
  const pcx = p.x + p.w / 2, pcy = p.y + p.h / 2;
  const lx = Math.max(-1, Math.min(1, (pcx - cx) / 220)), ly = Math.max(-1, Math.min(1, (pcy - (b.y + 10)) / 200));
  for (const sx of [-1, 1]) {
    const ex = sx * 34, ey = -84;
    ctx.fillStyle = rage && !flash ? '#fff0ee' : '#fff'; circle(ctx, ex, ey, 14); ctx.fill();
    if (dead) {
      ctx.strokeStyle = '#1d2b24'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(ex - 6, ey - 6); ctx.lineTo(ex + 6, ey + 6); ctx.moveTo(ex + 6, ey - 6); ctx.lineTo(ex - 6, ey + 6); ctx.stroke();
    } else if (stunned) {
      ctx.strokeStyle = '#1d2b24'; ctx.lineWidth = 2; ctx.beginPath();
      for (let i = 0; i <= 26; i++) { const ang = i * 0.55 + t * 6 * sx, r = 1.2 + i * 0.22; const px = ex + Math.cos(ang) * r, py = ey + Math.sin(ang) * r; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
      ctx.stroke();
    } else {
      ctx.fillStyle = '#1d2b24'; circle(ctx, ex + lx * 5, ey + ly * 4, 7); ctx.fill();
      ctx.fillStyle = '#fff'; circle(ctx, ex + lx * 5 - 2, ey + ly * 4 - 2.5, 2.2); ctx.fill();
      if (rage) { ctx.fillStyle = 'rgba(255,90,90,.22)'; circle(ctx, ex, ey, 14); ctx.fill(); }
    }
  }
  // brows
  if (!stunned && !dead) {
    ctx.strokeStyle = '#1f6a45'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    const k = rage ? 9 : 5;
    ctx.beginPath(); ctx.moveTo(-50, -100 + k * 0.2); ctx.lineTo(-20, -96 - 0 + k * 0.9 - 4); ctx.moveTo(50, -100 + k * 0.2); ctx.lineTo(20, -96 + k * 0.9 - 4); ctx.stroke();
  }
  // cheeks + mouth
  ctx.fillStyle = 'rgba(255,130,150,.45)'; circle(ctx, -46, -58, 7); ctx.fill(); circle(ctx, 46, -58, 7); ctx.fill();
  ctx.strokeStyle = '#1f6a45'; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
  const open = air || b.state === 'crouch' || dead;
  if (open) {
    ctx.fillStyle = '#25483a'; ctx.beginPath(); ctx.moveTo(-30, -56); ctx.quadraticCurveTo(0, -36, 30, -56); ctx.quadraticCurveTo(0, -62, -30, -56); ctx.fill();
    ctx.fillStyle = '#ff8fa6'; ell(ctx, 0, -48, 12, 4.5); ctx.fill();
  } else if (stunned) {
    ctx.beginPath(); ctx.moveTo(-14, -52); for (let i = 0; i <= 6; i++) ctx.lineTo(-14 + i * 4.7, -52 + (i % 2 ? -3 : 3)); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.moveTo(-32, -56); ctx.quadraticCurveTo(0, rage ? -48 : -40, 32, -56); ctx.stroke();
  }
  // lily-pad hat + flower
  const hb = Math.sin(t * 2.2) * 1.2;
  ctx.save(); ctx.translate(2, -101 + hb); ctx.rotate(-0.12);
  ctx.fillStyle = '#4fd36b'; ell(ctx, 0, 0, 27, 8); ctx.fill();
  ctx.fillStyle = '#8af19a'; ell(ctx, -4, -1.5, 18, 4.5); ctx.fill();
  ctx.fillStyle = body; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(22, -6); ctx.lineTo(24, 2); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ff8fb1'; for (let i = 0; i < 5; i++) { ctx.save(); ctx.translate(-6, -8); ctx.rotate(i * 1.2566); ell(ctx, 0, -4.5, 3, 5); ctx.fill(); ctx.restore(); }
  ctx.fillStyle = '#ffe27a'; circle(ctx, -6, -8, 2.6); ctx.fill();
  ctx.restore();
  // dizzy stars
  if (stunned) {
    for (let i = 0; i < 3; i++) {
      const ang = t * 4 + i * 2.094;
      ctx.fillStyle = '#ffe27a'; circle(ctx, Math.cos(ang) * 46, -122 + Math.sin(ang) * 9, 4); ctx.fill();
    }
  }
  ctx.restore();
}

function drawWave(ctx, wv, t) {
  const d = Math.sign(wv.vx) || 1, x = wv.x + wv.w / 2, y = wv.y + wv.h;
  ctx.save(); ctx.translate(x, y); ctx.scale(d, 1);
  ctx.fillStyle = '#58d6d0';
  ctx.beginPath(); ctx.moveTo(-15, 0); ctx.quadraticCurveTo(-14, -10, -2, -16); ctx.quadraticCurveTo(10, -26, 17, -22); ctx.quadraticCurveTo(10, -18, 14, -9); ctx.quadraticCurveTo(15, -3, 15, 0); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#bff7f1'; ctx.beginPath(); ctx.moveTo(-8, -2); ctx.quadraticCurveTo(-6, -10, 3, -14); ctx.quadraticCurveTo(0, -8, 2, -2); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ffffff'; circle(ctx, 18 + Math.sin(t * 20) * 1.5, -24, 2.2); ctx.fill(); circle(ctx, 8, -27, 1.6); ctx.fill();
  ctx.restore();
}

function drawReeds(ctx, x, t) {
  ctx.strokeStyle = '#1b5a58'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  for (let i = 0; i < 4; i++) {
    const h = 70 + hash(x + i) * 60, sw = Math.sin(t * 1.4 + i + x) * 4, bx = x + i * 10 - 15;
    ctx.beginPath(); ctx.moveTo(bx, 10 * TILE); ctx.quadraticCurveTo(bx + sw * 0.5, 10 * TILE - h * 0.5, bx + sw, 10 * TILE - h); ctx.stroke();
    if (i % 2 === 0) { ctx.fillStyle = '#6b4a3a'; rr(ctx, bx + sw - 3.5, 10 * TILE - h - 16, 7, 18, 3.5); ctx.fill(); }
  }
}

// ───────────────────────── scene ─────────────────────────
export function drawWorld(ctx, w, t, opts = {}) {
  const th = THEMES[w.level.theme];
  drawBackground(ctx, th, w.cam, t);
  ctx.save();
  const sh = (w.shake || 0) ** 2;
  ctx.translate(-Math.round(w.cam) + Math.sin(t * 93) * sh * 8, Math.cos(t * 77) * sh * 6);
  const c0 = Math.max(0, Math.floor(w.cam / TILE) - 1), c1 = Math.min(w.cols - 1, Math.floor((w.cam + VW) / TILE) + 1);
  const vis = o => o.x + (o.w || 0) > w.cam - 80 && o.x < w.cam + VW + 80;

  if (w.level.arena) { drawReeds(ctx, 40, t); drawReeds(ctx, w.cols * TILE - 70, t); }
  else { drawDoor(ctx, th, w); drawPole(ctx, th, w, t); }
  for (const post of w.posts) if (vis(post)) drawPost(ctx, post, t);

  for (const it of w.items) if (vis(it)) drawAcorn(ctx, it, t);
  for (let r = 0; r < ROWS; r++) for (let c = c0; c <= c1; c++) drawTile(ctx, w, th, c, r, t);

  for (const c of w.pickups) if (!c.got && vis(c)) drawCoin(ctx, c.x, c.y + Math.sin(t * 3 + c.ph) * 2.5, t * 3.2 + c.ph);
  for (const c of w.pops) drawCoin(ctx, c.x, c.y, t * 20, Math.max(0, 1 - c.t * 1.6));

  for (const e of w.enemies) {
    if (!vis(e)) continue;
    if (e.type === 'beetle') drawBeetle(ctx, e, th, t);
    else if (e.type === 'ghost') drawGhost(ctx, e, t, w);
    else if (e.type === 'burr') drawBurr(ctx, e, t);
    else drawHopper(ctx, e, t);
  }

  if (w.boss) drawBoss(ctx, w.boss, w, t);
  for (const wv of w.waves) drawWave(ctx, wv, t);
  if (w.p.visible && !opts.hideHero) drawHero(ctx, w.p, t);

  for (const q of w.parts) {
    const a = Math.min(1, q.life * 3);
    ctx.globalAlpha = a;
    if (q.color === 'brick') { ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.rot); ctx.fillStyle = th.brick; rr(ctx, -q.size / 2, -q.size / 2, q.size, q.size, 2.5); ctx.fill(); ctx.restore(); }
    else if (q.color === 'star') { ctx.fillStyle = '#fff6b0'; circle(ctx, q.x, q.y, q.size * a); ctx.fill(); }
    else if (q.color === 'spark') { ctx.fillStyle = '#ffd54a'; circle(ctx, q.x, q.y, q.size * a); ctx.fill(); }
    else { ctx.fillStyle = th.night ? 'rgba(190,190,230,.7)' : 'rgba(255,255,255,.85)'; circle(ctx, q.x, q.y, q.size * (0.6 + q.life)); ctx.fill(); }
  }
  ctx.globalAlpha = 1;

  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `800 19px ${FONT}`;
  for (const tx of w.texts) {
    ctx.globalAlpha = Math.min(1, (0.9 - tx.t) * 3);
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillText(tx.txt, tx.x + 1, tx.y + 2);
    ctx.fillStyle = tx.color; ctx.fillText(tx.txt, tx.x, tx.y);
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  // soft vignette
  const vg = ctx.createRadialGradient(VW / 2, VH / 2, VH * 0.45, VW / 2, VH / 2, VW * 0.65);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, `rgba(10,10,40,${th.vig})`);
  ctx.fillStyle = vg; ctx.fillRect(0, 0, VW, VH);
}
