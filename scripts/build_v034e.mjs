import fs from 'node:fs';
import zlib from 'node:zlib';

const repo='.';
const sourceParts=[1,2,3,4].map(i=>`${repo}/v034d/game.gz.part${String(i).padStart(2,'0')}.txt`);
const packed=sourceParts.map(path=>fs.readFileSync(path,'utf8')).join('').replace(/\s+/g,'');
let source=zlib.gunzipSync(Buffer.from(packed,'base64')).toString('utf8');
function replaceOnce(oldText,newText,label){if(!source.includes(oldText))throw new Error(label);source=source.replace(oldText,newText);}
function replaceRegex(regex,newText,label){if(!regex.test(source))throw new Error(label);source=source.replace(regex,newText);}

replaceOnce("const MINIMAP={w:124,h:88,pad:5,minX:-2050,maxX:2050,minY:-1150,maxY:1150,viewW:1900,viewH:1348,baseInterval:.15};","const MINIMAP={w:124,h:88,pad:5,minX:-1840,maxX:1840,minY:-1040,maxY:1040,viewW:1900,viewH:1348,baseInterval:.15};",'minimap');
replaceOnce("Object.assign(player,{x:0,y:0,r:16*SCALE.player","Object.assign(player,{x:0,y:620,r:16*SCALE.player",'player start');

replaceRegex(/const HOSPITAL_DEFS=\[[\s\S]*?\n\];\nlet hospitals=/,`const HOSPITAL_DEFS=[
 {id:'supportRecovery',name:'격리 병상',short:'회복',zoneId:'supportRecovery',color:'#79b58b',role:'support'},
 {id:'supportTransfusion',name:'응급 처치대',short:'수혈',zoneId:'supportTransfusion',color:'#d15b68',role:'support'},
 {id:'organHeart',name:'심전도 장비',short:'심장',zoneId:'organHeart',color:'#d94d5b',role:'organ',organSlot:'heart',eventLabel:'정지된 심장 회수'},
 {id:'organBrain',name:'관찰 장비',short:'신경',zoneId:'organBrain',color:'#b58ad2',role:'organ',organSlot:'brain',eventLabel:'침식된 뇌 표본 회수'},
 {id:'organStomach',name:'처치 장비',short:'소화',zoneId:'organStomach',color:'#d1b45f',role:'organ',organSlot:'stomach',eventLabel:'포식 기관 회수'},
 {id:'organLockedA',name:'봉인 카트 A',short:'봉인',zoneId:'organLockedA',color:'#55545b',role:'organ',available:false},
 {id:'organLockedB',name:'봉인 카트 B',short:'봉인',zoneId:'organLockedB',color:'#55545b',role:'organ',available:false},
 {id:'organLockedC',name:'봉인 카트 C',short:'봉인',zoneId:'organLockedC',color:'#55545b',role:'organ',available:false}
];
let hospitals=`, 'hospital defs');

