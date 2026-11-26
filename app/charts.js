// charts.js — small canvas charts drawn with plain Canvas 2D, no library.
// Two charts cover what a household budget needs: a donut of where the
// money went this month, and bars comparing income and spending per month.
// Charts are drawn after each render; if canvas is unavailable they leave
// the fallback text in place instead of failing.

import { rupiahShort } from './format.js';

// Draw a donut chart of spending by category into <canvas id>. slices is an
// array of { label, value, color }. The centre shows the total.
export function drawDonut(canvas, slices, totalLabel) {
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const cssWidth = canvas.clientWidth || 260;
  const cssHeight = canvas.clientHeight || 260;
  canvas.width = Math.round(cssWidth * dpr);
  canvas.height = Math.round(cssHeight * dpr);
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, cssWidth, cssHeight);

  const total = slices.reduce((sum, s) => sum + s.value, 0);
  const cx = cssWidth / 2;
  const cy = cssHeight / 2;
  const outer = Math.min(cssWidth, cssHeight) / 2 - 8;
  const inner = outer * 0.62;

  if (total <= 0) {
    ctx.beginPath();
    ctx.arc(cx, cy, outer, 0, Math.PI * 2);
    ctx.fillStyle = '#e2e8f0';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, inner, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    drawCentreText(ctx, cx, cy, 'Rp0', 'belum ada pengeluaran');
    return;
  }

  let angle = -Math.PI / 2;
  for (const slice of slices) {
    const sweep = (slice.value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, outer, angle, angle + sweep);
    ctx.closePath();
    ctx.fillStyle = slice.color;
    ctx.fill();
    angle += sweep;
  }
  // Cut the hole.
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(cx, cy, inner, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  // Thin white separators between slices.
  angle = -Math.PI / 2;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  for (const slice of slices) {
    const sweep = (slice.value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, outer, angle, angle + sweep);
    ctx.closePath();
    ctx.stroke();
    angle += sweep;
  }
  drawCentreText(ctx, cx, cy, rupiahShort(total), totalLabel || 'pengeluaran');
}

function drawCentreText(ctx, cx, cy, big, small) {
  ctx.fillStyle = '#0f172a';
  ctx.font = '700 20px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(big, cx, cy - 10);
  ctx.fillStyle = '#64748b';
  ctx.font = '400 12px system-ui, sans-serif';
  ctx.fillText(small, cx, cy + 12);
}

// Draw grouped bars: for each month, one income bar and one spending bar.
// months is an array of { label, income, expense }.
export function drawMonthBars(canvas, months) {
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const cssWidth = canvas.clientWidth || 520;
  const cssHeight = canvas.clientHeight || 240;
  canvas.width = Math.round(cssWidth * dpr);
  canvas.height = Math.round(cssHeight * dpr);
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, cssWidth, cssHeight);

  const padLeft = 8;
  const padRight = 8;
  const padTop = 26;
  const padBottom = 26;
  const plotW = cssWidth - padLeft - padRight;
  const plotH = cssHeight - padTop - padBottom;
  const maxValue = Math.max(1, ...months.flatMap((m) => [m.income, m.expense]));
  const groupW = plotW / Math.max(1, months.length);
  const barW = Math.min(34, groupW * 0.28);

  // Baseline.
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padLeft, padTop + plotH);
  ctx.lineTo(padLeft + plotW, padTop + plotH);
  ctx.stroke();

  months.forEach((month, i) => {
    const gx = padLeft + i * groupW + groupW / 2;
    const incomeH = (month.income / maxValue) * plotH;
    const expenseH = (month.expense / maxValue) * plotH;
    // Income bar (green), expense bar (red-orange).
    ctx.fillStyle = '#2e7d5b';
    roundTopBar(ctx, gx - barW - 3, padTop + plotH - incomeH, barW, incomeH);
    ctx.fillStyle = '#dc6a4a';
    roundTopBar(ctx, gx + 3, padTop + plotH - expenseH, barW, expenseH);
    // Value labels above the bars.
    ctx.fillStyle = '#334155';
    ctx.font = '600 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(rupiahShort(month.income), gx - barW / 2 - 3, padTop + plotH - incomeH - 6);
    ctx.fillText(rupiahShort(month.expense), gx + barW / 2 + 3, padTop + plotH - expenseH - 6);
    // Month label below.
    ctx.fillStyle = '#64748b';
    ctx.font = '400 12px system-ui, sans-serif';
    ctx.fillText(month.label, gx, cssHeight - 8);
  });
}

function roundTopBar(ctx, x, y, w, h) {
  if (h <= 0) return;
  const r = Math.min(4, w / 2, h);
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  ctx.fill();
}

// Build the legend rows for a donut: colour dot, label, amount, share.
export function donutLegendRows(slices, total) {
  return slices
    .slice()
    .sort((a, b) => b.value - a.value)
    .map((s) => ({
      label: s.label,
      color: s.color,
      amount: s.value,
      share: total > 0 ? Math.round((s.value / total) * 100) : 0,
    }));
}
