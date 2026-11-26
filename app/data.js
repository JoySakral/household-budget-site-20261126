// data.js — the example household behind DompetKeluarga and its seed data.
// Keluarga Santoso, a family of four in Bandung: Budi (father, office worker),
// Sari (mother, freelance designer), and two school-age children. All figures
// are realistic example rupiah amounts for September–November 2026. The app
// loads this seed only on first visit; afterwards the household's own edits
// live in localStorage (see app.js).

export const HOUSEHOLD = {
  name: 'Keluarga Santoso',
  members: 'Budi, Sari, Dimas & Kirana',
  city: 'Bandung',
  currency: 'IDR',
};

// Expense categories. Each has a colour used by the donut chart, the budget
// bars and the category dots, plus a short plain-language tip.
export const CATEGORIES = [
  { id: 'belanja', label: 'Belanja Harian', color: '#2e7d5b', tip: 'Belanja pasar & supermarket mingguan.' },
  { id: 'makanan', label: 'Makanan & Jajan', color: '#d97706', tip: 'Makan di luar, jajan anak, kopi.' },
  { id: 'transport', label: 'Transportasi', color: '#2563eb', tip: 'Bensin, tol, parkir, ojek online.' },
  { id: 'tagihan', label: 'Tagihan & Utilitas', color: '#7c3aed', tip: 'Listrik, air, internet, iuran RT.' },
  { id: 'pendidikan', label: 'Pendidikan', color: '#0891b2', tip: 'SPP, les, buku, seragam.' },
  { id: 'kesehatan', label: 'Kesehatan', color: '#dc2626', tip: 'Dokter, obat, vitamin, BPJS.' },
  { id: 'hiburan', label: 'Hiburan', color: '#db2777', tip: 'Nonton, langganan streaming, rekreasi.' },
  { id: 'lainnya', label: 'Lainnya', color: '#64748b', tip: 'Keperluan tak terduga lainnya.' },
];

export const INCOME_CATEGORIES = [
  { id: 'gaji', label: 'Gaji', color: '#15803d' },
  { id: 'freelance', label: 'Freelance', color: '#0e7490' },
  { id: 'lainnya-masuk', label: 'Pemasukan Lain', color: '#65a30d' },
];

export function categoryById(id) {
  return CATEGORIES.find((c) => c.id === id) || CATEGORIES[CATEGORIES.length - 1];
}

export function incomeCategoryById(id) {
  return INCOME_CATEGORIES.find((c) => c.id === id) || INCOME_CATEGORIES[INCOME_CATEGORIES.length - 1];
}

