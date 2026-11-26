// app.js — DompetKeluarga: a household budget site that runs entirely in
// the browser. One file owns the state, the hash router and every view.
// Data lives in localStorage (key below) so the family's edits survive a
// reload; the seed in data.js is only loaded on the very first visit.

import { rupiah, rupiahShort, formatDate, formatMonth, shiftMonth, parseAmount, clampPercent, todayIso } from './format.js';
import { CATEGORIES, INCOME_CATEGORIES, SEED_STATE, HOUSEHOLD, categoryById, incomeCategoryById } from './data.js';
import { drawDonut, drawMonthBars, donutLegendRows } from './charts.js';

const STORAGE_KEY = 'dompetkeluarga-v1';
const DEFAULT_MONTH = '2026-11';

// ---------- state ----------

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.transactions) && parsed.budgets && Array.isArray(parsed.goals)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Data tersimpan tidak bisa dibaca, memakai data contoh.', err);
  }
  return structuredClone(SEED_STATE);
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('Data tidak bisa disimpan di perangkat ini.', err);
  }
}

let state = loadState();
let editingId = null; // id of the transaction currently loaded into the form
let txFilter = { type: 'all', category: 'all', query: '' };

function monthTransactions(monthKey) {
  return state.transactions.filter((t) => t.date.slice(0, 7) === monthKey);
}

function monthTotals(monthKey) {
  let income = 0;
  let expense = 0;
  for (const t of monthTransactions(monthKey)) {
    if (t.type === 'in') income += t.amount;
    else expense += t.amount;
  }
  return { income, expense, balance: income - expense };
}

function spendingByCategory(monthKey) {
  const totals = new Map();
  for (const t of monthTransactions(monthKey)) {
    if (t.type !== 'out') continue;
    totals.set(t.category, (totals.get(t.category) || 0) + t.amount);
  }
  return CATEGORIES.map((c) => ({
    label: c.label,
    id: c.id,
    color: c.color,
    value: totals.get(c.id) || 0,
  })).filter((s) => s.value > 0);
}

