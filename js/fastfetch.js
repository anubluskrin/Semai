/* ==========================================================
   FASTFETCH  -- neofetch/fastfetch-style stats panel,
   opened from the command palette
   ========================================================== */
import { state, Storage, REAL_YEAR, REAL_MONTH, REAL_TODAY, now, MONTHS_ID } from './core.js';
import { THEMES } from './themes.js';

export const Fastfetch = (function () {
  const overlay = document.getElementById('fetchOverlay');
  const box = document.getElementById('fetchBox');
  const ASCII = ' .oOo.\n(  ^  )\n \\_-_/\n  | |\n  |_|';

  function daysSince(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const then = new Date(y, m - 1, d);
    const diffMs = new Date(REAL_YEAR, REAL_MONTH, now.getDate()) - then;
    return Math.max(0, Math.round(diffMs / 86400000));
  }

  function render() {
    const total = state.habits.length;
    const doneToday = total ? state.habits.filter(h => h.completions[REAL_TODAY]).length : 0;
    const weeklyCount = state.habits.filter(h => h.type === 'weekly').length;
    const themeKey = Storage.get(Storage.keys.theme, 'mocha');
    const themeName = themeKey === 'custom' ? '🎨 kustom (color wheel)' : (THEMES[themeKey] || THEMES.mocha).name;
    const earliest = state.habits.reduce((min, h) => (h.createdAt && (!min || h.createdAt < min)) ? h.createdAt : min, null);
    const sejak = earliest ? `${daysSince(earliest)} hari lalu` : '-';

    const rows = [
      ['kebiasaan', `${total} total (${weeklyCount} mingguan)`],
      ['hari ini', `${doneToday}/${total} selesai`],
      ['tema', themeName],
      ['sejak', sejak],
      ['bulan aktif', `${MONTHS_ID[state.viewMonth]} ${state.viewYear}`],
      ['penyimpanan', 'localStorage (perangkat ini)']
    ];

    const swatchVars = ['--crust', '--red', '--green', '--yellow', '--blue', '--mauve', '--teal', '--text'];
    const swatches = swatchVars.map(v => `<span style="background:var(${v})"></span>`).join('');

    box.innerHTML = `
      <div class="fetch-head">
        <div class="fetch-ascii">${ASCII}</div>
        <div>
          <div class="fetch-id">pelacak@kebiasaan</div>
          <hr class="fetch-rule">
          ${rows.map(([k, v]) => `<div class="fetch-row"><span class="fetch-key">${k}</span><span class="fetch-val">${v}</span></div>`).join('')}
        </div>
      </div>
      <div class="fetch-swatches">${swatches}</div>
      <div class="fetch-hint"># klik di mana saja atau tekan esc untuk menutup</div>`;
  }

  function open() {
    render();
    overlay.style.display = 'flex';
  }
  function close() { overlay.style.display = 'none'; }
  function isOpen() { return overlay.style.display !== 'none'; }

  overlay.addEventListener('click', close);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && isOpen()) close(); });

  return { open, close, isOpen };
})();