// Seed transactions. id is stable so edits and deletes survive a reload.
// November 2026 is the current month shown on first visit.
export const SEED_TRANSACTIONS = [
  // --- November 2026: pemasukan ---
  { id: 't-nov-01', date: '2026-11-01', desc: 'Gaji Budi — PT Maju Bersama', category: 'gaji', type: 'in', amount: 12500000 },
  { id: 't-nov-02', date: '2026-11-05', desc: 'Desain logo klien — Sari', category: 'freelance', type: 'in', amount: 1800000 },
  { id: 't-nov-03', date: '2026-11-18', desc: 'Jual sepeda bekas Dimas', category: 'lainnya-masuk', type: 'in', amount: 650000 },
  // --- November 2026: pengeluaran ---
  { id: 't-nov-04', date: '2026-11-02', desc: 'Belanja mingguan Pasar Cihapit', category: 'belanja', type: 'out', amount: 486000 },
  { id: 't-nov-05', date: '2026-11-03', desc: 'Listrik PLN (token)', category: 'tagihan', type: 'out', amount: 425000 },
  { id: 't-nov-06', date: '2026-11-04', desc: 'Bensin Pertalite', category: 'transport', type: 'out', amount: 200000 },
  { id: 't-nov-07', date: '2026-11-05', desc: 'Makan siang keluarga di luar', category: 'makanan', type: 'out', amount: 178000 },
  { id: 't-nov-08', date: '2026-11-06', desc: 'SPP Dimas & Kirana', category: 'pendidikan', type: 'out', amount: 1450000 },
  { id: 't-nov-09', date: '2026-11-07', desc: 'Internet IndiHome', category: 'tagihan', type: 'out', amount: 389000 },
  { id: 't-nov-10', date: '2026-11-08', desc: 'Belanja mingguan supermarket', category: 'belanja', type: 'out', amount: 512000 },
  { id: 't-nov-11', date: '2026-11-09', desc: 'Ojek online ke kantor (4x)', category: 'transport', type: 'out', amount: 96000 },
  { id: 't-nov-12', date: '2026-11-10', desc: 'Vitamin & obat flu Kirana', category: 'kesehatan', type: 'out', amount: 142000 },
  { id: 't-nov-13', date: '2026-11-12', desc: 'Jajan anak sekolah (seminggu)', category: 'makanan', type: 'out', amount: 150000 },
  { id: 't-nov-14', date: '2026-11-13', desc: 'Langganan streaming film', category: 'hiburan', type: 'out', amount: 54000 },
  { id: 't-nov-15', date: '2026-11-14', desc: 'Air PDAM', category: 'tagihan', type: 'out', amount: 186000 },
  { id: 't-nov-16', date: '2026-11-15', desc: 'Belanja mingguan Pasar Cihapit', category: 'belanja', type: 'out', amount: 468000 },
  { id: 't-nov-17', date: '2026-11-16', desc: 'Bensin Pertamax', category: 'transport', type: 'out', amount: 250000 },
  { id: 't-nov-18', date: '2026-11-17', desc: 'Buku latihan & alat tulis', category: 'pendidikan', type: 'out', amount: 128000 },
  { id: 't-nov-19', date: '2026-11-19', desc: 'Makan malam warung langganan', category: 'makanan', type: 'out', amount: 96000 },
  { id: 't-nov-20', date: '2026-11-20', desc: 'Iuran RT & kebersihan', category: 'tagihan', type: 'out', amount: 75000 },
  { id: 't-nov-21', date: '2026-11-21', desc: 'Nonton bioskop keluarga', category: 'hiburan', type: 'out', amount: 210000 },
  { id: 't-nov-22', date: '2026-11-22', desc: 'Belanja mingguan supermarket', category: 'belanja', type: 'out', amount: 534000 },
  { id: 't-nov-23', date: '2026-11-23', desc: 'Servis motor bulanan', category: 'transport', type: 'out', amount: 185000 },
  { id: 't-nov-24', date: '2026-11-24', desc: 'Periksa gigi Budi', category: 'kesehatan', type: 'out', amount: 275000 },
  { id: 't-nov-25', date: '2026-11-25', desc: 'Beli payung & jas hujan', category: 'lainnya', type: 'out', amount: 89000 },
];

