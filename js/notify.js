/* ==========================================================
   NOTIFY  -- toast notifications styled after dunst/mako
   ========================================================== */
import { state, Habits, REAL_TODAY } from './core.js';

export const Notify = (function () {
  const stack = document.getElementById('toastStack');
  function push(title, body) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `<div class="toast-app">habit-tracker</div><div class="toast-title">${title}</div>${body ? `<div class="toast-body">${body}</div>` : ''}`;
    stack.appendChild(el);
    setTimeout(() => {
      el.classList.add('leaving');
      setTimeout(() => el.remove(), 220);
    }, 4200);
  }
  return { push };
})();

// fires toasts when a full day is completed or a weekly target is hit --
// called after every habit toggle, guards against re-firing every click
export function checkNotifications() {
  const total = state.habits.length;
  if (total === 0) return;

  const doneToday = state.habits.filter(h => h.completions[REAL_TODAY]).length;
  if (doneToday === total) {
    if (!state.allDoneNotified) {
      state.allDoneNotified = true;
      Notify.push('semua kebiasaan selesai 🎉', `${total}/${total} tercapai hari ini`);
    }
  } else {
    state.allDoneNotified = false;
  }

  state.habits.forEach(habit => {
    if (habit.type !== 'weekly') return;
    const p = Habits.weekProgress(habit);
    const met = p.done >= p.target;
    const wasNotified = !!state.weeklyMetNotified[habit.id];
    if (met && !wasNotified) {
      state.weeklyMetNotified[habit.id] = true;
      Notify.push('target mingguan tercapai', `${habit.name} · ${p.done}/${p.target}x`);
    } else if (!met) {
      state.weeklyMetNotified[habit.id] = false;
    }
  });
}
