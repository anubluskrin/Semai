/* ==========================================================
   PERFORMANCE CHART  -- hand-rolled inline SVG, no dependency.
   Plots each day's completion rate (%) for the viewed month,
   with a smooth stock-ticker-style tween between updates.
   ========================================================== */
import { state, fmtDate, daysInMonth, isCurrentRealMonth, now } from './core.js';

function dailyPerformance() {
  const total = daysInMonth(state.viewYear, state.viewMonth);
  const isCurrent = isCurrentRealMonth(state.viewYear, state.viewMonth);
  const lastDay = isCurrent ? now.getDate() : total;
  const points = [];
  for (let d = 1; d <= lastDay; d++) {
    const dateStr = fmtDate(state.viewYear, state.viewMonth, d);
    const done = state.habits.filter(h => h.completions[dateStr]).length;
    const pct = state.habits.length ? Math.round((done / state.habits.length) * 100) : 0;
    points.push({ day: d, pct });
  }
  return points;
}

// data: array of {day, pct} where pct may be fractional (mid-tween)
function buildChartMarkup(data) {
  const W = 700, H = 180, padL = 28, padR = 10, padT = 14, padB = 22;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const n = data.length;

  const xFor = i => padL + (n === 1 ? 0 : (i / (n - 1)) * plotW);
  const yFor = pct => padT + plotH - (pct / 100) * plotH;

  const linePts = data.map((p, i) => `${xFor(i)},${yFor(p.pct)}`).join(' ');
  const areaPts = `${padL},${padT + plotH} ${linePts} ${xFor(n - 1)},${padT + plotH}`;

  const gridLines = [0, 25, 50, 75, 100].map(v => {
    const y = yFor(v);
    return `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="var(--surface1)" stroke-width="1" stroke-dasharray="3 4"/>
            <text x="${padL - 6}" y="${y + 3}" text-anchor="end" font-size="9" fill="var(--overlay1)" font-family="JetBrains Mono, monospace">${v}</text>`;
  }).join('');

  // day tick labels: show start, end, and a few in between (avoid crowding)
  const tickEvery = Math.max(1, Math.ceil(n / 8));
  const dayTicks = data.map((p, i) => {
    if (i !== 0 && i !== n - 1 && i % tickEvery !== 0) return '';
    return `<text x="${xFor(i)}" y="${H - 5}" text-anchor="middle" font-size="9" fill="var(--overlay1)" font-family="JetBrains Mono, monospace">${p.day}</text>`;
  }).join('');

  const dots = data.map((p, i) =>
    `<circle cx="${xFor(i)}" cy="${yFor(p.pct)}" r="2.4" fill="var(--pink)"><title>hari ${p.day}: ${Math.round(p.pct)}%</title></circle>`
  ).join('');

  return `
    <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Grafik performa harian">
      <defs>
        <linearGradient id="perfFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--pink)" stop-opacity="0.45"/>
          <stop offset="100%" stop-color="var(--pink)" stop-opacity="0"/>
        </linearGradient>
      </defs>
      ${gridLines}
      <polygon points="${areaPts}" fill="url(#perfFill)"/>
      <polyline points="${linePts}" fill="none" stroke="var(--mauve)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
      ${dots}
      ${dayTicks}
    </svg>`;
}

// easeOutCubic -- fast start, gentle settle, the classic "ticker" easing
function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

let chartPrevPct = null;   // last fully-settled pct values, keyed by day index
let chartAnimFrame = null; // current rAF handle, so a new input can cancel an in-flight tween
const CHART_ANIM_MS = 450;

export function renderChart() {
  const card = document.getElementById('chartCard');
  if (!card) return;
  const target = dailyPerformance();

  if (chartAnimFrame) { cancelAnimationFrame(chartAnimFrame); chartAnimFrame = null; }

  if (target.length < 2) {
    chartPrevPct = null;
    card.innerHTML = '<div class="chart-empty">butuh minimal 2 hari data pada bulan ini untuk menampilkan grafik.</div>';
    return;
  }

  const targetPct = target.map(p => p.pct);

  // no previous frame to tween from, or the number of days changed (month switch) --
  // draw immediately, nothing sensible to interpolate between
  if (!chartPrevPct || chartPrevPct.length !== targetPct.length) {
    card.innerHTML = buildChartMarkup(target);
    chartPrevPct = targetPct.slice();
    return;
  }

  const fromPct = chartPrevPct.slice();
  const start = performance.now();

  function step(ts) {
    const raw = Math.min(1, (ts - start) / CHART_ANIM_MS);
    const eased = easeOutCubic(raw);
    const frame = target.map((p, i) => ({ day: p.day, pct: fromPct[i] + (targetPct[i] - fromPct[i]) * eased }));
    card.innerHTML = buildChartMarkup(frame);
    if (raw < 1) {
      chartAnimFrame = requestAnimationFrame(step);
    } else {
      chartPrevPct = targetPct.slice();
      chartAnimFrame = null;
    }
  }
  chartAnimFrame = requestAnimationFrame(step);
}
