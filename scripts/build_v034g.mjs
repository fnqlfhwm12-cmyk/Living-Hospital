import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const fromVersion = 'v0.3.4.f';
const toVersion = 'v0.3.4.g';
const fromSlug = 'v034f';
const toSlug = 'v034g';
const fromFile = 'Living_Hospital_v0.3.4.f.html';
const toFile = 'Living_Hospital_v0.3.4.g.html';

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}
function write(rel, content) {
  const full = path.join(root, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'utf8');
}
function replaceRequired(source, needle, replacement, label) {
  const first = source.indexOf(needle);
  if (first < 0) throw new Error(`${label}: 교체 대상을 찾지 못했습니다.`);
  if (source.indexOf(needle, first + needle.length) >= 0) throw new Error(`${label}: 교체 대상이 두 번 이상 발견되었습니다.`);
  return source.slice(0, first) + replacement + source.slice(first + needle.length);
}

const partFiles = fs.readdirSync(path.join(root, fromSlug))
  .filter(name => /^game\.gz\.part\d+\.txt$/.test(name))
  .sort();
if (!partFiles.length) throw new Error(`${fromSlug} 압축 파트를 찾지 못했습니다.`);
const packedBase64 = partFiles.map(name => read(path.join(fromSlug, name))).join('').replace(/\s+/g, '');
let runtime = zlib.gunzipSync(Buffer.from(packedBase64, 'base64')).toString('utf8');

if (!runtime.includes('const WARD_BOUNDS=')) throw new Error('WARD_BOUNDS 정의를 찾지 못했습니다.');
const oldCameraFollow = " camera.x+=(player.x-camera.x)*Math.min(1,dt*5.8);camera.y+=(player.y-camera.y)*Math.min(1,dt*5.8);";
const newCameraFollow = " const cameraLimitX=Math.max(0,WARD_BOUNDS.halfW-W*.5),cameraLimitY=Math.max(0,WARD_BOUNDS.halfH-H*.5);const cameraTargetX=Math.max(-cameraLimitX,Math.min(cameraLimitX,player.x)),cameraTargetY=Math.max(-cameraLimitY,Math.min(cameraLimitY,player.y));camera.x+=(cameraTargetX-camera.x)*Math.min(1,dt*5.8);camera.y+=(cameraTargetY-camera.y)*Math.min(1,dt*5.8);";
runtime = replaceRequired(runtime, oldCameraFollow, newCameraFollow, '카메라 경계 처리');

const tempRuntime = path.join(root, '.tmp-runtime-v034g.js');
fs.writeFileSync(tempRuntime, runtime, 'utf8');
const syntax = spawnSync(process.execPath, ['--check', tempRuntime], { encoding: 'utf8' });
fs.rmSync(tempRuntime, { force: true });
if (syntax.status !== 0) throw new Error(`런타임 문법 검사 실패\n${syntax.stderr || syntax.stdout}`);

const WARD_TEST = { halfW: 2300, halfH: 1400 };
function clampCamera(player, viewport, halfMap) {
  const limit = Math.max(0, halfMap - viewport * .5);
  return Math.max(-limit, Math.min(limit, player));
}
for (const [w, h] of [[812, 311], [932, 430], [667, 375]]) {
  const cx = clampCamera(WARD_TEST.halfW - 48, w, WARD_TEST.halfW);
  const cy = clampCamera(WARD_TEST.halfH - 48, h, WARD_TEST.halfH);
  const sx = WARD_TEST.halfW - 48 - cx + w * .5;
  const sy = WARD_TEST.halfH - 48 - cy + h * .5;
  if (!(sx < w && sx > w - 90)) throw new Error(`가로 카메라 경계 테스트 실패: ${w}x${h}, screenX=${sx}`);
  if (!(sy < h && sy > h - 90)) throw new Error(`세로 카메라 경계 테스트 실패: ${w}x${h}, screenY=${sy}`);
}

