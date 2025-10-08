#!/usr/bin/env node
/*
  move-ui-to-src.js
  Usage:
    node tools/scripts/move-ui-to-src.js        # dry-run (no changes)
    node tools/scripts/move-ui-to-src.js --apply   # perform git mv and replacements

  What it does:
  - Detects files under "Classes/systems/ui" and calculates the equivalent path under "src/core/systems/ui".
  - Shows a dry-run list of proposed git mv operations and file edits (search-and-replace of "Classes/systems/ui" -> "src/core/systems/ui").
  - If --apply is passed, performs git mv for each file (preserves history) and updates textual references in project files.

  Notes:
  - This script assumes you're running from the project root and have git installed.
  - It will not overwrite files in the destination path; it will stop if conflicts appear.
  - Non-JS/docs edits are treated as plain text replacements; review the dry-run output before applying.
*/

const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

const ROOT = process.cwd();
const SRC_UI = path.join('src', 'core', 'systems', 'ui');
const OLD_UI = path.join('Classes', 'systems', 'ui');

function collectFiles(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      out.push(...collectFiles(full));
    } else if (e.isFile()) {
      out.push(full);
    }
  }
  return out;
}

function mapOldToNew(oldPath) {
  // oldPath is absolute or relative to cwd
  const rel = path.relative(ROOT, oldPath);
  if (!rel.startsWith(OLD_UI.replace(/\\/g, '/')) && !rel.startsWith(OLD_UI)) {
    throw new Error('Not an old UI path: ' + rel);
  }
  const newRel = rel.replace(new RegExp('^' + OLD_UI.replace(/\\/g, '\\\\')), SRC_UI.replace(/\\/g, '/'));
  return path.join(ROOT, newRel);
}

function printHeader() {
  console.log('\n--- Move UI to src/core/systems/ui (git-safe) ---\n');
}

function run() {
  printHeader();
  const apply = process.argv.includes('--apply');

  const oldDir = path.join(ROOT, OLD_UI);
  if (!fs.existsSync(oldDir)) {
    console.error('Source UI directory does not exist:', oldDir);
    process.exit(1);
  }

  const files = collectFiles(oldDir).map(p => path.relative(ROOT, p));
  if (files.length === 0) {
    console.log('No files found under', OLD_UI);
    process.exit(0);
  }

  // Prepare mappings
  const moves = files.map(f => {
    const dest = f.replace(new RegExp('^' + OLD_UI.replace(/\\/g, '\\\\')), SRC_UI.replace(/\\/g, '/'));
    return { from: f, to: dest };
  });

  console.log('Proposed git mv operations:');
  for (const m of moves) console.log(`  git mv "${m.from}" "${m.to}"`);

  // Replacement plan: replace textual occurrences of Classes/systems/ui -> src/core/systems/ui
  const replacements = [
    { search: /Classes\/systems\/ui/g, replace: 'src/core/systems/ui' },
    { search: /\.\/Classes\/systems\/ui/g, replace: './src/core/systems/ui' },
    { search: /'\.\.\/Classes\/systems\/ui/g, replace: "'../../src/core/systems/ui" },
    { search: /\"\.\.\/Classes\/systems\/ui/g, replace: '\"../../src/core/systems/ui' }
  ];

  console.log('\nPlanned textual replacements (preview):');
  for (const r of replacements) console.log(`  ${r.search}  ->  ${r.replace}`);

  // Where to apply replacements? simple approach: scan all project files (skip node_modules, .git)
  console.log('\nScanning project files to apply textual replacements...');
  const allFiles = collectFiles(ROOT).map(p => path.relative(ROOT, p)).filter(p => {
    if (p.startsWith('node_modules') || p.startsWith('.git')) return false;
    if (p.includes('tools/scripts/move-ui-to-src.js')) return false; // skip our script
    return true;
  });

  const candidates = [];
  for (const f of allFiles) {
    // only text files worth checking
    const ext = path.extname(f).toLowerCase();
    const textExts = ['.js', '.json', '.html', '.md', '.ts', '.jsx', '.tsx', '.yml', '.yaml'];
    if (!textExts.includes(ext) && ext !== '') continue;
    try {
      const content = fs.readFileSync(path.join(ROOT, f), 'utf8');
      let found = false;
      for (const r of replacements) {
        if (r.search.test(content)) { found = true; break; }
      }
      if (found) candidates.push(f);
    } catch (e) {
      // ignore binary or unreadable files
    }
  }

  console.log(`\nFiles that will be updated (${candidates.length}):`);
  for (const c of candidates) console.log('  ', c);

  if (!apply) {
    console.log('\nDry run complete. If output looks good, re-run with --apply to perform git mv and update files.');
    process.exit(0);
  }

  // APPLY: perform git mv for each file and apply replacements
  // Ensure destination dirs exist
  for (const m of moves) {
    const destDir = path.dirname(m.to);
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  }

  // Perform git mv operations
  console.log('\nApplying git mv operations...');
  for (const m of moves) {
    try {
      // If destination already exists, fail to avoid overwriting
      if (fs.existsSync(m.to)) {
        console.error('Destination already exists, skipping git mv to avoid overwrite:', m.to);
        continue;
      }
      const res = spawnSync('git', ['mv', m.from, m.to], { stdio: 'inherit' });
      if (res.status !== 0) {
        console.error('git mv failed for', m.from);
        process.exit(1);
      }
      console.log('Moved', m.from, '->', m.to);
    } catch (e) {
      console.error('Error moving', m.from, e.message);
      process.exit(1);
    }
  }

  // Apply textual replacements
  console.log('\nApplying textual replacements...');
  for (const f of candidates) {
    const fp = path.join(ROOT, f);
    let content = fs.readFileSync(fp, 'utf8');
    let updated = content;
    for (const r of replacements) updated = updated.replace(r.search, r.replace);
    if (updated !== content) {
      fs.writeFileSync(fp, updated, 'utf8');
      console.log('Updated', f);
    }
  }

  console.log('\nAll operations complete. Please run git status, review changes, and commit.');
}

run();
