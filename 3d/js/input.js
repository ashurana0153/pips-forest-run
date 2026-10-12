// Keyboard, mouse-drag and touch (joystick + buttons) input for the 3D run.
export const inp = { mx: 0, my: 0, run: false, jump: false, jumpEdge: false, camDX: 0, camDY: 0, camKey: 0, camIdle: 0 };
export const hooks = { pause() {}, mute() {}, lockLost() {} };
let lockEl = null;
export function captureMouse() { try { const r = lockEl && lockEl.requestPointerLock && lockEl.requestPointerLock(); if (r && r.catch) r.catch(() => {}); } catch (e) {} }
const keys = new Set();
const stick = { id: null, ox: 0, oy: 0, x: 0, y: 0 }, look = { id: null, x: 0, y: 0 };
let btnRun = false;

function recompute() {
  let mx = 0, my = 0;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) mx -= 1;
  if (keys.has('KeyD') || keys.has('ArrowRight')) mx += 1;
  if (keys.has('KeyW') || keys.has('ArrowUp')) my += 1;
  if (keys.has('KeyS') || keys.has('ArrowDown')) my -= 1;
  const l = Math.hypot(mx, my); if (l > 1) { mx /= l; my /= l; }
  let sm = Math.hypot(stick.x, stick.y);
  if (stick.id !== null) { mx = stick.x; my = stick.y; }
  inp.mx = mx; inp.my = my;
  inp.run = keys.has('ShiftLeft') || keys.has('ShiftRight') || keys.has('KeyX') || btnRun || (stick.id !== null && sm > 0.92);
  inp.camKey = (keys.has('KeyE') ? 1 : 0) - (keys.has('KeyQ') ? 1 : 0);
}

export function releaseAll() { keys.clear(); stick.id = look.id = null; stick.x = stick.y = 0; btnRun = false; inp.jump = false; inp.mx = inp.my = 0; inp.run = false; paintStick(false); }

addEventListener('keydown', e => {
  if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
  if (e.repeat) return;
  if (e.code === 'Space' || e.code === 'KeyZ' || e.code === 'KeyK') { inp.jump = true; inp.jumpEdge = true; }
  else if (e.code === 'KeyP' || e.code === 'Escape') hooks.pause();
  else if (e.code === 'KeyM') hooks.mute();
  keys.add(e.code); recompute();
});
addEventListener('keyup', e => { if (e.code === 'Space' || e.code === 'KeyZ' || e.code === 'KeyK') inp.jump = false; keys.delete(e.code); recompute(); });
addEventListener('blur', releaseAll);

let knob, base;
function paintStick(on) {
  if (!base) return;
  base.style.opacity = on ? 1 : 0.0;
  if (on) { base.style.left = stick.ox + 'px'; base.style.top = stick.oy + 'px'; knob.style.transform = `translate(${stick.x * 44}px, ${-stick.y * 44}px)`; }
}

export function bindInput(canvasHost, touchEl) {
  base = touchEl.querySelector('.stick'); knob = touchEl.querySelector('.knob');
  const zone = touchEl.querySelector('.zone'); lockEl = zone;
  document.addEventListener('pointerlockchange', () => { if (document.pointerLockElement !== zone) hooks.lockLost(); });
  // mouse / touch-look and joystick share pointer events on the full-screen zone
  zone.addEventListener('pointerdown', e => {
    const r = zone.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    if (e.pointerType === 'mouse') { if (e.button === 0 || e.button === 2) { look.id = e.pointerId; look.x = e.clientX; look.y = e.clientY; zone.setPointerCapture(e.pointerId); } return; }
    if (x < r.width * 0.5 && stick.id === null) { stick.id = e.pointerId; stick.ox = x; stick.oy = y; stick.x = stick.y = 0; zone.setPointerCapture(e.pointerId); paintStick(true); recompute(); }
    else if (look.id === null) { look.id = e.pointerId; look.x = e.clientX; look.y = e.clientY; zone.setPointerCapture(e.pointerId); }
  });
  zone.addEventListener('pointermove', e => {
    if (e.pointerType === 'mouse' && document.pointerLockElement === zone) { inp.camDX += e.movementX; inp.camDY += e.movementY; return; }
    if (e.pointerId === stick.id) {
      const r = zone.getBoundingClientRect(); let dx = e.clientX - r.left - stick.ox, dy = e.clientY - r.top - stick.oy; const l = Math.hypot(dx, dy), R = 44;
      if (l > R) { dx = dx / l * R; dy = dy / l * R; }
      stick.x = dx / R; stick.y = -dy / R; paintStick(true); recompute();
    } else if (e.pointerId === look.id) {
      inp.camDX += e.clientX - look.x; inp.camDY += e.clientY - look.y; look.x = e.clientX; look.y = e.clientY; inp.camIdle = 0;
    }
  });
  const end = e => {
    if (e.pointerId === stick.id) { stick.id = null; stick.x = stick.y = 0; paintStick(false); recompute(); }
    if (e.pointerId === look.id) look.id = null;
  };
  zone.addEventListener('pointerup', end); zone.addEventListener('pointercancel', end);
  zone.addEventListener('contextmenu', e => e.preventDefault());
  const jb = touchEl.querySelector('[data-act=jump]'), rb = touchEl.querySelector('[data-act=run]');
  jb.addEventListener('pointerdown', e => { e.preventDefault(); jb.setPointerCapture(e.pointerId); inp.jump = true; inp.jumpEdge = true; jb.classList.add('on'); });
  const jup = () => { inp.jump = false; jb.classList.remove('on'); }; jb.addEventListener('pointerup', jup); jb.addEventListener('pointercancel', jup);
  rb.addEventListener('pointerdown', e => { e.preventDefault(); rb.setPointerCapture(e.pointerId); btnRun = true; rb.classList.add('on'); recompute(); });
  const rup = () => { btnRun = false; rb.classList.remove('on'); recompute(); }; rb.addEventListener('pointerup', rup); rb.addEventListener('pointercancel', rup);
}