const newWorld=`function generateWorld(){
 const defs=[
  {id:'ward',name:'제1병실',x:0,y:0,w:3600,h:2000,tint:'#1c1818',corridor:true,mainWard:true,active:true},
  {id:'supportRecovery',name:'격리 병상',x:-1450,y:-620,w:520,h:390,tint:'#18231d',hospitalId:'supportRecovery',subzone:true},
  {id:'organHeart',name:'심전도 장비',x:-720,y:-690,w:460,h:330,tint:'#27171b',hospitalId:'organHeart',subzone:true},
  {id:'organBrain',name:'관찰 장비',x:-120,y:-690,w:460,h:330,tint:'#221b27',hospitalId:'organBrain',subzone:true},
  {id:'organStomach',name:'처치 장비',x:500,y:-690,w:460,h:330,tint:'#252216',hospitalId:'organStomach',subzone:true},
  {id:'supportTransfusion',name:'응급 처치대',x:1390,y:-610,w:520,h:390,tint:'#25191c',hospitalId:'supportTransfusion',subzone:true},
  {id:'organLockedA',name:'봉인 카트 A',x:-920,y:700,w:420,h:280,tint:'#17171b',hospitalId:'organLockedA',subzone:true},
  {id:'organLockedB',name:'봉인 카트 B',x:0,y:700,w:420,h:280,tint:'#17171b',hospitalId:'organLockedB',subzone:true},
  {id:'organLockedC',name:'봉인 카트 C',x:920,y:700,w:420,h:280,tint:'#17171b',hospitalId:'organLockedC',subzone:true}
 ];
 activeHospitalIds=['supportRecovery','supportTransfusion'];
 zones=defs.map(z=>({...z,active:z.mainWard||activeHospitalIds.includes(z.hospitalId)}));
 hospitals=HOSPITAL_DEFS.map(d=>({...d,active:activeHospitalIds.includes(d.id),zone:zones.find(z=>z.id===d.zoneId)}));
 const add=(type,x,y,w,h,hp=1,solid=true,extra={})=>objects.push({id:Math.random(),type,x,y,w,h,hp,maxHp:hp,solid,active:true,flash:0,reveal:0,hitJolt:0,...extra});
 const addScaled=(type,x,y,w,h,hp=1,solid=true,extra={})=>{const sw=w*SCALE.object,sh=h*SCALE.object;add(type,x+(w-sw)/2,y+(h-sh)/2,sw,sh,hp,solid,extra);};
 const halfW=1800,halfH=1000,wallT=30;
 add('wall',-halfW,-halfH,halfW*2,wallT,999,true,{zoneId:'ward',zoneActive:true});
 add('wall',-halfW,halfH-wallT,halfW*2,wallT,999,true,{zoneId:'ward',zoneActive:true});
 add('wall',-halfW,-halfH,wallT,halfH*2,999,true,{zoneId:'ward',zoneActive:true});
 add('wall',halfW-wallT,-halfH,wallT,halfH*2,999,true,{zoneId:'ward',zoneActive:true});
 add('door',-120,-halfH+2,240,34,999,false,{bossDoor:true});
 add('door',-95,halfH-31,190,29,999,false,{serviceDoor:true});
 const recovery=zones.find(z=>z.id==='supportRecovery'),transfusion=zones.find(z=>z.id==='supportTransfusion');
 [[-85,-32],[82,46]].forEach(([dx,dy])=>addScaled('medicine',recovery.x+dx-27,recovery.y+dy-22,54,44,32,true,{hospitalId:'supportRecovery'}));
 [[-88,-36],[84,48]].forEach(([dx,dy])=>addScaled('transfusionPump',transfusion.x+dx-32,transfusion.y+dy-30,64,60,58,true,{hospitalId:'supportTransfusion'}));
 const propSpecs={medicalCart:{w:46,h:34,hp:28},wasteBin:{w:32,h:34,hp:22},smallCabinet:{w:44,h:40,hp:30}};
 const addProp=(type,cx,cy)=>{const q=propSpecs[type];addScaled(type,cx-q.w/2,cy-q.h/2,q.w,q.h,q.hp,true,{breakableProp:true,damageStage:0});};
 [
  ['medicalCart',-1540,-260],['wasteBin',-1260,-850],['smallCabinet',-1030,830],
  ['medicalCart',-520,-860],['wasteBin',-420,820],['smallCabinet',250,-850],
  ['medicalCart',620,830],['wasteBin',1060,-850],['smallCabinet',1530,-250],
  ['medicalCart',1460,740],['wasteBin',-1510,720],['smallCabinet',1280,360]
 ].forEach(v=>addProp(v[0],v[1],v[2]));
 const addMark=(type,x,y,r,rot=0,extra={})=>landmarks.push({x,y,r:r*SCALE.landmark,type,rot,...extra});
 const bedRows=[
  [-1550,-720],[-1390,-720],[-1230,-720],[-1070,-720],
  [-1540,-500],[-1380,-500],[-1220,-500],
  [-880,-760],[-680,-760],[-480,-760],[-280,-760],[0,-760],[220,-760],[440,-760],[660,-760],
  [-1510,420],[-1330,420],[-1150,420],[-970,420]
 ];
 bedRows.forEach(([x,y],i)=>addMark('bed',x,y,46,i%2?.03:-.03,{mapBlock:i%4===0,mapW:150,mapH:68}));
 addMark('curtain',-1710,-650,92,0,{vertical:true,mapBlock:true,mapW:18,mapH:330});
 addMark('curtain',-1190,-650,92,0,{vertical:true,mapBlock:true,mapW:18,mapH:330});
 addMark('curtain',-1450,-850,92,Math.PI/2,{mapBlock:true,mapW:500,mapH:18});
 addMark('desk',1380,120,132,0,{mapBlock:true,mapW:310,mapH:90});
 addMark('screen',1250,-40,34,0);addMark('screen',1510,-40,34,0);
 addMark('table',-470,-160,48,.03,{mapBlock:true,mapW:170,mapH:72});
 addMark('table',450,170,48,-.03,{mapBlock:true,mapW:170,mapH:72});
 addMark('table',220,520,42,.02,{mapBlock:true,mapW:150,mapH:64});
 addMark('tank',1580,-610,40,0);addMark('tank',1200,-610,40,0);
 for(const [x,y] of [[-1050,690],[0,690],[1050,690]])addMark('table',x,y,44,0,{mapBlock:true,mapW:160,mapH:68});
 const stains=['corpse','blood','blood','corpse','organ'];for(let i=0;i<30;i++){const x=-1660+Math.random()*3320,y=-900+Math.random()*1800;if(Math.hypot(x,y-620)<260)continue;addMark(stains[Math.floor(Math.random()*stains.length)],x,y,15+Math.random()*25,Math.random()*Math.PI*2);}
 spawnMapPickups();
}

function minimapPoint`;
replaceRegex(/function generateWorld\(\)\{[\s\S]*?\n\}\n\nfunction minimapPoint/,newWorld,'generateWorld');

