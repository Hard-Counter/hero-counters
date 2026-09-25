#!/usr/bin/env node
// Builds the single-file web preview of the app from the same data and logic the
// phone app uses. Run after `node scripts/build-data.mjs`:
//   node scripts/build-preview.mjs [output.html]
// Needs the `typescript` package (installed with the project's dev dependencies).

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
let ts;
try {
  ts = require('typescript');
} catch {
  console.error('TypeScript is missing. Run `npm install` in the project first.');
  process.exit(1);
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(process.argv[2] ?? resolve(root, 'preview/dist/hero-counters.html'));

const data = JSON.parse(readFileSync(resolve(root, 'src/data/heroes.json'), 'utf8'));
const logic = ts
  .transpileModule(readFileSync(resolve(root, 'src/logic.ts'), 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2019, module: ts.ModuleKind.ESNext },
  })
  .outputText.replace(/^import .*$/gm, '')
  .replace(/^export \{\s*\};?\s*$/gm, '')
  .replace(/^export (?=(const|function|let|class) )/gm, '');

const template = readFileSync(resolve(root, 'preview/template.html'), 'utf8');
if (!template.includes('/*__BUNDLE__*/')) throw new Error('preview/template.html is missing the /*__BUNDLE__*/ marker');
const html = template.replace('/*__BUNDLE__*/', () => `const DATA = ${JSON.stringify(data)};\n${logic}`);

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, html);
console.log(`Wrote ${out} (${Math.round(html.length / 1024)} KB)`);
