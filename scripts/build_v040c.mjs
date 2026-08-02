import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const fromVersion = 'v0.4.0.b';
const toVersion = 'v0.4.0.c';
const fromSlug = 'v040b';
const toSlug = 'v040c';
const fromFile = 'Living_Hospital_v0.4.0.b.html';
const toFile = 'Living_Hospital_v0.4.0.c.html';

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

const encounterRuntime = String.raw`

// v0.4.0.c: Beta-only baseline, physical weapon exchange and preassigned room encounters.
for(const key of Object.keys(CHARACTER_DEFS))if(key!=='specimen')delete CHARACTER_DEFS[key];
selectedCharacter='specimen';
if(CHARACTER_DEFS.specimen)CHARACTER_DEFS.specimen.abilityText='';
if(meta&&meta.unlockedCharacters){for(const key of Object.keys(meta.unlockedCharacters))meta.unlockedCharacters[key]=key==='specimen';meta.unlockedCharacters.specimen=true;}

specimenAbilityStats=function(){return{lv:0,per:0,cap:0,surge:0,surgeSpeed:1,damage:0,perDamage:0,surgeDamage:0,crit:0,sync:false};};
atkSpeedMult=legacyAtkSpeedMult;
damageMult=legacyDamageMult;
rollWeaponCrit=legacyRollWeaponCrit;

let structureGroundWeapons=[];
let structureEncounterPlans=new Map();
let structureEncounterActive=new Set();
let structureEncounterCleared=new Set();
let structureEncounterGates=[];
let structureEncounterLog=[];

const STRUCTURE_ENCOUNTER_TEMPLATES=[
 [[-.70,-.54],[-.24,-.62],[.30,-.56],[.70,-.38],[-.66,.18],[-.18,.30],[.34,.20],[.68,.52]],
 [[-.72,-.48],[-.72,.02],[-.72,.50],[-.20,-.25],[-.20,.34],[.34,-.48],[.34,.06],[.70,.42]],
 [[-.62,-.55],[0,-.60],[.62,-.55],[-.32,-.02],[.32,-.02],[-.62,.52],[0,.58],[.62,.52]],
 [[-.68,-.42],[-.22,-.50],[.24,-.34],[.66,-.48],[-.52,.30],[-.08,.48],[.38,.26],[.70,.48]]
];

function v040cRemoveObject(object){
 const index=objects.indexOf(object);if(index>=0)objects.splice(index,1);
}
function v040cRemoveNodes(ids){
 const idSet=new Set(ids);
 for(const node of [...structureRewardNodes])if(idSet.has(node.nodeId))v040cRemoveObject(node);
 structureRewardNodes=structureRewardNodes.filter(node=>!idSet.has(node.nodeId));
}
function v040cWeaponPool(){
 const unlocked=STRUCTURE_WEAPON_KEYS.filter(key=>meta.unlockedWeapons[key]&&key!==primaryWeaponKey&&key!==secondaryWeaponKey);
 if(unlocked.length)return unlocked;
 return STRUCTURE_WEAPON_KEYS.filter(key=>key!==primaryWeaponKey&&key!==secondaryWeaponKey);
}
function v040cAddGroundWeapon(key,x,y){
 if(!key||!weapons[key])return null;
 const object=structureAddObject('groundWeapon',x-25,y-25,50,50,999,false,{structureGroundWeapon:true,weaponKey:key});
 structureGroundWeapons.push(object);return object;
}
function v040cPlaceStartingWeapon(){
 for(const object of structureGroundWeapons)v040cRemoveObject(object);
 structureGroundWeapons=[];
 const pool=v040cWeaponPool();if(!pool.length)return;
 v040cAddGroundWeapon(pool[Math.floor(Math.random()*pool.length)],170,850);
}
function v040cApplyWeaponLevels(){
 for(const weapon of Object.values(weapons))weapon.level=0;
 if(primaryWeaponKey&&weapons[primaryWeaponKey])weapons[primaryWeaponKey].level=8;
 if(secondaryWeaponKey&&weapons[secondaryWeaponKey])weapons[secondaryWeaponKey].level=8;
}
function v040cPickupGroundWeapon(object){
 if(!object||!object.structureGroundWeapon||weaponSwapLock>0)return;
 const incoming=object.weaponKey;if(!incoming||incoming===primaryWeaponKey)return;
 if(!secondaryWeaponKey){
  secondaryWeaponKey=primaryWeaponKey;primaryWeaponKey=incoming;
  v040cRemoveObject(object);structureGroundWeapons=structureGroundWeapons.filter(item=>item!==object);
 }else{
  const discarded=primaryWeaponKey;primaryWeaponKey=incoming;object.weaponKey=discarded;
 }
 v040cApplyWeaponLevels();
 weapons[primaryWeaponKey].timer=Math.min(weapons[primaryWeaponKey].timer||0,.28);
 onWeaponAcquired(primaryWeaponKey);weaponSwapLock=.24;bodyTwitch=Math.max(bodyTwitch,.16);sfx('growth');
 structureClaimedNodes.add('weapon');updateStructureHud();renderPauseSummary();renderMinimap();syncActionButton();
}

structureEquipSecondary=function(key){
 if(!weapons[key]||key===primaryWeaponKey)return;
 if(!secondaryWeaponKey)secondaryWeaponKey=key;else secondaryWeaponKey=key;
 v040cApplyWeaponLevels();weapons[key].timer=Math.min(weapons[key].timer||0,.28);onWeaponAcquired(key);updateStructureHud();renderPauseSummary();syncActionButton();
};
structureSwapWeapon=function(){
 if(!secondaryWeaponKey||weaponSwapLock>0)return;
 const previous=primaryWeaponKey;primaryWeaponKey=secondaryWeaponKey;secondaryWeaponKey=previous;weaponSwapLock=.24;
 bodyTwitch=Math.max(bodyTwitch,.14);sfx('growth');v040cApplyWeaponLevels();updateStructureHud();syncActionButton();
};

const v040cLegacyDrawObject=drawObject;
drawObject=function(object,screen){
 if(!object.structureGroundWeapon){v040cLegacyDrawObject(object,screen);return;}
 const weapon=weapons[object.weaponKey],pulse=.5+.5*Math.sin(elapsed*4.6+object.id*13);
 ctx.save();ctx.translate(screen.x+object.w*.5,screen.y+object.h*.5);ctx.globalAlpha=.92;
 ctx.fillStyle='#171314';ctx.beginPath();ctx.arc(0,0,23,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle='#eee6d5';ctx.lineWidth=1.5+pulse*.7;ctx.beginPath();ctx.arc(0,0,20+pulse*2,0,Math.PI*2);ctx.stroke();
 ctx.fillStyle='#fff';ctx.font='800 24px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(weapon?.icon||'·',0,1);ctx.restore();
};

drawRoom=function(zone){
 if(!zone.structureRoom&&!zone.structureCorridor){legacyDrawRoom(zone);return;}
 const point=worldToScreen(zone.x-zone.w*.5,zone.y-zone.h*.5),pulse=.5+.5*Math.sin(elapsed*.9+zone.x*.002+zone.y*.003);
 ctx.save();ctx.fillStyle=zone.tint||'#1b1718';ctx.fillRect(point.x,point.y,zone.w,zone.h);ctx.globalAlpha=.035+.025*pulse;ctx.fillStyle='#b55f6b';ctx.fillRect(point.x,point.y,zone.w,zone.h);ctx.globalAlpha=1;ctx.strokeStyle=zone.structureCorridor?'#ffffff0a':'#ffffff15';ctx.lineWidth=1;ctx.strokeRect(point.x+.5,point.y+.5,zone.w-1,zone.h-1);ctx.restore();
};

toast=function(){};
broadcast=function(){};

const v040cLegacyNodeReady=structureNodeReady;
structureNodeReady=function(node){
 if(node?.nodeType==='exit')return structureClaimedNodes.has('weapon')&&structureClaimedNodes.has('passiveCombat');
 return v040cLegacyNodeReady(node);
};
structureOpenNode=function(node){
 if(!structureNodeReady(node))return;
 if(node.nodeType==='passive'){
  const keys=Object.keys(passives).filter(key=>!passiveInventory.has(key));
  if(keys.length)applyPassive(keys[Math.floor(Math.random()*keys.length)]);
  structureClaimNode(node);sfx('growth');return;
 }
 if(node.nodeType==='specimen'){creditSpecimens(100+structureFloor*40);structureClaimNode(node);return;}
 if(node.nodeType==='exit'){structureAdvanceFloor();return;}
};

syncActionButton=function(){
 if(!ui.actionButton)return;
 let nearestActor=null,actorDistance=76*76;
 for(const actor of unlockActors){const distance=(actor.x-player.x)*(actor.x-player.x)+(actor.y-player.y)*(actor.y-player.y);if(distance<actorDistance){actorDistance=distance;nearestActor=actor;}}
 let nearestWeapon=null,weaponDistance=86*86;
 for(const object of structureGroundWeapons){if(!objects.includes(object))continue;const cx=object.x+object.w*.5,cy=object.y+object.h*.5,distance=(cx-player.x)*(cx-player.x)+(cy-player.y)*(cy-player.y);if(distance<weaponDistance){weaponDistance=distance;nearestWeapon=object;}}
 let nearestNode=null,nodeDistance=92*92;
 for(const node of structureRewardNodes){if(node.claimed)continue;const cx=node.x+node.w*.5,cy=node.y+node.h*.5,distance=(cx-player.x)*(cx-player.x)+(cy-player.y)*(cy-player.y);if(distance<nodeDistance){nodeDistance=distance;nearestNode=node;}}
 if(nearestActor&&!paused&&!gameOver)currentAction={type:'unlock',kind:nearestActor.kind,accent:nearestActor.kind==='residual'?'#b77986':'#9aa5a1'};
 else if(nearestWeapon&&!paused&&!gameOver)currentAction={type:'groundWeapon',weapon:nearestWeapon,accent:'#eee6d5'};
 else if(nearestNode&&!paused&&!gameOver)currentAction={type:'structureNode',node:nearestNode,accent:structureNodeReady(nearestNode)?'#d8cec0':'#665b5e'};
 else if(secondaryWeaponKey&&!paused&&!gameOver)currentAction={type:'weaponSwap',accent:'#d8cec0'};
 else currentAction=null;
 ui.actionButton.classList.toggle('ready',!!currentAction);ui.actionButton.disabled=!currentAction;ui.actionButton.setAttribute('aria-disabled',String(!currentAction));ui.actionButton.style.setProperty('--action-accent',currentAction?.accent||'#625d5b');
 let icon='';if(currentAction?.type==='groundWeapon')icon=weapons[currentAction.weapon.weaponKey]?.icon||'·';else if(currentAction?.type==='weaponSwap')icon=weapons[secondaryWeaponKey]?.icon||'↔';else if(currentAction?.type==='structureNode')icon=currentAction.node.nodeType==='exit'?'▲':'·';
 ui.actionButton.textContent=icon;ui.actionButton.setAttribute('aria-label',currentAction?'상호작용 가능':'사용 가능한 상호작용 없음');
};
useActionButton=function(){
 if(!currentAction||paused||gameOver||organCinematicTimer>0)return;initAudio();
 if(currentAction.type==='groundWeapon')v040cPickupGroundWeapon(currentAction.weapon);
 else if(currentAction.type==='weaponSwap')structureSwapWeapon();
 else if(currentAction.type==='structureNode')structureOpenNode(currentAction.node);
 else legacyUseActionButton();
};

function v040cBuildEncounterPlan(room){
 const templateIndex=Math.floor(Math.random()*STRUCTURE_ENCOUNTER_TEMPLATES.length),template=STRUCTURE_ENCOUNTER_TEMPLATES[templateIndex];
 const mirrorX=Math.random()<.5?-1:1,mirrorY=Math.random()<.5?-1:1,usableX=room.w*.5-105,usableY=room.h*.5-90;
 const positions=template.map(([nx,ny])=>({type:'patient',x:room.x+nx*mirrorX*usableX,y:room.y+ny*mirrorY*usableY}));
 const plan={roomId:room.id,templateIndex,positions,activated:false,cleared:false};structureEncounterPlans.set(room.id,plan);structureEncounterLog.push({floor:structureFloor,roomId:room.id,templateIndex,enemies:positions.map(entry=>({...entry}))});return plan;
}
function v040cSpawnPlan(plan){
 for(const entry of plan.positions){
  const before=enemies.length;legacySpawnEnemy('patient',[entry.x,entry.y]);
  for(let index=before;index<enemies.length;index++){
   const enemy=enemies[index];enemy.type='patient';enemy.anomaly=false;enemy.waveId=null;enemy.wavePersistent=true;enemy.structureRoomId=plan.roomId;enemy.structureDormant=true;enemy.structureSpawnX=entry.x;enemy.structureSpawnY=entry.y;enemy.x=entry.x;enemy.y=entry.y;enemy.lastX=entry.x;enemy.lastY=entry.y;enemy.clotStun=999999;enemy.farTimer=0;enemy.stuckTimer=0;enemy.routeTimer=0;
  }
 }
}
function v040cBuildEncounters(){
 structureEncounterPlans=new Map();structureEncounterActive=new Set();structureEncounterCleared=new Set();structureEncounterGates=[];structureEncounterLog=[];
 for(const room of STRUCTURE_ROOMS)if(room.combat){const plan=v040cBuildEncounterPlan(room);v040cSpawnPlan(plan);}
}
function v040cInsideRoom(room,margin=54){return Math.abs(player.x-room.x)<=room.w*.5-margin&&Math.abs(player.y-room.y)<=room.h*.5-margin;}
function v040cAddGate(room,side,center){
 const gap=190,t=WARD_BOUNDS.wallT,left=room.x-room.w*.5,right=room.x+room.w*.5,top=room.y-room.h*.5,bottom=room.y+room.h*.5;let gate=null;
 if(side==='n')gate=structureAddObject('wall',center-gap*.5,top,gap,t,999,true,{structureEncounterGate:true,structureRoomId:room.id,zoneActive:true});
 if(side==='s')gate=structureAddObject('wall',center-gap*.5,bottom-t,gap,t,999,true,{structureEncounterGate:true,structureRoomId:room.id,zoneActive:true});
 if(side==='w')gate=structureAddObject('wall',left,center-gap*.5,t,gap,999,true,{structureEncounterGate:true,structureRoomId:room.id,zoneActive:true});
 if(side==='e')gate=structureAddObject('wall',right-t,center-gap*.5,t,gap,999,true,{structureEncounterGate:true,structureRoomId:room.id,zoneActive:true});
 if(gate)structureEncounterGates.push(gate);
}
function v040cSealRoom(room){
 for(const [side,centers] of Object.entries(room.doors||{}))for(const center of centers)v040cAddGate(room,side,center);rebuildObjectGrid();
}
function v040cOpenRoom(roomId){
 for(let index=objects.length-1;index>=0;index--)if(objects[index].structureEncounterGate&&objects[index].structureRoomId===roomId)objects.splice(index,1);
 structureEncounterGates=structureEncounterGates.filter(gate=>gate.structureRoomId!==roomId);rebuildObjectGrid();
}
function v040cActivateEncounter(room){
 const plan=structureEncounterPlans.get(room.id);if(!plan||plan.activated||plan.cleared)return;
 plan.activated=true;structureEncounterActive.add(room.id);v040cSealRoom(room);
 for(const enemy of enemies)if(enemy.structureRoomId===room.id){enemy.structureDormant=false;enemy.clotStun=0;enemy.farTimer=0;enemy.stuckTimer=0;enemy.routeTimer=0;enemy.navCheck=0;}
 sfx('door');
}
function v040cCompleteEncounter(room){
 const plan=structureEncounterPlans.get(room.id);if(!plan||plan.cleared)return;
 plan.cleared=true;structureEncounterActive.delete(room.id);structureEncounterCleared.add(room.id);v040cOpenRoom(room.id);
 const node=structureNodeById(room.id==='leftCombat'?'passiveCombat':'relicCombat');if(node){node.ready=true;renderMinimap();syncActionButton();}sfx('growth');
}

const v040cLegacyGenerateWorld=generateWorld;
generateWorld=function(){
 v040cLegacyGenerateWorld();v040cRemoveNodes(['weapon','relicCombat','organLab']);v040cBuildEncounters();if(primaryWeaponKey)v040cPlaceStartingWeapon();
};

spawnEnemy=function(){return null;};

const v040cLegacyReset=reset;
reset=function(){
 selectedCharacter='specimen';v040cLegacyReset();spawnTimer=999999;waves.length=0;currentWave=null;v040cPlaceStartingWeapon();v040cApplyWeaponLevels();syncActionButton();
};

const v040cLegacyUpdate=update;
update=function(dt){
 spawnTimer=999999;waves.length=0;currentWave=null;
 for(const enemy of enemies)if(enemy.structureDormant){enemy.x=enemy.structureSpawnX;enemy.y=enemy.structureSpawnY;enemy.lastX=enemy.x;enemy.lastY=enemy.y;enemy.hp=enemy.maxHp;enemy.clotStun=999999;enemy.farTimer=0;enemy.stuckTimer=0;enemy.wavePersistent=true;enemy.routeTimer=0;}
 v040cLegacyUpdate(dt);
 for(const room of STRUCTURE_ROOMS){
  if(!room.combat)continue;
  const plan=structureEncounterPlans.get(room.id);if(!plan)continue;
  if(!plan.activated&&!plan.cleared&&v040cInsideRoom(room))v040cActivateEncounter(room);
  if(plan.activated&&!plan.cleared&&!enemies.some(enemy=>enemy.structureRoomId===room.id))v040cCompleteEncounter(room);
 }
 syncActionButton();
};

`;

