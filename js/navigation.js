/* ==========================================================
   NAVIGATION  -- add-habit form, month navigation, the
   tracker/settings panel switcher, and the waybar clock.
   ========================================================== */
import { state, Habits, isCurrentRealMonth } from './core.js';
import { renderAll } from './render.js';

/* ---------- Add habit ---------- */
function addHabitFromInput() {
  const input = document.getElementById('newHabitInput');
  const typeSelect = document.getElementById('newHabitType');
  const targetInput = document.getElementById('newHabitTarget');
  const name = input.value.trim();
  if (!name) return;
  const type = typeSelect.value;
  const target = Math.min(7, Math.max(1, parseInt(targetInput.value, 10) || 3));
  Habits.add(name, type, target);
  input.value = '';
  renderAll();
}

document.getElementById('addBtn').addEventListener('click', addHabitFromInput);
document.getElementById('newHabitInput').addEventListener('keydown', e => { if (e.key === 'Enter') addHabitFromInput(); });
document.getElementById('newHabitType').addEventListener('change', e => {
  document.getElementById('newHabitTarget').style.display = e.target.value === 'weekly' ? 'inline-block' : 'none';
});

/* ---------- Month navigation ---------- */
export function goPrevMonth() {
  state.viewMonth--; if (state.viewMonth < 0) { state.viewMonth = 11; state.viewYear--; }
  renderAll();
}
export function goNextMonth() {
  if (isCurrentRealMonth(state.viewYear, state.viewMonth)) return;
  state.viewMonth++; if (state.viewMonth > 11) { state.viewMonth = 0; state.viewYear++; }
  renderAll();
}
document.getElementById('prevMonth').addEventListener('click', goPrevMonth);
document.getElementById('nextMonth').addEventListener('click', goNextMonth);

/* ---------- Waybar clock ---------- */
function updateClock() {
  const d = new Date();
  const el = document.getElementById('waybarClock');
  if (el) el.textContent = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
updateClock();
setInterval(updateClock, 15000);

/* ==========================================================
   PANEL SWITCHER  -- settings is entered via the waybar gear
   icon instead of a second tab; titlebar path reflects section
   ========================================================== */
const panelTracker = document.getElementById('panelTracker');
const panelSettings = document.getElementById('panelSettings');
const gearBtn = document.getElementById('gearBtn');
const titlebarPath = document.getElementById('titlebarPath');

export function showTrackerTab() {
  panelTracker.style.display = 'block'; panelSettings.style.display = 'none';
  titlebarPath.textContent = '~/kebiasaan/tracker.sh';
  gearBtn.classList.remove('active');
}
export function showSettingsTab() {
  panelSettings.style.display = 'block'; panelTracker.style.display = 'none';
  titlebarPath.textContent = '~/kebiasaan/pengaturan.sh';
  gearBtn.classList.add('active');
}
gearBtn.addEventListener('click', () => {
  (panelSettings.style.display === 'block') ? showTrackerTab() : showSettingsTab();
});
document.getElementById('backToTracker').addEventListener('click', showTrackerTab);
