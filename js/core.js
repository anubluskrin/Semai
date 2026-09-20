/* ==========================================================
   CORE  -- storage, date utilities, app state, and the Habits
   data model. This module has no dependencies; almost every
   other module imports from it.
   ========================================================== */

/* ---------- Storage: thin localStorage wrapper ---------- */
export const Storage = {
  keys: {
    habits: 'habit-tracker-data-v2',
    theme: 'habit-tracker-theme-v1',
    winfx: 'habit-tracker-winfx-v2',
    bg: 'habit-tracker-bg-v1',
    customTheme: 'habit-tracker-custom-theme-v1'
  },
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (e) { console.error('Gagal memuat data:', key, e); return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch (e) { console.error('Gagal menyimpan data:', key, e); }
  },
  remove(key) { try { localStorage.removeItem(key); } catch (e) {} }
};

/* ---------- Date utilities ---------- */
export const DOW = ['min', 'sen', 'sel', 'rab', 'kam', 'jum', 'sab'];
export const MONTHS_ID = ['januari', 'februari', 'maret', 'april', 'mei', 'juni', 'juli', 'agustus', 'september', 'oktober', 'november', 'desember'];

export function fmtDate(y, m, d) { return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`; }
export function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
export function isCurrentRealMonth(y, m) { return y === REAL_YEAR && m === REAL_MONTH; }

export const now = new Date();
export const REAL_YEAR = now.getFullYear();
export const REAL_MONTH = now.getMonth();
export const REAL_TODAY = fmtDate(REAL_YEAR, REAL_MONTH, now.getDate());

export function getWeekStart(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() - dt.getDay()); // back to Sunday
  return dt;
}

/* ---------- App state (mutable, shared across modules) ---------- */
export const state = {
  viewYear: REAL_YEAR,
  viewMonth: REAL_MONTH,
  habits: Storage.get(Storage.keys.habits, []),
  allDoneNotified: false,   // transient (session-only) guard against re-firing the "all done" toast
  weeklyMetNotified: {}     // transient guard per habit id for the weekly-target toast
};

/* ---------- Habits: data model + weekly-target progress ---------- */
export const Habits = {
  save() { Storage.set(Storage.keys.habits, state.habits); },
  add(name, type, target) {
    state.habits.push({
      id: 'h_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      name,
      type: type === 'weekly' ? 'weekly' : 'daily',
      target: type === 'weekly' ? target : null,
      createdAt: REAL_TODAY,
      completions: {}
    });
    this.save();
  },
  remove(id) {
    state.habits = state.habits.filter(h => h.id !== id);
    this.save();
  },
  toggle(habit, dateStr) {
    if (habit.completions[dateStr]) delete habit.completions[dateStr];
    else habit.completions[dateStr] = true;
    this.save();
  },
  // days completed within the week that contains weekStartDate, capped at today
  countInWeek(habit, weekStartDate) {
    let count = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStartDate);
      d.setDate(d.getDate() + i);
      const ds = fmtDate(d.getFullYear(), d.getMonth(), d.getDate());
      if (ds > REAL_TODAY) break;
      if (habit.completions[ds]) count++;
    }
    return count;
  },
  weekProgress(habit) {
    return { done: this.countInWeek(habit, getWeekStart(REAL_TODAY)), target: habit.target };
  }
};