runtime = replaceRequired(runtime, 'ui.confirmSelectionBtn.onclick=', encounterRuntime + '\nui.confirmSelectionBtn.onclick=', 'v0.4.0.c 런타임 삽입');

const tempRuntime = path.join(root, '.tmp-runtime-v040c.js');
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
  .replaceAll('040b', '040c');
loader = loader.replace(/const parts=\[[^\]]+\];/, `const parts=[${chunks.map((_, index) => `\"${toSlug}/game.gz.part${String(index + 1).padStart(2, '0')}.txt\"`).join(',')}];`);
const noTextCss = String.raw`
#toast{display:none!important}
.abilityTrack,.abilityCurrent,.abilityRow{display:none!important}
`;
loader = replaceRequired(loader, '</style>', `${noTextCss}\n</style>`, '무문자 인게임 CSS');
write(toFile, loader);

for (const rel of ['index.html', 'playtest.html']) {
  const content = read(rel).replaceAll(fromFile, toFile).replaceAll(fromVersion, toVersion).replaceAll('040b', '040c');
  write(rel, content);
}
for (const rel of ['README.md', 'AGENTS.md', 'docs/PROJECT_STATUS.md']) {
  write(rel, read(rel).replaceAll(fromFile, toFile).replaceAll(fromVersion, toVersion).replaceAll('040b', '040c'));
}

