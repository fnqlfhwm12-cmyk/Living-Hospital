import fs from 'node:fs';
import zlib from 'node:zlib';

const repo='.';
const partPaths=[1,2,3,4].map(i=>`${repo}/v034b/game.gz.part${String(i).padStart(2,'0')}.txt`);
const packed=partPaths.map(p=>fs.readFileSync(p,'utf8')).join('').replace(/\s+/g,'');
let source=zlib.gunzipSync(Buffer.from(packed,'base64')).toString('utf8');

function replaceOnce(oldText,newText,label){
  if(!source.includes(oldText)) throw new Error(`${label} 위치를 찾지 못했습니다.`);
  source=source.replace(oldText,newText);
}
function removeOnce(text,label){
  if(!source.includes(text)) throw new Error(`${label} 위치를 찾지 못했습니다.`);
  source=source.replace(text,'');
}

// 1. 일시정지 메인 버튼 DOM 참조
replaceOnce("'resumeBtn','restartBtn','startScreen'","'resumeBtn','restartBtn','mainMenuBtn','startScreen'",'mainMenuBtn UI 참조');

// 2. 직전 성장 선택 기록
replaceOnce(
  "let selectionMode=null,selectedChoice=null,selectionConfirmAction=null,selectionCancelAction=null,selectionInputGuardUntil=0,selectionNeedsFreshPointer=false;",
  "let selectionMode=null,selectedChoice=null,selectionConfirmAction=null,selectionCancelAction=null,selectionInputGuardUntil=0,selectionNeedsFreshPointer=false,lastGrowthChoiceName='';",
  '성장 선택 상태'
);
replaceOnce(
  "growthCount=0;currentAction=null;broadcastTimer=0;",
  "growthCount=0;currentAction=null;lastGrowthChoiceName='';broadcastTimer=0;",
  '런 초기화 성장 기록'
);

// 3. 골절: 초반 기본 피해 상향 + 중량 개체 특화 충격 보정
replaceOnce(
  "bone:{name:'골절',icon:'🦴',level:0,cd:2.35,timer:0,damage:50,range:102,arc:Math.PI,knockback:76,critKnockback:148,lift:.43,hold:.11,strike:.15,recovery:.50,lore:'몸을 떠난 뼈가 뒤늦게 제 쓰임을 기억합니다.'}",
  "bone:{name:'골절',icon:'🦴',level:0,cd:2.35,timer:0,damage:64,range:102,arc:Math.PI,knockback:76,critKnockback:148,lift:.43,hold:.11,strike:.15,recovery:.50,lore:'몸을 떠난 뼈가 뒤늦게 제 쓰임을 기억합니다.'}",
  '골절 기본 피해'
);
replaceOnce(
  "if(e.hp<=0)continue;const rx=e.x-player.x,ry=e.y-player.y,d=Math.hypot(rx,ry)||1;if(d>a.range+e.r||(rx/d*a.ux+ry/d*a.uy)<cosHalf||!pathClearTo(player.x,player.y,e.x,e.y,.75))continue;e.hp-=a.damage;e.flash=Math.max(e.flash,.16);const nx=rx/d,ny=ry/d,force=a.crit?a.critKnockback:a.knockback,minTravel=Math.max(0,a.range+outerPadding+e.r*.18-d);startEnemyBoneLaunch(e,nx,ny,force,a.crit,a.damage,minTravel);",
  "if(e.hp<=0)continue;const rx=e.x-player.x,ry=e.y-player.y,d=Math.hypot(rx,ry)||1;if(d>a.range+e.r||(rx/d*a.ux+ry/d*a.uy)<cosHalf||!pathClearTo(player.x,player.y,e.x,e.y,.75))continue;const impactDamage=a.damage*(e.type==='fat'?1.35:1);e.hp-=impactDamage;e.flash=Math.max(e.flash,.16);const nx=rx/d,ny=ry/d,force=a.crit?a.critKnockback:a.knockback,minTravel=Math.max(0,a.range+outerPadding+e.r*.18-d);startEnemyBoneLaunch(e,nx,ny,force,a.crit,impactDamage,minTravel);",
  '골절 중량 보정'
);

