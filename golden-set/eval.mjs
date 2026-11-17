#!/usr/bin/env node
/**
 * Golden-set evaluation for job parsing.
 *
 * Usage:
 *   node golden-set/eval.mjs                         # baseline regex parser on golden-set/samples
 *   node golden-set/eval.mjs --dir golden-set/private
 *   node golden-set/eval.mjs --parser ./my-parser.mjs   # module whose default export is async (text) => parsedJob
 *   node golden-set/eval.mjs --save                  # write a JSON report to golden-set/results/
 *   node golden-set/eval.mjs --threshold 0.9         # exit code 1 if the overall score is below 0.9
 *
 * Each sample is a JSON file: { id, text, expected: { title, company, seniority, workMode, salary, stack } }.
 * Metrics: exact match (normalized) for title, company, seniority, workMode; exact match of the whole
 * salary object; F1 for the stack list. The overall score is the mean of the six metrics over all samples.
 *
 * The built-in baseline is intentionally naive. Your AI parser must beat it, and the score
 * must be recorded before and after every prompt or model change.
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

// ---------- CLI ----------
function parseArgs(argv) {
  const args = { dir: join(here, 'samples'), parser: null, save: false, threshold: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dir') args.dir = resolve(argv[++i]);
    else if (a === '--parser') args.parser = resolve(argv[++i]);
    else if (a === '--save') args.save = true;
    else if (a === '--threshold') args.threshold = Number(argv[++i]);
    else if (a === '--help' || a === '-h') {
      console.log('See the header comment of golden-set/eval.mjs for usage.');
      process.exit(0);
    } else {
      console.error(`Unknown argument: ${a}`);
      process.exit(2);
    }
  }
  return args;
}

// ---------- Baseline parser (naive on purpose) ----------
const TECH = [
  'React Native', 'TypeScript', 'JavaScript', 'Expo', 'Redux', 'Zustand', 'GraphQL', 'Apollo',
  'REST', 'Node.js', 'NestJS', 'PostgreSQL', 'Prisma', 'Firebase', 'Swift', 'Kotlin', 'AWS',
  'Docker', 'Jest', 'Sentry', 'Next.js', 'React', 'Vue', 'Nuxt', 'Tailwind', 'Stripe', 'CI/CD',
  'Python', 'Django', 'Figma',
];

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
}

export function baselineParse(text) {
  const lines = text.split('\n').map((l) => l.trim());
  const title = lines.find(Boolean) ?? '';

  const companyLine = lines.find((l) => /^company:/i.test(l));
  const company = companyLine ? companyLine.replace(/^company:\s*/i, '') : null;

  const lower = text.toLowerCase();
  let seniority = 'unknown';
  for (const level of ['lead', 'senior', 'middle', 'junior', 'intern']) {
    if (lower.includes(level)) {
      seniority = level;
      break;
    }
  }

  let workMode = 'unknown';
  if (/\bhybrid\b/.test(lower)) workMode = 'hybrid';
  else if (/\bremote\b/.test(lower)) workMode = 'remote';
  else if (/on-?site/.test(lower)) workMode = 'onsite';

  let salary = null;
  const m = /(\$|usd|eur|uah|€)\s?([\d,]+)\s?[-–]\s?([\d,]+)\s*(?:per\s+)?(month|year)?/i.exec(text);
  if (m) {
    const cur = { $: 'USD', usd: 'USD', eur: 'EUR', '€': 'EUR', uah: 'UAH' }[m[1].toLowerCase()];
    salary = {
      min: Number(m[2].replaceAll(',', '')),
      max: Number(m[3].replaceAll(',', '')),
      currency: cur ?? null,
      period: m[4] ? m[4].toLowerCase() : null,
    };
  }

  const stack = TECH.filter((t) => new RegExp(`(^|[^A-Za-z])${escapeRegExp(t)}([^A-Za-z]|$)`, 'i').test(text));

  return { title, company, seniority, workMode, salary, stack };
}

