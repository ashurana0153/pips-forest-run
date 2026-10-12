# Pip's Forest Run (working title)

A cozy side-scrolling platformer for the browser. Run, jump, bounce on beetles, smash bricks,
grab acorns and find the burrow at the end of each level. Original characters and world,
flat-vector art, no build step, no dependencies.

**Levels:** Sunny Meadow · Mossy Canopy · Twilight Grove · Boss Arena

**Dangers:** beetles and hoppers (stomp them), burrs (spiky, jump over), night ghosts (they freeze while you face them and creep up when you look away), and the Big Frog boss (stomp it three times, jump its shockwaves).

**Controls:** ← → / A D move · Space / ↑ / W / Z jump (hold for a higher jump) · Shift / X run · P pause · M mute.
On phones turn the device sideways: on-screen d-pad, Run and Jump buttons appear.

**3D version:** a first small 3D level lives in [`3d/`](3d/README.md).

## Run it
Any static server works (ES modules need http, not file://):

```
python3 -m http.server 8000   # then open http://localhost:8000
```

## Structure
- `js/levels.js` – tile DSL, the three levels and the boss arena
- `js/world.js` – physics, blocks, enemies, items, checkpoint, flag (pure logic, no DOM)
- `js/render.js` – flat-vector renderer (parallax themes, tiles, hero, enemies)
- `js/audio.js` – WebAudio synth sound effects and music
- `js/input.js` – keyboard and touch input
- `js/main.js` – menus, HUD, save/progress, game loop