replaceRegex(/function drawMinimapBase\(\)\{[\s\S]*?\n\}/,`function drawMinimapBase(){
 const c=minimapCtx;c.fillStyle='#090909';c.fillRect(0,0,MINIMAP.w,MINIMAP.h);
 c.save();c.beginPath();c.rect(MINIMAP.pad,MINIMAP.pad,MINIMAP.w-MINIMAP.pad*2,MINIMAP.h-MINIMAP.pad*2);c.clip();
 const ward=zones.find(z=>z.mainWard);if(ward){const r=minimapRect(ward.x-ward.w/2,ward.y-ward.h/2,ward.w,ward.h);c.fillStyle='#252020';c.fillRect(r.x,r.y,r.w,r.h);c.strokeStyle='#745b5b';c.lineWidth=1;c.strokeRect(r.x+.5,r.y+.5,Math.max(0,r.w-1),Math.max(0,r.h-1));}
 c.fillStyle='#57504d';for(const l of landmarks){if(!l.mapBlock)continue;const w=l.mapW||l.r*2,h=l.mapH||l.r*.7,r=minimapRect(l.x-w/2,l.y-h/2,w,h);if(r.x+r.w<MINIMAP.pad||r.x>MINIMAP.w-MINIMAP.pad||r.y+r.h<MINIMAP.pad||r.y>MINIMAP.h-MINIMAP.pad)continue;c.globalAlpha=.52;c.fillRect(r.x,r.y,r.w,r.h);}c.globalAlpha=1;
 const world=minimapRect(MINIMAP.minX,MINIMAP.minY,MINIMAP.maxX-MINIMAP.minX,MINIMAP.maxY-MINIMAP.minY);c.strokeStyle='#ffffff28';c.lineWidth=.9;c.strokeRect(world.x+.5,world.y+.5,Math.max(0,world.w-1),Math.max(0,world.h-1));c.restore();
 c.strokeStyle='#ffffff33';c.strokeRect(.5,.5,MINIMAP.w-1,MINIMAP.h-1);
}`, 'drawMinimapBase');

replaceOnce("drawMinimapBase();for(const h of hospitals)drawHospitalMapMarker(minimapCtx,h);","drawMinimapBase();for(const h of hospitals)if(h.active||events.some(e=>e.hospitalId===h.id))drawHospitalMapMarker(minimapCtx,h);",'minimap markers');

