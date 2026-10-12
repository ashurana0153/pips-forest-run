// Procedural models and textures (no asset files): Pip the fox, beetle, hopper, coin, props.
import * as THREE from 'three';

export function mulberry32(a) { return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ───────────── textures ─────────────
function canvasTex(size, paint) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'); paint(g, size, mulberry32(size + 11));
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
const pick = (r, a) => a[Math.floor(r() * a.length)];

export function makeTextures() {
  const grass = canvasTex(256, (g, s, r) => {
    g.fillStyle = '#5ca847'; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 70; i++) { g.globalAlpha = 0.28; g.fillStyle = pick(r, ['#73bd57', '#4a9239', '#82c85f']); g.beginPath(); g.ellipse(r() * s, r() * s, 14 + r() * 40, 10 + r() * 30, r() * 3, 0, 7); g.fill(); }
    g.lineCap = 'round';
    for (let i = 0; i < 4200; i++) {
      g.globalAlpha = 0.35 + r() * 0.4; g.strokeStyle = pick(r, ['#8fd46a', '#6dbb4f', '#44862f', '#a3df78', '#3c7a2c']); g.lineWidth = 1 + r() * 1.2;
      const x = r() * s, y = r() * s, a = -Math.PI / 2 + (r() - 0.5) * 1.2, l = 3 + r() * 7;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
    }
  });
  const dirt = canvasTex(256, (g, s, r) => {
    g.fillStyle = '#7d5c40'; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 90; i++) { g.globalAlpha = 0.25; g.fillStyle = pick(r, ['#6a4b33', '#8c6a4b', '#5a3f2b']); g.beginPath(); g.ellipse(r() * s, r() * s, 10 + r() * 34, 6 + r() * 18, r() * 3, 0, 7); g.fill(); }
    for (let i = 0; i < 700; i++) { g.globalAlpha = 0.5; g.fillStyle = pick(r, ['#4b3523', '#a0805c', '#6f7068', '#3f2d1e']); g.beginPath(); g.ellipse(r() * s, r() * s, 1 + r() * 3, 1 + r() * 2.2, r() * 3, 0, 7); g.fill(); }
  });
  const rock = canvasTex(256, (g, s, r) => {
    g.fillStyle = '#8b8579'; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 80; i++) { g.globalAlpha = 0.22; g.fillStyle = pick(r, ['#6f6a60', '#a39c8d', '#5f5a52', '#9a8f7c']); g.beginPath(); g.ellipse(r() * s, r() * s, 12 + r() * 44, 5 + r() * 22, r() * 3, 0, 7); g.fill(); }
    g.globalAlpha = 0.35; g.strokeStyle = '#4e4a44'; g.lineWidth = 1.4;
    for (let i = 0; i < 30; i++) { g.beginPath(); const x = r() * s, y = r() * s; g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 60, y + (r() - 0.5) * 60); g.stroke(); }
  });
  const bark = canvasTex(128, (g, s, r) => {
    g.fillStyle = '#6e4b33'; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 260; i++) { g.globalAlpha = 0.4; g.strokeStyle = pick(r, ['#4e3322', '#855f42', '#3b271a']); g.lineWidth = 1 + r() * 2.5; const x = r() * s; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + (r() - 0.5) * 6, s); g.stroke(); }
  });
  return { grass, dirt, rock, bark };
}

export function softSprite(color = '255,255,255', size = 128) {
  const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d');
  const gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gr.addColorStop(0, `rgba(${color},1)`); gr.addColorStop(0.5, `rgba(${color},.55)`); gr.addColorStop(1, `rgba(${color},0)`);
  g.fillStyle = gr; g.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// ───────────── helpers ─────────────
const M = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0, ...o });
function mesh(geo, mat, x = 0, y = 0, z = 0, cast = true) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; return m; }
const sph = (r, ws = 20, hs = 14) => new THREE.SphereGeometry(r, ws, hs);

