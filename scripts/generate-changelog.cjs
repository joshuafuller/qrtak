#!/usr/bin/env node
/**
 * Generate proposed changelog entries by analyzing actual diffs, not just messages.
 * Heuristic: use commits with subject matching /^chore: release / as boundaries.
 * For each range, summarize by affected areas derived from changed paths.
 */
const { execSync } = require('child_process');

function sh (cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8' }).trim();
  } catch (e) {
    if (e.output && e.output[1]) {
      return String(e.output[1]).trim();
    }
    throw e;
  }
}

function getReleaseBoundaries () {
  const lines = sh("git --no-pager log --pretty=format:'%h %ad %s' --date=short").split('\n');
  const releases = [];
  for (const line of lines) {
    const m = line.match(/^(\w+)\s+(\d{4}-\d{2}-\d{2})\s+chore: release\s+([\w\.-]+)/);
    if (m) {
      releases.push({ hash: m[1], date: m[2], version: m[3] });
    }
  }
  // Ensure descending by history, we'll process in chronological order later
  return releases;
}

function summarizeCommit (hash) {
  const show = sh(`git show --name-status --pretty=format:%s ${hash}`);
  const [subject, ...files] = show.split('\n');
  const paths = files.filter(Boolean).map(l => l.split('\t').slice(1).join('\t'));
  const areas = new Set();
  for (const p of paths) {
    if (p.startsWith('src/js/')) areas.add('App');
    if (p.startsWith('src/styles/')) areas.add('Styles');
    if (p === 'index.html') areas.add('Index');
    if (p.startsWith('tests/e2e/')) areas.add('E2E Tests');
    if (p.startsWith('src/js/__tests__/')) areas.add('Unit Tests');
    if (p.startsWith('.github/workflows/')) areas.add('CI');
    if (p.startsWith('docs/') || p === 'README.md') areas.add('Docs');
    if (p.startsWith('public/')) areas.add('Public');
    if (p.startsWith('Dockerfile') || p === 'docker-compose.yml') areas.add('Docker');
    if (p === 'eslint.config.js') areas.add('Lint');
  }
  return { subject, areas: [...areas], files: paths };
}

function analyzeRange (fromHash, toHash) {
  const commitHashes = sh(`git --no-pager log --pretty=format:%h ${fromHash}..${toHash}`).split('\n').filter(Boolean);
  const summaries = commitHashes.map(h => ({ hash: h, ...summarizeCommit(h) }));
  const buckets = {
    Features: [],
    'Bug Fixes': [],
    Docs: [],
    CI: [],
    Docker: [],
    Tests: []
  };
  for (const s of summaries) {
    const subj = s.subject;
    const lower = subj.toLowerCase();
    const line = `- ${subj}`;
    if (lower.startsWith('feat') || s.areas.includes('App')) {
      buckets.Features.push(line);
    } else if (lower.startsWith('fix') || lower.startsWith('chore(security)')) {
      buckets['Bug Fixes'].push(line);
    }
    if (s.areas.includes('Docs')) buckets.Docs.push(line);
    if (s.areas.includes('CI') || lower.startsWith('fix(ci')) buckets.CI.push(line);
    if (s.areas.includes('Docker')) buckets.Docker.push(line);
    if (s.areas.includes('E2E Tests') || s.areas.includes('Unit Tests') || lower.startsWith('test')) buckets.Tests.push(line);
  }
  return buckets;
}

function renderSection (version, date, buckets, compareLink) {
  let out = `\n## [${version}](${compareLink}) (${date})\n\n`;
  for (const [title, items] of Object.entries(buckets)) {
    if (!items.length) continue;
    const uniq = [...new Set(items)];
    out += `### ${title}\n\n`;
    out += uniq.join('\n') + '\n\n';
  }
  return out;
}

function main () {
  const releases = getReleaseBoundaries();
  if (!releases.length) {
    console.error('No release boundary commits found.');
    process.exit(1);
  }
  // Process from oldest to newest
  const ordered = releases.slice().reverse();
  const sections = [];
  for (let i = 0; i < ordered.length; i++) {
    const r = ordered[i];
    const prev = ordered[i - 1];
    const from = prev ? prev.hash : sh('git rev-list --max-parents=0 HEAD');
    const to = r.hash;
    const buckets = analyzeRange(from, to);
    const version = r.version;
    const tagA = prev ? `v${prev.version}` : 'v0.0.0';
    const tagB = `v${version}`;
    const compare = `https://github.com/joshuafuller/qrtak/compare/${tagA}...${tagB}`;
    sections.push(renderSection(version, r.date, buckets, compare));
  }
  console.log(sections.join('\n'));
}

main();
