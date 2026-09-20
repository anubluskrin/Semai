/* ==========================================================
   COMMAND PALETTE  -- Ctrl+K / Cmd+K, rofi/wofi-style launcher
   ========================================================== */
import { state, Habits, REAL_TODAY, isCurrentRealMonth } from './core.js';
import { showTrackerTab, showSettingsTab, goPrevMonth, goNextMonth } from './navigation.js';
import { THEMES, ThemeManager } from './themes.js';
import { Fastfetch } from './fastfetch.js';
import { renderAll } from './render.js';
import { checkNotifications } from './notify.js';

export const CommandPalette = (function () {
  const overlay = document.getElementById('cmdOverlay');
  const input = document.getElementById('cmdInput');
  const list = document.getElementById('cmdList');
  let items = [];   // filtered command list currently shown
  let selIndex = 0;

  function buildCommands() {
    const cmds = [];

    cmds.push({ label: 'buka pelacak', tag: 'tampilan', run: showTrackerTab });
    cmds.push({ label: 'buka pengaturan', tag: 'tampilan', run: showSettingsTab });
    cmds.push({ label: 'bulan sebelumnya', tag: 'navigasi', run: goPrevMonth });
    if (!isCurrentRealMonth(state.viewYear, state.viewMonth)) {
      cmds.push({ label: 'bulan berikutnya', tag: 'navigasi', run: goNextMonth });
    }
    cmds.push({ label: 'reset tampilan jendela', tag: 'pengaturan', run: () => document.getElementById('winReset').click() });
    cmds.push({ label: 'fastfetch', tag: 'info', run: Fastfetch.open });
    cmds.push({ label: 'neofetch', tag: 'info', run: Fastfetch.open });
    cmds.push({ label: 'ekspor rice (.json)', tag: 'rice', run: () => document.getElementById('riceExportBtn').click() });

    Object.entries(THEMES).forEach(([key, theme]) => {
      cmds.push({ label: `tema: ${theme.name}`, tag: 'tema', run: () => ThemeManager.set(key) });
    });
    cmds.push({ label: 'tema: kustom (color wheel)', tag: 'tema', run: () => ThemeManager.set('custom') });

    state.habits.forEach(habit => {
      const done = !!habit.completions[REAL_TODAY];
      cmds.push({
        label: `${done ? 'batalkan' : 'tandai'} hari ini · ${habit.name}`,
        tag: 'kebiasaan',
        run: () => {
          Habits.toggle(habit, REAL_TODAY);
          renderAll();
          checkNotifications();
        }
      });
    });

    return cmds;
  }

  function render() {
    const query = input.value.trim().toLowerCase();
    const all = buildCommands();
    items = query ? all.filter(c => c.label.toLowerCase().includes(query)) : all;
    selIndex = 0;

    if (items.length === 0) {
      list.innerHTML = '<div class="cmd-empty"># tidak ada perintah yang cocok</div>';
      return;
    }
    list.innerHTML = items.map((c, i) =>
      `<div class="cmd-item${i === 0 ? ' sel' : ''}" data-idx="${i}">
         <span>${c.label}</span><span class="cmd-tag">${c.tag}</span>
       </div>`
    ).join('');
  }

  function highlight() {
    list.querySelectorAll('.cmd-item').forEach(el => {
      el.classList.toggle('sel', Number(el.dataset.idx) === selIndex);
    });
    const selEl = list.querySelector('.cmd-item.sel');
    if (selEl) selEl.scrollIntoView({ block: 'nearest' });
  }

  function runSelected() {
    const cmd = items[selIndex];
    if (!cmd) return;
    close();
    cmd.run();
  }

  function open() {
    overlay.style.display = 'flex';
    input.value = '';
    render();
    input.focus();
  }
  function close() {
    overlay.style.display = 'none';
  }
  function isOpen() { return overlay.style.display !== 'none'; }

  input.addEventListener('input', render);
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); selIndex = Math.min(items.length - 1, selIndex + 1); highlight(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); selIndex = Math.max(0, selIndex - 1); highlight(); }
    else if (e.key === 'Enter') { e.preventDefault(); runSelected(); }
    else if (e.key === 'Escape') { close(); }
  });
  list.addEventListener('click', e => {
    const el = e.target.closest('.cmd-item');
    if (!el) return;
    selIndex = Number(el.dataset.idx);
    runSelected();
  });
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  document.getElementById('cmdHint').addEventListener('click', open);
  document.getElementById('cmdHint').addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });

  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      isOpen() ? close() : open();
    }
  });

  return { open, close };
})();
