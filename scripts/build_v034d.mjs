import fs from 'node:fs';
import zlib from 'node:zlib';

const repo='.';
const partPaths=[1,2,3,4].map(i=>`${repo}/v034c/game.gz.part${String(i).padStart(2,'0')}.txt`);
const packed=partPaths.map(p=>fs.readFileSync(p,'utf8')).join('').replace(/\s+/g,'');
let source=zlib.gunzipSync(Buffer.from(packed,'base64')).toString('utf8');

function replaceOnce(oldText,newText,label){
  if(!source.includes(oldText)) throw new Error(`${label} 위치를 찾지 못했습니다.`);
  source=source.replace(oldText,newText);
}

// 0. v0.3.4.c 골절 상향이 런 초기화에서 되돌아가던 누락 교정
replaceOnce(
  "Object.assign(weapons.bone,{level:0,timer:0,cd:2.35,damage:50,range:102,arc:Math.PI,knockback:76,critKnockback:148,lift:.43,hold:.11,strike:.15,recovery:.50});",
  "Object.assign(weapons.bone,{level:0,timer:0,cd:2.35,damage:64,range:102,arc:Math.PI,knockback:76,critKnockback:148,lift:.43,hold:.11,strike:.15,recovery:.50});",
  '골절 런 초기화 피해'
);

// 1. 이식대 라벨을 실제 오브젝트 영역의 가로·세로 중앙에 배치
replaceOnce(
  "ctx.font='bold 12px sans-serif';ctx.textAlign='center';ctx.fillText('이식',o.w/2,36);ctx.textAlign='left';",
  "ctx.font='bold 12px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('이식',o.w/2,10+(o.h-10)/2);ctx.textAlign='left';ctx.textBaseline='alphabetic';",
  '이식대 라벨 중앙 정렬'
);

// 2. 전기충격기: 판을 뒤엎는 일회성 아이템 역할 강화
replaceOnce(
  "else{defibrillatorTimer=5;defibrillatorPulseClock=0;bodyTwitch=Math.max(bodyTwitch,.32);sfx('defibrillatorStart');cameraShake=Math.max(cameraShake,5);}",
  "else if(o.type==='defibrillator'){defibrillatorTimer=7.5;defibrillatorPulseClock=0;bodyTwitch=Math.max(bodyTwitch,.32);sfx('defibrillatorStart');cameraShake=Math.max(cameraShake,5);}",
  '전기충격기 지속시간'
);
replaceOnce(
  "const ux=defibrillatorAimX,uy=defibrillatorAimY,range=355,halfAngle=.60,cosHalf=Math.cos(halfAngle),damage=52,knockback=24;let hits=0;",
  "const ux=defibrillatorAimX,uy=defibrillatorAimY,range=355,halfAngle=.60,cosHalf=Math.cos(halfAngle),damage=68,knockback=24;let hits=0;",
  '전기충격기 피해'
);
replaceOnce(
  "e.shockStun=Math.max(e.shockStun||0,.24);",
  "e.shockStun=Math.max(e.shockStun||0,.28);",
  '전기충격기 경직'
);

