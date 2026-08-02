import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const fromVersion = 'v0.3.4.h';
const toVersion = 'v0.4.0.a';
const fromSlug = 'v034h';
const toSlug = 'v040a';
const fromFile = 'Living_Hospital_v0.3.4.h.html';
const toFile = 'Living_Hospital_v0.4.0.a.html';

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

runtime = replaceRequired(
  runtime,
  "const WARD_BOUNDS={halfW:2300,halfH:1400,visualHalfW:2920,visualHalfH:1900,wallT:28,spawnInset:58,spawnViewMargin:160,minSpawnDistance:520};",
  "const WARD_BOUNDS={halfW:1580,halfH:1110,visualHalfW:1580,visualHalfH:1110,wallT:28,spawnInset:58,spawnViewMargin:120,minSpawnDistance:380};",
  '방형 맵 경계'
);
runtime = replaceRequired(
  runtime,
  "const MINIMAP={w:124,h:88,pad:5,minX:-2350,maxX:2350,minY:-1450,maxY:1450,viewW:2400,viewH:1650,baseInterval:.15};",
  "const MINIMAP={w:124,h:88,pad:5,minX:-1600,maxX:1600,minY:-1130,maxY:1130,viewW:3200,viewH:2260,baseInterval:.15};",
  '방형 미니맵 경계'
);