// ---------- Metrics ----------
const norm = (v) => (v == null ? null : String(v).trim().toLowerCase());

function exact(a, b) {
  return norm(a) === norm(b) ? 1 : 0;
}

function salaryMatch(a, b) {
  if (!a && !b) return 1;
  if (!a || !b) return 0;
  return a.min === b.min && a.max === b.max && norm(a.currency) === norm(b.currency) && norm(a.period) === norm(b.period)
    ? 1
    : 0;
}

function f1(predicted, expected) {
  const p = new Set((predicted ?? []).map(norm));
  const e = new Set((expected ?? []).map(norm));
  if (p.size === 0 && e.size === 0) return 1;
  let tp = 0;
  for (const x of p) if (e.has(x)) tp++;
  if (tp === 0) return 0;
  const precision = tp / p.size;
  const recall = tp / e.size;
  return (2 * precision * recall) / (precision + recall);
}

const FIELDS = ['title', 'company', 'seniority', 'workMode', 'salary', 'stack'];

export function scoreSample(predicted, expected) {
  return {
    title: exact(predicted.title, expected.title),
    company: exact(predicted.company, expected.company),
    seniority: exact(predicted.seniority, expected.seniority),
    workMode: exact(predicted.workMode, expected.workMode),
    salary: salaryMatch(predicted.salary, expected.salary),
    stack: f1(predicted.stack, expected.stack),
  };
}

// ---------- Main ----------
async function main() {
  const args = parseArgs(process.argv.slice(2));

  let parse = baselineParse;
  let parserName = 'baseline-regex';
  if (args.parser) {
    const mod = await import(pathToFileURL(args.parser).href);
    if (typeof mod.default !== 'function') {
      console.error('The parser module must export a default function: async (text) => parsedJob');
      process.exit(2);
    }
    parse = mod.default;
    parserName = args.parser;
  }

  const files = readdirSync(args.dir).filter((f) => f.endsWith('.json')).sort();
  if (files.length === 0) {
    console.error(`No .json samples in ${args.dir}`);
    process.exit(2);
  }

  const rows = [];
  for (const file of files) {
    const sample = JSON.parse(readFileSync(join(args.dir, file), 'utf8'));
    const predicted = await parse(sample.text);
    rows.push({ id: sample.id ?? file, scores: scoreSample(predicted, sample.expected) });
  }

  const pad = (s, n) => String(s).padEnd(n);
  console.log(`Parser: ${parserName}`);
  console.log(`Samples: ${rows.length} from ${args.dir}\n`);
  console.log(pad('sample', 34) + FIELDS.map((f) => pad(f, 10)).join(''));
  for (const r of rows) {
    console.log(pad(r.id, 34) + FIELDS.map((f) => pad(r.scores[f].toFixed(2), 10)).join(''));
  }

  const perField = Object.fromEntries(
    FIELDS.map((f) => [f, rows.reduce((sum, r) => sum + r.scores[f], 0) / rows.length]),
  );
  const overall = FIELDS.reduce((sum, f) => sum + perField[f], 0) / FIELDS.length;

  console.log('\n' + pad('MEAN', 34) + FIELDS.map((f) => pad(perField[f].toFixed(2), 10)).join(''));
  console.log(`\nOverall score: ${overall.toFixed(3)}`);

  if (args.save) {
    const outDir = join(here, 'results');
    mkdirSync(outDir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outFile = join(outDir, `${stamp}.json`);
    writeFileSync(
      outFile,
      JSON.stringify({ parser: parserName, samples: rows.length, perField, overall, rows }, null, 2) + '\n',
    );
    console.log(`Saved report: ${outFile}`);
  }

  if (args.threshold !== null && overall < args.threshold) {
    console.error(`Overall score ${overall.toFixed(3)} is below the threshold ${args.threshold}`);
    process.exit(1);
  }
}

// Run only when executed directly, so the functions above can be imported in tests.
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  await main();
}
