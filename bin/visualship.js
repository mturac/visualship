#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');

const BADGE = /(shields\.io|badge|codecov\.io|coveralls\.io|\/actions\/workflows\/[^)]*\.svg|badgen\.net|img\.shields)/i;
const MEDIA = /\.(png|jpe?g|gif|webp|svg)(\?[^)\s]*)?$/i;
const INSTALL = /^\s*(\$\s*)?(npm (i|install)|npx |pnpm (add|dlx)|yarn (add|dlx)|pip3? install|pipx install|cargo install|go install|brew install|git clone)/m;
const METRIC = /(used by\s+[\d,.]+\s*[kKmM+]*|[\d,.]+\s*[kKmM]?\+?\s*(users|downloads|developers|companies|stars)\b|#1 on (product hunt|hacker news|github))/i;
const HERO_LINES = 40;

function findReadme(dir) {
  for (const n of ['README.md', 'readme.md', 'Readme.md', 'README.markdown']) {
    const p = path.join(dir, n);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function images(text) {
  const out = [];
  const lines = text.split(/\r?\n/);
  lines.forEach((line, i) => {
    for (const m of line.matchAll(/!\[[^\]]*\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g)) out.push({ src: m[1], line: i + 1 });
    for (const m of line.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)) out.push({ src: m[1], line: i + 1 });
  });
  return out;
}

function check(target) {
  const res = { fails: [], warns: [], oks: [] };
  const dir = fs.existsSync(target) && fs.statSync(target).isFile() ? path.dirname(target) : target;
  const readme = fs.existsSync(target) && fs.statSync(target).isFile() ? target : findReadme(dir);
  if (!readme) { res.fails.push('README missing'); return res; }
  const text = fs.readFileSync(readme, 'utf8');
  const imgs = images(text);
  const nonBadge = imgs.filter((i) => !BADGE.test(i.src));
  if (imgs.length && !nonBadge.length) res.fails.push(`only badges (${imgs.length}) — no hero visual`);
  else if (!imgs.length) res.fails.push('no image in README — add a screenshot/GIF hero');
  let hero = null;
  for (const img of nonBadge) {
    if (/^https?:\/\//i.test(img.src)) {
      if (!MEDIA.test(img.src)) { res.fails.push(`line ${img.line}: remote image does not look like media: ${img.src}`); continue; }
    } else {
      const p = path.resolve(path.dirname(readme), decodeURIComponent(img.src.split(/[?#]/)[0]));
      if (!fs.existsSync(p)) { res.fails.push(`line ${img.line}: broken local image path: ${img.src}`); continue; }
    }
    if (img.line > HERO_LINES) { res.fails.push(`line ${img.line}: image below the fold (>${HERO_LINES} lines): ${img.src}`); continue; }
    hero = hero || img;
  }
  if (hero) { res.oks.push(`hero visual: ${hero.src} (line ${hero.line})`); res.fails = res.fails.filter((f) => !/broken|below|look like/.test(f)) .concat(res.fails.filter((f) => /broken/.test(f))); }
  if (!INSTALL.test(text)) res.warns.push('no install one-liner (npm/npx/pip/cargo/go install/brew/git clone)');
  text.replace(/```[\s\S]*?```/g, (b) => b.replace(/[^\n]/g, '')).split(/\r?\n/).forEach((raw, i) => {
    const line = raw.replace(/`[^`]*`/g, '');
    if (METRIC.test(line) && !/\]\(https?:\/\//.test(line) && !/https?:\/\//.test(line.replace(/!\[[^\]]*\]\([^)]*\)/g, '')))
      res.warns.push(`line ${i + 1}: unsourced metric claim: "${raw.trim().slice(0, 80)}"`);
  });
  if (!hero && !res.fails.length) res.fails.push('no valid hero visual above the fold');
  return res;
}

function main(argv) {
  const [cmd, target = '.'] = argv;
  if (cmd !== 'check') {
    console.log('usage: visualship check <path>\nNo hero, no ship.');
    return cmd === '-h' || cmd === '--help' ? 0 : 2;
  }
  const r = check(target);
  r.oks.forEach((m) => console.log(`OK    ${m}`));
  r.fails.forEach((m) => console.log(`FAIL  ${m}`));
  r.warns.forEach((m) => console.log(`WARN  ${m}`));
  const v = r.fails.length ? 'FAIL' : r.warns.length ? 'WARN' : 'PASS';
  console.log(`VERDICT\t${v}`);
  return v === 'FAIL' ? 1 : 0;
}

if (require.main === module) process.exitCode = main(process.argv.slice(2));
module.exports = { check };
