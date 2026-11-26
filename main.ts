// main.ts — DompetKeluarga's hand-in program (Node 22, standard library only).
//
// It assembles the entry in the output directory the grader reads: it copies
// app/ (the static budget site) and screenshots/ (real renders of the site)
// from beside this file, then writes /output/dossier.json with the make.fun
// dossier library from vendor/makefun-frontend.ts, which must stay unchanged.
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// The program is deliberately deterministic: it runs the same way twice and
// writes the same bytes both times, because the grader runs it twice and
// compares. Before writing it validates the pieces it hands in, so a broken
// build fails loudly here instead of silently reaching the gate.

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

// Where the repository lives (this file's directory) and where the entry goes.
const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output');

const APP_DIR = join(repoRoot, 'app');
const SHOTS_DIR = join(repoRoot, 'screenshots');
const DOSSIER_PATH = join(outDir, 'dossier.json');

// The gate's caps, kept here so a too-large entry fails in this program
// with a readable message instead of only in the scorer.
const APP_MAX_FILES = 993;
const APP_MAX_BYTES = 16777216;
const SHOT_MAX = 4;
const SHOT_MAX_BYTES = 262144;
const TEXT_MAX_BYTES = 163840;

function fail(message: string): never {
  throw new Error('main.ts: ' + message);
}

// Count every file and directory under a tree, with its total bytes.
function countTree(dir: string): { entries: number; bytes: number } {
  let entries = 0;
  let bytes = 0;
  const walk = (current: string) => {
    for (const name of readdirSync(current)) {
      const path = join(current, name);
      const info = statSync(path);
      entries += 1;
      if (info.isDirectory()) walk(path);
      else if (info.isFile()) bytes += info.size;
      else fail('not a plain file or directory: ' + path);
    }
  };
  walk(dir);
  return { entries, bytes };
}

// Validate app/ and screenshots/ against the gate's limits before copying.
function validateInputs(): void {
  if (!existsSync(join(APP_DIR, 'index.html'))) fail('app/index.html is missing');
  if (statSync(join(APP_DIR, 'index.html')).size > 1048576) fail('app/index.html is over 1 MiB');
  const app = countTree(APP_DIR);
  if (app.entries > APP_MAX_FILES) fail('app/ has ' + app.entries + ' entries, over the 993 cap');
  if (app.bytes > APP_MAX_BYTES) fail('app/ is ' + app.bytes + ' bytes, over the 16 MiB cap');

  if (!existsSync(SHOTS_DIR)) fail('screenshots/ is missing');
  const shots = readdirSync(SHOTS_DIR).filter((name) => !name.startsWith('.'));
  if (shots.length < 3 || shots.length > SHOT_MAX) {
    fail('screenshots/ holds ' + shots.length + ' images, expected 3 or 4');
  }
  for (const name of shots) {
    if (!/^[A-Za-z0-9._-]+$/.test(name) || name.startsWith('-')) fail('bad screenshot name: ' + name);
    const size = statSync(join(SHOTS_DIR, name)).size;
    if (size > SHOT_MAX_BYTES) fail('screenshot ' + name + ' is ' + size + ' bytes, over 256 KiB');
  }
  console.log('validated app/ (' + app.entries + ' entries, ' + app.bytes + ' bytes) and ' + shots.length + ' screenshots');
}

// Copy a directory tree into the output, replacing any previous copy so a
// second run writes exactly the same bytes as the first.
function copyFresh(source: string, target: string): void {
  if (existsSync(target)) rmSync(target, { recursive: true, force: true });
  mkdirSync(target, { recursive: true });
  cpSync(source, target, { recursive: true });
}

validateInputs();

mkdirSync(outDir, { recursive: true });
copyFresh(APP_DIR, join(outDir, 'app'));
copyFresh(SHOTS_DIR, join(outDir, 'screenshots'));

// The dossier is built from what was just copied, never from the repo, so
// the file the scorer re-derives matches this one byte for byte.
const dossier = buildDossier(outDir, {
  text_max_bytes: TEXT_MAX_BYTES,
  screenshots: { max: SHOT_MAX, max_bytes: SHOT_MAX_BYTES },
  app_max_files: APP_MAX_FILES,
  app_max_bytes: APP_MAX_BYTES,
});
writeFileSync(DOSSIER_PATH, dossier);

const out = countTree(outDir);
console.log('wrote ' + DOSSIER_PATH + ' (' + statSync(DOSSIER_PATH).size + ' bytes)');
console.log('output: ' + out.entries + ' entries, ' + out.bytes + ' bytes in ' + outDir);
