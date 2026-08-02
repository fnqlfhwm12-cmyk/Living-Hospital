import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const fromVersion = 'v0.4.0.a';
const toVersion = 'v0.4.0.b';
const fromSlug = 'v040a';
const toSlug = 'v040b';
const fromFile = 'Living_Hospital_v0.4.0.a.html';
const toFile = 'Living_Hospital_v0.4.0.b.html';

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
function replaceRegexRequired(source, pattern, replacement, label) {
  const matches = source.match(pattern);
  if (!matches) throw new Error(`${label}: 교체 대상을 찾지 못했습니다.`);
  return source.replace(pattern, replacement);
}

const partFiles = fs.readdirSync(path.join(root, fromSlug))
  .filter(name => /^game\.gz\.part\d+\.txt$/.test(name))
  .sort();
if (!partFiles.length) throw new Error(`${fromSlug} 압축 파트를 찾지 못했습니다.`);
const packedBase64 = partFiles.map(name => read(path.join(fromSlug, name))).join('').replace(/\s+/g, '');
let runtime = zlib.gunzipSync(Buffer.from(packedBase64, 'base64')).toString('utf8');

const compactRuntime = String.raw`

// v0.4.0.b: compact HUD, six-step heart health, explored-room minimap and silent specimen collection.
function renderHeartHud(){
 const root=document.getElementById('heartHud');if(!root)return;const units=Math.max(0,Math.min(6,Math.floor((player.hp||0)+.0001))),key=String(units);if(root.dataset.units===key)return;root.dataset.units=key;let html='';for(let i=0;i<3;i++){const left=Math.max(0,Math.min(2,units-i*2)),fill=left>=2?100:left===1?50:0;html+='<span class="heartUnit"><span class="heartBase">♥</span><span class="heartFill" style="width:'+fill+'%">♥</span></span>';}root.innerHTML=html;
}
function renderCompactRelics(){
 const root=document.getElementById('relicHud');if(!root)return;root.innerHTML=relicInventory.map(function(key){const d=STRUCTURE_RELICS[key];return d?'<span class="relicHudItem" title="'+d.name+'">'+d.icon+'</span>':'';}).join('');
}
function updateCompactHud(){
 const primary=document.getElementById('primaryWeaponValue'),secondary=document.getElementById('secondaryWeaponValue');if(primary)primary.textContent=primaryWeaponKey?(weapons[primaryWeaponKey]?.icon||'·'):'·';if(secondary)secondary.textContent=secondaryWeaponKey?(weapons[secondaryWeaponKey]?.icon||'·'):'—';const count=document.getElementById('specimenCount');if(count)count.textContent=Number(runSpecimens||0).toLocaleString('ko-KR');renderHeartHud();renderCompactRelics();
}
updateStructureHud=updateCompactHud;

const v040bLegacyRenderOrganHud=renderOrganHud;
renderOrganHud=function(){v040bLegacyRenderOrganHud();updateCompactHud();};

const v040bLegacyGenerateWorld=generateWorld;
generateWorld=function(){
 v040bLegacyGenerateWorld();const specimenNode=structureNodeById('specimenLab');if(specimenNode){const objectIndex=objects.indexOf(specimenNode);if(objectIndex>=0)objects.splice(objectIndex,1);structureRewardNodes=structureRewardNodes.filter(function(node){return node!==specimenNode;});}structureVisitedRooms.add('start');structureLastRoom='start';
};

drawMinimapBase=function(){
 const c=minimapCtx;c.fillStyle='#090909';c.fillRect(0,0,MINIMAP.w,MINIMAP.h);c.save();c.beginPath();c.rect(MINIMAP.pad,MINIMAP.pad,MINIMAP.w-MINIMAP.pad*2,MINIMAP.h-MINIMAP.pad*2);c.clip();
 for(const z of zones){if(!z.structureRoom&&!z.structureCorridor)continue;const r=minimapRect(z.x-z.w*.5,z.y-z.h*.5,z.w,z.h);if(z.structureCorridor){c.fillStyle='#181516';c.fillRect(r.x,r.y,r.w,r.h);continue;}const visited=structureVisitedRooms.has(z.id);c.fillStyle=visited?'#302829':'#151213';c.fillRect(r.x,r.y,r.w,r.h);c.strokeStyle=visited?'#80696c':'#342d2f';c.lineWidth=visited?1:.7;c.strokeRect(r.x+.5,r.y+.5,Math.max(0,r.w-1),Math.max(0,r.h-1));}
 c.restore();c.strokeStyle='#ffffff33';c.strokeRect(.5,.5,MINIMAP.w-1,MINIMAP.h-1);
};
renderMinimap=function(){
 drawMinimapBase();for(const node of structureRewardNodes){if(node.claimed||!structureVisitedRooms.has(node.roomId))continue;const m=minimapPoint(node.x+node.w*.5,node.y+node.h*.5);minimapCtx.fillStyle=structureNodeReady(node)?'#f2e8d8':'#776b6e';minimapCtx.fillRect(m.x-1.5,m.y-1.5,3,3);}const p=minimapPoint(player.x,player.y);minimapCtx.save();minimapCtx.translate(p.x,p.y);minimapCtx.fillStyle='#fff';minimapCtx.strokeStyle='#111';minimapCtx.lineWidth=1;minimapCtx.beginPath();minimapCtx.moveTo(0,-5);minimapCtx.lineTo(4,4);minimapCtx.lineTo(0,2.5);minimapCtx.lineTo(-4,4);minimapCtx.closePath();minimapCtx.fill();minimapCtx.stroke();minimapCtx.restore();
};

const v040bLegacyApplyPlayerDamage=applyPlayerDamage;
applyPlayerDamage=function(raw,invuln=.45){
 if(player.invuln>0||raw<=0)return false;const factor=Math.max(.0001,(player.damageTakenMult||1)*(organMods.damageTaken||1)),result=v040bLegacyApplyPlayerDamage(1/factor,invuln);player.maxHp=6;player.hp=Math.max(0,Math.min(6,player.hp));renderHeartHud();return result;
};
const v040bLegacyApplyPassive=applyPassive;
applyPassive=function(key){const hpBefore=player.hp;v040bLegacyApplyPassive(key);player.maxHp=6;if(key==='density')player.hp=hpBefore;player.hp=Math.max(0,Math.min(6,player.hp));updateCompactHud();};

spawnXpOrb=function(x,y,v){gainXp(v);};

const v040bLegacyReset=reset;
reset=function(){
 v040bLegacyReset();player.maxHp=6;player.hp=6;player.shield=0;player.residualDamage=0;structureVisitedRooms.add('start');structureLastRoom='start';renderOrganHud();updateCompactHud();renderMinimap();
};

const v040bLegacyUpdate=update;
update=function(dt){
 const visitedBefore=structureVisitedRooms.size;v040bLegacyUpdate(dt);player.maxHp=6;player.hp=Math.max(0,Math.min(6,player.hp));const room=structureRoomAt(player.x,player.y);if(room&&room.id==='leftLab'&&!structureClaimedNodes.has('specimenLab')){creditSpecimens(100+structureFloor*40);structureClaimedNodes.add('specimenLab');updateCompactHud();renderMinimap();syncActionButton();toast('보존된 검체가 가까이 닿기 전에 몸으로 스며듭니다.');}if(structureVisitedRooms.size!==visitedBefore)renderMinimap();renderHeartHud();
};

`;

