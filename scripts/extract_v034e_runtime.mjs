import fs from 'node:fs';
import zlib from 'node:zlib';

const dir = 'v034e';
const parts = [1, 2, 3, 4].map((n) =>
  fs.readFileSync(`${dir}/game.gz.part${String(n).padStart(2, '0')}.txt`, 'utf8').replace(/\s+/g, '')
);
const compressed = Buffer.from(parts.join(''), 'base64');
const source = zlib.gunzipSync(compressed).toString('utf8');
fs.mkdirSync('tmp-runtime', { recursive: true });
fs.writeFileSync('tmp-runtime/runtime-v034e.js', source);
console.log(`Extracted ${source.length} characters.`);