function allMonths() {
  const keys = new Set(state.transactions.map((t) => t.date.slice(0, 7)));
  return [...keys].sort();
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ---------- router ----------

const ROUTES = [
  { hash: '#/', label: 'Dasbor', render: renderDashboard },
  { hash: '#/transaksi', label: 'Transaksi', render: renderTransactions },
  { hash: '#/anggaran', label: 'Anggaran', render: renderBudgets },
  { hash: '#/tabungan', label: 'Tabungan', render: renderGoals },
  { hash: '#/laporan', label: 'Laporan', render: renderReport },
];

function currentRoute() {
  const hash = location.hash || '#/';
  return ROUTES.find((r) => hash === r.hash || hash.startsWith(r.hash + '?')) || ROUTES[0];
}

function render() {
  const route = currentRoute();
  const main = document.getElementById('view');
  document.querySelectorAll('.nav-link').forEach((link) => {
    const isActive = link.getAttribute('href') === route.hash;
    link.classList.toggle('active', isActive);
    if (isActive) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  main.innerHTML = route.render();
  afterRender(route.hash);
  window.scrollTo(0, 0);
}

// Runs after a view is painted: draw charts, wire the view's controls.
function afterRender(hash) {
  if (hash === '#/') drawDashboardCharts();
  if (hash === '#/laporan') drawReportCharts();
  wireCommonControls();
  if (hash === '#/transaksi') wireTransactionForm();
  if (hash === '#/anggaran') wireBudgetControls();
  if (hash === '#/tabungan') wireGoalControls();
}

// ---------- dashboard ----------

function monthSwitcherHtml() {
  const prev = shiftMonth(state.currentMonth, -1);
  const next = shiftMonth(state.currentMonth, 1);
  return '<div class="month-switcher" role="group" aria-label="Pilih bulan">' +
    '<button type="button" class="month-btn" data-month="' + prev + '" aria-label="Bulan sebelumnya">&larr;</button>' +
    '<strong class="month-label">' + formatMonth(state.currentMonth) + '</strong>' +
    '<button type="button" class="month-btn" data-month="' + next + '" aria-label="Bulan berikutnya">&rarr;</button>' +
    '</div>';
}

function renderDashboard() {
  const totals = monthTotals(state.currentMonth);
  const prevTotals = monthTotals(shiftMonth(state.currentMonth, -1));
  const slices = spendingByCategory(state.currentMonth);
  const spent = totals.expense;
  const budgetTotal = Object.values(state.budgets).reduce((a, b) => a + b, 0);
  const budgetUsed = budgetTotal > 0 ? Math.round((spent / budgetTotal) * 100) : 0;
  const recent = monthTransactions(state.currentMonth)
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 6);
  const overBudget = CATEGORIES.filter((c) => {
    const used = slices.find((s) => s.id === c.id);
    return used && used.value > (state.budgets[c.id] || 0);
  });
  const savingRate = totals.income > 0 ? Math.round((totals.balance / totals.income) * 100) : 0;

  return '<section class="hero">' +
    '<div><p class="eyebrow">Anggaran rumah tangga &middot; ' + escapeHtml(HOUSEHOLD.name) + ' &middot; ' + escapeHtml(HOUSEHOLD.city) + '</p>' +
    '<h1>Uang keluarga, terlihat jelas.</h1>' +
    '<p class="lede">Catat pemasukan dan pengeluaran, jaga anggaran tiap kategori, dan kumpulkan tabungan untuk tujuan keluarga — semuanya di satu tempat, tanpa perlu akun.</p></div>' +
    monthSwitcherHtml() +
    '</section>' +
    '<section class="cards" aria-label="Ringkasan bulan ini">' +
    summaryCard('Pemasukan', rupiah(totals.income), 'Dari gaji dan freelance bulan ini.', 'in') +
    summaryCard('Pengeluaran', rupiah(totals.expense), expenseNote(prevTotals.expense, totals.expense), 'out') +
    summaryCard('Sisa / Saldo', rupiah(totals.balance), savingRate >= 0 ? savingRate + '% pemasukan tersisa bulan ini.' : 'Pengeluaran melebihi pemasukan.', totals.balance >= 0 ? 'in' : 'out') +
    summaryCard('Anggaran terpakai', budgetUsed + '%', rupiah(spent) + ' dari ' + rupiah(budgetTotal) + ' anggaran.', budgetUsed > 100 ? 'out' : 'in') +
    '</section>' +
    (overBudget.length
      ? '<div class="alert" role="alert"><strong>Perhatian:</strong> ' + overBudget.map((c) => escapeHtml(c.label)).join(', ') + ' sudah melewati anggaran bulan ini. <a href="#/anggaran">Lihat anggaran &rarr;</a></div>'
      : '<div class="ok-note">Semua kategori masih dalam anggaran bulan ini. Kerja bagus!</div>') +
    '<section class="grid-2">' +
    '<article class="panel"><h2>Ke mana uang pergi?</h2>' +
    '<p class="panel-sub">Pengeluaran ' + formatMonth(state.currentMonth) + ' per kategori.</p>' +
    '<canvas id="donut" width="260" height="260" role="img" aria-label="Diagram lingkaran pengeluaran per kategori"></canvas>' +
    '<ul class="legend">' + donutLegendRows(slices, spent).map((row) =>
      '<li><span class="dot" style="background:' + row.color + '"></span>' + escapeHtml(row.label) +
      '<strong>' + rupiah(row.amount) + '</strong><span class="share">' + row.share + '%</span></li>').join('') + '</ul></article>' +
    '<article class="panel"><h2>Pemasukan vs pengeluaran</h2>' +
    '<p class="panel-sub">Tiga bulan terakhir, supaya trennya kelihatan.</p>' +
    '<canvas id="monthbars" width="520" height="240" role="img" aria-label="Diagram batang pemasukan dan pengeluaran tiga bulan terakhir"></canvas>' +
    '<div class="chart-key"><span><i class="swatch in"></i>Pemasukan</span><span><i class="swatch out"></i>Pengeluaran</span></div>' +
    '<h3 class="mini-title">Transaksi terbaru</h3>' +
    '<ul class="tx-list compact">' + recent.map(transactionRow).join('') + '</ul>' +
    '<p class="more-link"><a href="#/transaksi">Semua transaksi &rarr;</a></p></article>' +
    '</section>' +
    '<section class="grid-2">' +
    '<article class="panel"><h2>Anggaran bulan ini</h2><p class="panel-sub">Tiga kategori dengan pemakaian terbesar.</p>' +
    topBudgetsHtml(slices) +
    '<p class="more-link"><a href="#/anggaran">Atur semua anggaran &rarr;</a></p></article>' +
    '<article class="panel"><h2>Tabungan keluarga</h2><p class="panel-sub">Tujuan yang sedang dikumpulkan.</p>' +
    state.goals.map(goalCardHtml).join('') +
    '<p class="more-link"><a href="#/tabungan">Kelola tabungan &rarr;</a></p></article>' +
    '</section>';
}

function summaryCard(label, value, note, tone) {
  return '<article class="card ' + tone + '"><p class="card-label">' + label + '</p>' +
    '<p class="card-value">' + value + '</p><p class="card-note">' + note + '</p></article>';
}

function expenseNote(prev, current) {
  if (prev <= 0) return 'Bulan ini.';
  const diff = Math.round(((current - prev) / prev) * 100);
  if (diff === 0) return 'Sama seperti bulan lalu.';
  return (diff > 0 ? diff + '% lebih besar' : Math.abs(diff) + '% lebih kecil') + ' dari bulan lalu.';
}

function topBudgetsHtml(slices) {
  const rows = CATEGORIES.map((c) => {
    const used = (slices.find((s) => s.id === c.id) || { value: 0 }).value;
    return { label: c.label, color: c.color, used, limit: state.budgets[c.id] || 0 };
  }).sort((a, b) => b.used - a.used).slice(0, 3);
  return rows.map((r) => budgetBarHtml(r.label, r.color, r.used, r.limit)).join('');
}

function budgetBarHtml(label, color, used, limit) {
  const pct = limit > 0 ? Math.round((used / limit) * 100) : 0;
  const over = pct > 100;
  return '<div class="budget-row"><div class="budget-head"><span>' + escapeHtml(label) + '</span>' +
    '<span>' + rupiah(used) + ' / ' + rupiah(limit) + '</span></div>' +
    '<div class="bar" role="progressbar" aria-valuenow="' + clampPercent(pct) + '" aria-valuemin="0" aria-valuemax="100" aria-label="Anggaran ' + escapeHtml(label) + '">' +
    '<span class="bar-fill' + (over ? ' over' : '') + '" style="width:' + clampPercent(pct) + '%;background:' + color + '"></span></div>' +
    '<p class="budget-note">' + (over ? 'Melebihi anggaran ' + rupiah(used - limit) + '.' : pct + '% terpakai, sisa ' + rupiah(Math.max(0, limit - used)) + '.') + '</p></div>';
}

function goalCardHtml(goal) {
  const pct = goal.target > 0 ? Math.round((goal.saved / goal.target) * 100) : 0;
  return '<div class="goal-row"><div class="goal-head"><strong>' + escapeHtml(goal.name) + '</strong>' +
    '<span>' + rupiah(goal.saved) + ' dari ' + rupiah(goal.target) + '</span></div>' +
    '<div class="bar"><span class="bar-fill" style="width:' + clampPercent(pct) + '%;background:' + goal.color + '"></span></div>' +
    '<p class="budget-note">' + pct + '% tercapai &middot; kurang ' + rupiah(Math.max(0, goal.target - goal.saved)) + ' lagi.</p></div>';
}

function transactionRow(t) {
  const cat = t.type === 'in' ? incomeCategoryById(t.category) : categoryById(t.category);
  return '<li><span class="dot" style="background:' + cat.color + '"></span>' +
    '<span class="tx-desc"><strong>' + escapeHtml(t.desc) + '</strong><small>' + formatDate(t.date) + ' &middot; ' + escapeHtml(cat.label) + '</small></span>' +
    '<span class="tx-amount ' + t.type + '">' + (t.type === 'in' ? '+' : '&minus;') + rupiah(t.amount) + '</span></li>';
}

function drawDashboardCharts() {
  const donut = document.getElementById('donut');
  if (donut) {
    const slices = spendingByCategory(state.currentMonth);
    drawDonut(donut, slices, 'pengeluaran');
  }
  const bars = document.getElementById('monthbars');
  if (bars) {
    const months = allMonths().slice(-3).map((key) => {
      const totals = monthTotals(key);
      return { label: formatMonth(key).split(' ')[0].slice(0, 3), income: totals.income, expense: totals.expense };
    });
    drawMonthBars(bars, months);
  }
}

// ---------- transactions ----------

function renderTransactions() {
  const filtered = state.transactions
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .filter((t) => {
      if (txFilter.type !== 'all' && t.type !== txFilter.type) return false;
      if (txFilter.category !== 'all' && t.category !== txFilter.category) return false;
      if (txFilter.query && !t.desc.toLowerCase().includes(txFilter.query.toLowerCase())) return false;
      return true;
    });
  const editing = editingId ? state.transactions.find((t) => t.id === editingId) : null;
  const monthTx = monthTransactions(state.currentMonth);
  const inTotal = monthTx.filter((t) => t.type === 'in').reduce((a, t) => a + t.amount, 0);
  const outTotal = monthTx.filter((t) => t.type === 'out').reduce((a, t) => a + t.amount, 0);

  return '<section class="page-head"><div><h1>Transaksi</h1>' +
    '<p class="lede">Semua pemasukan dan pengeluaran keluarga. Tambah, ubah, atau hapus — perubahan langsung tersimpan di perangkat ini.</p></div>' +
    monthSwitcherHtml() + '</section>' +
    '<section class="cards small"><article class="card in"><p class="card-label">Masuk &middot; ' + formatMonth(state.currentMonth) + '</p><p class="card-value">' + rupiah(inTotal) + '</p></article>' +
    '<article class="card out"><p class="card-label">Keluar &middot; ' + formatMonth(state.currentMonth) + '</p><p class="card-value">' + rupiah(outTotal) + '</p></article>' +
    '<article class="card"><p class="card-label">Jumlah transaksi</p><p class="card-value">' + filtered.length + ' dari ' + state.transactions.length + '</p></article></section>' +
    '<section class="panel"><h2>' + (editing ? 'Ubah transaksi' : 'Tambah transaksi') + '</h2>' +
    '<form id="tx-form" class="tx-form">' +
    '<label>Tanggal<input type="date" id="tx-date" required value="' + (editing ? editing.date : todayIso()) + '"></label>' +
    '<label>Keterangan<input type="text" id="tx-desc" required maxlength="80" placeholder="cth. Belanja mingguan pasar" value="' + (editing ? escapeHtml(editing.desc) : '') + '"></label>' +
    '<label>Jenis<select id="tx-type"><option value="out"' + (!editing || editing.type === 'out' ? ' selected' : '') + '>Pengeluaran</option><option value="in"' + (editing && editing.type === 'in' ? ' selected' : '') + '>Pemasukan</option></select></label>' +
    '<label>Kategori<select id="tx-category"></select></label>' +
    '<label>Jumlah (Rp)<input type="number" id="tx-amount" required min="1" step="1" inputmode="numeric" placeholder="500000" value="' + (editing ? editing.amount : '') + '"></label>' +
    '<div class="form-actions"><button type="submit" class="btn primary">' + (editing ? 'Simpan perubahan' : 'Tambah transaksi') + '</button>' +
    (editing ? '<button type="button" class="btn" id="tx-cancel">Batal</button>' : '') + '</div>' +
    '<p class="form-hint" id="tx-msg" role="status"></p></form></section>' +
    '<section class="panel"><h2>Daftar transaksi</h2>' +
    '<div class="filters" role="group" aria-label="Saring transaksi">' +
    '<label>Jenis <select id="filter-type"><option value="all">Semua</option><option value="in"' + (txFilter.type === 'in' ? ' selected' : '') + '>Pemasukan</option><option value="out"' + (txFilter.type === 'out' ? ' selected' : '') + '>Pengeluaran</option></select></label>' +
    '<label>Kategori <select id="filter-category"><option value="all">Semua kategori</option>' +
    CATEGORIES.map((c) => '<option value="' + c.id + '"' + (txFilter.category === c.id ? ' selected' : '') + '>' + c.label + '</option>').join('') +
    INCOME_CATEGORIES.map((c) => '<option value="' + c.id + '"' + (txFilter.category === c.id ? ' selected' : '') + '>' + c.label + ' (masuk)</option>').join('') +
    '</select></label>' +
    '<label>Cari <input type="search" id="filter-query" placeholder="cth. pasar" value="' + escapeHtml(txFilter.query) + '"></label>' +
    '</div>' +
    (filtered.length === 0
      ? '<p class="empty">Tidak ada transaksi yang cocok dengan saringan ini.</p>'
      : '<ul class="tx-list full">' + filtered.map((t) => {
        const cat = t.type === 'in' ? incomeCategoryById(t.category) : categoryById(t.category);
        return '<li><span class="dot" style="background:' + cat.color + '"></span>' +
          '<span class="tx-desc"><strong>' + escapeHtml(t.desc) + '</strong><small>' + formatDate(t.date) + ' &middot; ' + escapeHtml(cat.label) + '</small></span>' +
          '<span class="tx-amount ' + t.type + '">' + (t.type === 'in' ? '+' : '&minus;') + rupiah(t.amount) + '</span>' +
          '<span class="tx-actions"><button type="button" class="btn small" data-edit="' + t.id + '">Ubah</button>' +
          '<button type="button" class="btn small danger" data-delete="' + t.id + '">Hapus</button></span></li>';
      }).join('') + '</ul>') +
    '</section>';
}

// ---------- budgets ----------

function renderBudgets() {
  const slices = spendingByCategory(state.currentMonth);
  const budgetTotal = Object.values(state.budgets).reduce((a, b) => a + b, 0);
  const spentTotal = slices.reduce((a, s) => a + s.value, 0);
  const remaining = Math.max(0, budgetTotal - spentTotal);
  return '<section class="page-head"><div><h1>Anggaran</h1>' +
    '<p class="lede">Batas belanja tiap kategori untuk ' + formatMonth(state.currentMonth) + '. Ubah angkanya kapan saja — bilah kemajuan langsung menyesuaikan.</p></div>' +
    monthSwitcherHtml() + '</section>' +
    '<section class="cards small"><article class="card"><p class="card-label">Total anggaran</p><p class="card-value">' + rupiah(budgetTotal) + '</p></article>' +
    '<article class="card out"><p class="card-label">Terpakai</p><p class="card-value">' + rupiah(spentTotal) + '</p></article>' +
    '<article class="card in"><p class="card-label">Sisa anggaran</p><p class="card-value">' + rupiah(remaining) + '</p></article></section>' +
    '<section class="panel"><h2>Batas per kategori</h2>' +
    '<p class="panel-sub">Ketuk angka batasnya untuk mengubah. Anggaran yang terlampaui ditandai merah.</p>' +
    CATEGORIES.map((c) => {
      const used = (slices.find((s) => s.id === c.id) || { value: 0 }).value;
      const limit = state.budgets[c.id] || 0;
      const pct = limit > 0 ? Math.round((used / limit) * 100) : 0;
      const over = pct > 100;
      return '<div class="budget-edit"><div class="budget-head"><span><span class="dot" style="background:' + c.color + '"></span> ' + escapeHtml(c.label) + '</span>' +
        '<span>' + rupiah(used) + ' / <label class="sr-only" for="budget-' + c.id + '">Batas ' + escapeHtml(c.label) + '</label>' +
        '<input type="number" id="budget-' + c.id + '" class="budget-input" min="0" step="50000" value="' + limit + '" data-category="' + c.id + '"> </span></div>' +
        '<div class="bar" role="progressbar" aria-valuenow="' + clampPercent(pct) + '" aria-valuemin="0" aria-valuemax="100" aria-label="Anggaran ' + escapeHtml(c.label) + '">' +
        '<span class="bar-fill' + (over ? ' over' : '') + '" style="width:' + clampPercent(pct) + '%;background:' + c.color + '"></span></div>' +
        '<p class="budget-note">' + escapeHtml(c.tip) + ' ' + (over ? 'Melebihi anggaran ' + rupiah(used - limit) + '.' : pct + '% terpakai, sisa ' + rupiah(Math.max(0, limit - used)) + '.') + '</p></div>';
    }).join('') +
    '<p class="form-hint" id="budget-msg" role="status"></p></section>' +
    '<section class="panel tips"><h2>Tips menjaga anggaran</h2><ul class="tips-list">' +
    '<li><strong>Belanja mingguan, bukan harian.</strong> Satu kali belanja besar tiap minggu biasanya lebih hemat daripada bolak-balik ke pasar.</li>' +
    '<li><strong>Pisahkan uang jajan.</strong> Beri anak uang jajan mingguan dalam amplop — kalau habis, tunggu minggu depan.</li>' +
    '<li><strong>Cek tagihan di awal bulan.</strong> Listrik, internet, dan SPP jatuh tempo di minggu pertama; sisihkan dulu sebelum belanja lain.</li>' +
    '<li><strong>Aturan 24 jam.</strong> Untuk pembelian di luar anggaran, tunggu sehari sebelum memutuskan — banyak keinginan hilang sendiri.</li>' +
    '</ul></section>';
}

// ---------- savings goals ----------

function renderGoals() {
  const totalSaved = state.goals.reduce((a, g) => a + g.saved, 0);
  const totalTarget = state.goals.reduce((a, g) => a + g.target, 0);
  return '<section class="page-head"><div><h1>Tabungan</h1>' +
    '<p class="lede">Tujuan menabung keluarga: dana darurat, liburan, dan rencana besar lainnya. Tambah setoran tiap kali ada sisa uang.</p></div></section>' +
    '<section class="cards small"><article class="card in"><p class="card-label">Total terkumpul</p><p class="card-value">' + rupiah(totalSaved) + '</p></article>' +
    '<article class="card"><p class="card-label">Total target</p><p class="card-value">' + rupiah(totalTarget) + '</p></article>' +
    '<article class="card"><p class="card-label">Tujuan aktif</p><p class="card-value">' + state.goals.length + '</p></article></section>' +
    '<section class="grid-2 goals-grid">' +
    state.goals.map((g) => {
      const pct = g.target > 0 ? Math.round((g.saved / g.target) * 100) : 0;
      return '<article class="panel goal-panel"><h2>' + escapeHtml(g.name) + '</h2>' +
        '<p class="panel-sub">' + escapeHtml(g.note) + '</p>' +
        '<p class="goal-big"><strong>' + rupiah(g.saved) + '</strong> dari ' + rupiah(g.target) + '</p>' +
        '<div class="bar big"><span class="bar-fill" style="width:' + clampPercent(pct) + '%;background:' + g.color + '"></span></div>' +
        '<p class="budget-note">' + pct + '% tercapai &middot; kurang ' + rupiah(Math.max(0, g.target - g.saved)) + ' lagi.</p>' +
        '<form class="goal-form" data-goal="' + g.id + '"><label>Tambah setoran (Rp)<input type="number" min="1000" step="1000" placeholder="100000" required></label>' +
        '<button type="submit" class="btn primary small">Tambah</button></form></article>';
    }).join('') + '</section>' +
    '<section class="panel"><h2>Buat tujuan baru</h2>' +
    '<form id="goal-form" class="tx-form"><label>Nama tujuan<input type="text" id="goal-name" required maxlength="40" placeholder="cth. Umroh keluarga"></label>' +
    '<label>Target (Rp)<input type="number" id="goal-target" required min="1000" step="1000" placeholder="10000000"></label>' +
    '<label>Sudah terkumpul (Rp)<input type="number" id="goal-saved" min="0" step="1000" value="0"></label>' +
    '<div class="form-actions"><button type="submit" class="btn primary">Buat tujuan</button></div>' +
    '<p class="form-hint" id="goal-msg" role="status"></p></form></section>';
}

// ---------- monthly report ----------

function renderReport() {
  const months = allMonths();
  const rows = months.map((key) => {
    const t = monthTotals(key);
    return { key, label: formatMonth(key), income: t.income, expense: t.expense, balance: t.balance };
  });
  const bestSaving = rows.slice().sort((a, b) => b.balance - a.balance)[0];
  const avgExpense = rows.length ? Math.round(rows.reduce((a, r) => a + r.expense, 0) / rows.length) : 0;
  return '<section class="page-head"><div><h1>Laporan bulanan</h1>' +
    '<p class="lede">Perbandingan pemasukan, pengeluaran, dan sisa uang dari bulan ke bulan — supaya tren keluarga kelihatan.</p></div></section>' +
    '<section class="cards small"><article class="card in"><p class="card-label">Bulan paling hemat</p><p class="card-value">' + (bestSaving ? escapeHtml(bestSaving.label) : '&mdash;') + '</p><p class="card-note">' + (bestSaving ? 'Sisa ' + rupiah(bestSaving.balance) + '.' : '') + '</p></article>' +
    '<article class="card"><p class="card-label">Rata-rata pengeluaran</p><p class="card-value">' + rupiah(avgExpense) + '</p><p class="card-note">Per bulan, ' + rows.length + ' bulan terakhir.</p></article>' +
    '<article class="card"><p class="card-label">Total sisa ' + rows.length + ' bulan</p><p class="card-value">' + rupiah(rows.reduce((a, r) => a + r.balance, 0)) + '</p></article></section>' +
    '<section class="panel"><h2>Perbandingan bulanan</h2>' +
    '<canvas id="reportbars" width="640" height="260" role="img" aria-label="Diagram batang perbandingan pemasukan dan pengeluaran per bulan"></canvas>' +
    '<div class="chart-key"><span><i class="swatch in"></i>Pemasukan</span><span><i class="swatch out"></i>Pengeluaran</span></div>' +
    '<div class="table-wrap"><table class="report-table"><thead><tr><th>Bulan</th><th>Pemasukan</th><th>Pengeluaran</th><th>Sisa</th><th>Tabungan</th></tr></thead><tbody>' +
    rows.map((r) => '<tr><td>' + escapeHtml(r.label) + '</td><td>' + rupiah(r.income) + '</td><td>' + rupiah(r.expense) + '</td>' +
      '<td class="' + (r.balance >= 0 ? 'pos' : 'neg') + '">' + rupiah(r.balance) + '</td>' +
      '<td>' + (r.income > 0 ? Math.round((r.balance / r.income) * 100) + '%' : '&mdash;') + '</td></tr>').join('') +
    '</tbody></table></div></section>' +
    '<section class="panel"><h2>Pengeluaran per kategori — ' + formatMonth(state.currentMonth) + '</h2>' +
    '<div class="table-wrap"><table class="report-table"><thead><tr><th>Kategori</th><th>Terpakai</th><th>Anggaran</th><th>Sisa</th></tr></thead><tbody>' +
    CATEGORIES.map((c) => {
      const used = (spendingByCategory(state.currentMonth).find((s) => s.id === c.id) || { value: 0 }).value;
      const limit = state.budgets[c.id] || 0;
      return '<tr><td><span class="dot" style="background:' + c.color + '"></span> ' + escapeHtml(c.label) + '</td><td>' + rupiah(used) + '</td><td>' + rupiah(limit) + '</td>' +
        '<td class="' + (used > limit ? 'neg' : 'pos') + '">' + (used > limit ? 'Lebih ' + rupiah(used - limit) : rupiah(limit - used)) + '</td></tr>';
    }).join('') + '</tbody></table></div>' +
    '<p class="more-link"><a href="#/anggaran">Ubah anggaran &rarr;</a></p></section>';
}

function drawReportCharts() {
  const canvas = document.getElementById('reportbars');
  if (!canvas) return;
  const months = allMonths().map((key) => {
    const t = monthTotals(key);
    return { label: formatMonth(key).split(' ')[0].slice(0, 3) + ' ' + key.slice(2, 4), income: t.income, expense: t.expense };
  });
  drawMonthBars(canvas, months);
}

// ---------- wiring ----------

function wireCommonControls() {
  document.querySelectorAll('[data-month]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.currentMonth = btn.getAttribute('data-month');
      saveState();
      render();
    });
  });
  const resetBtn = document.getElementById('reset-data');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      state = structuredClone(SEED_STATE);
      editingId = null;
      saveState();
      render();
    });
  }
}