runtime = replaceRequired(runtime, 'ui.confirmSelectionBtn.onclick=', compactRuntime + '\nui.confirmSelectionBtn.onclick=', 'v0.4.0.b 런타임 삽입');
runtime = replaceRequired(
  runtime,
  'ui.actionButton.onclick=useActionButton;',
  "ui.actionButton.addEventListener('touchstart',event=>{if(paused||gameOver)return;event.preventDefault();event.stopPropagation();ui.actionButton.dataset.lastTouch=String(performance.now());useActionButton();},{passive:false});ui.actionButton.onclick=()=>{if(performance.now()-Number(ui.actionButton.dataset.lastTouch||0)<500)return;useActionButton();};",
  '이동 중 스왑 터치 입력'
);

const tempRuntime = path.join(root, '.tmp-runtime-v040b.js');
fs.writeFileSync(tempRuntime, runtime, 'utf8');
const syntax = spawnSync(process.execPath, ['--check', tempRuntime], { encoding: 'utf8' });
fs.rmSync(tempRuntime, { force: true });
if (syntax.status !== 0) throw new Error(`런타임 문법 검사 실패\n${syntax.stderr || syntax.stdout}`);

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
  .replaceAll('040a', '040b');
loader = loader.replace(/const parts=\[[^\]]+\];/, `const parts=[${chunks.map((_, index) => `\"${toSlug}/game.gz.part${String(index + 1).padStart(2, '0')}.txt\"`).join(',')}];`);