// 4. 플레이어 외 체력바 제거 + 오브젝트 타격 피드백 강화
replaceOnce(
  "function damageObject(o,dmg){if(!isTargetObject(o))return;o.hp-=dmg;o.flash=.12;o.hitJolt=Math.max(o.hitJolt||0,.14);if(isBreakableProp(o)){o.reveal=Math.max(o.reveal||0,1.35);o.damageStage=o.hp<=o.maxHp*.34?2:o.hp<=o.maxHp*.68?1:0;}if(o.hp<=0)destroyObject(o);}",
  "function damageObject(o,dmg){if(!isTargetObject(o))return;o.hp-=dmg;o.flash=.18;o.hitJolt=Math.max(o.hitJolt||0,.22);cameraShake=Math.max(cameraShake,1.8);hitStopTimer=Math.max(hitStopTimer,.018);if(isBreakableProp(o)){o.reveal=Math.max(o.reveal||0,1.35);o.damageStage=o.hp<=o.maxHp*.34?2:o.hp<=o.maxHp*.68?1:0;}if(o.hp<=0)destroyObject(o);}",
  '오브젝트 타격 피드백'
);
replaceOnce(
  "function drawObject(o,s){ctx.save();const staticWall=o.type==='wall',breakable=isBreakableProp(o),jolt=breakable&&o.hitJolt>0?Math.sin((elapsed+o.id)*92)*1.35*(o.hitJolt/.14):0;",
  "function drawObject(o,s){ctx.save();const staticWall=o.type==='wall',breakable=isBreakableProp(o),jolt=o.hitJolt>0?Math.sin((elapsed+o.id)*102)*2.2*(o.hitJolt/.22):0;",
  '오브젝트 흔들림'
);
replaceOnce(
  "if(o.type!=='wall'&&o.type!=='door'&&o.type!=='transplantStation'&&!breakable){ctx.fillStyle='#0009';ctx.fillRect(0,-10,o.w,5);ctx.fillStyle='#fff';ctx.fillRect(0,-10,o.w*Math.max(0,o.hp/o.maxHp),5);}if(breakable&&(o.reveal>0||o.damageStage>0)){ctx.globalAlpha=o.damageStage>0?.82:Math.min(.72,o.reveal*.55);ctx.fillStyle='#000a';ctx.fillRect(0,-8,o.w,4);ctx.fillStyle=o.damageStage>1?'#c86b64':'#d7d0c2';ctx.fillRect(0,-8,o.w*Math.max(0,o.hp/o.maxHp),4);ctx.globalAlpha=1;}ctx.restore();}",
  "if(o.flash>0){ctx.globalAlpha=Math.min(.68,o.flash*3.8);ctx.strokeStyle='#fff';ctx.lineWidth=2.2;ctx.strokeRect(-2,-2,o.w+4,o.h+4);ctx.globalAlpha=1;}ctx.restore();}",
  '오브젝트 체력바 제거'
);

// 5. 웨이브 시작 문구 제거
for(const [text,label] of [
  ["broadcast('무거운 발소리가 가까워졌다.','event');",'중량 웨이브 메시지'],
  ["broadcast('무언가가 복도를 가로질렀다.','event');",'고속 웨이브 메시지'],
  ["broadcast('병실 안이 붐비기 시작했다.','event');",'군집 웨이브 메시지'],
  ["broadcast('병동의 문이 하나씩 잠겼다.','event');",'보스 전조 메시지']
]) removeOnce(text,label);

