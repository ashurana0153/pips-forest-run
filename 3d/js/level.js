// Level data for the 3D run. Units are metres, +y is up, the path leads towards -z.
// Hero reach (run): ~5 m across on the flat, ~4.4 m when rising 1 m, ~2 m up. Gaps below are kept to <= 3.5 m.

const P = (x, z, y, w, d, kind = 'island') => ({ x, z, y, w, d, kind });

export const LEVEL = {
  name: 'Sunny Meadow',
  start: { x: 0, y: 0, z: 2, yaw: Math.PI },
  plats: [
    P(0, 0, 0, 14, 14),            // 0 start island
    P(0, -12.5, 0.4, 5, 5, 'stone'),
    P(3, -19.5, 0.9, 4, 4, 'stone'),
    P(-0.5, -26, 1.4, 4, 4, 'stone'),
    P(0, -37, 1.4, 14, 12),        // 4 beetle meadow
    P(7, -47, 2.0, 3.2, 3.2, 'stone'),
    P(11, -52, 2.6, 3.2, 3.2, 'stone'),
    P(8, -70, 2.6, 12, 28),        // 7 checkpoint + hopper island
    P(2, -88, 3.4, 4, 4, 'stone'),
    P(-3.5, -92, 4.2, 4, 4, 'stone'),
    P(-9.5, -87, 5.0, 4, 4, 'stone'),
    P(-9.5, -80, 5.8, 4, 4, 'stone'),
    P(-9.5, -73, 6.4, 4, 4, 'stone'),
    P(-9.5, -62, 6.4, 14, 12),     // 13 goal island
  ],
  coins: [
    // start island
    ...[-3, -1.5, 0, 1.5, 3].map(x => ({ x, y: 0.7, z: -3 })),
    // over the first stepping stones
    { x: 0, y: 1.9, z: -9.8 }, { x: 0, y: 1.6, z: -12.5 }, { x: 1.4, y: 2.1, z: -16.2 }, { x: 3, y: 1.7, z: -19.5 },
    { x: 1.5, y: 2.3, z: -22.8 }, { x: -0.5, y: 2.2, z: -26 },
    // meadow
    ...[-4, -2, 0, 2, 4].map(x => ({ x, y: 2.1, z: -37 })),
    { x: 3, y: 3.2, z: -45 }, { x: 7, y: 3.4, z: -47 }, { x: 9, y: 3.7, z: -49.6 }, { x: 11, y: 4.0, z: -52 },
    // plaza
    ...[0, 1, 2, 3].map(i => ({ x: 8 + (i % 2 ? 1.5 : -1.5), y: 3.4, z: -63 - i * 2 })),
    ...[0, 1, 2].map(i => ({ x: 8, y: 3.4, z: -82 + i * 1.2 })),
    // spiral
    { x: 2, y: 4.5, z: -88 }, { x: -3.5, y: 5.4, z: -92 }, { x: -9.5, y: 6.2, z: -87 }, { x: -9.5, y: 7.0, z: -80 }, { x: -9.5, y: 7.6, z: -73 },
    // goal run-up
    ...[0, 1, 2].map(i => ({ x: -9.5, y: 7.4, z: -66 + i * 2 })),
  ],
  enemies: [
    { type: 'beetle', x: 0, z: -35, y: 1.4, ax: 1, az: 0, range: 4.5, dir: 1 },
    { type: 'beetle', x: 0, z: -39.5, y: 1.4, ax: 1, az: 0, range: 4.5, dir: -1 },
    { type: 'hopper', x: 6, z: -71, y: 2.6, plat: 7 },
    { type: 'hopper', x: 10.5, z: -78, y: 2.6, plat: 7 },
  ],
  checkpoints: [{ x: 8, y: 2.6, z: -60 }],
  goal: { x: -9.5, y: 6.4, z: -57.5 },
};

// Handy for the bot and the camera: the intended route, platform by platform.
export const ROUTE = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