loader = replaceRegexRequired(
  loader,
  /  <div id="topLeft">[\s\S]*?  <div id="topCenter">/,
  `  <div id="topLeft">\n    <div id="healthRow">\n      <div id="heartHud" aria-label="체력 하트 3개"></div>\n      <div id="specialHud" aria-label="장기와 유물"><div id="organHud" aria-label="메인 장기"></div><div id="relicHud" aria-label="획득 유물"></div></div>\n    </div>\n    <div id="weaponHud" aria-label="획득 무기"><span class="weaponHudSlot primary"><span id="primaryWeaponValue">·</span></span><span class="weaponHudSwap">⇄</span><span class="weaponHudSlot secondary"><span id="secondaryWeaponValue">—</span></span></div>\n    <div id="specimenHud" aria-label="이번 플레이에서 회수한 검체"><span class="specimenVial" aria-hidden="true"></span><span id="specimenCount">0</span></div>\n    <span id="hpDebtFill" hidden></span><span id="hpFill" hidden></span><span id="xpFill" hidden></span>\n  </div>\n  <div id="topCenter">`,
  '좌측 상단 HUD 교체'
);
loader = replaceRegexRequired(
  loader,
  /\n\s*<div id="specimenHud" aria-label="이번 플레이에서 회수한 검체">[\s\S]*?<\/div>\n\s*<div id="structureHud" aria-label="현재 층과 장비">[\s\S]*?<\/div>/,
  '',
  '기존 검체·구조 HUD 제거'
);

const compactCss = String.raw`
#topLeft{position:absolute!important;left:max(10px,env(safe-area-inset-left))!important;top:max(8px,env(safe-area-inset-top))!important;display:flex!important;flex-direction:column!important;align-items:flex-start!important;gap:5px!important;width:auto!important;pointer-events:none}
#healthRow{display:flex;align-items:center;gap:7px;height:30px}
#heartHud{display:flex;align-items:center;gap:2px;height:28px}
.heartUnit{position:relative;display:inline-block;width:25px;height:27px;font:900 27px/27px -apple-system,BlinkMacSystemFont,sans-serif;filter:drop-shadow(0 2px 3px #000a)}
.heartBase,.heartFill{position:absolute;left:0;top:0;display:block;overflow:hidden;white-space:nowrap}.heartBase{width:100%;color:#4c3437;-webkit-text-stroke:1px #d8c9c5}.heartFill{color:#d84f59;-webkit-text-stroke:1px #f0d7d4}
#specialHud{display:flex;align-items:center;gap:4px;min-height:28px}
#organHud{width:auto!important;height:28px!important;display:flex!important;align-items:center!important}.organSlot{width:28px!important;height:28px!important;border-radius:7px!important;font-size:17px!important}.organSlot.empty{display:none!important}
#relicHud{display:flex;align-items:center;gap:3px}.relicHudItem{width:25px;height:25px;display:flex;align-items:center;justify-content:center;border:1px solid #ffffff70;border-radius:6px;background:#171313e8;font-size:15px;box-shadow:0 2px 5px #0008}
#weaponHud{display:flex;align-items:center;gap:4px;height:28px}.weaponHudSlot{width:31px;height:27px;display:flex;align-items:center;justify-content:center;box-sizing:border-box;border:1px solid #ffffff68;border-radius:7px;background:#171313e8;font-size:18px;box-shadow:0 2px 5px #0008}.weaponHudSlot.primary{border:2px solid #eee}.weaponHudSlot.secondary{opacity:.72}.weaponHudSwap{font-size:12px;opacity:.56}
#specimenHud{position:static!important;right:auto!important;top:auto!important;min-width:0!important;width:auto!important;height:21px!important;padding:0 6px!important;justify-content:flex-start!important;gap:5px!important;background:#130f0fc9!important;font-size:11px!important;border-radius:6px!important;transform-origin:left center!important}
#topCenter,#debug,#structureHud{display:none!important}
@media(max-height:430px){#topLeft{top:max(6px,env(safe-area-inset-top))!important;gap:3px!important}#healthRow{height:26px}.heartUnit{width:22px;height:24px;font-size:24px;line-height:24px}#organHud{height:25px!important}.organSlot{width:25px!important;height:25px!important;font-size:15px!important}.relicHudItem{width:23px;height:23px;font-size:13px}.weaponHudSlot{width:28px;height:24px;font-size:16px}#weaponHud{height:24px}#specimenHud{height:19px!important;font-size:10px!important}}
`;
loader = replaceRequired(loader, '</style>', `${compactCss}\n</style>`, '컴팩트 HUD CSS');
write(toFile, loader);

