/* ==========================================================
   TRACKER RENDER  -- builds the calendar header/rows and keeps
   the waybar status strip in sync with the data.
   ========================================================== */
import {
  state, Habits, fmtDate, daysInMonth, isCurrentRealMonth,
  REAL_TODAY, REAL_YEAR, REAL_MONTH, now, DOW, MONTHS_ID
} from './core.js';
import { renderChart } from './chart.js';
import { checkNotifications } from './notify.js';

function getWeekGroups(totalDays) {
  const groups = [];
  let day = 1, weekNum = 1;
  while (day <= totalDays) {
    const span = Math.min(7, totalDays - day + 1);
    groups.push({ weekNum, span });
    day += span; weekNum++;
  }
  return groups;
}

function updateNav() {
  document.getElementById('monthLabel').textContent = `${MONTHS_ID[state.viewMonth]} ${state.viewYear}`;
  document.getElementById('nextMonth').disabled = isCurrentRealMonth(state.viewYear, state.viewMonth);
}

function renderColgroup(total) {
  const colgroup = document.getElementById('tableColgroup');
  colgroup.innerHTML = '';
  const habitCol = document.createElement('col');
  habitCol.className = 'col-habit';
  colgroup.appendChild(habitCol);
  for (let d = 0; d < total; d++) colgroup.appendChild(document.createElement('col'));
}

function renderHeader() {
  const total = daysInMonth(state.viewYear, state.viewMonth);
  renderColgroup(total);
  const weekRow = document.getElementById('weekRow');
  const dayRow = document.getElementById('dayRow');
  weekRow.querySelectorAll('th:not(.habit-col-head)').forEach(el => el.remove());
  dayRow.innerHTML = '';

  getWeekGroups(total).forEach(g => {
    const th = document.createElement('th');
    th.colSpan = g.span;
    th.textContent = `week ${g.weekNum}`;
    weekRow.appendChild(th);
  });

  for (let d = 1; d <= total; d++) {
    const dateObj = new Date(state.viewYear, state.viewMonth, d);
    const dateStr = fmtDate(state.viewYear, state.viewMonth, d);
    const th = document.createElement('th');
    th.className = dateStr === REAL_TODAY ? 'is-today' : '';
    th.innerHTML = `<span class="dow">${DOW[dateObj.getDay()]}</span><span class="dnum">${d}</span>`;
    dayRow.appendChild(th);
  }
}

function onHabitToggled(habitId) {
  const habit = state.habits.find(h => h.id === habitId);
  if (habit && habit.type === 'weekly') updateWeeklyBadge(habit);
}

function updateWeeklyBadge(habit) {
  const tag = document.querySelector(`.habit-tag[data-habit-id="${habit.id}"]`);
  if (!tag) return;
  const p = Habits.weekProgress(habit);
  tag.textContent = `${p.done}/${p.target}x mgu ini`;
  tag.classList.toggle('met', p.done >= p.target);
}

