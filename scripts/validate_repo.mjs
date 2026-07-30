import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const failures = [];
const notes = [];

function fail(message) { failures.push(message); }
function note(message) { notes.push(message); }
function read(rel) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) {
    fail(`필수 파일 없음: ${rel}`);
    return '';
  }
  return fs.readFileSync(full, 'utf8');
}
function suffixValue(suffix) {
  return [...suffix].reduce((value, char) => value * 26 + (char.charCodeAt(0) - 96), 0);
}
function compareBuilds(a, b) {
  for (let i = 0; i < 3; i += 1) {
    if (a.version[i] !== b.version[i]) return a.version[i] - b.version[i];
  }
  return suffixValue(a.suffix) - suffixValue(b.suffix);
}
function extractBuild(file) {
  const match = file.match(/^Living_Hospital_v(\d+)\.(\d+)\.(\d+)\.([a-z]+)\.html$/i);
  if (!match) return null;
  return {
    file,
    version: match.slice(1, 4).map(Number),
    suffix: match[4].toLowerCase(),
    label: `v${match[1]}.${match[2]}.${match[3]}.${match[4].toLowerCase()}`,
  };
}
function getIds(html) {
  return [...html.matchAll(/\bid\s*=\s*["']([^"']+)["']/gi)].map((match) => match[1]);
}
function checkDuplicateIds(rel, html) {
  const counts = new Map();
  for (const id of getIds(html)) counts.set(id, (counts.get(id) ?? 0) + 1);
  const duplicates = [...counts.entries()].filter(([, count]) => count > 1);
  if (duplicates.length) {
    fail(`${rel}: 중복 id 발견 — ${duplicates.map(([id, count]) => `${id}×${count}`).join(', ')}`);
  }
}
function checkInlineScripts(rel, html) {
  const scripts = [];
  const pattern = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(pattern)) {
    const attrs = match[1] ?? '';
    const code = match[2] ?? '';
    if (/\bsrc\s*=/i.test(attrs)) continue;
    const type = attrs.match(/\btype\s*=\s*["']([^"']+)["']/i)?.[1]?.toLowerCase();
    if (type && !['text/javascript', 'application/javascript', 'module'].includes(type)) continue;
    scripts.push(code);
  }
  if (!scripts.length) {
    note(`${rel}: 검사할 인라인 JavaScript 없음`);
    return;
  }
  const tempFile = path.join(os.tmpdir(), `living-hospital-${process.pid}-${path.basename(rel)}.js`);
  fs.writeFileSync(tempFile, scripts.join('\n;\n'), 'utf8');
  const result = spawnSync(process.execPath, ['--check', tempFile], { encoding: 'utf8' });
  fs.rmSync(tempFile, { force: true });
  if (result.status !== 0) {
    fail(`${rel}: JavaScript 문법 오류\n${(result.stderr || result.stdout).trim()}`);
  }
}
function checkHtml(rel, html) {
  if (!/^\s*<!doctype html>/i.test(html)) fail(`${rel}: <!doctype html> 누락`);
  if (!/<html\b/i.test(html) || !/<\/html>\s*$/i.test(html)) fail(`${rel}: HTML 루트 구조 이상`);
  if (/^(<<<<<<<|=======|>>>>>>>)/m.test(html)) fail(`${rel}: 병합 충돌 표시 발견`);
  checkDuplicateIds(rel, html);
  checkInlineScripts(rel, html);
}

const rootFiles = fs.readdirSync(root, { withFileTypes: true })
  .filter((entry) => entry.isFile())
  .map((entry) => entry.name);
const builds = rootFiles.map(extractBuild).filter(Boolean).sort(compareBuilds);
if (!builds.length) {
  fail('Living_Hospital_v*.html 빌드를 찾지 못함');
} else {
  const latest = builds.at(-1);
  const gameHtml = read(latest.file);
  checkHtml(latest.file, gameHtml);
  if (!new RegExp(`<title>[^<]*${latest.label.replaceAll('.', '\\.')}`, 'i').test(gameHtml)) {
    fail(`${latest.file}: <title>에 ${latest.label} 버전이 표시되지 않음`);
  }

  const readme = read('README.md');
  const status = read('docs/PROJECT_STATUS.md');
  const agents = read('AGENTS.md');
  const index = read('index.html');
  const playtest = fs.existsSync(path.join(root, 'playtest.html')) ? read('playtest.html') : '';

  for (const [rel, content] of [['README.md', readme], ['docs/PROJECT_STATUS.md', status], ['AGENTS.md', agents]]) {
    if (content && !content.includes(latest.file)) fail(`${rel}: 최신 빌드 ${latest.file} 참조 누락`);
  }

  const redirectTargets = [
    ...index.matchAll(/(?:url=|location\.replace\()\s*["']?\.?\/?([^"')>\s;]+)/gi),
  ].map((match) => match[1]);
  if (!index.includes(latest.file)) fail(`index.html: 최신 빌드 ${latest.file}를 가리키지 않음`);
  for (const target of redirectTargets) {
    const normalized = target.replace(/^\.\//, '');
    if (normalized.endsWith('.html') && !fs.existsSync(path.join(root, normalized))) {
      fail(`index.html: 존재하지 않는 대상 참조 — ${normalized}`);
    }
  }

  if (playtest) {
    checkHtml('playtest.html', playtest);
    if (!playtest.includes(latest.file)) fail(`playtest.html: 최신 빌드 ${latest.file}를 가리키지 않음`);
  }

  note(`최신 빌드: ${latest.file}`);
  note(`보존된 버전 파일: ${builds.length}개`);
}

for (const rel of ['README.md', 'AGENTS.md', 'docs/PROJECT_STATUS.md', 'docs/CHANGELOG.md']) {
  const content = read(rel);
  if (/^(<<<<<<<|=======|>>>>>>>)/m.test(content)) fail(`${rel}: 병합 충돌 표시 발견`);
}

console.log('Living Hospital 저장소 검사');
for (const message of notes) console.log(`- ${message}`);
if (failures.length) {
  console.error(`\n검사 실패 ${failures.length}건`);
  for (const message of failures) console.error(`- ${message}`);
  process.exit(1);
}
console.log('\n검사 통과');
