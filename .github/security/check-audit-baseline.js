#!/usr/bin/env node
/**
 * Audit Baseline Enforcement
 *
 * Reads ./audit.json (npm audit --json output) from the current working
 * directory, compares high/critical counts against the repo baseline stored
 * alongside this script, and exits non-zero on regression.
 *
 * Environment variables:
 *   PROJECT         (required) – which key to look up in audit-baseline.json
 *   STRICT_CRITICAL – if set to "true", any critical vulnerability causes
 *                     failure regardless of baseline (used on scheduled runs)
 *
 * Usage:
 *   cd backend && npm audit --json > audit.json
 *   node ../.github/security/check-audit-baseline.js
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const project = process.env.PROJECT;
if (!project) {
  console.error('check-audit-baseline: PROJECT env var is required.');
  process.exit(1);
}

const strictCritical = process.env.STRICT_CRITICAL === 'true';

// audit.json is expected next to the cwd (the project directory).
const auditPath    = path.join(process.cwd(), 'audit.json');
const baselinePath = path.join(__dirname, 'audit-baseline.json');

let audit, baselineAll;
try {
  audit = JSON.parse(fs.readFileSync(auditPath, 'utf8'));
} catch (e) {
  console.error(`check-audit-baseline: Could not read audit.json – ${e.message}`);
  process.exit(1);
}

try {
  baselineAll = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
} catch (e) {
  console.error(`check-audit-baseline: Could not read audit-baseline.json – ${e.message}`);
  process.exit(1);
}

const baseline = baselineAll[project];
if (!baseline) {
  console.error(`check-audit-baseline: No baseline entry for project "${project}".`);
  console.error(`  Available keys: ${Object.keys(baselineAll).join(', ')}`);
  process.exit(1);
}

const vulns   = (audit.metadata || {}).vulnerabilities || {};
const high     = Number(vulns.high     || 0);
const critical = Number(vulns.critical || 0);

console.log(`[${project}] Current  – high: ${high}, critical: ${critical}`);
console.log(`[${project}] Baseline – high: ${baseline.high}, critical: ${baseline.critical}`);

let failed = false;

if (high > baseline.high) {
  console.error(
    `[${project}] FAIL: high vulnerabilities (${high}) exceed baseline (${baseline.high}).`
  );
  failed = true;
}

if (critical > baseline.critical) {
  console.error(
    `[${project}] FAIL: critical vulnerabilities (${critical}) exceed baseline (${baseline.critical}).`
  );
  failed = true;
}

if (strictCritical && critical > 0) {
  console.error(
    `[${project}] FAIL: strict-critical mode – ${critical} critical vulnerability/ies must be zero.`
  );
  failed = true;
}

if (failed) {
  console.error('');
  console.error('To update the baseline after a deliberate dependency change, run:');
  console.error('  node .github/security/update-audit-baseline.js');
  process.exit(1);
}

console.log(`[${project}] Security baseline check passed.`);