for (const rel of ['index.html', 'playtest.html']) {
  const content = read(rel).replaceAll(fromFile, toFile).replaceAll(fromVersion, toVersion).replaceAll('040a', '040b');
  write(rel, content);
}
write('README.md', read('README.md').replaceAll(fromFile, toFile).replaceAll(fromVersion, toVersion));
write('AGENTS.md', read('AGENTS.md').replaceAll(fromFile, toFile).replaceAll(fromVersion, toVersion));
write('docs/PROJECT_STATUS.md', `# 프로젝트 상태\n\n마지막 갱신: 2026-08-02\n\n## 현재 기준\n\n- 저장소 기준 최신 빌드: **${toVersion}**\n- 기준 파일: \`${toFile}\`\n- 주 테스트 환경: iPhone 가로 화면\n\n## 이번 수정\n\n1. A버튼을 이동 조작과 동시에 누를 수 있도록 터치 시작 시점에 스왑 처리\n2. 좌측 상단 HUD를 하트 체력, 장기·유물, 무기 두 칸, 검체 순서로 재배치\n3. 체력을 하트 3개, 총 6칸으로 변경하고 유효 피격당 반 칸 감소\n4. 진행 시간과 화면 디버그 문구 숨김\n5. 방문하지 않은 방은 미니맵에서 어두운 실루엣으로만 표시\n6. 적 처치 검체는 구슬을 생성하지 않고 자동 회수\n7. 검체 보관실 보상도 방 진입 시 자동 회수되어 필드 오브젝트를 남기지 않음\n\n## 다음 확인 항목\n\n- 이동 손가락을 유지한 상태에서 A버튼 스왑이 안정적으로 작동하는지\n- 하트 반 칸 감소와 사망 판정이 일치하는지\n- 장기·유물 네 칸이 작은 가로 화면에서 잘리지 않는지\n- 미니맵의 방문·미방문 방 구분이 충분히 읽히는지\n- 검체 자동 회수량이 지나치게 빠르지 않은지\n`);
let changelog = read('docs/CHANGELOG.md').trimEnd();
if (!changelog.includes(`## ${toVersion} - 2026-08-02`)) changelog += `\n\n## ${toVersion} - 2026-08-02\n\n- 이동 중 A버튼 무기 스왑 지원\n- 하트 3개·반 칸 피격 체력 구조 적용\n- 좌측 상단 HUD를 장기·유물·무기·검체 중심으로 재구성\n- 진행 시간과 디버그 표시 숨김\n- 미방문 방을 미니맵 실루엣으로 처리\n- 전투 검체 및 검체방 보상을 자동 회수로 변경\n`;
write('docs/CHANGELOG.md', changelog + '\n');
write('UPDATE_v0.4.0.b.md', `# Living Hospital ${toVersion}\n\n## UI와 입력 수정\n\n- 체력은 숫자나 막대 대신 하트 3개로 표시합니다.\n- 피격 한 번마다 하트 반 개가 줄어듭니다.\n- 하트 오른쪽에는 현재 장기와 획득 유물을 표시합니다.\n- 아래에는 주무기·보조무기, 그 아래에는 현재 검체를 표시합니다.\n- 진행 시간과 디버그 문자열은 화면에서 제거했습니다.\n- 이동 입력을 유지한 상태에서도 A버튼으로 무기를 교체할 수 있습니다.\n\n## 탐색 정보\n\n- 미방문 방은 미니맵에서 어두운 실루엣으로만 보입니다.\n- 방에 진입한 뒤에만 보상 위치가 표시됩니다.\n- 적 처치 검체는 필드 구슬 없이 자동 회수됩니다.\n- 검체 보관실의 검체도 방에 들어가면 자동 회수됩니다.\n`);

console.log(`${toVersion} generated: runtime ${runtime.length} bytes, gzip parts ${chunks.length}`);