function renderRows() {
  const table = document.getElementById('trackerTable');
  const empty = document.getElementById('emptyState');
  const chartSection = document.getElementById('chartSection');
  const tbody = document.getElementById('habitList');
  tbody.innerHTML = '';

  if (state.habits.length === 0) {
    empty.style.display = 'block';
    table.style.display = 'none';
    chartSection.style.display = 'none';
    return;
  }
  empty.style.display = 'none';
  table.style.display = 'table';
  chartSection.style.display = 'block';

  const total = daysInMonth(state.viewYear, state.viewMonth);

  state.habits.forEach(habit => {
    const tr = document.createElement('tr');
    tr.className = 'habit-row';

    const nameTd = document.createElement('td');
    nameTd.className = 'habit-name-cell';
    const nameWrap = document.createElement('div');
    nameWrap.className = 'habit-name-wrap';
    const nameSpan = document.createElement('span');
    nameSpan.className = 'name-text';
    nameSpan.textContent = habit.name;
    nameWrap.appendChild(nameSpan);

    if (habit.type === 'weekly') {
      const tag = document.createElement('span');
      tag.className = 'habit-tag';
      tag.setAttribute('data-habit-id', habit.id);
      const p = Habits.weekProgress(habit);
      tag.textContent = `${p.done}/${p.target}x mgu ini`;
      if (p.done >= p.target) tag.classList.add('met');
      nameWrap.appendChild(tag);
    }

    const delBtn = document.createElement('button');
    delBtn.className = 'del-btn';
    delBtn.type = 'button';
    delBtn.setAttribute('aria-label', `Hapus kebiasaan ${habit.name}`);
    delBtn.textContent = '✕';
    delBtn.addEventListener('click', () => {
      if (confirm(`Hapus "${habit.name}"?`)) {
        Habits.remove(habit.id);
        renderAll();
      }
    });
    nameWrap.appendChild(delBtn);
    nameTd.appendChild(nameWrap);
    tr.appendChild(nameTd);

    for (let d = 1; d <= total; d++) {
      const dateStr = fmtDate(state.viewYear, state.viewMonth, d);
      const td = document.createElement('td');
      td.className = 'day-cell';
      const sq = document.createElement('button');
      sq.type = 'button';
      const isFuture = dateStr > REAL_TODAY;
      const isDone = !!habit.completions[dateStr];
      sq.className = 'sq' + (isDone ? ' done' : '') + (isFuture ? ' future' : '') + (dateStr === REAL_TODAY ? ' is-today' : '');
      sq.setAttribute('aria-label', `${habit.name} - ${dateStr}${isDone ? ' (selesai)' : ''}`);
      sq.setAttribute('aria-pressed', String(isDone));
      if (isFuture) {
        sq.disabled = true;
      } else {
        sq.addEventListener('click', () => {
          Habits.toggle(habit, dateStr);
          const nowDone = !!habit.completions[dateStr];
          sq.classList.toggle('done', nowDone);
          sq.setAttribute('aria-pressed', String(nowDone));
          if (nowDone) {
            sq.classList.add('just-checked');
            setTimeout(() => sq.classList.remove('just-checked'), 240);
          }
          onHabitToggled(habit.id);
          renderChart();
          renderWaybarStatus();
          checkNotifications();
        });
      }
      td.appendChild(sq);
      tr.appendChild(td);
    }

    tbody.appendChild(tr);
  });
}

// Repurposes the waybar's decorative bits into real data: the "workspace"
// squares become a 5-day-at-a-glance strip, and the right-side icons show
// today's actual completion instead of a hardcoded 100%.
function renderWaybarStatus() {
  const wsEl = document.getElementById('wsDays');
  const habitCountEl = document.getElementById('wbHabitCount');
  const todayPctEl = document.getElementById('wbTodayPct');
  if (!wsEl) return;

  const total = state.habits.length;

  wsEl.innerHTML = '';
  for (let i = 4; i >= 0; i--) {
    const d = new Date(REAL_YEAR, REAL_MONTH, now.getDate() - i);
    const ds = fmtDate(d.getFullYear(), d.getMonth(), d.getDate());
    const done = total ? state.habits.filter(h => h.completions[ds]).length : 0;
    const span = document.createElement('span');
    span.textContent = d.getDate();
    span.title = `${ds} — ${done}/${total} selesai`;
    if (ds === REAL_TODAY) span.classList.add('today');
    if (total > 0 && done === total) span.classList.add('full');
    else if (done > 0) span.classList.add('partial');
    wsEl.appendChild(span);
  }

  const doneToday = total ? state.habits.filter(h => h.completions[REAL_TODAY]).length : 0;
  const pct = total ? Math.round((doneToday / total) * 100) : 0;
  habitCountEl.textContent = `🌱 ${doneToday}/${total}`;
  todayPctEl.textContent = `🔋 ${pct}%`;
}

export function renderAll() {
  updateNav();
  renderHeader();
  renderRows();
  renderChart();
  renderWaybarStatus();
}