// 3. 플레이어가 벽에 붙었을 때 생기는 허위 차단을 피하는 접근점 기반 경로 판정
replaceOnce(
  "function pathClearTo(x1,y1,x2,y2,r=8){for(const o of objects){if(o.active&&o.solid&&o.type==='wall'&&segmentHitsExpandedRect(x1,y1,x2,y2,o,r))return false;}return true;}",
  `function pathClearTo(x1,y1,x2,y2,r=8){for(const o of objects){if(o.active&&o.solid&&o.type==='wall'&&segmentHitsExpandedRect(x1,y1,x2,y2,o,r))return false;}return true;}
function playerApproachPoint(fromX,fromY,e){const dx=player.x-fromX,dy=player.y-fromY,d=Math.hypot(dx,dy)||1,stop=Math.min(Math.max(0,d-1),player.r+e.r+5);return{x:player.x-dx/d*stop,y:player.y-dy/d*stop};}
function pathClearToPlayerFrom(fromX,fromY,e){const p=playerApproachPoint(fromX,fromY,e);return pathClearTo(fromX,fromY,p.x,p.y,Math.max(4,e.r*.72));}
function enemyDirectPathClear(e){return pathClearToPlayerFrom(e.x,e.y,e);}
function clearEnemyRoute(e){e.routeTimer=0;e.routeStage=0;e.routeGateId=null;e.routeLane=0;e.routeAttempts=Math.max(0,(e.routeAttempts||0)-1);e.navCheck=.08;}`,
  '플레이어 접근점 경로 함수'
);
replaceOnce(
  "exitClear=pathClearTo(tx,ty,player.x,player.y,clearance)",
  "exitClear=pathClearToPlayerFrom(tx,ty,e)",
  '우회 출구 경로 판정'
);
replaceOnce(
  "const launched=updateEnemyBoneLaunch(e,dt),curDx=player.x-e.x,curDy=player.y-e.y,dist2=curDx*curDx+curDy*curDy,coagulated=e.clotStun>0,wallStunned=e.wallStun>0,hardStunned=coagulated||wallStunned,controlMult=hardStunned?0:(e.shockStun>0?.16:1)*(1-clotSlow),moveSpeed=e.speed*controlMult,navEligible=!launched&&!hardStunned&&e.charm<=0&&!(e.anomaly&&e.formationTime>0);\n   if(navEligible&&e.routeTimer<=0&&e.navCheck<=0&&e.knockbackLock<=0){e.navCheck=.16+e.aiPhase*.025;if(!pathClearTo(e.x,e.y,player.x,player.y,e.r+2))assignEnemyReroute(e);}",
  "const launched=updateEnemyBoneLaunch(e,dt),curDx=player.x-e.x,curDy=player.y-e.y,dist2=curDx*curDx+curDy*curDy,coagulated=e.clotStun>0,wallStunned=e.wallStun>0,hardStunned=coagulated||wallStunned,controlMult=hardStunned?0:(e.shockStun>0?.16:1)*(1-clotSlow),moveSpeed=e.speed*controlMult,navEligible=!launched&&!hardStunned&&e.charm<=0&&!(e.anomaly&&e.formationTime>0),directPath=navEligible?enemyDirectPathClear(e):false;\n   if(navEligible&&e.routeTimer>0&&e.navCheck<=0){e.navCheck=.15+e.aiPhase*.018;if(directPath){clearEnemyRoute(e);e.wallBlockedTime=0;}}\n   if(navEligible&&e.routeTimer<=0&&e.navCheck<=0&&e.knockbackLock<=0){e.navCheck=.16+e.aiPhase*.025;if(!directPath)assignEnemyReroute(e);}",
  '우회 중 직접 추적 복귀'
);
replaceOnce(
  "if(wallBlocked&&e.knockbackLock<=0){e.wallBlockedTime=Math.min(3,(e.wallBlockedTime||0)+dt);if(navEligible&&e.rerouteCooldown<=0&&(e.routeTimer<=0||e.wallBlockedTime>.42)){assignEnemyReroute(e,e.routeTimer>0);e.rerouteCooldown=.20;}}else e.wallBlockedTime=Math.max(0,(e.wallBlockedTime||0)-dt*3);",
  "if(wallBlocked&&e.knockbackLock<=0){e.wallBlockedTime=Math.min(3,(e.wallBlockedTime||0)+dt);if(navEligible&&e.rerouteCooldown<=0&&e.wallBlockedTime>.22&&!enemyDirectPathClear(e)){assignEnemyReroute(e,e.routeTimer>0);e.rerouteCooldown=.20;}}else e.wallBlockedTime=Math.max(0,(e.wallBlockedTime||0)-dt*3);",
  '벽 접촉 우회 진입 지연'
);
replaceOnce(
  "if(e.stuckTimer>.75&&navEligible){assignEnemyReroute(e,true);e.stuckTimer=0;}",
  "if(e.stuckTimer>.75&&navEligible){if(!enemyDirectPathClear(e))assignEnemyReroute(e,true);else clearEnemyRoute(e);e.stuckTimer=0;}",
  '정체 상태 우회 판정'
);

