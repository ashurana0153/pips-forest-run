// Keyboard + touch input. `active` is toggled by main so menus keep normal key behaviour.
export const input = { left: false, right: false, jump: false, run: false, jumpEdge: false, active: false };
export const hooks = { pause: null, mute: null };

const KEYS = {
  ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
  Space: 'jump', ArrowUp: 'jump', KeyW: 'jump', KeyZ: 'jump',
  ShiftLeft: 'run', ShiftRight: 'run', KeyX: 'run',
};

function set(act, on) {
  if (act === 'jump' && on && !input.jump) input.jumpEdge = true;
  input[act] = on;
}

export function releaseAll() { input.left = input.right = input.jump = input.run = false; input.jumpEdge = false; }

addEventListener('keydown', e => {
  const k = KEYS[e.code];
  if (k && input.active) { e.preventDefault(); if (!e.repeat) set(k, true); return; }
  if (e.repeat) return;
  if (e.code === 'KeyP' || e.code === 'Escape') hooks.pause && hooks.pause();
  else if (e.code === 'KeyM') hooks.mute && hooks.mute();
});
addEventListener('keyup', e => { const k = KEYS[e.code]; if (k) set(k, false); });
addEventListener('blur', releaseAll);

export function bindTouch(root) {
  // d-pad: one surface, so sliding the thumb from left to right switches direction smoothly
  const pad = root.querySelector('[data-dpad]');
  if (pad) {
    const upd = e => {
      const r = pad.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      set('left', x < 0.46); set('right', x > 0.54);
      pad.dataset.dir = x < 0.46 ? 'l' : x > 0.54 ? 'r' : '';
    };
    pad.addEventListener('pointerdown', e => { e.preventDefault(); pad.setPointerCapture(e.pointerId); upd(e); });
    pad.addEventListener('pointermove', e => { if (pad.hasPointerCapture(e.pointerId)) upd(e); });
    const off = () => { set('left', false); set('right', false); pad.dataset.dir = ''; };
    pad.addEventListener('pointerup', off); pad.addEventListener('pointercancel', off); pad.addEventListener('lostpointercapture', off);
  }
  root.querySelectorAll('[data-act]').forEach(btn => {
    const act = btn.dataset.act;
    btn.addEventListener('pointerdown', e => { e.preventDefault(); btn.setPointerCapture(e.pointerId); set(act, true); btn.classList.add('on'); });
    const off = () => { set(act, false); btn.classList.remove('on'); };
    btn.addEventListener('pointerup', off); btn.addEventListener('pointercancel', off); btn.addEventListener('lostpointercapture', off);
  });
}