replaceRegex(/function edgeSpawnWorld\(\)\{[\s\S]*?\n\}/,`function edgeSpawnWorld(){
 const minX=-1715,maxX=1715,minY=-915,maxY=915,pad=42,side=Math.floor(Math.random()*4);
 if(side===0)return[minX+pad,Math.max(minY+pad,Math.min(maxY-pad,player.y+(Math.random()-.5)*H*1.45))];
 if(side===1)return[maxX-pad,Math.max(minY+pad,Math.min(maxY-pad,player.y+(Math.random()-.5)*H*1.45))];
 if(side===2)return[Math.max(minX+pad,Math.min(maxX-pad,player.x+(Math.random()-.5)*W*1.55)),minY+pad];
 return[Math.max(minX+pad,Math.min(maxX-pad,player.x+(Math.random()-.5)*W*1.55)),maxY-pad];
}`, 'edge spawn');

replaceRegex(/function recycleEnemyOffscreen\(e\)\{[^\n]+\}/,`function recycleEnemyOffscreen(e){const pos=edgeSpawnWorld();e.x=pos[0];e.y=pos[1];e.lastX=e.x;e.lastY=e.y;e.farTimer=0;e.stuckTimer=0;e.stuckCheck=0;e.wallBlockedTime=0;e.knockbackLock=0;e.boneLaunchAge=0;e.boneLaunchDuration=0;e.boneLaunchDistance=0;e.boneLaunchLast=0;e.boneLaunchNx=0;e.boneLaunchNy=0;e.boneLaunchCrit=false;e.boneLaunchDamage=0;e.boneLaunchTrail=0;e.phaseTimer=0;e.routeTimer=0;e.routeStage=0;e.routeNextX=e.x;e.routeNextY=e.y;e.routeGateId=null;e.routeLane=0;e.routeLaneIndex=2;e.routeAttempts=0;e.navSeed=Math.floor(Math.random()*997);e.rerouteCooldown=0;e.navCheck=Math.random()*.16;e.shockStun=0;e.clotStun=0;e.clotStunResist=0;e.clotStunPhase=0;e.wallStun=0;e.wallStunMax=0;e.wallStunPhase=0;e.wallStunAngle=0;e.clotTick=.08;e.aiPhase=frameTick%3;}`, 'recycle');

replaceRegex(/function spawnUnlockActor\(kind\)\{[^\n]+\}/,`function spawnUnlockActor(kind){if(unlockActors.some(a=>a.kind===kind))return;const residual=kind==='residual';unlockActors.push({kind,x:residual?-1450:1380,y:residual?-620:105,r:18,pulse:Math.random()*6.2});if(residual)broadcast('커튼 너머에서 작은 소리가 났다.','event');else broadcast('데스크 쪽 호출 벨이 한 번 울렸다.','event');}`, 'unlock actor');
replaceOnce("broadcast('회수관이 격리실을 찾았다.','event');","broadcast('회수관이 빈 병상을 찾았다.','event');",'recovery line');
replaceRegex(/function spawnCollector\(\)\{[^\n]+\}/,`function spawnCollector(){const x=0,y=-790;spawnEnemy('collector',[x,y]);const e=enemies[enemies.length-1];Object.assign(e,{boss:true,action:'idle',actionTimer:1.1,cooldown:1.2,phase:1,chargeX:0,chargeY:0,chargeSpeed:0,phaseSignal1:false,phaseSignal2:false,recoveryChecked:false,procedureCount:0,stunTimer:0,visualDamage:0});bossState={enemy:e};}`, 'collector');
replaceOnce("camera.x+=(player.x+Math.min(230,W*.22)-camera.x)*Math.min(1,dt*1.2);cameraShake=bossCinematicAge>2.3&&bossCinematicAge<4.3?5:1;","camera.x+=(0-camera.x)*Math.min(1,dt*1.35);camera.y+=(-790-camera.y)*Math.min(1,dt*1.35);cameraShake=bossCinematicAge>2.3&&bossCinematicAge<4.3?5:1;",'boss camera');

