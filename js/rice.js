/* ==========================================================
   RICE  -- one-click theme+appearance presets, plus full-state
   export/import (like sharing dotfiles)
   ========================================================== */
import { Storage, state, Habits, REAL_TODAY } from './core.js';
import { THEMES, ThemeManager } from './themes.js';
import { WinFx } from './winfx.js';
import { Background } from './background.js';
import { renderAll } from './render.js';

export const Rice = (function () {
  const PRESETS = [
  { name: 'mono glass', desc: 'monokrom · blur tinggi', theme: 'mono', opacity: 70, blur: 18 },
  { name: 'phosphor', desc: 'terminal hijau · solid', theme: 'termgreen', opacity: 100, blur: 0 },
  { name: 'crt amber', desc: 'terminal amber · solid', theme: 'amber', opacity: 100, blur: 0 },
  { name: 'frost', desc: 'nord · lembut', theme: 'nord', opacity: 55, blur: 10 }
];

  function buildGrid() {
    const grid = document.getElementById('presetGrid');
    grid.innerHTML = PRESETS.map((p, i) => {
      const theme = THEMES[p.theme];
      const dots = ['--mauve', '--blue', '--teal', '--red'].map(v => `<span style="background:${theme.vars[v]}"></span>`).join('');
      return `<div class="preset-swatch" data-idx="${i}">
        <div class="preset-dots">${dots}</div>
        <div><div class="preset-name">${p.name}</div><div class="preset-desc">${p.desc}</div></div>
      </div>`;
    }).join('');
    grid.querySelectorAll('.preset-swatch').forEach(el => {
      el.addEventListener('click', () => applyPreset(PRESETS[Number(el.dataset.idx)]));
    });
  }

  function applyPreset(p) {
    ThemeManager.set(p.theme);
    WinFx.set(p.opacity, p.blur);
  }

  function exportRice() {
    const payload = {
      kind: 'habit-tracker-rice',
      version: 1,
      exportedAt: REAL_TODAY,
      theme: Storage.get(Storage.keys.theme, 'mono'),
      customThemeVars: Storage.get(Storage.keys.customTheme, null),
      winfx: WinFx.get(),
      background: Background.exportData(),
      habits: state.habits
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `habit-tracker-rice-${REAL_TODAY}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function importRice(file) {
    const reader = new FileReader();
    reader.onload = () => {
      let data;
      try { data = JSON.parse(reader.result); }
      catch (e) { alert('File tidak valid — bukan JSON rice yang benar.'); return; }

      if (data.habits) {
        const replace = confirm(`File ini berisi ${data.habits.length} kebiasaan. Timpa kebiasaan yang ada sekarang? (Batal = hanya terapkan tema/tampilan/latar, kebiasaan tidak diubah)`);
        if (replace) {
          state.habits = data.habits;
          Habits.save();
        }
      }
      if (data.customThemeVars) Storage.set(Storage.keys.customTheme, data.customThemeVars);
      if (data.theme) ThemeManager.set(data.theme);
      if (data.winfx) WinFx.set(data.winfx.opacity, data.winfx.blur);
      if (data.background) Background.importData(data.background);

      renderAll();
    };
    reader.onerror = () => alert('Gagal membaca file.');
    reader.readAsText(file);
  }

  document.getElementById('riceExportBtn').addEventListener('click', exportRice);
  document.getElementById('riceImportInput').addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) importRice(file);
    e.target.value = '';
  });

  function load() { buildGrid(); }
  return { load };
})();
