// three.js scene: floating-island forest, lighting, sky, characters, particles.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { HH } from './sim.js';
import { makeTextures, softSprite, mulberry32, buildPip, buildBeetle, buildHopper, buildCoinGeometry, buildPost, buildBurrow, buildTree } from './models.js';

const hash3 = (x, y, z) => { const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453; return s - Math.floor(s); };

export class View {
  constructor(canvas) {
    const r = this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.0; r.outputColorSpace = THREE.SRGBColorSpace;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(54, 16 / 9, 0.1, 700);
    this.tex = makeTextures();
    this.rnd = mulberry32(2024);
    this.t = 0;
    this.parts = [];
    this.buildEnvironment();
  }

  resize(w, h) { this.renderer.setSize(w, h, false); this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); }

  // ───────────── static world ─────────────
  buildEnvironment() {
    const sc = this.scene, FOG = new THREE.Color('#cfe5ee');
    sc.fog = new THREE.Fog(FOG, 55, 380);
    // sky dome
    const sky = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { top: { value: new THREE.Color('#4f9fe6') }, mid: { value: new THREE.Color('#a8d6f4') }, hor: { value: FOG }, sun: { value: new THREE.Vector3(0.45, 0.62, 0.64).normalize() } },
      vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'uniform vec3 top; uniform vec3 mid; uniform vec3 hor; uniform vec3 sun; varying vec3 vP; void main(){ float h = clamp(vP.y,0.0,1.0); vec3 c = mix(hor, mid, smoothstep(0.0,0.25,h)); c = mix(c, top, smoothstep(0.2,0.9,h)); float d = max(dot(normalize(vP), sun),0.0); c += vec3(1.0,0.88,0.6) * (pow(d,900.0)*1.6 + pow(d,12.0)*0.22); gl_FragColor = vec4(c,1.0);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n }',
    }));
    sky.renderOrder = -10; sc.add(sky); this.sky = sky;
    // lights
    sc.add(new THREE.HemisphereLight('#bfe3ff', '#7a8f5a', 0.85));
    const sun = this.sun = new THREE.DirectionalLight('#fff0d0', 3.3);
    sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    const sh = sun.shadow.camera; sh.left = -20; sh.right = 20; sh.top = 20; sh.bottom = -20; sh.near = 1; sh.far = 90;
    sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.04; sun.shadow.radius = 3;
    sc.add(sun, sun.target);
    // clouds
    const cloudTex = softSprite('255,255,255', 128); this.clouds = [];
    for (let i = 0; i < 14; i++) {
      const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTex, transparent: true, opacity: 0.55 + this.rnd() * 0.3, depthWrite: false, fog: false }));
      const a = this.rnd() * 6.28, d = 140 + this.rnd() * 120;
      m.position.set(Math.cos(a) * d, 45 + this.rnd() * 50, Math.sin(a) * d - 40); m.scale.set(70 + this.rnd() * 60, 22 + this.rnd() * 14, 1);
      sc.add(m); this.clouds.push(m);
    }
    // mist far below
    const mist = new THREE.Mesh(new THREE.CircleGeometry(700, 32), new THREE.MeshBasicMaterial({ color: FOG, fog: false }));
    mist.rotation.x = -Math.PI / 2; mist.position.y = -34; sc.add(mist);
    // a soft sea of clouds below the islands
    const seaTex = softSprite('255,255,255', 128);
    for (let i = 0; i < 46; i++) { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: seaTex, transparent: true, opacity: 0.5 + this.rnd() * 0.35, depthWrite: false, fog: false })); m.position.set((this.rnd() - 0.5) * 420, -26 + this.rnd() * 6, -60 + (this.rnd() - 0.5) * 420); m.scale.set(60 + this.rnd() * 50, 18 + this.rnd() * 10, 1); sc.add(m); }
    // pollen
    const n = 160, pos = new Float32Array(n * 3); this.pollen = { n, pos, seed: Array.from({ length: n }, () => [this.rnd(), this.rnd(), this.rnd()]) };
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.pollenPts = new THREE.Points(pg, new THREE.PointsMaterial({ size: 0.09, color: '#fff3b8', transparent: true, opacity: 0.75, depthWrite: false, map: softSprite('255,243,184', 32) }));
    this.pollenPts.frustumCulled = false; sc.add(this.pollenPts);
    // soft particle pool
    const pm = [new THREE.MeshBasicMaterial({ color: '#ffd54a', transparent: true }), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true })];
    // distant misty hills for depth
    const hillMat = [new THREE.MeshBasicMaterial({ color: '#8fb8b5' }), new THREE.MeshBasicMaterial({ color: '#a9cbc9' })];
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2 + this.rnd() * 0.2, d = 300 + this.rnd() * 60, h = 40 + this.rnd() * 70;
      const hill = new THREE.Mesh(new THREE.ConeGeometry(50 + this.rnd() * 50, h, 7, 1), hillMat[i % 2]);
      hill.position.set(Math.cos(a) * d, -34 + h / 2 - 6, Math.sin(a) * d - 40); hill.rotation.y = this.rnd() * 6; sc.add(hill);
    }
    // soft blob under Pip so landings are easy to judge in 3D
    this.blob = new THREE.Mesh(new THREE.CircleGeometry(0.5, 28), new THREE.MeshBasicMaterial({ color: '#10261a', transparent: true, opacity: 0.4, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
    this.blob.rotation.x = -Math.PI / 2; this.blob.renderOrder = 2; sc.add(this.blob);
    this.partPool = Array.from({ length: 70 }, (_, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), pm[i % 2].clone()); m.visible = false; sc.add(m); return { m, life: 0, vx: 0, vy: 0, vz: 0, max: 1 }; });
  }

  // ───────────── level ─────────────
  loadLevel(level) {
    const sc = this.scene, tex = this.tex, rnd = this.rnd;
    if (this.levelGroup) sc.remove(this.levelGroup);
    const grp = this.levelGroup = new THREE.Group(); sc.add(grp);
    const dirtMat = new THREE.MeshStandardMaterial({ map: tex.dirt, roughness: 1 });
    const rockMat = new THREE.MeshStandardMaterial({ map: tex.rock, roughness: 1, flatShading: true });
    const tufts = [], flowers = [];
    const addPlat = (p, far = false) => {
      const capH = 0.3, lipH = 1.1;
      const gm = new THREE.MeshStandardMaterial({ map: tex.grass.clone(), roughness: 0.95 }); gm.map.repeat.set(Math.max(1, p.w / 3), Math.max(1, p.d / 3)); gm.map.needsUpdate = true;
      const cap = new THREE.Mesh(new RoundedBoxGeometry(p.w, capH, p.d, 3, 0.12), gm); cap.position.set(p.x, p.y - capH / 2, p.z); cap.receiveShadow = true; cap.castShadow = true;
      const lip = new THREE.Mesh(new RoundedBoxGeometry(p.w - 0.18, lipH, p.d - 0.18, 3, 0.2), dirtMat); lip.position.set(p.x, p.y - capH - lipH / 2 + 0.06, p.z); lip.receiveShadow = true; lip.castShadow = true;
      const hgt = 2.3 + Math.min(p.w, p.d) * 0.5;
      const cg = new THREE.ConeGeometry(1, hgt, 9, 4); const pa = cg.attributes.position;
      for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i), k = (hash3(Math.round(x * 20), Math.round(y * 20), Math.round(z * 20)) - 0.5) * 0.28 * (y > -hgt / 2 + 0.05 ? 1 : 0.2); pa.setXYZ(i, x * (1 + k), y, z * (1 + k)); }
      cg.computeVertexNormals();
      const cone = new THREE.Mesh(cg, rockMat); cone.rotation.x = Math.PI; cone.scale.set(p.w * 0.5, 1, p.d * 0.5);
      cone.position.set(p.x, p.y - capH - lipH - hgt / 2 + 0.3, p.z); cone.receiveShadow = true; cone.castShadow = true;
      grp.add(cap, lip, cone);
      if (!far) {
        const vg = new THREE.CylinderGeometry(0.035, 0.012, 1, 5); vg.translate(0, -0.5, 0); const vm = new THREE.MeshStandardMaterial({ color: '#3f7f3a', roughness: 0.9 });
        const n = Math.floor((p.w + p.d) * 0.7);
        for (let i = 0; i < n; i++) {
          const e = Math.floor(rnd() * 4), t = (rnd() - 0.5) * 0.9, hx = e < 2 ? t * p.w : (e === 2 ? 1 : -1) * (p.w / 2 - 0.12), hz = e < 2 ? (e === 0 ? 1 : -1) * (p.d / 2 - 0.12) : t * p.d;
          const m = new THREE.Mesh(vg, vm); const len = 0.5 + rnd() * 1.6; m.scale.set(1, len, 1); m.position.set(p.x + hx, p.y - capH - 0.1, p.z + hz); m.castShadow = true; grp.add(m);
          const lf = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), vm); lf.scale.set(1.4, 0.5, 1); lf.position.set(p.x + hx, p.y - capH - 0.1 - len, p.z + hz); grp.add(lf);
        }
      }
      if (far) return;
      const area = p.w * p.d, nT = Math.min(220, Math.floor(area * 1.6));
      for (let i = 0; i < nT; i++) tufts.push([p.x + (rnd() - 0.5) * (p.w - 0.3), p.y, p.z + (rnd() - 0.5) * (p.d - 0.3), 0.7 + rnd() * 0.9, rnd()]);
      if (p.kind === 'island') for (let i = 0; i < Math.floor(area / 7); i++) flowers.push([p.x + (rnd() - 0.5) * (p.w - 0.8), p.y, p.z + (rnd() - 0.5) * (p.d - 0.8), Math.floor(rnd() * 4)]);
    };
    for (const p of level.plats) addPlat(p);

    // distant floating islands (decor only)
    const far = [[-34, -8, 8, 16, 12], [30, -4, 20, 20, 14], [-48, -14, -22, 22, 16], [42, 2, -40, 26, 18], [-36, 6, -64, 18, 14], [38, -12, -86, 24, 18], [-44, 10, -100, 24, 16], [8, -6, -126, 30, 20]];
    const treeSpots = [];
    for (const [x, y, z, w, d] of far) { addPlat({ x, y, z, w, d, kind: 'island' }, true); for (let i = 0; i < 5; i++) treeSpots.push([x + (rnd() - 0.5) * (w - 3), y, z + (rnd() - 0.5) * (d - 3), 1.2 + rnd() * 0.9]); }

    // instanced grass tufts
    const tg = new THREE.ConeGeometry(0.03, 0.2, 4); tg.translate(0, 0.1, 0);
    const tm = new THREE.InstancedMesh(tg, new THREE.MeshStandardMaterial({ color: '#7bc45a', roughness: 0.9 }), tufts.length); const dm = new THREE.Object3D(), col = new THREE.Color();
    tufts.forEach((t, i) => { dm.position.set(t[0], t[1] - 0.02, t[2]); dm.rotation.set((rnd() - 0.5) * 0.5, rnd() * 6, (rnd() - 0.5) * 0.5); dm.scale.setScalar(t[3]); dm.updateMatrix(); tm.setMatrixAt(i, dm.matrix); tm.setColorAt(i, col.setHSL(0.25 + t[4] * 0.07, 0.6, 0.42 + t[4] * 0.2)); });
    tm.instanceMatrix.needsUpdate = true; if (tm.instanceColor) tm.instanceColor.needsUpdate = true; tm.receiveShadow = true; grp.add(tm);
    // flowers
    const stemG = new THREE.CylinderGeometry(0.01, 0.01, 0.17, 5); stemG.translate(0, 0.085, 0);
    const stemM = new THREE.InstancedMesh(stemG, new THREE.MeshStandardMaterial({ color: '#4d9b3f' }), flowers.length);
    const headM = new THREE.InstancedMesh(new THREE.SphereGeometry(0.05, 10, 8), new THREE.MeshStandardMaterial({ roughness: 0.6 }), flowers.length);
    const fc = ['#ffffff', '#ffd54a', '#ff8fb1', '#b9a3ff'];
    flowers.forEach((f, i) => { dm.position.set(f[0], f[1], f[2]); dm.rotation.set(0, 0, 0); dm.scale.setScalar(1); dm.updateMatrix(); stemM.setMatrixAt(i, dm.matrix); dm.position.y += 0.18; dm.updateMatrix(); headM.setMatrixAt(i, dm.matrix); headM.setColorAt(i, col.set(fc[f[3]])); });
    grp.add(stemM, headM);

    // trees on the real islands (edges, so they never block the path) + far islands
    const spots = [];
    const side = (p, ox, oz, s, k) => spots.push([p.x + ox, p.y, p.z + oz, s, k]);
    const [s0, , , , m4, , , i7, , , , , , g13] = level.plats;
    side(s0, -5.4, -4.5, 1.25, 'round'); side(s0, 5.6, -5.2, 1.1, 'pine'); side(s0, -5.8, 4.4, 1.0, 'round'); side(s0, 5.5, 5, 1.2, 'pine');
    side(m4, -6.1, -3.5, 1.2, 'pine'); side(m4, 6.2, 4.4, 1.15, 'round'); side(m4, -6.0, 4.6, 0.95, 'round');
    for (let i = 0; i < 6; i++) side(i7, i % 2 ? 5.2 : -5.3, -12 + i * 4.6, 1.0 + (i % 3) * 0.18, i % 2 ? 'pine' : 'round');
    side(g13, -6, 4.8, 1.2, 'round'); side(g13, 6.2, 4.4, 1.1, 'pine'); side(g13, 6.2, -4.8, 1.25, 'round'); side(g13, -6.2, -4.6, 1.0, 'pine');
    for (const [x, y, z, s] of treeSpots) spots.push([x, y, z, s, rnd() > 0.5 ? 'round' : 'pine']);
    for (const [x, y, z, s, k] of spots) { const t = buildTree(tex, s, k, rnd); t.position.set(x, y, z); t.rotation.y = rnd() * 6; grp.add(t); }

    // rocks + mushrooms
    const rockG = new THREE.DodecahedronGeometry(0.4, 0), rockM = M3('#8b877c');
    for (const [pi, ox, oz, s] of [[0, 3.2, -2.5, 1], [0, -2.4, 3, 0.7], [4, 5.4, -2, 0.9], [7, -4.4, -18, 1.1], [7, 4.4, 8, 0.8], [13, 4.5, 2, 1], [13, -4.8, -3.2, 0.7]]) {
      const p = level.plats[pi], r = new THREE.Mesh(rockG, rockM); r.position.set(p.x + ox, p.y + 0.14 * s, p.z + oz); r.scale.set(s * 1.2, s * 0.8, s); r.rotation.set(rnd(), rnd() * 6, rnd()); r.castShadow = r.receiveShadow = true; grp.add(r);
    }
    const capG = new THREE.SphereGeometry(0.2, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), stG = new THREE.CylinderGeometry(0.05, 0.07, 0.2, 8);
    for (const [pi, ox, oz] of [[0, -4.5, -1.5], [4, -5, -4], [7, 4.6, -4], [13, 3, 4]]) {
      const p = level.plats[pi], m = new THREE.Group(); m.position.set(p.x + ox, p.y, p.z + oz);
      for (let i = 0; i < 3; i++) { const sc2 = 0.6 + i * 0.3, c = new THREE.Mesh(capG, M3(i % 2 ? '#e0524a' : '#d9503f')), st = new THREE.Mesh(stG, M3('#f3e6cf')); const g2 = new THREE.Group(); st.position.y = 0.1; c.position.y = 0.2; g2.add(st, c); g2.position.set(i * 0.28 - 0.2, 0, (i % 2) * 0.2); g2.scale.setScalar(sc2); c.castShadow = true; m.add(g2); }
      grp.add(m);
    }

    // coins
    this.coinGeo = buildCoinGeometry();
    this.coinMesh = new THREE.InstancedMesh(this.coinGeo, new THREE.MeshStandardMaterial({ color: '#ffc93a', metalness: 0.85, roughness: 0.28, emissive: '#6b4300', emissiveIntensity: 0.55 }), level.coins.length);
    this.coinMesh.castShadow = true; this.coinMesh.frustumCulled = false; grp.add(this.coinMesh);
    // checkpoint posts
    this.posts = level.checkpoints.map(c => { const p = buildPost(); p.group.position.set(c.x, c.y, c.z); grp.add(p.group); return p; });
    // burrow (door faces -z, towards the arrival route)
    const bu = this.burrow = buildBurrow(tex); bu.group.position.set(level.goal.x, level.goal.y, level.goal.z + 1.7); bu.group.rotation.y = Math.PI; grp.add(bu.group);

    // actors
    this.pip = buildPip(); this.pip.root.scale.setScalar(1.18); grp.add(this.pip.root);
    this.enemyViews = new Map();
  }

  addParticles(x, y, z, kind, n) {
    for (let i = 0; i < n; i++) {
      const p = this.partPool.find(q => q.life <= 0); if (!p) return;
      p.life = p.max = kind === 'coin' ? 0.55 : 0.5; p.m.visible = true; p.m.position.set(x, y, z);
      const a = Math.random() * 6.28, sp = kind === 'coin' ? 2.4 : 2.0; p.vx = Math.cos(a) * sp * Math.random(); p.vz = Math.sin(a) * sp * Math.random(); p.vy = kind === 'coin' ? 2 + Math.random() * 3 : 0.8 + Math.random() * 1.5;
      p.m.material.color.set(kind === 'coin' ? '#ffd54a' : '#fff7e6'); p.m.scale.setScalar(kind === 'coin' ? 1 : 1.5);
    }
  }

  handle(ev) {
    if (ev.type === 'coin') this.addParticles(ev.x, ev.y, ev.z, 'coin', 8);
    else if (ev.type === 'stomp') this.addParticles(ev.x, ev.y, ev.z, 'dust', 10);
    else if (ev.type === 'jump' || ev.type === 'land') this.addParticles(this.sim.p.x, this.sim.p.y + 0.05, this.sim.p.z, 'dust', ev.type === 'jump' ? 4 : 5);
    else if (ev.type === 'checkpoint') for (const p of this.posts) { /* lit by sim state */ }
  }

  // ───────────── per-frame sync ─────────────
  sync(sim, dt) {
    this.sim = sim; this.t += dt; const t = this.t, p = sim.p;
    // coins
    const dm = this._dm || (this._dm = new THREE.Object3D());
    sim.coins.forEach((c, i) => {
      dm.position.set(c.x, c.y + Math.sin(t * 2.4 + i) * 0.06, c.z); dm.rotation.set(0, t * 2.8 + i * 0.7, 0); dm.scale.setScalar(c.got ? 0.0001 : 1); dm.updateMatrix(); this.coinMesh.setMatrixAt(i, dm.matrix);
    });
    this.coinMesh.instanceMatrix.needsUpdate = true;
    // posts
    sim.posts.forEach((c, i) => { const v = this.posts[i]; const on = c.on; v.glass.emissive.set(on ? '#ffb73a' : '#000000'); v.glass.emissiveIntensity = on ? 1.6 + Math.sin(t * 6) * 0.2 : 0; v.glass.color.set(on ? '#ffe6a8' : '#9aa5b6'); v.light.intensity += ((on ? 6 : 0) - v.light.intensity) * Math.min(1, dt * 5); });
    this.burrow.glow.opacity = 0.7 + Math.sin(t * 3) * 0.15;
    // Pip
    const pip = this.pip, air = !p.onGround && p.state === 'play', sp = Math.hypot(p.vx, p.vz);
    pip.root.position.set(p.x, p.y, p.z);
    let da = p.yaw - pip.root.rotation.y; da = Math.atan2(Math.sin(da), Math.cos(da)); pip.root.rotation.y += da * Math.min(1, dt * 14);
    const sq = p.squash;
    pip.body.scale.set(1 + sq * 0.5, 1 - sq, 1 + sq * 0.5);
    const swing = air ? 0 : Math.sin(p.anim * 1.5) * Math.min(1, sp / 3) * 0.9;
    pip.legs.forEach((l, i) => { l.rotation.x = air ? (i < 2 ? -0.7 : 0.8) : swing * (i % 2 === (i < 2 ? 0 : 1) ? 1 : -1); });
    pip.body.position.y = air ? 0 : Math.abs(Math.sin(p.anim * 1.5)) * Math.min(1, sp / 3) * 0.045;
    pip.tail.rotation.y = Math.sin(t * 4 + p.anim) * (0.25 + Math.min(1, sp / 5) * 0.2); pip.tail.rotation.x = air ? -0.35 : 0;
    pip.head.rotation.x = air && p.vy > 0 ? -0.18 : air ? 0.12 : 0;
    pip.root.visible = !(p.invuln > 0 && Math.floor(t * 18) % 2) || p.state !== 'play';
    if (p.state === 'dying') { pip.root.rotation.z += dt * 6; pip.root.visible = true; } else pip.root.rotation.z = 0;
    // blob shadow on the highest surface below Pip
    let ys = -1e3; for (const b of sim.boxes) if (p.x > b.x0 - 0.15 && p.x < b.x1 + 0.15 && p.z > b.z0 - 0.15 && p.z < b.z1 + 0.15 && b.y1 <= p.y + 0.4 && b.y1 > ys) ys = b.y1;
    if (ys > -1e3 && p.state !== 'dying') { const hgt = Math.max(0, p.y - ys), k = Math.max(0.35, 1 - hgt / 7); this.blob.visible = true; this.blob.position.set(p.x, ys + 0.03, p.z); this.blob.scale.setScalar(k * 1.05); this.blob.material.opacity = 0.42 * k; } else this.blob.visible = false;
    // enemies
    const seen = new Set();
    for (const e of sim.enemies) {
      seen.add(e); let v = this.enemyViews.get(e);
      if (!v) { v = e.type === 'beetle' ? buildBeetle() : buildHopper(); this.levelGroup.add(v.root); this.enemyViews.set(e, v); }
      v.root.position.set(e.x, e.y, e.z);
      let d2 = e.yaw - v.root.rotation.y; d2 = Math.atan2(Math.sin(d2), Math.cos(d2)); v.root.rotation.y += d2 * Math.min(1, dt * 10);
      if (e.state === 'squash') v.body.scale.set(1.3, 0.18, 1.3);
      else if (e.type === 'beetle') { v.body.scale.set(1, 1, 1); v.legs.forEach((l, i) => { l.rotation.x = Math.sin(e.anim * 9 + i * 1.7) * 0.5; }); v.body.rotation.z = Math.sin(e.anim * 9) * 0.03; }
      else { const st = Math.max(-0.25, Math.min(0.3, e.vy * 0.035)); const rest = e.y <= e.y0 + 0.001 ? 1 - 0.1 * Math.max(0, Math.sin(e.anim * 7)) * (e.hop < 0.35 ? 1 : 0.3) : 1; v.body.scale.set(1 - st * 0.5, rest + st, 1 - st * 0.5); }
    }
    for (const [e, v] of this.enemyViews) if (!seen.has(e)) { this.levelGroup.remove(v.root); this.enemyViews.delete(e); }
    // particles
    for (const q of this.partPool) {
      if (q.life <= 0) continue; q.life -= dt; if (q.life <= 0) { q.m.visible = false; continue; }
      q.vy -= 9 * dt; q.m.position.x += q.vx * dt; q.m.position.y += q.vy * dt; q.m.position.z += q.vz * dt; q.m.material.opacity = Math.min(1, q.life / q.max * 1.4);
    }
    // pollen + clouds
    const pl = this.pollen, pa = this.pollenPts.geometry.attributes.position;
    for (let i = 0; i < pl.n; i++) { const s = pl.seed[i]; pa.setXYZ(i, p.x + (((s[0] * 40 + t * 0.4 * (s[2] - 0.3)) % 40) - 20), p.y + 0.3 + ((s[1] * 9 + t * 0.25 * (0.4 + s[0])) % 9), p.z + (((s[2] * 40 + t * 0.3 * (s[1] - 0.5)) % 40) - 20)); }
    pa.needsUpdate = true;
    for (const c of this.clouds) { c.position.x += dt * 0.8; if (c.position.x > 260) c.position.x = -260; }
    // sun follows the hero so shadows stay crisp
    const tx = Math.round(p.x), ty = Math.round(p.y), tz = Math.round(p.z);
    this.sun.position.set(tx + 14, ty + 26, tz + 11); this.sun.target.position.set(tx, ty, tz); this.sun.target.updateMatrixWorld();
  }

  setCamera(target, yaw, pitch, dist, dt, snap) {
    const cx = target.x + Math.sin(yaw) * Math.cos(pitch) * dist, cz = target.z + Math.cos(yaw) * Math.cos(pitch) * dist, cy = target.y + 1.1 + Math.sin(pitch) * dist;
    const c = this.camera;
    if (snap) c.position.set(cx, cy, cz); else c.position.lerp(new THREE.Vector3(cx, cy, cz), Math.min(1, dt * 14));
    c.lookAt(target.x, target.y + 1.15, target.z);
  }

  render() { this.renderer.render(this.scene, this.camera); }
}

function M3(color) { return new THREE.MeshStandardMaterial({ color, roughness: 0.85, flatShading: true }); }
