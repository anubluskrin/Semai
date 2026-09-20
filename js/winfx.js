/* ==========================================================
   WINDOW APPEARANCE -- opacity + blur only (radius & glow removed)
   ========================================================== */
import { Storage } from './core.js';

export const WinFx = (function () {
  const opacityInput = document.getElementById('winOpacity');
  const blurInput = document.getElementById('winBlur');
  const opacityVal = document.getElementById('winOpacityVal');
  const blurVal = document.getElementById('winBlurVal');

  function hexToRgb(hex) {
    hex = (hex || '').trim().replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const num = parseInt(hex, 16) || 0;
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
  }

  const CHART_OPACITY_FLOOR = 0.10; // chart card never fades past this, even if window opacity goes lower

  function apply() {
    const root = document.documentElement;
    const cs = getComputedStyle(root);
    const baseRgb = hexToRgb(cs.getPropertyValue('--base'));
    const mantleRgb = hexToRgb(cs.getPropertyValue('--mantle'));
    const opacity = opacityInput.value / 100;
    const blur = blurInput.value;
    const chartOpacity = Math.max(CHART_OPACITY_FLOOR, opacity);

    root.style.setProperty('--window-bg', `rgba(${baseRgb.r},${baseRgb.g},${baseRgb.b},${opacity})`);
    root.style.setProperty('--window-blur', `${blur}px`);
    root.style.setProperty('--chart-bg', `rgba(${mantleRgb.r},${mantleRgb.g},${mantleRgb.b},${chartOpacity})`);

    opacityVal.textContent = Math.round(opacity * 100) + '%';
    blurVal.textContent = blur + 'px';
  }

  function save() {
    Storage.set(Storage.keys.winfx, { opacity: opacityInput.value, blur: blurInput.value });
  }

  function load() {
    const d = Storage.get(Storage.keys.winfx, null);
    if (d) {
      if (d.opacity != null) opacityInput.value = d.opacity;
      if (d.blur != null) blurInput.value = d.blur;
    }
    apply();
  }

  function set(opacity, blur) {
    opacityInput.value = opacity;
    blurInput.value = blur;
    apply(); save();
  }

  function reset() { set(100, 0); }

  [opacityInput, blurInput].forEach(inp => inp.addEventListener('input', () => { apply(); save(); }));
  document.getElementById('winReset').addEventListener('click', reset);

  return { load, apply, set, get: () => ({ opacity: Number(opacityInput.value), blur: Number(blurInput.value) }) };
})();