const structuralRuntime = String.raw`

// v0.4.0.a structural prototype: Omega floor, two-weapon swap, room rewards.
let structureFloor=1,primaryWeaponKey=null,secondaryWeaponKey=null,weaponSwapLock=0;
let structureRewardNodes=[],structureRoomKills={},structureVisitedRooms=new Set(),structureClaimedNodes=new Set();
let passiveInventory=new Set(),relicInventory=[],structureLastRoom=null,structureSecondaryKillClock=0;
const STRUCTURE_RELIC_LIMIT=3,STRUCTURE_CLEAR_QUOTA=10;
const STRUCTURE_WEAPON_KEYS=['blood','bone','heart','autophagy','stitch','incision'];
const STRUCTURE_RELICS={
 brokenDefib:{icon:'ϟ',name:'고장 난 제세동기',desc:'무기를 교체하면 짧은 전기 충격이 즉시 방출됩니다.'},
 crackedBottle:{icon:'◒',name:'금이 간 수혈병',desc:'열다섯 번째 처치마다 저장된 피가 상처를 조금 닫습니다.'},
 patientPager:{icon:'▤',name:'환자용 호출기',desc:'처음 들어간 방에서 주변 개체의 움직임이 잠시 멎습니다.'}
};
const STRUCTURE_SECONDARY_TEXT={
 blood:'대기 중에도 주무기의 발동 주기를 재촉합니다.',
 bone:'대기 중에도 주무기의 충격을 무겁게 만듭니다.',
 heart:'대기 중에도 치명 현상을 간헐적으로 유도합니다.',
 autophagy:'처치가 누적되면 상처를 조금 삼킵니다.',
 stitch:'교체 순간 주변 개체의 움직임을 잠시 묶습니다.',
 incision:'대기 중에도 주무기의 피해를 조금 증폭합니다.'
};
const STRUCTURE_ROOMS=[
 {id:'start',name:'회복 병실',x:0,y:850,w:820,h:420,tint:'#211a1b',doors:{n:[0]}},
 {id:'hub',name:'중앙 처치실',x:0,y:200,w:820,h:520,tint:'#20191a',doors:{s:[0],n:[0],w:[200],e:[200]}},
 {id:'leftCombat',name:'격리실',x:-1050,y:200,w:820,h:520,tint:'#1d1a20',combat:true,doors:{e:[200],n:[-1050]}},
 {id:'rightCombat',name:'배양실',x:1050,y:200,w:820,h:520,tint:'#1b201c',combat:true,doors:{w:[200],n:[1050]}},
 {id:'leftLab',name:'검체 보관실',x:-1050,y:-600,w:820,h:500,tint:'#201b22',doors:{s:[-1050]}},
 {id:'exit',name:'승강기실',x:0,y:-600,w:820,h:500,tint:'#24201b',doors:{s:[0]}},
 {id:'rightLab',name:'관찰실',x:1050,y:-600,w:820,h:500,tint:'#1b2221',doors:{s:[1050]}}
];
const STRUCTURE_CORRIDORS=[
 {id:'cStart',x:0,y:525,w:220,h:230,vertical:true},
 {id:'cLeft',x:-525,y:200,w:230,h:220},
 {id:'cRight',x:525,y:200,w:230,h:220},
 {id:'cUpperLeft',x:-1050,y:-205,w:220,h:290,vertical:true},
 {id:'cExit',x:0,y:-205,w:220,h:290,vertical:true},
 {id:'cUpperRight',x:1050,y:-205,w:220,h:290,vertical:true}
];

CHAPTER_DEFS.beta.subtitle='오메가의 내부';
CHAPTER_DEFS.beta.desc='오메가가 병원을 자신의 몸처럼 접어 만든 살아 있는 층.';
CHARACTER_DEFS.specimen.abilityText='두 무기가 서로의 자리를 받아들입니다. 교체와 적응을 반복할수록 반응이 빨라집니다.';
ABILITY_STEPS.specimen.splice(0,ABILITY_STEPS.specimen.length,
 '두 번째 무기를 받아들이면 공격 주기가 빨라집니다.',
 '두 무기의 적응 속도가 증가합니다.',
 '새 무기를 받아들이거나 교체하면 잠시 적응이 가속됩니다.',
 '적응 가속의 지속시간과 기본 효율이 증가합니다.',
 '보조무기가 존재하면 모든 피해가 증가합니다.',
 '보조효과가 피해 적응에도 관여합니다.',
 '공격 주기 적응의 상한이 크게 확장됩니다.',
 '적응 가속 중 피해량도 함께 증가합니다.',
 '보조무기가 존재하면 치명 현상 확률이 증가합니다.',
 '일정 시간마다 두 무기가 같은 순간에 반응합니다.'
);

function structureRoomAt(x,y){
 for(const room of STRUCTURE_ROOMS)if(Math.abs(x-room.x)<=room.w*.5&&Math.abs(y-room.y)<=room.h*.5)return room;
 let nearest=STRUCTURE_ROOMS[1],best=Infinity;for(const room of STRUCTURE_ROOMS){const d=(x-room.x)*(x-room.x)+(y-room.y)*(y-room.y);if(d<best){best=d;nearest=room;}}return nearest;
}
function structureNodeById(id){return structureRewardNodes.find(node=>node.nodeId===id)||null;}
function structureRewardCount(){let count=0;for(const id of structureClaimedNodes)if(id!=='exit')count++;return count;}
function structureNodeReady(node){if(!node||node.claimed)return false;if(node.nodeType==='exit')return structureRewardCount()>=3;return !!node.ready;}
function structureAddObject(type,x,y,w,h,hp=999,solid=true,extra={}){objects.push({id:Math.random(),type,x,y,w,h,hp,maxHp:hp,solid,active:true,flash:0,reveal:0,hitJolt:0,...extra});return objects.at(-1);}
function structureAddWall(x,y,w,h,extra={}){if(w<=1||h<=1)return;structureAddObject('wall',x,y,w,h,999,true,{zoneActive:true,...extra});}
function structureAddHorizontalWall(room,y,openings=[]){
 const left=room.x-room.w*.5,right=room.x+room.w*.5,gap=190,sorted=[...openings].sort((a,b)=>a-b);let cursor=left;
 for(const center of sorted){const a=Math.max(left,center-gap*.5),b=Math.min(right,center+gap*.5);structureAddWall(cursor,y,Math.max(0,a-cursor),WARD_BOUNDS.wallT);cursor=b;}
 structureAddWall(cursor,y,Math.max(0,right-cursor),WARD_BOUNDS.wallT);
}
function structureAddVerticalWall(room,x,openings=[]){
 const top=room.y-room.h*.5,bottom=room.y+room.h*.5,gap=190,sorted=[...openings].sort((a,b)=>a-b);let cursor=top;
 for(const center of sorted){const a=Math.max(top,center-gap*.5),b=Math.min(bottom,center+gap*.5);structureAddWall(x,cursor,WARD_BOUNDS.wallT,Math.max(0,a-cursor));cursor=b;}
 structureAddWall(x,cursor,WARD_BOUNDS.wallT,Math.max(0,bottom-cursor));
}
function structureAddRoomWalls(room){
 const left=room.x-room.w*.5,right=room.x+room.w*.5,top=room.y-room.h*.5,bottom=room.y+room.h*.5,t=WARD_BOUNDS.wallT;
 structureAddHorizontalWall(room,top,room.doors?.n||[]);structureAddHorizontalWall(room,bottom-t,room.doors?.s||[]);
 structureAddVerticalWall(room,left,room.doors?.w||[]);structureAddVerticalWall(room,right-t,room.doors?.e||[]);
}
function structureAddCorridorWalls(c){
 const left=c.x-c.w*.5,right=c.x+c.w*.5,top=c.y-c.h*.5,bottom=c.y+c.h*.5,t=WARD_BOUNDS.wallT;
 if(c.vertical){structureAddWall(left,top,t,c.h);structureAddWall(right-t,top,t,c.h);}else{structureAddWall(left,top,c.w,t);structureAddWall(left,bottom-t,c.w,t);}
}
function structureAddNode(nodeId,nodeType,roomId,x,y,ready=true){
 const node=structureAddObject('structureCache',x-27,y-27,54,54,999,false,{structureNode:true,nodeId,nodeType,roomId,ready,claimed:false});structureRewardNodes.push(node);return node;
}
function structureDecorate(){
 const marks=[[-230,850,'bed'],[230,850,'bed'],[-250,200,'table'],[245,200,'medicalCart'],[-1240,80,'bed'],[-860,320,'bed'],[860,80,'tank'],[1240,320,'table'],[-1240,-710,'table'],[-860,-505,'tank'],[870,-690,'screen'],[1220,-500,'table']];
 for(const [x,y,type] of marks)landmarks.push({x,y,r:42*SCALE.landmark,type,rot:0,mapBlock:false});
 for(let i=0;i<22;i++){const room=STRUCTURE_ROOMS[Math.floor(Math.random()*STRUCTURE_ROOMS.length)],x=room.x+(Math.random()-.5)*(room.w-130),y=room.y+(Math.random()-.5)*(room.h-130);landmarks.push({x,y,r:(12+Math.random()*18)*SCALE.landmark,type:Math.random()<.72?'blood':'corpse',rot:Math.random()*Math.PI*2});}
}

const legacyGenerateWorld=generateWorld;
generateWorld=function(){
 activeHospitalIds=[];hospitals=[];structureRewardNodes=[];structureRoomKills={leftCombat:0,rightCombat:0};structureClaimedNodes=new Set();structureVisitedRooms=new Set();structureLastRoom=null;
 zones=[...STRUCTURE_ROOMS.map(room=>({...room,active:true,structureRoom:true})),...STRUCTURE_CORRIDORS.map(c=>({...c,name:'접힌 통로',tint:'#171415',active:true,structureCorridor:true}))];
 const t=WARD_BOUNDS.wallT,hw=WARD_BOUNDS.halfW,hh=WARD_BOUNDS.halfH;
 structureAddObject('wall',-hw,-hh,hw*2,t,999,true,{render:false,boundary:true});structureAddObject('wall',-hw,hh-t,hw*2,t,999,true,{render:false,boundary:true});structureAddObject('wall',-hw,-hh,t,hh*2,999,true,{render:false,boundary:true});structureAddObject('wall',hw-t,-hh,t,hh*2,999,true,{render:false,boundary:true});
 for(const room of STRUCTURE_ROOMS)structureAddRoomWalls(room);for(const corridor of STRUCTURE_CORRIDORS)structureAddCorridorWalls(corridor);
 structureAddNode('weapon','weapon','start',170,850,true);
 structureAddNode('passiveCombat','passive','leftCombat',-1050,200,false);
 structureAddNode('relicCombat','relic','rightCombat',1050,200,false);
 structureAddNode('specimenLab','specimen','leftLab',-1050,-600,true);
 structureAddNode('organLab','organ','rightLab',1050,-600,true);
 structureAddNode('exit','exit','exit',0,-600,false);
 structureDecorate();
};

const legacyDrawRoom=drawRoom;
drawRoom=function(z){
 if(!z.structureRoom&&!z.structureCorridor){legacyDrawRoom(z);return;}
 const p=worldToScreen(z.x-z.w*.5,z.y-z.h*.5),pulse=.5+.5*Math.sin(elapsed*.9+z.x*.002+z.y*.003);ctx.save();ctx.fillStyle=z.tint||'#1b1718';ctx.fillRect(p.x,p.y,z.w,z.h);ctx.globalAlpha=.035+.025*pulse;ctx.fillStyle='#b55f6b';ctx.fillRect(p.x,p.y,z.w,z.h);ctx.globalAlpha=1;ctx.strokeStyle=z.structureCorridor?'#ffffff0a':'#ffffff15';ctx.lineWidth=1;ctx.strokeRect(p.x+.5,p.y+.5,z.w-1,z.h-1);if(z.structureRoom){ctx.fillStyle='#ffffff18';ctx.font='700 13px sans-serif';ctx.fillText(z.name,p.x+22,p.y+30);}ctx.restore();
};
const legacyDrawObject=drawObject;
drawObject=function(o,s){
 if(!o.structureNode){legacyDrawObject(o,s);return;}
 const ready=structureNodeReady(o),claimed=o.claimed,pulse=.5+.5*Math.sin(elapsed*5+o.id*7),icon=o.nodeType==='weapon'?'↔':o.nodeType==='passive'?'◇':o.nodeType==='relic'?'◆':o.nodeType==='organ'?'◉':o.nodeType==='specimen'?'▣':'▲';ctx.save();ctx.translate(s.x,s.y);ctx.globalAlpha=claimed?.22:1;ctx.fillStyle=ready?'#d9d1c5':'#51484a';ctx.fillRect(0,0,o.w,o.h);ctx.fillStyle='#171314';ctx.fillRect(6,6,o.w-12,o.h-12);ctx.strokeStyle=ready?'#fff':'#817679';ctx.lineWidth=ready?2:1;ctx.strokeRect(.5,.5,o.w-1,o.h-1);ctx.fillStyle=ready?'#fff':'#91878a';ctx.font='700 23px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(icon,o.w*.5,o.h*.52);if(ready&&!claimed){ctx.globalAlpha=.22+.18*pulse;ctx.strokeRect(-4-pulse*2,-4-pulse*2,o.w+8+pulse*4,o.h+8+pulse*4);}ctx.restore();
};

drawMinimapBase=function(){
 const c=minimapCtx;c.fillStyle='#090909';c.fillRect(0,0,MINIMAP.w,MINIMAP.h);c.save();c.beginPath();c.rect(MINIMAP.pad,MINIMAP.pad,MINIMAP.w-MINIMAP.pad*2,MINIMAP.h-MINIMAP.pad*2);c.clip();
 for(const z of zones){if(!z.structureRoom&&!z.structureCorridor)continue;const r=minimapRect(z.x-z.w*.5,z.y-z.h*.5,z.w,z.h);c.fillStyle=z.structureCorridor?'#3a3031':'#272122';c.fillRect(r.x,r.y,r.w,r.h);if(z.structureRoom){c.strokeStyle='#705c5f';c.lineWidth=.8;c.strokeRect(r.x+.5,r.y+.5,Math.max(0,r.w-1),Math.max(0,r.h-1));}}
 c.restore();c.strokeStyle='#ffffff33';c.strokeRect(.5,.5,MINIMAP.w-1,MINIMAP.h-1);
};
renderMinimap=function(){
 drawMinimapBase();for(const node of structureRewardNodes){if(node.claimed)continue;const m=minimapPoint(node.x+node.w*.5,node.y+node.h*.5);minimapCtx.fillStyle=structureNodeReady(node)?'#f2e8d8':'#776b6e';minimapCtx.fillRect(m.x-1.5,m.y-1.5,3,3);}const p=minimapPoint(player.x,player.y);minimapCtx.save();minimapCtx.translate(p.x,p.y);minimapCtx.fillStyle='#fff';minimapCtx.strokeStyle='#111';minimapCtx.lineWidth=1;minimapCtx.beginPath();minimapCtx.moveTo(0,-5);minimapCtx.lineTo(4,4);minimapCtx.lineTo(0,2.5);minimapCtx.lineTo(-4,4);minimapCtx.closePath();minimapCtx.fill();minimapCtx.stroke();minimapCtx.restore();
};

const legacyActiveWeaponCount=activeWeaponCount;
activeWeaponCount=function(){return (primaryWeaponKey?1:0)+(secondaryWeaponKey?1:0);};
const legacySpecimenAbilityStats=specimenAbilityStats;
specimenAbilityStats=function(){const lv=characterAbilityLevel('specimen'),per=[.015,.020,.025,.025,.030,.030,.035,.040,.040,.045,.050][lv],cap=[.12,.14,.16,.18,.19,.20,.22,.24,.25,.27,.30][lv];return{lv,per,cap,surge:lv>=3?(lv>=8?18:12):0,surgeSpeed:lv>=10?1.30:1.20,damage:lv>=5&&secondaryWeaponKey?.08:0,perDamage:lv>=6?.015:0,surgeDamage:lv>=8?.12:0,crit:lv>=9&&secondaryWeaponKey?.06:0,sync:lv>=10};};
function structureEquipSecondary(key){
 if(!weapons[key]||key===primaryWeaponKey)return;secondaryWeaponKey=key;for(const [weaponKey,w] of Object.entries(weapons))w.level=weaponKey===primaryWeaponKey||weaponKey===secondaryWeaponKey?8:0;weapons[key].timer=Math.min(weapons[key].timer||0,.3);onWeaponAcquired(key);player.adaptationSurge=Math.max(player.adaptationSurge||0,specimenAbilityStats().surge||0);updateStructureHud();renderPauseSummary();syncActionButton();
}
grantWeaponLevel=function(key){if(key===primaryWeaponKey||key===secondaryWeaponKey)return;if(!secondaryWeaponKey)structureEquipSecondary(key);else structureEquipSecondary(key);};
const legacyApplyPassive=applyPassive;
applyPassive=function(key){if(passiveInventory.has(key))return;legacyApplyPassive(key);passives[key].level=1;passiveInventory.add(key);updateStructureHud();};
const legacyAtkSpeedMult=atkSpeedMult;
atkSpeedMult=function(){return legacyAtkSpeedMult()*(secondaryWeaponKey==='blood'?1.12:1);};
const legacyDamageMult=damageMult;
damageMult=function(){return legacyDamageMult()*(secondaryWeaponKey==='bone'?1.15:secondaryWeaponKey==='incision'?1.08:1);};
const legacyRollWeaponCrit=rollWeaponCrit;
rollWeaponCrit=function(key){return legacyRollWeaponCrit(key)||(secondaryWeaponKey==='heart'&&Math.random()<.055);};
gainXp=function(v){creditSpecimens(Math.max(1,Math.round(v*2)));};
openGrowthChoice=function(){};

function structureWeaponChoices(){
 const keys=STRUCTURE_WEAPON_KEYS.filter(key=>meta.unlockedWeapons[key]&&key!==primaryWeaponKey&&key!==secondaryWeaponKey);return shuffledCopy(keys).slice(0,3).map(key=>({icon:weapons[key].icon,type:secondaryWeaponKey?'보조 무기 교체':'보조 무기',name:weapons[key].name,desc:STRUCTURE_SECONDARY_TEXT[key]||weapons[key].lore,apply(){structureEquipSecondary(key);}}));
}
function structurePassiveChoices(){
 const keys=Object.keys(passives).filter(key=>!passiveInventory.has(key));return shuffledCopy(keys).slice(0,3).map(key=>({icon:passives[key].icon,type:'패시브',name:passives[key].name,desc:passives[key].desc,apply(){applyPassive(key);}}));
}
function structureRelicChoices(){
 const keys=Object.keys(STRUCTURE_RELICS).filter(key=>!relicInventory.includes(key));return shuffledCopy(keys).slice(0,3).map(key=>{const d=STRUCTURE_RELICS[key];return{icon:d.icon,type:'유물',name:d.name,desc:d.desc,apply(){if(relicInventory.length<STRUCTURE_RELIC_LIMIT)relicInventory.push(key);else creditSpecimens(80);updateStructureHud();}};});
}
function structureOrganChoices(){
 const keys=shuffledCopy(ORGAN_SLOTS).slice(0,3);return keys.map(slot=>{const d=ORGAN_DEFS[slot];return{icon:d.icon,type:'장기',name:d.name,desc:d.lore,apply(){organStored[slot]=true;transplantOrgan(slot);renderOrganHud();}};});
}
function structureClaimNode(node){node.claimed=true;structureClaimedNodes.add(node.nodeId);updateStructureHud();renderMinimap();syncActionButton();}
function structureOpenNode(node){
 if(!structureNodeReady(node)){toast(node.nodeType==='exit'?'아직 세 개의 반응이 필요합니다.':'방이 아직 당신을 놓아주지 않습니다.');return;}
 if(node.nodeType==='specimen'){creditSpecimens(100+structureFloor*40);structureClaimNode(node);toast('보존액 속 검체가 몸 안으로 스며듭니다.');return;}
 if(node.nodeType==='exit'){structureAdvanceFloor();return;}
 const choices=node.nodeType==='weapon'?structureWeaponChoices():node.nodeType==='passive'?structurePassiveChoices():node.nodeType==='organ'?structureOrganChoices():structureRelicChoices();
 if(!choices.length){creditSpecimens(70);structureClaimNode(node);toast('남은 것은 검체뿐입니다.');return;}
 const title=node.nodeType==='weapon'?'어느 반응을 깨울 것인가':node.nodeType==='passive'?'몸이 새로운 규칙을 기억합니다':node.nodeType==='organ'?'당신의 빈자리가 반응합니다':'병원이 버리지 못한 물건';
 for(const choice of choices){const original=choice.apply;choice.apply=()=>{original();structureClaimNode(node);};}
 openConfirmedRewardChoice(title,choices,{cancelLabel:'닫기'});
}
function structureSwapWeapon(){
 if(!secondaryWeaponKey||weaponSwapLock>0)return;const old=primaryWeaponKey;primaryWeaponKey=secondaryWeaponKey;secondaryWeaponKey=old;weaponSwapLock=.4;bodyTwitch=Math.max(bodyTwitch,.18);sfx('growth');if(relicInventory.includes('brokenDefib')){defibrillatorTimer=Math.max(defibrillatorTimer,1.05);defibrillatorPulseClock=0;}if(secondaryWeaponKey==='stitch')for(const e of enemies)e.shockStun=Math.max(e.shockStun||0,.42);const st=specimenAbilityStats();if(selectedCharacter==='specimen'&&st.surge>0)player.adaptationSurge=Math.max(player.adaptationSurge||0,Math.min(5,st.surge*.35));updateStructureHud();syncActionButton();
}

const legacySyncActionButton=syncActionButton;
syncActionButton=function(){
 if(!ui.actionButton)return;let nearestActor=null,actorD=76*76;for(const a of unlockActors){const d=(a.x-player.x)*(a.x-player.x)+(a.y-player.y)*(a.y-player.y);if(d<actorD){actorD=d;nearestActor=a;}}
 let nearestNode=null,nodeD=92*92;for(const node of structureRewardNodes){if(node.claimed)continue;const cx=node.x+node.w*.5,cy=node.y+node.h*.5,d=(cx-player.x)*(cx-player.x)+(cy-player.y)*(cy-player.y);if(d<nodeD){nodeD=d;nearestNode=node;}}
 if(nearestActor&&!paused&&!gameOver)currentAction={type:'unlock',kind:nearestActor.kind,accent:nearestActor.kind==='residual'?'#b77986':'#9aa5a1'};else if(nearestNode&&!paused&&!gameOver)currentAction={type:'structureNode',node:nearestNode,accent:structureNodeReady(nearestNode)?'#d8cec0':'#665b5e'};else if(secondaryWeaponKey&&!paused&&!gameOver)currentAction={type:'weaponSwap',accent:'#d8cec0'};else currentAction=null;
 ui.actionButton.classList.toggle('ready',!!currentAction);ui.actionButton.disabled=!currentAction;ui.actionButton.setAttribute('aria-disabled',String(!currentAction));ui.actionButton.style.setProperty('--action-accent',currentAction?.accent||'#625d5b');let icon='';if(currentAction?.type==='weaponSwap')icon=weapons[secondaryWeaponKey]?.icon||'↔';else if(currentAction?.type==='structureNode')icon=currentAction.node.nodeType==='exit'?'▲':'·';ui.actionButton.textContent=icon;ui.actionButton.setAttribute('aria-label',currentAction?.type==='weaponSwap'?'무기 교체':currentAction?'상호작용 가능':'사용 가능한 상호작용 없음');
};
const legacyUseActionButton=useActionButton;
useActionButton=function(){if(!currentAction||paused||gameOver||organCinematicTimer>0)return;initAudio();if(currentAction.type==='weaponSwap')structureSwapWeapon();else if(currentAction.type==='structureNode')structureOpenNode(currentAction.node);else legacyUseActionButton();};

function structureEnemyPoint(room){
 const inset=70,side=Math.floor(Math.random()*4);if(side===0)return[room.x-room.w*.5+inset+Math.random()*(room.w-inset*2),room.y-room.h*.5+inset];if(side===1)return[room.x+room.w*.5-inset,room.y-room.h*.5+inset+Math.random()*(room.h-inset*2)];if(side===2)return[room.x-room.w*.5+inset+Math.random()*(room.w-inset*2),room.y+room.h*.5-inset];return[room.x-room.w*.5+inset,room.y-room.h*.5+inset+Math.random()*(room.h-inset*2)];
}
const legacySpawnEnemy=spawnEnemy;
spawnEnemy=function(...args){if(!secondaryWeaponKey)return;const before=enemies.length,result=legacySpawnEnemy(...args),room=structureRoomAt(player.x,player.y)||STRUCTURE_ROOMS[1];for(let i=before;i<enemies.length;i++){const e=enemies[i],p=structureEnemyPoint(room);e.x=p[0];e.y=p[1];e.lastX=e.x;e.lastY=e.y;e.routeTimer=0;e.stuckTimer=0;}return result;};
const legacyKillEnemy=killEnemy;
killEnemy=function(i,e){const x=e.x,y=e.y,type=e.type;legacyKillEnemy(i,e);if(type==='collector')return;const room=structureRoomAt(x,y);if(room?.combat){structureRoomKills[room.id]=(structureRoomKills[room.id]||0)+1;const node=structureNodeById(room.id==='leftCombat'?'passiveCombat':'relicCombat');if(node&&!node.ready&&structureRoomKills[room.id]>=STRUCTURE_CLEAR_QUOTA){node.ready=true;toast('방이 더 이상 당신을 붙잡지 못합니다.');renderMinimap();syncActionButton();}}
 if(relicInventory.includes('crackedBottle')){structureSecondaryKillClock++;if(structureSecondaryKillClock>=15){structureSecondaryKillClock=0;player.hp=Math.min(player.maxHp,player.hp+8);}}
};

function updateStructureHud(){
 const floorEl=document.getElementById('floorValue'),primaryEl=document.getElementById('primaryWeaponValue'),secondaryEl=document.getElementById('secondaryWeaponValue'),passiveEl=document.getElementById('passiveValue'),relicEl=document.getElementById('relicValue'),progressEl=document.getElementById('floorProgressValue');if(floorEl)floorEl.textContent=String(structureFloor);if(primaryEl)primaryEl.textContent=primaryWeaponKey?(weapons[primaryWeaponKey]?.icon||'·'):'·';if(secondaryEl)secondaryEl.textContent=secondaryWeaponKey?(weapons[secondaryWeaponKey]?.icon||'·'):'—';if(passiveEl)passiveEl.textContent=String(passiveInventory.size);if(relicEl)relicEl.textContent=relicInventory.length+'/'+STRUCTURE_RELIC_LIMIT;if(progressEl)progressEl.textContent=structureRewardCount()+'/3';
}
const legacyUpdateHudDom=updateHudDom;
updateHudDom=function(force=false){legacyUpdateHudDom(force);if(ui.xpFill)ui.xpFill.style.width='0%';updateStructureHud();};
const legacyRenderPauseSummary=renderPauseSummary;
renderPauseSummary=function(){
 if(!ui.pauseSummary)return;const weaponsNow=[primaryWeaponKey,secondaryWeaponKey].filter(Boolean).map((key,index)=>pauseItem(weapons[key].icon,weapons[key].name+(index===0?' · 주무기':' · 보조무기'),index===0?weapons[key].lore:STRUCTURE_SECONDARY_TEXT[key])).join('');const passivesNow=[...passiveInventory].map(key=>pauseItem(passives[key].icon,passives[key].name,passives[key].desc)).join('');let organItems='';if(activeOrgan){const d=ORGAN_DEFS[activeOrgan];organItems+=pauseItem(d.icon,d.name+' · 메인 장기',d.lore);}else organItems='<div class="pauseEmpty">이식된 메인 장기가 없습니다.</div>';const relicItems=relicInventory.map(key=>{const d=STRUCTURE_RELICS[key];return pauseItem(d.icon,d.name,d.desc);}).join('');ui.pauseSummary.innerHTML='<section class="pauseSection"><h3>무기</h3>'+(weaponsNow||'<div class="pauseEmpty">활성 무기 없음</div>')+'</section><section class="pauseSection"><h3>패시브</h3>'+(passivesNow||'<div class="pauseEmpty">아직 몸에 남은 반응이 없습니다.</div>')+'</section><section class="pauseSection"><h3>장기</h3>'+organItems+'</section><section class="pauseSection"><h3>유물</h3>'+(relicItems||'<div class="pauseEmpty">회수한 유물이 없습니다.</div>')+'</section>';ui.audioToggleBtn.textContent=soundEnabled?'음향 켜짐':'음향 꺼짐';ui.audioToggleBtn.classList.toggle('off',!soundEnabled);
};

function structureClearFloorObjects(){
 recycleAllActive();waves.length=0;slashes.length=0;stitchFx.length=0;stitchGroups.length=0;incisionFx.length=0;unlockActors.length=0;bossHazards.length=0;boneShards.length=0;boneImpactFx.length=0;shockFx.length=0;leechFx.length=0;bloodWrapFx.length=0;brainLinks.length=0;landmarks.length=0;objects.length=0;zones.length=0;events.length=0;hazards.length=0;clotFields.length=0;clotCritFx.length=0;clotReleaseFx.length=0;organDrops.length=0;pickups.length=0;pickupRespawns.length=0;breaches.length=0;navGates.length=0;
}
function structureAdvanceFloor(){
 structureFloor++;structureClearFloorObjects();generateWorld();rebuildObjectGrid();buildMinimapStatic();player.x=0;player.y=850;camera.x=0;camera.y=850;renderCamera.x=0;renderCamera.y=850;spawnTimer=1.2;buildMinimapStatic();renderMinimap();updateStructureHud();syncActionButton();toast(structureFloor%2===0?'오메가가 병동의 순서를 다시 접습니다.':'벽 안쪽에서 새로운 층이 자랍니다.');
}

const legacyReset=reset;
reset=function(){
 legacyReset();structureFloor=1;passiveInventory=new Set();relicInventory=[];structureSecondaryKillClock=0;weaponSwapLock=0;primaryWeaponKey=CHARACTER_DEFS[selectedCharacter]?.weapon||'blood';secondaryWeaponKey=null;for(const [key,w] of Object.entries(weapons))w.level=key===primaryWeaponKey?8:0;player.x=0;player.y=850;camera.x=0;camera.y=850;renderCamera.x=0;renderCamera.y=850;player.xp=0;growthCount=0;buildMinimapStatic();renderMinimap();updateStructureHud();syncActionButton();toast('오메가는 벽과 배관을 자신의 몸처럼 접어 올렸습니다.');
};

const legacyUpdate=update;
update=function(dt){
 weaponSwapLock=Math.max(0,weaponSwapLock-dt);if(secondaryWeaponKey&&weapons[secondaryWeaponKey])weapons[secondaryWeaponKey].timer=(weapons[secondaryWeaponKey].timer||0)-dt;const levels={};for(const [key,w] of Object.entries(weapons)){levels[key]=w.level;w.level=0;}if(primaryWeaponKey&&weapons[primaryWeaponKey])weapons[primaryWeaponKey].level=8;
 try{legacyUpdate(dt);}finally{for(const w of Object.values(weapons))w.level=0;if(primaryWeaponKey&&weapons[primaryWeaponKey])weapons[primaryWeaponKey].level=8;if(secondaryWeaponKey&&weapons[secondaryWeaponKey])weapons[secondaryWeaponKey].level=8;}
 const room=structureRoomAt(player.x,player.y);if(room&&room.id!==structureLastRoom){structureLastRoom=room.id;if(!structureVisitedRooms.has(room.id)){structureVisitedRooms.add(room.id);if(relicInventory.includes('patientPager'))for(const e of enemies)e.shockStun=Math.max(e.shockStun||0,.75);if(room.id!=='start')toast(room.name);}}syncActionButton();
};
updateChapterTimeline=function(){};

`;

