# Pip's Forest Run 3D

A small 3D platformer level (three.js r160, no build step). Floating islands, coins, beetles and
hoppers to stomp, a lantern checkpoint and a burrow at the end.

**Controls:** W A S D / arrows move · Space jump (hold for higher) · Shift run · mouse (click to capture) or Q / E camera · P pause · M mute.
On phones: left thumb = joystick (push all the way to run), right side drag = camera, Run / Jump buttons.

## Run it
three.js loads from a CDN (see the import map in `index.html`), so you only need a static server:

```
python3 -m http.server 8000   # then open http://localhost:8000/3d/
```

## Structure
- `js/level.js` – platform, coin, enemy, checkpoint and goal data
- `js/sim.js` – pure game logic (AABB collision, hero, enemies, hearts); no three.js, testable in Node
- `js/models.js` – procedural textures and models (Pip, beetle, hopper, trees, props)
- `js/view.js` – scene, lights, sky, camera, particles
- `js/input.js`, `js/audio.js`, `js/main.js` – controls, WebAudio synth, UI and game loop
