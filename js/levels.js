// Level data. Every level is 12 rows tall (12 * 45px = 540px, exactly one screen high).
// Ground surface is row 10, so the hero stands on row 9. Jump reach: ~3 tiles up, ~4 tiles
// across at walking speed, ~6 tiles across when sprinting.

export const TILE = 45;
export const ROWS = 12;
export const T = { AIR: 0, GROUND: 1, BRICK: 3, Q: 4, USED: 5, STONE: 6, LEAF: 7, LOG: 8 };

function make(def) {
  const cols = def.flag + 9;
  const tiles = Array.from({ length: ROWS }, () => new Uint8Array(cols));
  const L = {
    id: def.id, name: def.name, world: def.world, theme: def.theme, time: def.time,
    cols, tiles, contents: {}, enemies: [], coins: [], checkpoints: [],
    flag: def.flag, spawn: { c: 3, r: 9 },
  };
  const set = (c, r, t) => { if (c >= 0 && c < cols && r >= 0 && r < ROWS) tiles[r][c] = t; };
  const b = {
    ground(c0, c1) { for (let c = c0; c <= c1; c++) { set(c, 10, T.GROUND); set(c, 11, T.GROUND); } },
    plat(c, r, len, t = T.LEAF) { for (let i = 0; i < len; i++) set(c + i, r, t); },
    brick(c, r, hidden) { set(c, r, T.BRICK); if (hidden) L.contents[c + ',' + r] = hidden; },
    q(c, r, content = 'coin') { set(c, r, T.Q); L.contents[c + ',' + r] = content; },
    stack(c, h) { for (let i = 0; i < h; i++) set(c, 9 - i, T.STONE); },
    log(c, h) { for (let i = 0; i < h; i++) { set(c, 9 - i, T.LOG); set(c + 1, 9 - i, T.LOG); } },
    coin(c, r) { L.coins.push({ c, r }); },
    coinRow(c, r, n) { for (let i = 0; i < n; i++) L.coins.push({ c: c + i, r }); },
    arc(c, r, n) {
      for (let i = 0; i < n; i++) {
        const t = n === 1 ? 0.5 : i / (n - 1);
        L.coins.push({ c: c + i, r: r - Math.sin(t * Math.PI) * 1.3 });
      }
    },
    enemy(type, c, r = 9) { L.enemies.push({ type, c, r }); },
    check(c) { L.checkpoints.push({ c }); },
  };
  def.build(b);
  return L;
}

// ───────────────────────── 1 · Sunny Meadow (gentle, beetles only) ─────────────────────────
const meadow = make({
  id: 0, world: 1, name: 'Sunny Meadow', theme: 'meadow', time: 240, flag: 113,
  build(b) {
    b.ground(0, 40);
    b.q(12, 6, 'coin'); b.brick(13, 6); b.q(14, 6, 'acorn'); b.brick(15, 6); b.q(16, 6, 'coin');
    b.coinRow(19, 8, 3);
    b.enemy('beetle', 22);
    b.log(27, 2); b.coinRow(27, 7, 2);
    b.enemy('beetle', 33); b.enemy('beetle', 36);
    // gap 41-43
    b.arc(41, 8, 3);
    b.ground(44, 72);
    b.plat(47, 7, 3); b.coinRow(47, 6, 3);
    b.brick(52, 6); b.q(53, 6, 'coin'); b.brick(54, 6); b.q(55, 6, 'coin'); b.brick(56, 6);
    b.enemy('beetle', 51); b.enemy('beetle', 58); b.enemy('beetle', 61);
    b.stack(64, 1); b.stack(65, 2); b.stack(66, 3);
    b.enemy('beetle', 69);
    // gap 73-75
    b.arc(73, 8, 3);
    b.ground(76, 100);
    b.check(78);
    b.plat(80, 7, 3); b.coinRow(80, 6, 3);
    b.plat(84, 6, 3); b.coinRow(84, 5, 3);
    b.plat(88, 7, 3); b.coinRow(88, 6, 3);
    b.enemy('beetle', 86); b.enemy('beetle', 91);
    b.q(92, 6, 'coin'); b.brick(93, 6); b.q(94, 6, 'acorn'); b.brick(95, 6);
    // gap 101-103
    b.arc(101, 8, 3);
    b.ground(104, 121);
    b.stack(106, 1); b.stack(107, 2); b.stack(108, 3); b.stack(109, 4);
    b.coinRow(110, 5, 3);
  },
});

