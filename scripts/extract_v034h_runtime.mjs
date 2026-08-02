import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const root = process.cwd();
const slug = 'v034h';
const partsDir = path.join(root, slug);
const partFiles = fs.readdirSync(partsDir)
  .filter(name => /^game\.gz\.part\d+\.txt$/.test(name))
  .sort();

if (!partFiles.length) throw new Error('v034h 압축 파트를 찾지 못했습니다.');

const packed = partFiles
  .map(name => fs.readFileSync(path.join(partsDir, name), 'utf8'))
  .join('')
  .replace(/\s+/g, '');
const runtime = zlib.gunzipSync(Buffer.from(packed, 'base64')).toString('utf8');

const outDir = path.join(root, 'debug');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'runtime-v034h.js'), runtime, 'utf8');

const keywords = [
  'actionButton', 'xpFill', 'gainXp', 'gainXP', 'levelUp', 'openLevel',
  'weapons', 'passives', 'relic', 'artifact', 'organ', 'WARD_BOUNDS',
  'generateWard', 'buildWard', 'minimap', 'specimen', 'player', 'drawWard'
];
const contexts = [];
for (const keyword of keywords) {
  let from = 0;
  let count = 0;
  while (count < 12) {
    const index = runtime.indexOf(keyword, from);
    if (index < 0) break;
    const start = Math.max(0, index - 420);
    const end = Math.min(runtime.length, index + keyword.length + 720);
    contexts.push(`\n===== ${keyword} @ ${index} =====\n${runtime.slice(start, end)}\n`);
    from = index + keyword.length;
    count += 1;
  }
}
fs.writeFileSync(path.join(outDir, 'runtime-v034h-contexts.txt'), contexts.join('\n'), 'utf8');

const symbols = new Set();
for (const match of runtime.matchAll(/\bfunction\s+([A-Za-z_$][\w$]*)\s*\(/g)) symbols.add(`function ${match[1]}`);
for (const match of runtime.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/g)) symbols.add(`arrow ${match[1]}`);
for (const match of runtime.matchAll(/\bclass\s+([A-Za-z_$][\w$]*)\b/g)) symbols.add(`class ${match[1]}`);
fs.writeFileSync(path.join(outDir, 'runtime-v034h-symbols.txt'), [...symbols].sort().join('\n') + '\n', 'utf8');

console.log(`runtime ${runtime.length} bytes, contexts ${contexts.length}, symbols ${symbols.size}`);
