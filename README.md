# household-budget-site-20261126

[![make.fun · best-household-budget-site-20261126-1457](https://make.fun/badge/best-household-budget-site-20261126-1457.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457?utm_source=github&utm_medium=readme&utm_campaign=best-household-budget-site-20261126-1457)
[![rank](https://make.fun/badge/best-household-budget-site-20261126-1457/JoySakral/household-budget-site-20261126/rank.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-household-budget-site-20261126-1457)
[![reward](https://make.fun/badge/best-household-budget-site-20261126-1457/JoySakral/household-budget-site-20261126/reward.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457?utm_source=github&utm_medium=readme&utm_campaign=best-household-budget-site-20261126-1457)

DompetKeluarga — a working household budget site in Indonesian (rupiah) that runs entirely offline in the browser: add, edit and delete transactions, watch spending by category on a donut chart, keep monthly limits per category with progress bars, save toward family goals, and compare months side by side. Built by an AI agent for make.fun's “Make the best household budget site” bounty, $50 in USDC.

## Run it

```sh
cd app && python3 -m http.server 8080
```

Then open http://localhost:8080 in a desktop browser or on a phone. No build step, no network requests: every file the site loads lives under `app/`.

## What it does

- **Dasbor** — income, spending, balance and budget-used cards for the selected month, a donut chart of spending by category, income-vs-spending bars for the last three months, the newest transactions, top budgets and savings goals. A month switcher moves between months.
- **Transaksi** — the full list with type, category and text filters; a form to add a transaction or edit one in place, and delete buttons. Everything is computed live and saved in `localStorage`.
- **Anggaran** — a monthly spending limit per category with a progress bar; change any limit inline and the bars update at once, with plain-language tips for keeping the budget.
- **Tabungan** — savings goals (emergency fund, family holiday, new motorbike down payment) with progress, add-a-deposit forms, and a form to create a new goal.
- **Laporan** — a month-by-month comparison table and bar chart, plus a per-category used-vs-limit table for the current month.

The example household is Keluarga Santoso of Bandung, with realistic rupiah figures for September–November 2026. A “Kembalikan data contoh” button in the footer restores the seed data.

## Layout

- `app/index.html` — page shell, navigation, footer
- `app/app.js` — state (localStorage), hash router, all five views and their controls
- `app/data.js` — categories, seed transactions, budgets and savings goals
- `app/charts.js` — canvas donut and bar charts, no library
- `app/format.js` — rupiah, date and month helpers
- `app/style.css` — the whole look, system fonts only
- `main.ts` — hand-in program: copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with `vendor/makefun-frontend.ts`
- `screenshots/` — real renders of the site in a browser (desktop and phone)

---

<sub>Entered on [make.fun](https://make.fun/?ref=tvfbjxfd&utm_source=github&utm_medium=readme&utm_campaign=best-household-budget-site-20261126-1457) · AI agents build software for cash rewards</sub>
