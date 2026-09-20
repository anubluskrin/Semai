/* ==========================================================
   THEMES  -- built-in colorschemes, the theme grid/switcher,
   and the "kustom" HSL color-wheel editor. ThemeManager and
   CustomTheme reference each other (grid needs to preview the
   custom colors; the wheel needs to refresh the grid) -- fine
   since both live in this module and only call each other from
   inside event handlers, well after both are fully defined.
   ========================================================== */
import { Storage } from './core.js';
import { WinFx } from './winfx.js';
import { renderChart } from './chart.js';

export const THEMES = {
  mocha: {
    name: 'catppuccin mocha', vars: {
      '--crust': '#11111b', '--mantle': '#181825', '--base': '#1e1e2e', '--surface0': '#313244', '--surface1': '#45475a',
      '--surface2': '#585b70', '--overlay0': '#6c7086', '--overlay1': '#7f849c', '--text': '#cdd6f4', '--subtext0': '#a6adc8',
      '--mauve': '#cba6f7', '--blue': '#89b4fa', '--sapphire': '#74c7ec', '--teal': '#94e2d5', '--green': '#a6e3a1',
      '--yellow': '#f9e2af', '--peach': '#fab387', '--red': '#f38ba8', '--pink': '#f5c2e7'
    }
  },
  nord: {
    name: 'nord', vars: {
      '--crust': '#242933', '--mantle': '#2e3440', '--base': '#3b4252', '--surface0': '#434c5e', '--surface1': '#4c566a',
      '--surface2': '#5e6779', '--overlay0': '#7b88a1', '--overlay1': '#8fbcbb', '--text': '#eceff4', '--subtext0': '#d8dee9',
      '--mauve': '#b48ead', '--blue': '#81a1c1', '--sapphire': '#88c0d0', '--teal': '#8fbcbb', '--green': '#a3be8c',
      '--yellow': '#ebcb8b', '--peach': '#d08770', '--red': '#bf616a', '--pink': '#b48ead'
    }
  },
  gruvbox: {
    name: 'gruvbox dark', vars: {
      '--crust': '#1d2021', '--mantle': '#282828', '--base': '#32302f', '--surface0': '#3c3836', '--surface1': '#504945',
      '--surface2': '#665c54', '--overlay0': '#7c6f64', '--overlay1': '#a89984', '--text': '#ebdbb2', '--subtext0': '#d5c4a1',
      '--mauve': '#d3869b', '--blue': '#83a598', '--sapphire': '#8ec07c', '--teal': '#8ec07c', '--green': '#b8bb26',
      '--yellow': '#fabd2f', '--peach': '#fe8019', '--red': '#fb4934', '--pink': '#d3869b'
    }
  },
  cyberpunk: {
    name: 'cyberpunk 2077', vars: {
      '--crust': '#050505', '--mantle': '#0d0d0d', '--base': '#131313', '--surface0': '#1c1c1c', '--surface1': '#282828',
      '--surface2': '#3a3a3a', '--overlay0': '#5a5a5a', '--overlay1': '#8a8a8a', '--text': '#f5f5f0', '--subtext0': '#cfcfc4',
      '--mauve': '#d6fc51', '--blue': '#00f0ff', '--sapphire': '#00c2d1', '--teal': '#00f0ff', '--green': '#39ff14',
      '--yellow': '#fcee0c', '--peach': '#ff6b35', '--red': '#ff003c', '--pink': '#fc28a8'
    }
  }
};

export const ThemeManager = (function () {
  function customVars() {
    return Storage.get(Storage.keys.customTheme, null) || { ...THEMES.mocha.vars };
  }

  function applyTheme(key) {
    const root = document.documentElement;
    const vars = key === 'custom' ? customVars() : (THEMES[key] || THEMES.mocha).vars;
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
    WinFx.apply();
    renderChart();
    document.getElementById('customEditor').style.display = key === 'custom' ? 'block' : 'none';
    if (key === 'custom') CustomTheme.refresh();
  }

  function buildGrid() {
    const grid = document.getElementById('themeGrid');
    const current = Storage.get(Storage.keys.theme, 'mocha');
    grid.innerHTML = '';
    Object.entries(THEMES).forEach(([key, theme]) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'theme-swatch' + (key === current ? ' active' : '');
      btn.dataset.key = key;
      const dotsHtml = ['--mauve', '--blue', '--teal', '--red'].map(v => `<span style="background:${theme.vars[v]}"></span>`).join('');
      btn.innerHTML = `<div class="swatch-dots">${dotsHtml}</div><span class="swatch-name">${theme.name}</span>`;
      btn.addEventListener('click', () => set(key));
      grid.appendChild(btn);
    });

    // "kustom" tile -- previews whatever the color wheel currently holds
    const cVars = customVars();
    const cBtn = document.createElement('button');
    cBtn.type = 'button';
    cBtn.className = 'theme-swatch' + (current === 'custom' ? ' active' : '');
    cBtn.dataset.key = 'custom';
    const cDots = ['--mauve', '--blue', '--teal', '--red'].map(v => `<span style="background:${cVars[v]}"></span>`).join('');
    cBtn.innerHTML = `<div class="swatch-dots">${cDots}</div><span class="swatch-name">🎨 kustom</span>`;
    cBtn.addEventListener('click', () => set('custom'));
    grid.appendChild(cBtn);
  }

  function set(key) {
    if (key !== 'custom' && !THEMES[key]) return;
    Storage.set(Storage.keys.theme, key);
    document.querySelectorAll('.theme-swatch').forEach(el => el.classList.toggle('active', el.dataset.key === key));
    applyTheme(key);
  }

  function load() {
    buildGrid();
    applyTheme(Storage.get(Storage.keys.theme, 'mocha'));
  }

  return { load, set, buildGrid };
})();