runtime = replaceRequired(runtime, 'ui.confirmSelectionBtn.onclick=', structuralRuntime + '\nui.confirmSelectionBtn.onclick=', '구조 프로토타입 런타임 삽입');

const tempRuntime = path.join(root, '.tmp-runtime-v040a.js');
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
  .replaceAll('034h', '040a');
loader = loader.replace(/const parts=\[[^\]]+\];/, `const parts=[${chunks.map((_, index) => `\"${toSlug}/game.gz.part${String(index + 1).padStart(2, '0')}.txt\"`).join(',')}];`);
loader = replaceRequired(loader, '<title>Living Hospital v0.4.0.a · CHAPTER I β</title>', '<title>Living Hospital v0.4.0.a · OMEGA FLOOR</title>', '문서 제목');
loader = replaceRequired(loader, '<div class="statusRow"><div class="bar" aria-label="경험치"><div id="xpFill" class="fill xp"></div></div></div>', '<span id="xpFill" hidden></span>', 'EXP 바 제거');
loader = replaceRequired(loader, '<div id="specimenHud" aria-label="이번 플레이에서 회수한 검체"><span class="specimenVial" aria-hidden="true"></span><span id="specimenCount">0</span></div>', '<div id="specimenHud" aria-label="이번 플레이에서 회수한 검체"><span class="specimenVial" aria-hidden="true"></span><span id="specimenCount">0</span></div>\n  <div id="structureHud" aria-label="현재 층과 장비"><span class="structureCell">F<span id="floorValue">1</span></span><span class="structureCell weapon primary"><span id="primaryWeaponValue">·</span></span><span class="structureArrow">⇄</span><span class="structureCell weapon secondary"><span id="secondaryWeaponValue">—</span></span><span class="structureCell">P <span id="passiveValue">0</span></span><span class="structureCell">R <span id="relicValue">0/3</span></span><span class="structureCell">□ <span id="floorProgressValue">0/3</span></span></div>', '구조 HUD 추가');
const extraCss = String.raw`
#barStack{min-width:180px}
#structureHud{position:absolute;left:max(12px,env(safe-area-inset-left));top:max(67px,calc(env(safe-area-inset-top) + 60px));display:flex;align-items:center;gap:5px;height:28px;padding:4px 7px;box-sizing:border-box;border:1px solid #ffffff35;border-radius:8px;background:#100d0ddd;font-size:10px;font-weight:800;pointer-events:none}
.structureCell{height:18px;min-width:23px;padding:0 5px;display:flex;align-items:center;justify-content:center;gap:3px;border:1px solid #ffffff20;border-radius:4px;background:#241d1e}.structureCell.weapon{font-size:14px;min-width:26px}.structureCell.primary{border-color:#ffffffa0}.structureCell.secondary{opacity:.72}.structureArrow{opacity:.55;font-size:11px}
#actionButton{display:flex!important;align-items:center!important;justify-content:center!important;font-size:25px!important;font-weight:800!important;color:#fff!important}#actionButton.ready{border-color:var(--action-accent)!important;box-shadow:0 0 0 2px #0008,0 0 16px color-mix(in srgb,var(--action-accent) 55%,transparent)!important}
@media(max-height:430px){#structureHud{top:max(58px,calc(env(safe-area-inset-top) + 52px));height:24px;padding:3px 5px;gap:3px}.structureCell{height:16px;padding:0 4px;font-size:9px}#specimenHud{top:max(112px,calc(env(safe-area-inset-top) + 106px))}#debug{top:max(139px,calc(env(safe-area-inset-top) + 133px))}}
`;
loader = replaceRequired(loader, '</style>', `${extraCss}\n</style>`, '구조 HUD CSS');
write(toFile, loader);