// 6. 직전 선택 능력의 다음 선택 가중치만 소폭 하향
replaceOnce(
  "function openGrowthChoice(){",
  `function weightedGrowthChoices(count=4){
 const pool=upgradePool().slice(),result=[];
 while(pool.length&&result.length<count){
  const weights=pool.map(o=>o.name===lastGrowthChoiceName?0.60:1),total=weights.reduce((a,b)=>a+b,0);let roll=Math.random()*total,index=0;
  for(;index<pool.length-1;index++){roll-=weights[index];if(roll<=0)break;}
  result.push(pool.splice(index,1)[0]);
 }
 return result;
}
function openGrowthChoice(){`,
  '성장 가중 선택 함수'
);
replaceOnce(
  "upgradePool().sort(()=>Math.random()-.5).slice(0,4).forEach(o=>",
  "weightedGrowthChoices(4).forEach(o=>",
  '성장 선택 후보 생성'
);
replaceOnce(
  "selectionConfirmAction=()=>{if(!selectedChoice)return;selectedChoice.apply();renderHudIcons();growthChoosing=false;paused=false;hideOverlay();syncActionButton();};",
  "selectionConfirmAction=()=>{if(!selectedChoice)return;lastGrowthChoiceName=selectedChoice.name||'';selectedChoice.apply();renderHudIcons();growthChoosing=false;paused=false;hideOverlay();syncActionButton();};",
  '성장 선택 기록 저장'
);

// 7. 일시정지에서 영구 데이터를 저장하고 현재 런을 종료한 뒤 메인으로 복귀
replaceOnce(
  "ui.restartBtn.onclick=()=>{reset();startChapterBgm(false);last=performance.now();loopClock=0;if(!running){running=true;requestAnimationFrame(loop);}};ui.startBtn.onclick",
  "ui.restartBtn.onclick=()=>{reset();startChapterBgm(false);last=performance.now();loopClock=0;if(!running){running=true;requestAnimationFrame(loop);}};ui.mainMenuBtn.onclick=()=>{saveMeta();stopCinematicAudio();stopChapterBgm();running=false;paused=false;growthChoosing=false;gameOver=true;dialogueState=null;bossState=null;bossIntroTimer=0;bossDeathTimer=0;document.body.classList.remove('boss-cinematic');clearSelectionUi();hideOverlay();resetJoystickInput();showMetaScreen('startScreen');};ui.startBtn.onclick",
  '메인 복귀 동작'
);

// 런타임 문법·의도 검증
new Function(source);
if(source.includes("o.hp/o.maxHp"))throw new Error('오브젝트 체력바 코드가 남아 있습니다.');
for(const text of ['무거운 발소리가 가까워졌다.','무언가가 복도를 가로질렀다.','병실 안이 붐비기 시작했다.','병동의 문이 하나씩 잠겼다.'])if(source.includes(text))throw new Error(`웨이브 메시지가 남아 있습니다: ${text}`);
if(!source.includes("damage:64")||!source.includes("e.type==='fat'?1.35:1"))throw new Error('골절 수치가 반영되지 않았습니다.');
if(64*1.35*2<118*1.45)throw new Error('골절이 최초 중량 개체를 두 번 안에 처치하지 못합니다.');
if(!source.includes('weightedGrowthChoices(4)')||!source.includes("lastGrowthChoiceName=selectedChoice.name"))throw new Error('성장 선택 가중치가 반영되지 않았습니다.');
if(!source.includes('ui.mainMenuBtn.onclick'))throw new Error('메인 복귀 동작이 없습니다.');

// v0.3.4.c 압축 런타임 생성
const compressed=zlib.gzipSync(Buffer.from(source,'utf8'),{level:9});
const encoded=compressed.toString('base64');
fs.mkdirSync(`${repo}/v034c`,{recursive:true});
const size=Math.ceil(encoded.length/4);
for(let i=0;i<4;i++)fs.writeFileSync(`${repo}/v034c/game.gz.part${String(i+1).padStart(2,'0')}.txt`,encoded.slice(i*size,(i+1)*size));

// HTML 로더 및 UI 수정
let loader=fs.readFileSync(`${repo}/Living_Hospital_v0.3.4.b.html`,'utf8');
loader=loader
 .replace('Living Hospital v0.3.4.b · Chapter 1','Living Hospital v0.3.4.c · Chapter 1')
 .replaceAll('v034b/game.gz.part','v034c/game.gz.part')
 .replace('<button class="btn" id="restartBtn">재시작</button>','<button class="btn" id="restartBtn">재시작</button>\n        <button class="btn" id="mainMenuBtn">저장하고 메인으로</button>')
 .replace('<button class="btn" id="characterConfirmBtn">대기실로</button>','<button class="btn" id="characterConfirmBtn">선택하기</button>');