// ───────────── Pip the fox ─────────────
export function buildPip() {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const orange = M('#f08a32', { roughness: 0.62 }), dark = M('#6b3516', { roughness: 0.8 }), cream = M('#ffe6c4', { roughness: 0.75 }), ink = M('#1d1612', { roughness: 0.3 });
  // torso
  const torso = mesh(new THREE.CapsuleGeometry(0.2, 0.24, 8, 16), orange, 0, 0.36, 0); torso.rotation.x = Math.PI / 2; torso.scale.set(1, 1, 0.95); body.add(torso);
  const belly = mesh(sph(0.16), cream, 0, 0.3, 0.1); belly.scale.set(0.95, 0.85, 1.25); body.add(belly);
  // head
  const head = new THREE.Group(); head.position.set(0, 0.64, 0.3); body.add(head);
  const skull = mesh(sph(0.23, 28, 18), orange); skull.scale.set(1.08, 0.92, 1); head.add(skull);
  const cheekL = mesh(sph(0.12), cream, 0.1, -0.07, 0.1); cheekL.scale.set(1, 0.8, 1); head.add(cheekL);
  const cheekR = cheekL.clone(); cheekR.position.x = -0.1; head.add(cheekR);
  const snout = mesh(sph(0.1), cream, 0, -0.05, 0.19); snout.scale.set(0.9, 0.75, 1.2); head.add(snout);
  head.add(mesh(sph(0.04), ink, 0, -0.01, 0.31));
  for (const s of [-1, 1]) {
    head.add(mesh(sph(0.045, 14, 10), ink, s * 0.1, 0.05, 0.19));
    head.add(mesh(sph(0.015, 8, 6), M('#ffffff', { roughness: 0.2 }), s * 0.1 + 0.012, 0.068, 0.225, false));
    const ear = mesh(new THREE.ConeGeometry(0.1, 0.26, 12), orange, s * 0.13, 0.25, -0.02); ear.rotation.z = -s * 0.28; head.add(ear);
    const inner = mesh(new THREE.ConeGeometry(0.06, 0.18, 10), dark, s * 0.13, 0.24, 0.03); inner.rotation.z = -s * 0.28; head.add(inner);
    const blush = mesh(sph(0.03), M('#ff9a9a', { roughness: 0.9 }), s * 0.16, -0.04, 0.17, false); blush.scale.set(1, 0.7, 0.4); head.add(blush);
  }
  // tail
  const tail = new THREE.Group(); tail.position.set(0, 0.4, -0.28); body.add(tail);
  const tb = mesh(new THREE.ConeGeometry(0.15, 0.5, 14), orange, 0, 0.09, -0.23); tb.rotation.x = -1.2; tail.add(tb);
  const tip = mesh(sph(0.1), cream, 0, 0.21, -0.5); tip.scale.set(1, 1, 1.2); tail.add(tip);
  // legs (pivot at hip)
  const legs = [];
  for (const [x, z] of [[-0.11, 0.17], [0.11, 0.17], [-0.11, -0.17], [0.11, -0.17]]) {
    const piv = new THREE.Group(); piv.position.set(x, 0.2, z); body.add(piv);
    const l = mesh(new THREE.CapsuleGeometry(0.052, 0.12, 6, 10), dark, 0, -0.1, 0); piv.add(l);
    legs.push(piv);
  }
  return { root, body, head, tail, legs, flash: [torso, skull, tb] };
}

// ───────────── enemies ─────────────
export function buildBeetle() {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const shell = M('#2f8581', { roughness: 0.32, metalness: 0.15 }), cream = M('#f3dcc0', { roughness: 0.7 }), ink = M('#1d1612', { roughness: 0.3 }), legm = M('#244d56');
  const dome = mesh(new THREE.SphereGeometry(0.42, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2), shell, 0, 0.1, -0.04); dome.scale.set(1, 0.95, 1.15); body.add(dome);
  const gloss = mesh(new THREE.SphereGeometry(0.3, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2.4), M('#4bb5ae', { roughness: 0.25, metalness: 0.1 }), 0, 0.2, -0.1); gloss.scale.set(0.9, 0.9, 1.1); body.add(gloss);
  const line = mesh(new THREE.TorusGeometry(0.4, 0.012, 6, 28, Math.PI), legm, 0, 0.1, -0.04); line.rotation.y = Math.PI / 2; line.scale.set(1.15, 0.95, 1); body.add(line);
  const head = mesh(sph(0.21), cream, 0, 0.17, 0.4); head.scale.set(1.1, 0.8, 0.9); body.add(head);
  for (const s of [-1, 1]) {
    body.add(mesh(sph(0.045, 12, 8), ink, s * 0.09, 0.22, 0.56));
    body.add(mesh(sph(0.014, 8, 6), M('#fff', { roughness: 0.2 }), s * 0.09 + 0.01, 0.235, 0.595, false));
    const brow = mesh(new THREE.BoxGeometry(0.1, 0.022, 0.03), ink, s * 0.09, 0.285, 0.54); brow.rotation.z = s * 0.45; body.add(brow);
  }
  const legs = [];
  for (const [x, z] of [[-0.3, 0.2], [0.3, 0.2], [-0.34, 0], [0.34, 0], [-0.3, -0.22], [0.3, -0.22]]) {
    const l = mesh(new THREE.CapsuleGeometry(0.035, 0.1, 4, 8), legm, x, 0.07, z); l.rotation.z = Math.sign(x) * 0.7; body.add(l); legs.push(l);
  }
  return { root, body, legs };
}