for (const rel of ['index.html','playtest.html']) {
  let content = read(rel).replaceAll(fromFile, toFile).replaceAll('034h', '040a').replaceAll(fromVersion, toVersion);
  write(rel, content);
}
let readme = read('README.md').replaceAll(fromFile, toFile).replaceAll(fromVersion, toVersion);
readme = readme.replace('싱글 파일 HTML 액션 로그라이크 프로토타입입니다.', 'HTML 액션 로그라이크 프로토타입입니다. v0.4 계열은 오메가가 변형하는 방 연결형 병원을 검증합니다.');
write('README.md', readme);
let agents = read('AGENTS.md').replaceAll(fromFile, toFile).replaceAll(fromVersion, toVersion);
agents = agents.replace('- 기본 무기는 개성이 있으나 완성형 성능이 아니어야 합니다.', '- 무기는 획득 즉시 완성형으로 작동하며, 주무기와 보조무기를 A버튼으로 교체합니다.');
write('AGENTS.md', agents);
write('docs/PROJECT_STATUS.md', `# 프로젝트 상태\n\n마지막 갱신: 2026-08-02\n\n## 현재 기준\n\n- 저장소 기준 최신 빌드: **${toVersion}**\n- 기준 파일: \`${toFile}\`\n- 작업 브랜치: \`agent/v035-structural-prototype\`\n- 주 테스트 환경: iPhone 가로 화면\n\n## 현재 개발 단계\n\n${toVersion}는 기존 v0.3.4.h 전투 엔진을 유지하면서 게임의 큰 진행 구조를 교체한 1차 프로토타입입니다.\n\n적용된 골격:\n\n1. 단일 대형 병실을 일곱 개 방과 짧은 통로로 구성된 층으로 교체\n2. EXP 바와 레벨업 선택을 제거하고 적 처치 보상을 검체로 전환\n3. 무기 보유량을 주무기 1개와 보조무기 1개로 제한\n4. A버튼으로 두 무기의 역할을 교체하고, 대기 무기는 보조효과 제공\n5. 패시브는 중복 없이 누적되며 화면상 레벨 제거\n6. 관찰실의 장기 보상에서 기존 장기 3종 중 하나를 이식하는 경로 추가\n7. 장기 1개 교체식 구조 유지 및 유물 최대 3개 보유 골격 추가\n8. 방 보상 세 개를 회수하면 다음 층으로 이동 가능\n9. 오메가가 병원을 장악해 내부를 변형한다는 서사 전제로 변경\n\n## 이번 버전의 의도적 한계\n\n- 방 배치는 아직 고정형입니다.\n- 무기별 보조효과와 유물 효과는 구조 검증용 1차 수치입니다.\n- 장기 목표군 6종 중 기존 구현된 심장·뇌·위만 실제 작동합니다.\n- 봉쇄문, 방별 세부 목표, 무기·패시브 시너지 태그는 다음 단계입니다.\n- 보스 타임라인은 구조 검증 중 임시 비활성화했습니다.\n\n## 우선 확인 항목\n\n- 방과 통로에서 적이 벽에 장시간 걸리지 않는지\n- A버튼 스왑이 기존 상호작용과 충돌하지 않는지\n- 주무기만 완전 공격하고 보조무기는 직접 동시 발사하지 않는지\n- 보상 세 개 회수 후 층 이동이 정상 작동하는지\n- iPhone 가로 화면에서 새 HUD가 겹치거나 잘리지 않는지\n- EXP 제거 후 검체 획득량과 전투 동기가 적절한지\n`);
write('docs/PROJECT_RULES.md', `# 프로젝트 고정 원칙\n\n## 게임 방향\n\n- 방을 탐색하며 빌드를 조립하는 뱀서류 기반 액션 로그라이크\n- 한 판 목표 길이 30~45분\n- 모바일 가로 화면 우선\n- 귀엽지만 그로테스크한 병원·실험실\n- 오메가는 병원과 결합해 공간을 움직이고 변형합니다.\n\n## 진행 구조\n\n- 병원은 여러 방이 연결된 층으로 구성합니다.\n- 일정 수의 방 보상을 회수하면 다음 층으로 이동합니다.\n- 모든 방을 전멸전으로 만들지 않으며 생존·파괴·활성화 목표를 혼합합니다.\n- 긴 복도보다 짧은 연결 통로를 사용합니다.\n\n## 전투와 성장\n\n- 플레이어 레벨과 EXP 성장은 사용하지 않습니다.\n- 적 처치와 탐색으로 검체를 얻습니다.\n- 검체는 캐릭터 개인능력의 1~10강 영구 강화에 사용합니다.\n- 무기는 획득 즉시 완성된 기능을 가집니다.\n- 최대 무기는 주무기 1개와 보조무기 1개입니다.\n- A버튼으로 두 무기의 역할을 교체합니다.\n- 주무기는 완전한 공격을 수행하고 보조무기는 직접 동시 발사 대신 보조효과를 제공합니다.\n- 단일 공격은 강하고 광역 공격은 상대적으로 약해야 합니다.\n\n## 패시브·장기·유물\n\n- 패시브는 슬롯 제한과 레벨 없이 중복되지 않게 누적합니다.\n- 패시브는 단순 수치보다 상태와 공격 사이의 연쇄 반응을 만듭니다.\n- 메인 장기는 한 번에 1개만 착용하며 새 장기와 교체합니다.\n- 목표 장기군은 뇌, 심장, 위, 간, 폐, 척추입니다.\n- 유물은 최대 3개이며 일반 규칙을 비트는 희귀 효과를 담당합니다.\n\n## 정보 전달과 성능\n\n- 텍스트는 짧고 모호하며 실제 효과·이미지·소리로 학습하게 합니다.\n- 발열과 프레임 유지가 최우선 기술 조건입니다.\n- 현재 방 주변만 활성화하는 방향으로 객체와 충돌 계산을 제한합니다.\n`);
let changelog = read('docs/CHANGELOG.md').trimEnd();
if (!changelog.includes(`## ${toVersion} - 2026-08-02`)) changelog += `\n\n## ${toVersion} - 2026-08-02\n\n- 일곱 개 방과 짧은 통로로 구성된 오메가 층 프로토타입 추가\n- EXP 바와 레벨업 선택 제거, 경험치 구슬을 검체 회수로 전환\n- 주무기·보조무기 2칸 구조와 A버튼 스왑 추가\n- 보조무기 직접 동시 발사를 막고 무기별 1차 보조효과 적용\n- 패시브 무제한 비중복 수집, 관찰실 장기 선택, 장기 1개 유지, 유물 3칸 골격 추가\n- 방 보상 3개 회수 후 다음 층 재구성\n- 오메가가 병원 전체를 장악해 공간을 변형한다는 설정 반영\n`;
write('docs/CHANGELOG.md', changelog);
write('UPDATE_v0.4.0.a.md', `# Living Hospital ${toVersion}\n\n## 구조 개편\n\n- 맵이 단일 병실에서 방 연결형 층으로 바뀌었습니다.\n- EXP와 레벨업을 제거했습니다.\n- 무기는 두 개만 보유하며 A버튼으로 주·보조 역할을 교체합니다.\n- 패시브는 레벨 없이 누적되고, 관찰실에서 장기를 교체하며, 유물은 최대 세 개까지 보유합니다.\n- 세 개의 보상을 회수하면 오메가가 다음 층을 다시 구성합니다.\n\n## 테스트 포인트\n\n- 시작 방의 무기 장치에서 보조무기를 획득할 수 있는지\n- A버튼으로 주무기와 보조무기가 정상 교체되는지\n- 격리실과 배양실에서 10마리 처치 후 보상 장치가 활성화되는지\n- 보상 세 개 회수 후 승강기실에서 다음 층으로 이동하는지\n- 새 HUD와 미니맵이 iPhone 가로 화면에서 읽히는지\n`);

// Diagnostic extraction files are branch-only scaffolding and should not remain in the review diff.
fs.rmSync(path.join(root, 'debug'), { recursive: true, force: true });
fs.rmSync(path.join(root, 'scripts/extract_v034h_runtime.mjs'), { force: true });
fs.rmSync(path.join(root, '.github/workflows/extract-v034h-runtime.yml'), { force: true });

console.log(`${toVersion} 생성 완료: ${chunks.length} parts, runtime ${runtime.length} bytes`);
