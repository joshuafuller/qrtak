#!/usr/bin/env node
/* eslint-disable no-console */
const { execSync } = require('child_process');
const fs = require('fs');

function sh (cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8' }).trim();
  } catch (e) {
    if (e.output && e.output[1]) return String(e.output[1]).trim();
    throw e;
  }
}

const lines = sh('git --no-pager log --pretty=format:%h %ad %s --date=short').split('\n');
const releases = [];
for (const l of lines) {
  const m = l.match(/^(\w+)\s+(\d{4}-\d{2}-\d{2})\s+chore: release\s+([\w.-]+)/);
  if (m) releases.push({ hash: m[1], date: m[2], version: m[3] });
}
const ordered = releases.slice().reverse();
let out = '# Changelog Audit (from release commits)\n\n';
for (let i = 0; i < ordered.length; i++) {
  const r = ordered[i];
  const prev = ordered[i - 1];
  const from = prev ? prev.hash : sh('git rev-list --max-parents=0 HEAD');
  const to = r.hash;
  const commits = sh(`git --no-pager log --pretty=format:'%h %ad %s' --date=short ${from}..${to}`).split('\n').filter(Boolean);
  out += `## ${r.version} (${r.date})\n`;
  for (const c of commits) {
    const parts = c.split(' ');
    const hash = parts.shift();
    const date = parts.shift();
    const subj = parts.join(' ');
    const files = sh(`git show --name-status --pretty=format:%s ${hash}`).split('\n').slice(1).filter(Boolean);
    out += `- ${subj} [${files.length} files]\n`;
  }
  out += '\n';
}
fs.writeFileSync('docs/CHANGELOG-AUDIT.md', out);
console.log('Wrote docs/CHANGELOG-AUDIT.md');