replaceRegex(/function drawRoom\(z\)\{[\s\S]*?\n\}/,`function drawRoom(z){
 const a=worldToScreen(z.x-z.w/2,z.y-z.h/2),x=a.x,y=a.y,w=z.w,h=z.h;
 if(z.mainWard){ctx.fillStyle=z.tint;ctx.fillRect(x,y,w,h);ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();ctx.strokeStyle='#ffffff08';ctx.lineWidth=1;const tile=90,startX=Math.floor((camera.x-W/2-(z.x-z.w/2))/tile)*tile+(z.x-z.w/2),startY=Math.floor((camera.y-H/2-(z.y-z.h/2))/tile)*tile+(z.y-z.h/2);for(let gx=startX;gx<camera.x+W/2+tile;gx+=tile){const s=worldToScreen(gx,z.y);ctx.beginPath();ctx.moveTo(s.x,y);ctx.lineTo(s.x,y+h);ctx.stroke();}for(let gy=startY;gy<camera.y+H/2+tile;gy+=tile){const s=worldToScreen(z.x,gy);ctx.beginPath();ctx.moveTo(x,s.y);ctx.lineTo(x+w,s.y);ctx.stroke();}ctx.fillStyle='#00000018';ctx.fillRect(x,y,w,46);ctx.fillRect(x,y+h-46,w,46);ctx.fillRect(x,y,46,h);ctx.fillRect(x+w-46,y,46,h);ctx.fillStyle='#ffffff18';ctx.font='700 15px sans-serif';ctx.fillText('제1병실',x+60,y+72);ctx.restore();return;}
 if(z.subzone){ctx.save();ctx.globalAlpha=z.active?.10:.045;ctx.fillStyle=z.tint;ctx.fillRect(x,y,w,h);ctx.strokeStyle=z.active?'#ffffff12':'#ffffff08';ctx.setLineDash([10,12]);ctx.strokeRect(x+.5,y+.5,w-1,h-1);ctx.setLineDash([]);ctx.restore();}
}`, 'drawRoom');

replaceRegex(/function drawLandmark\(l,s\)\{[\s\S]*?ctx\.restore\(\);ctx\.globalAlpha=1;\n\}/,`function drawLandmark(l,s){
 ctx.save();ctx.translate(s.x,s.y);ctx.rotate(l.rot);ctx.globalAlpha=.30;
 if(l.type==='bed'){ctx.fillStyle='#5c5555';ctx.fillRect(-l.r,-l.r*.35,l.r*2,l.r*.7);ctx.fillStyle='#7d7777';ctx.fillRect(-l.r*.85,-l.r*.28,l.r*.5,l.r*.56);ctx.strokeStyle='#948989';ctx.strokeRect(-l.r,-l.r*.35,l.r*2,l.r*.7);}
 if(l.type==='table'){ctx.fillStyle='#574d49';ctx.fillRect(-l.r,-l.r*.22,l.r*2,l.r*.44);ctx.fillRect(-l.r*.75,l.r*.15,6,l.r*.7);ctx.fillRect(l.r*.65,l.r*.15,6,l.r*.7);}
 if(l.type==='tank'){ctx.fillStyle='#31484a';ctx.fillRect(-l.r*.55,-l.r,l.r*1.1,l.r*2);ctx.strokeStyle='#87aeb0';ctx.strokeRect(-l.r*.55,-l.r,l.r*1.1,l.r*2);}
 if(l.type==='curtain'){ctx.globalAlpha=.22;ctx.strokeStyle='#a29a93';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-l.r,0);ctx.lineTo(l.r,0);ctx.stroke();ctx.globalAlpha=.15;ctx.strokeStyle='#d3ccc4';ctx.lineWidth=1;for(let k=-4;k<=4;k++){const x=k*l.r/4;ctx.beginPath();ctx.moveTo(x,-8);ctx.lineTo(x+Math.sin(k)*5,8);ctx.stroke();}}
 if(l.type==='desk'){ctx.globalAlpha=.36;ctx.fillStyle='#67615d';ctx.fillRect(-l.r,-l.r*.30,l.r*2,l.r*.60);ctx.fillStyle='#363231';ctx.fillRect(-l.r*.78,-l.r*.16,l.r*1.56,l.r*.32);ctx.strokeStyle='#8e8782';ctx.strokeRect(-l.r,-l.r*.30,l.r*2,l.r*.60);}
 if(l.type==='screen'){ctx.globalAlpha=.38;ctx.fillStyle='#293333';ctx.fillRect(-l.r*.48,-l.r*.72,l.r*.96,l.r*1.18);ctx.fillStyle='#6f8582';ctx.fillRect(-l.r*.36,-l.r*.58,l.r*.72,l.r*.52);}
 if(l.type==='corpse'){ctx.fillStyle='#6d5d58';ctx.beginPath();ctx.ellipse(0,0,l.r*.9,l.r*.35,0,0,Math.PI*2);ctx.fill();}
 if(l.type==='organ'){ctx.fillStyle='#6e2832';ctx.beginPath();ctx.arc(0,0,l.r*.55,0,Math.PI*2);ctx.fill();}
 if(l.type==='blood'){ctx.fillStyle='#5f1f27';ctx.beginPath();ctx.ellipse(0,0,l.r,l.r*.55,0,0,Math.PI*2);ctx.fill();}
 ctx.restore();ctx.globalAlpha=1;
}`, 'drawLandmark');