// 4. 파괴 오브젝트 보상: 검체 8%, 보너스 맵 아이템 5%, 보너스 아이템 동시 1개
replaceOnce(
  "const PERF_WARMUP=4,ORGAN_CINEMATIC_DURATION=3.7,MAX_MAP_PICKUPS=3,PICKUP_RESPAWN_MIN=20,PICKUP_RESPAWN_MAX=35;",
  "const PERF_WARMUP=4,ORGAN_CINEMATIC_DURATION=3.7,MAX_MAP_PICKUPS=3,BONUS_MAP_PICKUP_CAP=1,PICKUP_RESPAWN_MIN=20,PICKUP_RESPAWN_MAX=35;",
  '보너스 맵 아이템 상한'
);
replaceOnce(
  "const PICKUP_DEFS={water:{r:11},magnet:{r:12},defibrillator:{r:12}};\nfunction spawnPickup(type,x,y){const d=PICKUP_DEFS[type],o=takePool('pickup');Object.assign(o,{type,x,y,r:d.r,pulse:Math.random()*6.28});pickups.push(o);return o;}",
  `const PICKUP_DEFS={water:{r:11},magnet:{r:12},defibrillator:{r:12},specimen:{r:9}};
function spawnPickup(type,x,y,extra={}){const d=PICKUP_DEFS[type],o=takePool('pickup');Object.assign(o,{type,x,y,r:d.r,pulse:Math.random()*6.28,bonusMap:false,specimenDrop:false},extra);pickups.push(o);return o;}
function baseMapPickupCount(){let count=0;for(const p of pickups)if(PICKUP_TYPES.includes(p.type)&&!p.bonusMap)count++;return count;}
function bonusMapPickupCount(){let count=0;for(const p of pickups)if(p.bonusMap)count++;return count;}
function spawnBreakableSpecimen(x,y){spawnPickup('specimen',x+(Math.random()-.5)*18,y+(Math.random()-.5)*18,{specimenDrop:true});}
function spawnBreakableMapPickup(x,y){if(bonusMapPickupCount()>=BONUS_MAP_PICKUP_CAP)return false;const type=PICKUP_TYPES[Math.floor(Math.random()*PICKUP_TYPES.length)];spawnPickup(type,x+(Math.random()-.5)*20,y+(Math.random()-.5)*20,{bonusMap:true});return true;}`,
  '파괴 보상 픽업 함수'
);
replaceOnce(
  "function spawnRandomMapPickup(type){if(pickups.length>=MAX_MAP_PICKUPS||pickups.some(p=>p.type===type))return false;const pos=randomPickupPosition();if(!pos)return false;spawnPickup(type,pos.x,pos.y);return true;}",
  "function spawnRandomMapPickup(type){if(baseMapPickupCount()>=MAX_MAP_PICKUPS||pickups.some(p=>p.type===type&&!p.bonusMap))return false;const pos=randomPickupPosition();if(!pos)return false;spawnPickup(type,pos.x,pos.y);return true;}",
  '기본 맵 아이템 수 계산'
);
replaceOnce(
  "function ensurePickupPopulation(){for(const type of PICKUP_TYPES)if(!pickups.some(p=>p.type===type)&&!pickupRespawns.some(q=>q.type===type))pickupRespawns.push({type,timer:.35+Math.random()*.45});}",
  "function ensurePickupPopulation(){for(const type of PICKUP_TYPES)if(!pickups.some(p=>p.type===type&&!p.bonusMap)&&!pickupRespawns.some(q=>q.type===type))pickupRespawns.push({type,timer:.35+Math.random()*.45});}",
  '기본 맵 아이템 유지 판정'
);
replaceOnce(
  "function updatePickupRespawns(dt){for(let i=pickupRespawns.length-1;i>=0;i--){const q=pickupRespawns[i];q.timer-=dt;if(q.timer<=0&&pickups.length<MAX_MAP_PICKUPS){if(spawnRandomMapPickup(q.type))pickupRespawns.splice(i,1);else q.timer=.8;}}}",
  "function updatePickupRespawns(dt){for(let i=pickupRespawns.length-1;i>=0;i--){const q=pickupRespawns[i];q.timer-=dt;if(q.timer<=0&&baseMapPickupCount()<MAX_MAP_PICKUPS){if(spawnRandomMapPickup(q.type))pickupRespawns.splice(i,1);else q.timer=.8;}}}",
  '기본 맵 아이템 재생성 판정'
);
replaceOnce(
  "else if(o.type==='magnet'){globalMagnet=Math.max(globalMagnet,4.2);sfx('magnet');for(let i=0;i<10;i++){const a=i/10*Math.PI*2;emitParticle(player.x,player.y,Math.cos(a)*110,Math.sin(a)*110,.42,2,'#9ac4c9');}}\n  else if(o.type==='defibrillator'){defibrillatorTimer=7.5;defibrillatorPulseClock=0;bodyTwitch=Math.max(bodyTwitch,.32);sfx('defibrillatorStart');cameraShake=Math.max(cameraShake,5);}",
  "else if(o.type==='magnet'){globalMagnet=Math.max(globalMagnet,4.2);sfx('magnet');for(let i=0;i<10;i++){const a=i/10*Math.PI*2;emitParticle(player.x,player.y,Math.cos(a)*110,Math.sin(a)*110,.42,2,'#9ac4c9');}}\n  else if(o.type==='defibrillator'){defibrillatorTimer=7.5;defibrillatorPulseClock=0;bodyTwitch=Math.max(bodyTwitch,.32);sfx('defibrillatorStart');cameraShake=Math.max(cameraShake,5);}\n  else if(o.type==='specimen'){meta.specimens=(meta.specimens||0)+1;saveMeta();toast('검체 +1');tone(420,.06,'triangle',.018,690);for(let i=0;i<7;i++)emitParticle(player.x,player.y,(Math.random()-.5)*95,(Math.random()-.5)*95,.32,2+Math.random()*2,'#d7a7b4');}",
  '검체 획득 처리'
);
replaceOnce(
  "if(isBreakableProp(o)){const cx=o.x+o.w/2,cy=o.y+o.h/2;for(let i=0;i<(qualityLevel===2?4:8);i++)emitParticle(cx,cy,(Math.random()-.5)*150,(Math.random()-.5)*120,.34,2+Math.random()*3,o.type==='wasteBin'?'#6d7771':'#9b9184');if(Math.random()<.55)addRewardOrbs(cx,cy,1+Math.floor(Math.random()*2),1,24);return;}",
  "if(isBreakableProp(o)){const cx=o.x+o.w/2,cy=o.y+o.h/2;for(let i=0;i<(qualityLevel===2?4:8);i++)emitParticle(cx,cy,(Math.random()-.5)*150,(Math.random()-.5)*120,.34,2+Math.random()*3,o.type==='wasteBin'?'#6d7771':'#9b9184');if(Math.random()<.55)addRewardOrbs(cx,cy,1+Math.floor(Math.random()*2),1,24);if(Math.random()<.08)spawnBreakableSpecimen(cx,cy);if(Math.random()<.05)spawnBreakableMapPickup(cx,cy);return;}",
  '파괴 오브젝트 확률 보상'
);
replaceOnce(
  "for(let i=pickups.length-1;i>=0;i--){const o=pickups[i],dx=player.x-o.x,dy=player.y-o.y,d2=dx*dx+dy*dy,cr=player.r+o.r+5;if(d2<cr*cr){const type=o.type;collectPickup(o);schedulePickupRespawn(type);removePooledAt(pickups,i,'pickup');}}",
  "for(let i=pickups.length-1;i>=0;i--){const o=pickups[i],dx=player.x-o.x,dy=player.y-o.y,d2=dx*dx+dy*dy,cr=player.r+o.r+5;if(d2<cr*cr){const type=o.type,shouldRespawn=PICKUP_TYPES.includes(type)&&!o.bonusMap;collectPickup(o);if(shouldRespawn)schedulePickupRespawn(type);removePooledAt(pickups,i,'pickup');}}",
  '보너스 픽업 재생성 제외'
);
replaceOnce(
  "if(o.type==='water'){ctx.fillStyle='#655f43';ctx.strokeStyle='#a39a70';ctx.beginPath();ctx.ellipse(0,2,11,7,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#34372d';ctx.fillRect(-5,-9,10,10);}else if(o.type==='magnet')",
  "if(o.type==='specimen'){ctx.globalAlpha=.30;ctx.fillStyle='#d7a7b4';ctx.beginPath();ctx.arc(0,0,14,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;ctx.fillStyle='#d8d1cb';ctx.strokeStyle='#7d4f5c';ctx.lineWidth=1.5;ctx.fillRect(-5,-9,10,17);ctx.strokeRect(-5,-9,10,17);ctx.fillStyle='#8f344b';ctx.fillRect(-3,-5,6,9);ctx.fillStyle='#eee';ctx.fillRect(-3,-12,6,4);}else if(o.type==='water'){ctx.fillStyle='#655f43';ctx.strokeStyle='#a39a70';ctx.beginPath();ctx.ellipse(0,2,11,7,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#34372d';ctx.fillRect(-5,-9,10,10);}else if(o.type==='magnet')",
  '검체 드롭 렌더링'
);

