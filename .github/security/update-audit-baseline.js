#!/usr/bin/env node
/**
 * Update Audit Baseline
 *
 * Run this from the REPO ROOT after intentionally upgrading or accepting
 * a set of known vulnerabilities. It re-captures npm audit counts for
 * both backend and frontend and writes them to audit-baseline.json.
 *
 * Usage:
 *   node .github/security/update-audit-baseline.js
 *
 * Requires that npm dependencies are installed in both backend/ and frontend/.
 */

'use strict';

const { execSync } = require('child_process');
const fs           = require('fs');
const path         = require('path');

const baselinePath = path.join(__dirname, 'audit-baseline.json');
const projects     = ['backend', 'frontend'];
const result       = {};

for (const project of projects) {
  const dir = path.join(__dirname, '..', '..', project);

  let raw;
  try {
    // npm audit exits non-zero when vulnerabilities exist – capture anyway.
    raw = execSync('npm audit --json', { cwd: dir, stdio: ['pipe', 'pipe', 'pipe'] }).toString();
  } catch (e) {
    raw = (e.stdout || '').toString();
  }

  const audit   = JSON.parse(raw);
  const vulns   = (audit.metadata || {}).vulnerabilities || {};
  const high     = Number(vulns.high     || 0);
  const critical = Number(vulns.critical || 0);

  console.log(`[${project}] high=${high} critical=${critical}`);
  result[project] = { high, critical };
}

fs.writeFileSync(baselinePath, JSON.stringify(result, null, 2) + '\n', 'utf8');
console.log(`\nBaseline written to ${baselinePath}`);
console.log('Commit the updated file to record the new accepted baseline.');