replaceOnce("if(o.type==='door'){ctx.fillStyle='#436064';ctx.fillRect(0,0,o.w,o.h);ctx.fillStyle='#8ac1c7';ctx.fillRect(8,5,o.w-16,o.h-10);}",`if(o.type==='door'){if(o.bossDoor){const opening=bossIntroTimer>0?Math.min(1,bossCinematicAge/3.2):chapterFlags.bossStarted?1:0,gap=o.w*.42*opening;ctx.fillStyle='#3f4a4b';ctx.fillRect(0,0,o.w/2-gap/2,o.h);ctx.fillRect(o.w/2+gap/2,0,o.w/2-gap/2,o.h);ctx.fillStyle='#7e9595';ctx.fillRect(5,5,Math.max(0,o.w/2-gap/2-10),o.h-10);ctx.fillRect(o.w/2+gap/2+5,5,Math.max(0,o.w/2-gap/2-10),o.h-10);}else{ctx.fillStyle='#436064';ctx.fillRect(0,0,o.w,o.h);ctx.fillStyle='#8ac1c7';ctx.fillRect(8,5,o.w-16,o.h-10);}}`,'door draw');

new Function(source);
for(const forbidden of ['중앙 복도','회복실','수혈실','격리실','관찰실','처치실','보관실','준비실','폐쇄실'])if(source.includes(forbidden))throw new Error('old room term '+forbidden);
if(!source.includes("name:'제1병실'")||!source.includes("bossDoor:true")||!source.includes("x:residual?-1450:1380"))throw new Error('map not patched');
// v0.3.4.e 압축 런타임 생성
const compressed=zlib.gzipSync(Buffer.from(source,'utf8'),{level:9});
const encoded=compressed.toString('base64');
fs.mkdirSync(`${repo}/v034e`,{recursive:true});
const partSize=Math.ceil(encoded.length/4);
for(let i=0;i<4;i++)fs.writeFileSync(`${repo}/v034e/game.gz.part${String(i+1).padStart(2,'0')}.txt`,encoded.slice(i*partSize,(i+1)*partSize));

// HTML 로더 생성
let loader=fs.readFileSync(`${repo}/Living_Hospital_v0.3.4.d.html`,'utf8');
loader=loader
 .replace('Living Hospital v0.3.4.d · Chapter 1','Living Hospital v0.3.4.e · Chapter 1')
 .replaceAll('v034d/game.gz.part','v034e/game.gz.part');
if(!loader.includes('Living Hospital v0.3.4.e · Chapter 1')||!loader.includes('v034e/game.gz.part04.txt'))throw new Error('v0.3.4.e HTML 로더 생성 실패');
fs.writeFileSync(`${repo}/Living_Hospital_v0.3.4.e.html`,loader);

const redirect=`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta http-equiv="refresh" content="0;url=./Living_Hospital_v0.3.4.e.html?v=034e"><title>Living Hospital</title><script>location.replace('./Living_Hospital_v0.3.4.e.html?v=034e')</script></head><body><a href="./Living_Hospital_v0.3.4.e.html?v=034e">Living Hospital 실행</a></body></html>`;
fs.writeFileSync(`${repo}/index.html`,redirect);
fs.writeFileSync(`${repo}/stable-v034e.html`,redirect);