function fillCategoryOptions(type) {
  const select = document.getElementById('tx-category');
  if (!select) return;
  const list = type === 'in' ? INCOME_CATEGORIES : CATEGORIES;
  select.innerHTML = list.map((c) => '<option value="' + c.id + '">' + escapeHtml(c.label) + '</option>').join('');
  const editing = editingId ? state.transactions.find((t) => t.id === editingId) : null;
  if (editing && editing.type === type) select.value = editing.category;
}

function wireTransactionForm() {
  const form = document.getElementById('tx-form');
  const typeSelect = document.getElementById('tx-type');
  const msg = document.getElementById('tx-msg');
  if (!form || !typeSelect) return;
  fillCategoryOptions(typeSelect.value);
  typeSelect.addEventListener('change', () => fillCategoryOptions(typeSelect.value));
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const amount = parseAmount(document.getElementById('tx-amount').value);
    const desc = document.getElementById('tx-desc').value.trim();
    const date = document.getElementById('tx-date').value;
    if (!desc || !date || amount <= 0) {
      msg.textContent = 'Isi tanggal, keterangan, dan jumlah yang benar (lebih dari Rp0).';
      return;
    }
    const record = {
      id: editingId || 't-' + Date.now().toString(36),
      date,
      desc,
      category: document.getElementById('tx-category').value,
      type: typeSelect.value,
      amount,
    };
    if (editingId) {
      const index = state.transactions.findIndex((t) => t.id === editingId);
      if (index >= 0) state.transactions[index] = record;
      msg.textContent = 'Transaksi diperbarui.';
    } else {
      state.transactions.push(record);
      msg.textContent = 'Transaksi ditambahkan.';
    }
    state.currentMonth = date.slice(0, 7);
    editingId = null;
    saveState();
    render();
  });
  const cancel = document.getElementById('tx-cancel');
  if (cancel) cancel.addEventListener('click', () => { editingId = null; render(); });
  document.querySelectorAll('[data-edit]').forEach((btn) => {
    btn.addEventListener('click', () => {
      editingId = btn.getAttribute('data-edit');
      render();
      document.getElementById('tx-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
  document.querySelectorAll('[data-delete]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-delete');
      state.transactions = state.transactions.filter((t) => t.id !== id);
      if (editingId === id) editingId = null;
      saveState();
      render();
    });
  });
  document.getElementById('filter-type').addEventListener('change', (e) => { txFilter.type = e.target.value; render(); });
  document.getElementById('filter-category').addEventListener('change', (e) => { txFilter.category = e.target.value; render(); });
  document.getElementById('filter-query').addEventListener('input', (e) => { txFilter.query = e.target.value; renderListOnly(); });
}