if(!loader.includes('id="mainMenuBtn"')||!loader.includes('id="characterConfirmBtn">선택하기'))throw new Error('HTML UI 수정 실패');
fs.writeFileSync(`${repo}/Living_Hospital_v0.3.4.c.html`,loader);

const redirect=`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta http-equiv="refresh" content="0;url=./Living_Hospital_v0.3.4.c.html?v=034c"><title>Living Hospital</title><script>location.replace('./Living_Hospital_v0.3.4.c.html?v=034c')</script></head><body><a href="./Living_Hospital_v0.3.4.c.html?v=034c">Living Hospital 실행</a></body></html>`;
fs.writeFileSync(`${repo}/index.html`,redirect);
fs.writeFileSync(`${repo}/stable-v034c.html`,redirect);

// 계측 페이지와 저장소 문서의 최신 빌드 참조 갱신
let playtest=fs.readFileSync(`${repo}/playtest.html`,'utf8');
playtest=playtest.replaceAll('Living_Hospital_v0.3.3.u.html','Living_Hospital_v0.3.4.c.html').replaceAll('Living_Hospital_v0.3.4.b.html','Living_Hospital_v0.3.4.c.html');
fs.writeFileSync(`${repo}/playtest.html`,playtest);

let readme=fs.readFileSync(`${repo}/README.md`,'utf8');
readme=readme.replace(/- 현재 저장소 기준 빌드: \*\*v[^*]+\*\*/,'- 현재 저장소 기준 빌드: **v0.3.4.c**').replace(/- 현재 실행 파일: \[`Living_Hospital_v[^`]+`\]\([^\)]+\)/,'- 현재 실행 파일: [`Living_Hospital_v0.3.4.c.html`](./Living_Hospital_v0.3.4.c.html)');
fs.writeFileSync(`${repo}/README.md`,readme);

let agents=fs.readFileSync(`${repo}/AGENTS.md`,'utf8');
agents=agents.replace(/- 현재 기준선은 `Living_Hospital_v[^`]+`입니다\./,'- 현재 기준선은 `Living_Hospital_v0.3.4.c.html`입니다.');
fs.writeFileSync(`${repo}/AGENTS.md`,agents);

let status=fs.readFileSync(`${repo}/docs/PROJECT_STATUS.md`,'utf8');
status=status.replace(/마지막 갱신: .*/,'마지막 갱신: 2026-07-31').replace(/- 저장소 기준 최신 빌드: \*\*v[^*]+\*\*/,'- 저장소 기준 최신 빌드: **v0.3.4.c**').replace(/- 기준 파일: `Living_Hospital_v[^`]+`/,'- 기준 파일: `Living_Hospital_v0.3.4.c.html`');
fs.writeFileSync(`${repo}/docs/PROJECT_STATUS.md`,status);

let changelog=fs.readFileSync(`${repo}/docs/CHANGELOG.md`,'utf8');
if(!changelog.includes('## v0.3.4.c'))changelog+=`\n\n## v0.3.4.c - 2026-07-31\n\n- 플레이어 외 적·오브젝트 체력바 제거\n- 오브젝트 피격 흔들림, 외곽 섬광, 짧은 히트스톱 강화\n- 골절 기본 피해 64 및 중량 개체 대상 1.35배 보정\n- 직전 성장 선택의 다음 선택 가중치 60%로 조정\n- 챕터 웨이브 시작 메시지 제거\n- 일시정지에 저장하고 메인으로 복귀 버튼 추가\n- 캐릭터 확정 버튼 문구를 선택하기로 변경\n`;
fs.writeFileSync(`${repo}/docs/CHANGELOG.md`,changelog);

fs.writeFileSync(`${repo}/UPDATE_v0.3.4.c.md`,`# Living Hospital v0.3.4.c\n\n- 플레이어 외 체력바 제거\n- 오브젝트 타격 피드백 강화\n- 골절 중량 개체 2타 기준 조정\n- 직전 성장 선택 재등장 확률 소폭 하향\n- 웨이브 시작 메시지 제거\n- 저장하고 메인으로 복귀 추가\n- 캐릭터 확정 버튼을 선택하기로 변경\n`);

console.log('v0.3.4.c generated',{source:source.length,gzip:compressed.length,parts:4});
