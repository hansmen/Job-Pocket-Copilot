#!/usr/bin/env node
/**
 * Creates GitHub milestones, labels and issues from scripts/backlog.json using the GitHub CLI (`gh`).
 *
 * Usage:
 *   node scripts/create-issues.mjs --dry-run              # print what would be created, change nothing
 *   node scripts/create-issues.mjs                        # create in the repo of the current directory
 *   node scripts/create-issues.mjs --repo owner/name      # create in a specific repo
 *   node scripts/create-issues.mjs --stage 0 --stage 1    # only the given stages (5 = ideas)
 *
 * Requirements: `gh auth login` done, and the repository already exists on GitHub.
 * The script is idempotent for labels and milestones, and skips issues whose title already exists.
 * It never deletes or edits anything.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const args = { dryRun: false, repo: null, stages: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') args.dryRun = true;
    else if (a === '--repo') args.repo = argv[++i];
    else if (a === '--stage') args.stages.push(Number(argv[++i]));
    else {
      console.error(`Unknown argument: ${a}`);
      process.exit(2);
    }
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const backlog = JSON.parse(readFileSync(join(here, 'backlog.json'), 'utf8'));

// ---- Validate the backlog before touching GitHub ----
const milestoneTitles = new Set(backlog.milestones.map((m) => m.title));
const labelNames = new Set(backlog.labels.map((l) => l.name));
const problems = [];
const seenTitles = new Set();
for (const issue of backlog.issues) {
  if (!issue.title || !issue.body)
    problems.push(`Issue without title/body: ${JSON.stringify(issue.title)}`);
  if (seenTitles.has(issue.title)) problems.push(`Duplicate issue title: ${issue.title}`);
  seenTitles.add(issue.title);
  if (!milestoneTitles.has(issue.milestone))
    problems.push(`Unknown milestone "${issue.milestone}" in "${issue.title}"`);
  for (const l of issue.labels ?? []) {
    if (!labelNames.has(l)) problems.push(`Unknown label "${l}" in "${issue.title}"`);
  }
}
if (problems.length > 0) {
  console.error('backlog.json is invalid:\n- ' + problems.join('\n- '));
  process.exit(1);
}

const issues = backlog.issues.filter(
  (i) => args.stages.length === 0 || args.stages.includes(i.stage),
);
const neededMilestones = new Set(issues.map((i) => i.milestone));

console.log(
  `${args.dryRun ? '[dry run] ' : ''}${issues.length} issue(s), ${neededMilestones.size} milestone(s), ${backlog.labels.length} label(s)`,
);

if (args.dryRun) {
  for (const i of issues) {
    console.log(`- [${i.milestone}] ${i.title}  (${(i.labels ?? []).join(', ')})`);
  }
  console.log('\nNothing was created. Run without --dry-run to create these.');
  process.exit(0);
}

// ---- Real run: uses the gh CLI (execFile, no shell, so titles/bodies cannot inject commands) ----
const repoArgs = args.repo ? ['--repo', args.repo] : [];

function gh(ghArgs, { allowFail = false } = {}) {
  try {
    return execFileSync('gh', ghArgs, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (error) {
    if (allowFail) return null;
    console.error(`gh ${ghArgs.slice(0, 3).join(' ')} failed:\n${error.stderr ?? error.message}`);
    process.exit(1);
  }
}

// Resolve "owner/name" for the milestones API.
const repoFull =
  args.repo ?? JSON.parse(gh(['repo', 'view', '--json', 'nameWithOwner'])).nameWithOwner;

for (const l of backlog.labels) {
  // Fails harmlessly if the label already exists.
  gh(['label', 'create', l.name, '--color', l.color, ...repoArgs], { allowFail: true });
}

const existingMilestones = JSON.parse(
  gh(['api', `repos/${repoFull}/milestones?state=all&per_page=100`]),
);
const milestoneByTitle = new Map(existingMilestones.map((m) => [m.title, m.number]));
for (const m of backlog.milestones) {
  if (!neededMilestones.has(m.title) || milestoneByTitle.has(m.title)) continue;
  const created = JSON.parse(
    gh([
      'api',
      `repos/${repoFull}/milestones`,
      '-f',
      `title=${m.title}`,
      '-f',
      `description=${m.description}`,
    ]),
  );
  milestoneByTitle.set(m.title, created.number);
  console.log(`Created milestone: ${m.title}`);
}

const existingIssues = JSON.parse(
  gh(['issue', 'list', '--state', 'all', '--limit', '500', '--json', 'title', ...repoArgs]),
);
const existingTitles = new Set(existingIssues.map((i) => i.title));

let created = 0;
let skipped = 0;
for (const issue of issues) {
  if (existingTitles.has(issue.title)) {
    skipped++;
    continue;
  }
  const labelArgs = (issue.labels ?? []).flatMap((l) => ['--label', l]);
  gh([
    'issue',
    'create',
    '--title',
    issue.title,
    '--body',
    issue.body,
    '--milestone',
    issue.milestone,
    ...labelArgs,
    ...repoArgs,
  ]);
  created++;
  console.log(`Created: ${issue.title}`);
}

console.log(`\nDone. Created ${created}, skipped ${skipped} (already existed).`);