const updateNote = `# Living Hospital ${toVersion}\n\n## 목표\n\n방 전투를 무한 웨이브가 아니라 층 생성 시 확정되는 배치형 인카운터로 전환하고, 베타 단일 주인공·물리적 무기 교환 구조의 기준선을 만듭니다.\n\n## 변경\n\n- 플레이어블 캐릭터를 베타 하나로 제한\n- 개인능력 강화 효과와 표시 비활성화\n- 대기 무기의 공통 보조효과 제거\n- 무기 최대 2개, 활성 무기 하나만 공격\n- 바닥 무기 근처에서 같은 버튼으로 활성 무기와 즉시 교환\n- 방 이름·토스트 등 플레이 중 설명용 글자 제거\n- 기존 전투 적을 기본 환자형 하나로 통일\n- 층 생성 시 전투방별 적 수와 위치를 내부 인카운터 로그에 선배정\n- 적은 방 안의 지정 위치에서 대기하고 플레이어 진입 후 활성화\n- 전투 시작 시 출입구 봉쇄, 전멸 시 재개방\n- 시간 기반 랜덤 웨이브와 화면 밖 적 생성 차단\n- F1의 장기·유물 보상 노드 제거\n\n## 확인\n\n- 첫 바닥 무기 획득 시 기존 무기가 대기 슬롯으로 이동하는지\n- 무기 두 개 보유 중 교환하면 활성 무기만 바닥에 남는지\n- 방 진입 전 적이 고정 위치에서 움직이지 않는지\n- 방 진입 시 문이 막히고 모든 적 처치 후 다시 열리는지\n- 다른 방의 대기 적이 사라지거나 플레이어를 추적하지 않는지\n- 전투 중 설명용 글자가 화면에 표시되지 않는지\n`;
write('UPDATE_v0.4.0.c.md', updateNote);

let changelog = read('docs/CHANGELOG.md');
if (!changelog.includes('## v0.4.0.c')) changelog += `\n## v0.4.0.c - 2026-08-02\n\n- 베타 단일 플레이어블 구조로 정리\n- 개인능력 강화 효과와 인게임 표시 비활성화\n- 대기 무기의 공통 보조효과 제거\n- 바닥 무기와 활성 무기를 같은 버튼으로 즉시 교환\n- 방 이름과 토스트 등 플레이 중 설명용 글자 제거\n- 적을 기본 환자형으로 통일하고 층 생성 시 방별 위치를 선배정\n- 시간 기반 랜덤 웨이브를 중단하고 방 진입형 섬멸전으로 변경\n- 전투방 진입 시 출입구 봉쇄, 전멸 시 재개방\n- F1 장기·유물 보상 노드 제거\n`;
write('docs/CHANGELOG.md', changelog);

console.log(`${toVersion} generated: ${chunks.length} runtime chunks`);