// 런타임 문법 및 핵심 조건 검증
new Function(source);
for(const required of [
  "ctx.textBaseline='middle';ctx.fillText('이식',o.w/2,10+(o.h-10)/2)",
  'defibrillatorTimer=7.5',
  'damage=68',
  "e.shockStun=Math.max(e.shockStun||0,.28)",
  'function enemyDirectPathClear(e)',
  'if(directPath){clearEnemyRoute(e)',
  'Math.random()<.08',
  'Math.random()<.05',
  'BONUS_MAP_PICKUP_CAP=1',
  "o.type==='specimen'",
  'damage:64'
])if(!source.includes(required))throw new Error(`필수 변경 누락: ${required}`);
if(source.includes("Object.assign(weapons.bone,{level:0,timer:0,cd:2.35,damage:50"))throw new Error('골절 초기화 피해가 다시 50으로 남아 있습니다.');
if(source.includes('schedulePickupRespawn(type);removePooledAt(pickups'))throw new Error('보너스 픽업도 재생성되는 기존 코드가 남아 있습니다.');

// v0.3.4.d 런타임 압축
const compressed=zlib.gzipSync(Buffer.from(source,'utf8'),{level:9});
const encoded=compressed.toString('base64');
fs.mkdirSync(`${repo}/v034d`,{recursive:true});
const size=Math.ceil(encoded.length/4);
for(let i=0;i<4;i++)fs.writeFileSync(`${repo}/v034d/game.gz.part${String(i+1).padStart(2,'0')}.txt`,encoded.slice(i*size,(i+1)*size));