export function buildHopper() {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const green = M('#6fcf55', { roughness: 0.5 }), light = M('#c4f5a8', { roughness: 0.6 }), dk = M('#4aa23a', { roughness: 0.6 }), ink = M('#1d1612', { roughness: 0.3 });
  const b = mesh(sph(0.38, 24, 16), green, 0, 0.34, 0); b.scale.set(1, 0.9, 1.05); body.add(b);
  const belly = mesh(sph(0.3, 18, 12), light, 0, 0.27, 0.1); belly.scale.set(0.9, 0.75, 0.9); body.add(belly);
  for (const s of [-1, 1]) {
    body.add(mesh(sph(0.13, 16, 12), green, s * 0.17, 0.66, 0.12));
    body.add(mesh(sph(0.095, 14, 10), M('#fff', { roughness: 0.25 }), s * 0.17, 0.68, 0.19));
    body.add(mesh(sph(0.05, 12, 8), ink, s * 0.17, 0.68, 0.27));
    const thigh = mesh(sph(0.15, 12, 8), dk, s * 0.3, 0.17, -0.12); thigh.scale.set(0.6, 1, 1.4); body.add(thigh);
    const paw = mesh(sph(0.1, 10, 8), dk, s * 0.28, 0.05, 0.18); paw.scale.set(1, 0.5, 1.4); body.add(paw);
  }
  const mouth = mesh(new THREE.TorusGeometry(0.1, 0.011, 6, 16, Math.PI), M('#2f7f2a'), 0, 0.46, 0.38); mouth.rotation.z = Math.PI; body.add(mouth);
  return { root, body };
}

// ───────────── props ─────────────
export function buildCoinGeometry() {
  const pts = [[0, 0.025], [0.19, 0.025], [0.2, 0.06], [0.29, 0.06], [0.3, 0.04], [0.3, -0.04], [0.29, -0.06], [0.2, -0.06], [0.19, -0.025], [0, -0.025]].map(([x, y]) => new THREE.Vector2(x, y));
  const g = new THREE.LatheGeometry(pts, 28); g.rotateX(Math.PI / 2); return g;
}

export function buildPost() {
  const g = new THREE.Group(), wood = M('#6d4c38', { roughness: 0.85 });
  g.add(mesh(new THREE.CylinderGeometry(0.07, 0.09, 1.7, 10), wood, 0, 0.85, 0));
  g.add(mesh(new THREE.BoxGeometry(0.7, 0.08, 0.08), wood, 0, 1.68, 0));
  const glass = new THREE.MeshStandardMaterial({ color: '#9aa5b6', roughness: 0.15, metalness: 0.1, emissive: '#000000' });
  const lamp = mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.3, 12), glass, 0, 1.5, 0); g.add(lamp);
  g.add(mesh(new THREE.ConeGeometry(0.2, 0.14, 12), wood, 0, 1.72, 0));
  const light = new THREE.PointLight('#ffd27a', 0, 7, 1.6); light.position.set(0, 1.5, 0); g.add(light);
  return { group: g, glass, light };
}