// ───────────────────────── 2 · Mossy Canopy (hoppers, bigger gaps) ─────────────────────────
const canopy = make({
  id: 1, world: 2, name: 'Mossy Canopy', theme: 'canopy', time: 260, flag: 139,
  build(b) {
    b.ground(0, 30);
    b.q(8, 6, 'coin'); b.q(9, 6, 'coin'); b.brick(11, 6); b.q(12, 6, 'acorn'); b.brick(13, 6);
    b.enemy('beetle', 16); b.enemy('hopper', 22);
    b.coinRow(18, 8, 4);
    // gap 31-34
    b.arc(31, 8, 4);
    b.ground(35, 60);
    b.plat(38, 7, 3); b.coinRow(38, 6, 3);
    b.plat(43, 6, 3); b.coinRow(43, 5, 3);
    b.plat(48, 7, 3); b.coinRow(48, 6, 3);
    b.enemy('hopper', 45); b.enemy('beetle', 52); b.enemy('beetle', 55);
    // gap 61-64
    b.plat(62, 7, 2); b.arc(61, 8, 4);
    b.ground(65, 100);
    b.check(67);
    b.brick(70, 6); b.q(71, 6, 'coin'); b.brick(72, 6); b.q(73, 6, 'acorn'); b.brick(74, 6);
    b.enemy('hopper', 77); b.enemy('beetle', 81);
    b.stack(84, 1); b.stack(85, 2); b.stack(86, 3);
    b.coinRow(89, 8, 4);
    b.enemy('hopper', 92); b.enemy('beetle', 96);
    b.plat(93, 7, 3); b.coinRow(93, 6, 3);
    // gap 101-105
    b.plat(103, 7, 2); b.arc(101, 8, 5);
    b.ground(106, 147);
    b.enemy('hopper', 110); b.enemy('beetle', 114); b.enemy('beetle', 117); b.enemy('hopper', 121);
    b.plat(112, 7, 3); b.coinRow(112, 6, 3);
    b.plat(118, 6, 3); b.coinRow(118, 5, 3);
    b.q(124, 6, 'coin'); b.brick(125, 6); b.q(126, 6, 'coin');
    b.log(128, 2);
    b.enemy('beetle', 124); b.enemy('hopper', 131);
    b.stack(133, 1); b.stack(134, 2); b.stack(135, 3); b.stack(136, 4);
  },
});

// ───────────────────────── 3 · Twilight Grove (burrs, sprint jumps) ─────────────────────────
const grove = make({
  id: 2, world: 3, name: 'Twilight Grove', theme: 'grove', time: 280, flag: 156,
  build(b) {
    b.ground(0, 24);
    b.q(9, 6, 'coin'); b.brick(10, 6); b.q(11, 6, 'acorn'); b.brick(12, 6);
    b.enemy('beetle', 15); b.enemy('hopper', 20);
    // gap 25-29 (five wide: needs a sprint jump)
    b.arc(25, 8, 5);
    b.ground(30, 52);
    b.enemy('burr', 34); b.enemy('beetle', 38); b.enemy('hopper', 42); b.enemy('burr', 50);
    b.plat(36, 7, 3); b.coinRow(36, 6, 3);
    b.plat(41, 6, 2); b.coinRow(41, 5, 2);
    // gap 53-56
    b.arc(53, 8, 4);
    b.ground(57, 80);
    b.check(59);
    b.brick(62, 6); b.q(63, 6, 'coin'); b.q(64, 6, 'acorn'); b.brick(65, 6);
    b.enemy('burr', 71); b.enemy('hopper', 74); b.enemy('beetle', 76);
    b.stack(78, 1); b.stack(79, 2); b.stack(80, 3);
    // gap 81-85 (five wide, with a small stepping stone)
    b.plat(83, 8, 1); b.arc(81, 8, 5);
    b.ground(86, 120);
    b.log(92, 2); b.log(98, 2); b.log(104, 3);
    b.enemy('burr', 95); b.enemy('hopper', 101); b.enemy('beetle', 108); b.enemy('burr', 112); b.enemy('hopper', 116);
    b.plat(93, 6, 3); b.coinRow(93, 5, 3);
    b.plat(110, 7, 3); b.coinRow(110, 6, 3);
    // gap 121-124
    b.arc(121, 8, 4);
    b.ground(125, 164);
    b.enemy('beetle', 128); b.enemy('hopper', 133); b.enemy('burr', 137); b.enemy('beetle', 141);
    b.q(130, 6, 'coin'); b.brick(131, 6); b.q(132, 6, 'coin');
    b.plat(138, 7, 3); b.coinRow(138, 6, 3);
    b.stack(148, 1); b.stack(149, 2); b.stack(150, 3); b.stack(151, 4);
  },
});

export const LEVELS = [meadow, canopy, grove];