// 로더와 배포 진입점
let loader=fs.readFileSync(`${repo}/Living_Hospital_v0.3.4.c.html`,'utf8');
loader=loader.replace('Living Hospital v0.3.4.c · Chapter 1','Living Hospital v0.3.4.d · Chapter 1').replaceAll('v034c/game.gz.part','v034d/game.gz.part');
fs.writeFileSync(`${repo}/Living_Hospital_v0.3.4.d.html`,loader);
const redirect=`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta http-equiv="refresh" content="0;url=./Living_Hospital_v0.3.4.d.html?v=034d"><title>Living Hospital</title><script>location.replace('./Living_Hospital_v0.3.4.d.html?v=034d')</script></head><body><a href="./Living_Hospital_v0.3.4.d.html?v=034d">Living Hospital 실행</a></body></html>`;
fs.writeFileSync(`${repo}/index.html`,redirect);
fs.writeFileSync(`${repo}/stable-v034d.html`,redirect);

let playtest=fs.readFileSync(`${repo}/playtest.html`,'utf8').replaceAll('Living_Hospital_v0.3.4.c.html','Living_Hospital_v0.3.4.d.html');
fs.writeFileSync(`${repo}/playtest.html`,playtest);
let readme=fs.readFileSync(`${repo}/README.md`,'utf8').replace(/- 현재 저장소 기준 빌드: \*\*v[^*]+\*\*/,'- 현재 저장소 기준 빌드: **v0.3.4.d**').replace(/- 현재 실행 파일: \[`Living_Hospital_v[^`]+`\]\([^\)]+\)/,'- 현재 실행 파일: [`Living_Hospital_v0.3.4.d.html`](./Living_Hospital_v0.3.4.d.html)');
fs.writeFileSync(`${repo}/README.md`,readme);
let agents=fs.readFileSync(`${repo}/AGENTS.md`,'utf8').replace(/- 현재 기준선은 `Living_Hospital_v[^`]+`입니다\./,'- 현재 기준선은 `Living_Hospital_v0.3.4.d.html`입니다.');
fs.writeFileSync(`${repo}/AGENTS.md`,agents);
let status=fs.readFileSync(`${repo}/docs/PROJECT_STATUS.md`,'utf8').replace(/마지막 갱신: .*/,'마지막 갱신: 2026-07-31').replace(/- 저장소 기준 최신 빌드: \*\*v[^*]+\*\*/,'- 저장소 기준 최신 빌드: **v0.3.4.d**').replace(/- 기준 파일: `Living_Hospital_v[^`]+`/,'- 기준 파일: `Living_Hospital_v0.3.4.d.html`');
fs.writeFileSync(`${repo}/docs/PROJECT_STATUS.md`,status);
let changelog=fs.readFileSync(`${repo}/docs/CHANGELOG.md`,'utf8');
if(!changelog.includes('## v0.3.4.d'))changelog+=`\n\n## v0.3.4.d - 2026-07-31\n\n- 이식대 텍스트 가로·세로 중앙 정렬\n- 전기충격기 지속시간 7.5초, 피해 68, 경직 0.28초로 강화\n- 플레이어 접근점 기반 경로 판정 및 우회 중 직접 추적 복귀\n- 파괴 오브젝트에서 검체 8%, 보너스 맵 아이템 5% 확률 드롭\n- 보너스 맵 아이템 동시 1개 제한\n- 골절 기본 피해가 런 초기화에서 50으로 되돌아가던 누락 수정\n`;
fs.writeFileSync(`${repo}/docs/CHANGELOG.md`,changelog);
fs.writeFileSync(`${repo}/UPDATE_v0.3.4.d.md`,`# Living Hospital v0.3.4.d\n\n- 이식대 라벨 중앙 정렬\n- 전기충격기 강화\n- 적 우회 경로 복귀 로직 교정\n- 파괴 오브젝트 검체·맵 아이템 보상 추가\n- 골절 런 초기화 피해 누락 수정\n`);
console.log('v0.3.4.d generated');