// 계측 페이지 및 문서 갱신
let playtest=fs.readFileSync(`${repo}/playtest.html`,'utf8');
playtest=playtest.replaceAll('Living_Hospital_v0.3.4.d.html','Living_Hospital_v0.3.4.e.html');
if(!playtest.includes("GAME_FILE='Living_Hospital_v0.3.4.e.html'"))throw new Error('계측 페이지 최신 빌드 참조 갱신 실패');
fs.writeFileSync(`${repo}/playtest.html`,playtest);

let readme=fs.readFileSync(`${repo}/README.md`,'utf8');
readme=readme
 .replace('- 현재 저장소 기준 빌드: **v0.3.4.d**','- 현재 저장소 기준 빌드: **v0.3.4.e**')
 .replace('- 현재 실행 파일: [`Living_Hospital_v0.3.4.d.html`](./Living_Hospital_v0.3.4.d.html)','- 현재 실행 파일: [`Living_Hospital_v0.3.4.e.html`](./Living_Hospital_v0.3.4.e.html)');
fs.writeFileSync(`${repo}/README.md`,readme);

let agents=fs.readFileSync(`${repo}/AGENTS.md`,'utf8');
agents=agents.replace('- 현재 기준선은 `Living_Hospital_v0.3.4.d.html`입니다.','- 현재 기준선은 `Living_Hospital_v0.3.4.e.html`입니다.');
fs.writeFileSync(`${repo}/AGENTS.md`,agents);

let status=fs.readFileSync(`${repo}/docs/PROJECT_STATUS.md`,'utf8');
status=status
 .replace('마지막 갱신: 2026-07-31','마지막 갱신: 2026-08-01')
 .replace('- 저장소 기준 최신 빌드: **v0.3.4.d**','- 저장소 기준 최신 빌드: **v0.3.4.e**')
 .replace('- 기준 파일: `Living_Hospital_v0.3.4.d.html`','- 기준 파일: `Living_Hospital_v0.3.4.e.html`');
fs.writeFileSync(`${repo}/docs/PROJECT_STATUS.md`,status);

let changelog=fs.readFileSync(`${repo}/docs/CHANGELOG.md`,'utf8');
const entry=`\n\n## v0.3.4.e - 2026-08-01\n\n- 챕터 1을 중앙 복도와 독립실 구조에서 하나의 대형 병실 구조로 전면 변경\n- 외곽 벽만 유지하고 내부 병상·커튼·데스크·장비 구획을 개방형 배치로 변경\n- 시작 지점을 남측 중앙으로 이동\n- 잔존자를 북서 격리 병상, 당직자를 동측 간호 데스크에 배치\n- 회수자 등장 위치를 북측 이송문으로 변경하고 보스 입장 카메라 연출 연결\n- 적 생성·재배치 위치를 병실 내부 외곽으로 제한\n- 미니맵을 단일 병실 외곽과 주요 장애물 덩어리 중심으로 단순화\n- 대부분의 병상·커튼·데스크를 비충돌 랜드마크로 처리해 모바일 성능과 적 이동 안정성 유지\n`;
if(!changelog.includes('## v0.3.4.e - 2026-08-01'))changelog+=entry;
fs.writeFileSync(`${repo}/docs/CHANGELOG.md`,changelog);

// 생성 결과 자체 검증
const rebuilt=sourceParts.map((_,i)=>fs.readFileSync(`${repo}/v034e/game.gz.part${String(i+1).padStart(2,'0')}.txt`,'utf8')).join('');
const decoded=zlib.gunzipSync(Buffer.from(rebuilt,'base64')).toString('utf8');
if(decoded!==source)throw new Error('분할 압축 런타임 재조립 불일치');
new Function(decoded);
for(const required of ["name:'제1병실'","bossDoor:true","x:residual?-1450:1380","const x=0,y=-790","minX:-1840,maxX:1840"]){if(!decoded.includes(required))throw new Error(`필수 맵 변경 누락: ${required}`);}
for(const old of ["name:'중앙 복도'","name:'회복실'","name:'수혈실'","name:'격리실'","name:'관찰실'","name:'처치실'","name:'보관실'","name:'준비실'","name:'폐쇄실'"]){if(decoded.includes(old))throw new Error(`구형 방 구조 잔존: ${old}`);}
console.log(`v0.3.4.e built: ${source.split('\n').length} lines, ${compressed.length} gzip bytes`);