export function buildBurrow(tex) {
  const g = new THREE.Group();
  const grassMat = new THREE.MeshStandardMaterial({ map: tex.grass.clone(), roughness: 0.95 }); grassMat.map.repeat.set(3, 2); grassMat.map.needsUpdate = true;
  const mound = mesh(new THREE.SphereGeometry(2.1, 36, 18, 0, Math.PI * 2, 0, Math.PI / 2), grassMat, 0, 0, 0); mound.scale.set(1.25, 0.95, 1); g.add(mound);
  const dirt = M('#4a2f1d', { roughness: 1 });
  const door = mesh(new THREE.CircleGeometry(0.75, 28, 0, Math.PI), dirt, 0, 0.02, 1.0, false); door.scale.set(1, 1.15, 1); g.add(door);
  const glow = new THREE.MeshBasicMaterial({ color: '#ffcf6e', transparent: true, opacity: 0.85 });
  const inner = mesh(new THREE.CircleGeometry(0.5, 24, 0, Math.PI), glow, 0, 0.03, 1.02, false); inner.scale.set(1, 1.1, 1); g.add(inner);
  const frame = mesh(new THREE.TorusGeometry(0.78, 0.07, 8, 24, Math.PI), M('#8a6a52', { roughness: 0.9 }), 0, 0.02, 1.0); frame.scale.set(1, 1.15, 1); g.add(frame);
  const light = new THREE.PointLight('#ffcf6e', 4, 9, 1.5); light.position.set(0, 1.0, 1.6); g.add(light);
  return { group: g, glow, light };
}

function shaded(geo, lo = 0.5) {
  // soft top-lit gradient baked into vertex colours: reads as volume without extra lights
  const pa = geo.attributes.position, c = new Float32Array(pa.count * 3); let mn = 1e9, mx = -1e9;
  for (let i = 0; i < pa.count; i++) { mn = Math.min(mn, pa.getY(i)); mx = Math.max(mx, pa.getY(i)); }
  for (let i = 0; i < pa.count; i++) { const t = (pa.getY(i) - mn) / (mx - mn || 1), k = lo + (1 - lo) * Math.pow(t, 0.8); c[i * 3] = k; c[i * 3 + 1] = k; c[i * 3 + 2] = k; }
  geo.setAttribute('color', new THREE.BufferAttribute(c, 3)); return geo;
}
let treeGeo = null;
export function buildTree(tex, s, kind, r) {
  const g = new THREE.Group();
  if (!treeGeo) treeGeo = { trunk: new THREE.CylinderGeometry(0.16, 0.26, 1, 10), blob: shaded(new THREE.IcosahedronGeometry(1, 3), 0.42), cone: shaded(new THREE.ConeGeometry(1, 1.4, 20, 3), 0.5) };
  const bark = new THREE.MeshStandardMaterial({ map: tex.bark, roughness: 0.95 });
  const greens = ['#5aa84c', '#68b653', '#4a9a44', '#78c25c'].map(c => M(c, { roughness: 0.78, vertexColors: true }));
  if (kind === 'round') {
    const h = 1.6 * s; const t = mesh(treeGeo.trunk, bark, 0, h / 2, 0); t.scale.set(s, h, s); g.add(t);
    for (let i = 0; i < 6; i++) {
      const a = r() * 6.28, rad = i === 0 ? 0 : (0.55 + r() * 0.4) * s, b = mesh(treeGeo.blob, greens[Math.floor(r() * 4)], Math.cos(a) * rad, h + 0.6 * s + (i % 3) * 0.28 * s, Math.sin(a) * rad);
      const k = (i === 0 ? 1.15 : 0.8 + r() * 0.3) * s; b.scale.set(k, k * 0.85, k); g.add(b);
    }
  } else {
    const h = 1.2 * s; const t = mesh(treeGeo.trunk, bark, 0, h / 2, 0); t.scale.set(s * 0.8, h, s * 0.8); g.add(t);
    const dk = M('#2f7a46', { roughness: 0.85, vertexColors: true });
    for (let i = 0; i < 4; i++) { const c = mesh(treeGeo.cone, i % 2 ? greens[0] : dk, 0, h + 0.5 * s + i * 0.9 * s, 0); const k = (1.35 - i * 0.28) * s; c.scale.set(k, k * 0.9, k); g.add(c); }
  }
  return g;
}