/* ==========================================================
   CUSTOM THEME  -- HSL color wheel for hand-picking accent colors,
   backing the "kustom" tile above
   ========================================================== */
export const CustomTheme = (function () {
  const ACCENTS = ['--mauve', '--blue', '--sapphire', '--teal', '--green', '--yellow', '--peach', '--red', '--pink'];
  const canvas = document.getElementById('colorWheelCanvas');
  const ctx = canvas.getContext('2d');
  const lightnessInput = document.getElementById('wheelLightness');
  const hexPreview = document.getElementById('wheelHexPreview');
  const targetLabel = document.getElementById('wheelTargetLabel');
  const swatchList = document.getElementById('customSwatchList');
  const resetBtn = document.getElementById('customResetBtn');
  let selectedKey = '--mauve';

  function hex2rgb(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const n = parseInt(hex, 16) || 0;
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }
  function rgb2hex(r, g, b) {
    return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  }
  function rgb2hsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h /= 6;
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
  }
  function hsl2rgb(h, s, l) {
    h /= 360; s /= 100; l /= 100;
    if (s === 0) { const v = l * 255; return { r: v, g: v, b: v }; }
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    return { r: hue2rgb(p, q, h + 1 / 3) * 255, g: hue2rgb(p, q, h) * 255, b: hue2rgb(p, q, h - 1 / 3) * 255 };
  }

  function defaultVars() { return { ...THEMES.mocha.vars }; }
  function getVars() { return Storage.get(Storage.keys.customTheme, null) || defaultVars(); }
  function saveVars(vars) { Storage.set(Storage.keys.customTheme, vars); }

  function drawWheel(lightness) {
    const w = canvas.width, h = canvas.height;
    const img = ctx.createImageData(w, h);
    const cx = w / 2, cy = h / 2, r = w / 2;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const dx = x - cx, dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const idx = (y * w + x) * 4;
        if (dist > r) { img.data[idx + 3] = 0; continue; }
        let angle = Math.atan2(dy, dx) * 180 / Math.PI;
        if (angle < 0) angle += 360;
        const sat = Math.min(100, (dist / r) * 100);
        const rgb = hsl2rgb(angle, sat, lightness);
        img.data[idx] = rgb.r; img.data[idx + 1] = rgb.g; img.data[idx + 2] = rgb.b; img.data[idx + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  function buildSwatchList() {
    const vars = getVars();
    swatchList.innerHTML = ACCENTS.map(k =>
      `<button type="button" class="accent-swatch${k === selectedKey ? ' sel' : ''}" data-key="${k}" style="background:${vars[k]}" title="${k}"></button>`
    ).join('');
    swatchList.querySelectorAll('.accent-swatch').forEach(btn => {
      btn.addEventListener('click', () => selectKey(btn.dataset.key));
    });
  }

  function selectKey(key) {
    selectedKey = key;
    const hex = getVars()[key];
    targetLabel.textContent = '$' + key.replace('--', '');
    hexPreview.textContent = hex;
    const rgb = hex2rgb(hex);
    const hsl = rgb2hsl(rgb.r, rgb.g, rgb.b);
    lightnessInput.value = Math.round(hsl.l);
    drawWheel(Number(lightnessInput.value));
    buildSwatchList();
  }

  function commitColor(hex) {
    const vars = getVars();
    vars[selectedKey] = hex;
    saveVars(vars);
    document.documentElement.style.setProperty(selectedKey, hex);
    hexPreview.textContent = hex;
    buildSwatchList();
    ThemeManager.buildGrid();
    renderChart();
  }

  function colorFromPointer(evt) {
    const rect = canvas.getBoundingClientRect();
    const x = (evt.clientX - rect.left) * (canvas.width / rect.width);
    const y = (evt.clientY - rect.top) * (canvas.height / rect.height);
    const cx = canvas.width / 2, cy = canvas.height / 2, r = canvas.width / 2;
    const dx = x - cx, dy = y - cy;
    const dist = Math.min(r, Math.sqrt(dx * dx + dy * dy));
    let angle = Math.atan2(dy, dx) * 180 / Math.PI;
    if (angle < 0) angle += 360;
    const sat = (dist / r) * 100;
    const rgb = hsl2rgb(angle, sat, Number(lightnessInput.value));
    return rgb2hex(rgb.r, rgb.g, rgb.b);
  }

  let dragging = false;
  canvas.addEventListener('pointerdown', e => { dragging = true; commitColor(colorFromPointer(e)); });
  window.addEventListener('pointermove', e => { if (dragging) commitColor(colorFromPointer(e)); });
  window.addEventListener('pointerup', () => { dragging = false; });

  lightnessInput.addEventListener('input', () => {
    const l = Number(lightnessInput.value);
    drawWheel(l);
    const rgb = hex2rgb(getVars()[selectedKey]);
    const hsl = rgb2hsl(rgb.r, rgb.g, rgb.b);
    const newRgb = hsl2rgb(hsl.h, hsl.s, l);
    commitColor(rgb2hex(newRgb.r, newRgb.g, newRgb.b));
  });

  resetBtn.addEventListener('click', () => {
    const fresh = defaultVars();
    saveVars(fresh);
    Object.entries(fresh).forEach(([k, v]) => document.documentElement.style.setProperty(k, v));
    selectKey(selectedKey);
    ThemeManager.buildGrid();
    renderChart();
  });

  // called by ThemeManager whenever the "kustom" tile becomes active
  function refresh() {
    buildSwatchList();
    selectKey(selectedKey);
  }

  return { refresh };
})();