// Re-render the whole view while typing in the search box, then restore
// the cursor to the end of the search field so focus is kept.
function renderListOnly() {
  render();
  const query = document.getElementById('filter-query');
  if (query) { query.focus(); query.setSelectionRange(query.value.length, query.value.length); }
}

function wireBudgetControls() {
  document.querySelectorAll('.budget-input').forEach((input) => {
    input.addEventListener('change', () => {
      const category = input.getAttribute('data-category');
      const value = Math.max(0, parseAmount(input.value));
      state.budgets[category] = value;
      saveState();
      // Re-render, then put the confirmation back: render() rebuilds the
      // view, so the message must be set on the fresh element. Keep the
      // scroll position so editing a budget mid-page does not jump to top.
      const scrollY = window.scrollY;
      render();
      window.scrollTo(0, scrollY);
      const msg = document.getElementById('budget-msg');
      if (msg) msg.textContent = 'Anggaran ' + categoryById(category).label + ' diubah menjadi ' + rupiah(value) + '.';
    });
  });
}

function wireGoalControls() {
  document.querySelectorAll('.goal-form').forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const goal = state.goals.find((g) => g.id === form.getAttribute('data-goal'));
      const input = form.querySelector('input');
      const amount = parseAmount(input.value);
      if (!goal || amount <= 0) return;
      goal.saved += amount;
      saveState();
      render();
    });
  });
  const form = document.getElementById('goal-form');
  if (!form) return;
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = document.getElementById('goal-name').value.trim();
    const target = parseAmount(document.getElementById('goal-target').value);
    const saved = Math.max(0, parseAmount(document.getElementById('goal-saved').value));
    const msg = document.getElementById('goal-msg');
    if (!name || target <= 0) {
      msg.textContent = 'Isi nama tujuan dan target yang benar (lebih dari Rp0).';
      return;
    }
    const colors = ['#2e7d5b', '#0891b2', '#d97706', '#7c3aed', '#dc2626'];
    state.goals.push({
      id: 'g-' + Date.now().toString(36),
      name,
      note: 'Tujuan baru keluarga.',
      target,
      saved: Math.min(saved, target),
      color: colors[state.goals.length % colors.length],
    });
    saveState();
    render();
  });
}

// ---------- boot ----------

window.addEventListener('hashchange', render);
document.addEventListener('DOMContentLoaded', render);
if (document.readyState !== 'loading') render();