// --- October and September 2026: shorter histories, so the report page can
// compare three real months instead of showing one month and two blanks. ---
export const SEED_HISTORY = [
  // October 2026
  { id: 't-okt-01', date: '2026-10-01', desc: 'Gaji Budi — PT Maju Bersama', category: 'gaji', type: 'in', amount: 12500000 },
  { id: 't-okt-02', date: '2026-10-07', desc: 'Desain brosur klien — Sari', category: 'freelance', type: 'in', amount: 950000 },
  { id: 't-okt-03', date: '2026-10-03', desc: 'Belanja mingguan Pasar Cihapit', category: 'belanja', type: 'out', amount: 502000 },
  { id: 't-okt-04', date: '2026-10-04', desc: 'Listrik PLN (token)', category: 'tagihan', type: 'out', amount: 438000 },
  { id: 't-okt-05', date: '2026-10-06', desc: 'SPP Dimas & Kirana', category: 'pendidikan', type: 'out', amount: 1450000 },
  { id: 't-okt-06', date: '2026-10-08', desc: 'Bensin & tol', category: 'transport', type: 'out', amount: 412000 },
  { id: 't-okt-07', date: '2026-10-10', desc: 'Belanja mingguan supermarket', category: 'belanja', type: 'out', amount: 489000 },
  { id: 't-okt-08', date: '2026-10-12', desc: 'Internet IndiHome', category: 'tagihan', type: 'out', amount: 389000 },
  { id: 't-okt-09', date: '2026-10-15', desc: 'Makan di luar & jajan', category: 'makanan', type: 'out', amount: 486000 },
  { id: 't-okt-10', date: '2026-10-18', desc: 'Belanja mingguan Pasar Cihapit', category: 'belanja', type: 'out', amount: 521000 },
  { id: 't-okt-11', date: '2026-10-20', desc: 'Les piano Kirana', category: 'pendidikan', type: 'out', amount: 350000 },
  { id: 't-okt-12', date: '2026-10-22', desc: 'Bensin Pertalite', category: 'transport', type: 'out', amount: 200000 },
  { id: 't-okt-13', date: '2026-10-24', desc: 'Nonton & streaming', category: 'hiburan', type: 'out', amount: 189000 },
  { id: 't-okt-14', date: '2026-10-26', desc: 'Air PDAM & iuran RT', category: 'tagihan', type: 'out', amount: 261000 },
  { id: 't-okt-15', date: '2026-10-28', desc: 'Belanja mingguan supermarket', category: 'belanja', type: 'out', amount: 498000 },
  { id: 't-okt-16', date: '2026-10-29', desc: 'Obat & vitamin', category: 'kesehatan', type: 'out', amount: 96000 },
  // September 2026
  { id: 't-sep-01', date: '2026-09-01', desc: 'Gaji Budi — PT Maju Bersama', category: 'gaji', type: 'in', amount: 12500000 },
  { id: 't-sep-02', date: '2026-09-09', desc: 'Desain undangan — Sari', category: 'freelance', type: 'in', amount: 1200000 },
  { id: 't-sep-03', date: '2026-09-03', desc: 'Belanja mingguan Pasar Cihapit', category: 'belanja', type: 'out', amount: 476000 },
  { id: 't-sep-04', date: '2026-09-05', desc: 'Listrik PLN (token)', category: 'tagihan', type: 'out', amount: 402000 },
  { id: 't-sep-05', date: '2026-09-06', desc: 'SPP Dimas & Kirana', category: 'pendidikan', type: 'out', amount: 1450000 },
  { id: 't-sep-06', date: '2026-09-08', desc: 'Seragam baru Dimas', category: 'pendidikan', type: 'out', amount: 385000 },
  { id: 't-sep-07', date: '2026-09-10', desc: 'Belanja mingguan supermarket', category: 'belanja', type: 'out', amount: 511000 },
  { id: 't-sep-08', date: '2026-09-12', desc: 'Internet IndiHome', category: 'tagihan', type: 'out', amount: 389000 },
  { id: 't-sep-09', date: '2026-09-14', desc: 'Bensin & ojek online', category: 'transport', type: 'out', amount: 356000 },
  { id: 't-sep-10', date: '2026-09-16', desc: 'Makan di luar & jajan', category: 'makanan', type: 'out', amount: 412000 },
  { id: 't-sep-11', date: '2026-09-18', desc: 'Belanja mingguan Pasar Cihapit', category: 'belanja', type: 'out', amount: 499000 },
  { id: 't-sep-12', date: '2026-09-21', desc: 'Periksa dokter anak', category: 'kesehatan', type: 'out', amount: 320000 },
  { id: 't-sep-13', date: '2026-09-24', desc: 'Belanja mingguan supermarket', category: 'belanja', type: 'out', amount: 527000 },
  { id: 't-sep-14', date: '2026-09-27', desc: 'Air PDAM & iuran RT', category: 'tagihan', type: 'out', amount: 261000 },
  { id: 't-sep-15', date: '2026-09-29', desc: 'Rekreasi akhir pekan', category: 'hiburan', type: 'out', amount: 245000 },
];

// Monthly spending limits per expense category (November 2026 values).
// The household reviews these together at the start of each month.
export const SEED_BUDGETS = {
  belanja: 2500000,
  makanan: 900000,
  transport: 1200000,
  tagihan: 1500000,
  pendidikan: 2000000,
  kesehatan: 800000,
  hiburan: 600000,
  lainnya: 500000,
};

// Savings goals: what the family is setting money aside for.
export const SEED_GOALS = [
  { id: 'g-darurat', name: 'Dana Darurat', note: 'Enam bulan biaya hidup, untuk jaga-jaga.', target: 30000000, saved: 18450000, color: '#2e7d5b' },
  { id: 'g-liburan', name: 'Liburan Keluarga', note: 'Liburan ke Yogyakarta saat libur sekolah.', target: 8000000, saved: 3200000, color: '#0891b2' },
  { id: 'g-motor', name: 'DP Motor Baru', note: 'Ganti motor lama yang sering mogok.', target: 12000000, saved: 5750000, color: '#d97706' },
];

// The whole seed, as one object the app stores on first run.
export const SEED_STATE = {
  transactions: SEED_TRANSACTIONS.concat(SEED_HISTORY),
  budgets: Object.assign({}, SEED_BUDGETS),
  goals: SEED_GOALS.map((g) => Object.assign({}, g)),
  currentMonth: '2026-11',
};