const gzip = zlib.gzipSync(Buffer.from(runtime, 'utf8'), { level: 9 });
const encoded = gzip.toString('base64');
const chunkSize = 64000;
const chunks = [];
for (let i = 0; i < encoded.length; i += chunkSize) chunks.push(encoded.slice(i, i + chunkSize));
fs.rmSync(path.join(root, toSlug), { recursive: true, force: true });
chunks.forEach((chunk, index) => {
  const wrapped = chunk.match(/.{1,120}/g)?.join('\n') ?? '';
  write(path.join(toSlug, `game.gz.part${String(index + 1).padStart(2, '0')}.txt`), `${wrapped}\n`);
});

let loader = read(fromFile)
  .replaceAll(fromVersion, toVersion)
  .replaceAll(fromSlug, toSlug)
  .replaceAll('034f', '034g');
const partList = chunks.map((_, index) => `\"${toSlug}/game.gz.part${String(index + 1).padStart(2, '0')}.txt\"`).join(',');
loader = loader.replace(/const parts=\[[^\]]+\];/, `const parts=[${partList}];`);
write(toFile, loader);

let index = read('index.html')
  .replaceAll(fromFile, toFile)
  .replaceAll('034f', '034g');
write('index.html', index);

let playtest = read('playtest.html')
  .replaceAll(fromFile, toFile)
  .replaceAll('034f', '034g');
write('playtest.html', playtest);

let readme = read('README.md')
  .replaceAll(fromFile, toFile)
  .replaceAll(fromVersion, toVersion);
write('README.md', readme);

let agents = read('AGENTS.md')
  .replaceAll(fromFile, toFile)
  .replaceAll(fromVersion, toVersion);
write('AGENTS.md', agents);

let status = read('docs/PROJECT_STATUS.md');
status = status.replace('다음 게임 버전 후보: `v0.3.4.g`', '다음 게임 버전 후보: `v0.3.4.h`');
status = status.replaceAll(fromFile, toFile).replaceAll(fromVersion, toVersion);
write('docs/PROJECT_STATUS.md', status);

let changelog = read('docs/CHANGELOG.md').trimEnd();
if (!changelog.includes('## v0.3.4.g - 2026-08-01')) {
  changelog += `\n\n## v0.3.4.g - 2026-08-01\n\n- 맵 경계에 가까워지면 카메라가 플레이어를 계속 중앙에 고정하지 않고 병실 경계에서 멈추도록 변경\n- 플레이어는 벽 쪽으로 이동할수록 화면 가장자리로 이동해 보이지 않는 외곽 충돌 경계를 자연스럽게 인지 가능\n- iPhone 가로 화면 크기에 따라 카메라 이동 가능 범위를 실시간 계산하도록 처리\n- 보스 등장·사망 연출의 기존 강제 카메라 이동은 유지\n`;
}
write('docs/CHANGELOG.md', changelog);

write('UPDATE_v0.3.4.g.md', `# Living Hospital ${toVersion}\n\n## 변경\n\n- 맵 외곽 접근 시 카메라 추적 범위를 병실 내부로 제한했습니다.\n- 플레이어가 벽에 가까워지면 카메라는 멈추고 플레이어만 화면 가장자리 쪽으로 이동합니다.\n- 숨겨진 외벽을 직접 노출하지 않으면서 이동 경계를 읽을 수 있도록 했습니다.\n- 보스 시네마틱 카메라 동작은 변경하지 않았습니다.\n\n## 확인 항목\n\n- 상하좌우 외곽에서 플레이어가 화면 가장자리로 자연스럽게 이동하는지\n- 카메라 정지가 급격하거나 흔들리지 않는지\n- iPhone Safari 가로 화면에서 외벽 인지가 개선됐는지\n`);

console.log(`${toVersion} 생성 완료: ${chunks.length} parts, runtime ${runtime.length} bytes`);
