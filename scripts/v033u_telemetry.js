const LH_PLAYTEST_PROTOCOL='LH_PLAYTEST_V1',LH_BUILD='Living_Hospital_v0.3.3.u.html';
let playtestRunStartedAt='',playtestIncidents=[],playtestIncidentAt=new Map(),playtestHealthClock=0,playtestLowFpsSeconds=0,playtestCriticalFpsSeconds=0,playtestFinished=false,playtestLastSnapshot=null;
function postPlaytest(type,payload={}){
 try{if(window.parent&&window.parent!==window)window.parent.postMessage({protocol:LH_PLAYTEST_PROTOCOL,type,build:LH_BUILD,at:new Date().toISOString(),payload},location.origin);}catch(_){}
}
function playtestLoadout(){
 const weaponLevels={};for(const [key,w] of Object.entries(weapons))weaponLevels[key]=w.level;
 const passiveLevels={};for(const [key,p] of Object.entries(passives))passiveLevels[key]=p.level;
 return{activeOrgan:activeOrgan||null,storedOrgans:Object.keys(organStored),weapons:weaponLevels,passives:passiveLevels};
}
function collectPlaytestSnapshot(reason='snapshot',completed=null){
 const avgMs=frameSamples?frameMsSum/frameSamples:0;
 return{
  reason,completed,build:LH_BUILD,generatedAt:new Date().toISOString(),runStartedAt:playtestRunStartedAt||null,
  gameTime:Math.max(0,elapsed),gameTimeText:fmt(elapsed),kills,best:Math.max(best,elapsed),
  performance:{currentFps:Number(fps.toFixed(1)),minimumFps:Number(minFps.toFixed(1)),averageFrameMs:Number(avgMs.toFixed(2)),maximumFrameMs:Number(maxFrameMs.toFixed(2)),slowFrames,qualityLevel},
  counts:{enemies:enemies.length,maxEnemies,orbs:orbs.length,maxOrbs,projectiles:projectiles.length,enemyShots:enemyShots.length,waves:waves.length,particles:particles.length,clotFields:clotFields.length,clotCritFx:clotCritFx.length,organDrops:organDrops.length,pickups:pickups.length,objects:objects.filter(o=>o.active).length},
  player:{hp:Number(player.hp.toFixed(2)),maxHp:Number(player.maxHp.toFixed(2)),shield:Number(player.shield.toFixed(2)),x:Number(player.x.toFixed(1)),y:Number(player.y.toFixed(1)),crit:Number(player.crit.toFixed(3)),damageTakenMult:Number(player.damageTakenMult.toFixed(3))},
  world:{activeHospitals:hospitals.filter(h=>h.active).map(h=>h.id),eventCount,anomalyCount,growthCount},
  loadout:playtestLoadout(),incidents:playtestIncidents.map(x=>({...x}))
 };
}
function resetPlaytestRun(){
 playtestRunStartedAt=new Date().toISOString();playtestIncidents.length=0;playtestIncidentAt.clear();playtestHealthClock=0;playtestLowFpsSeconds=0;playtestCriticalFpsSeconds=0;playtestFinished=false;playtestLastSnapshot=null;window.__LH_PLAYTEST_LAST__=null;
}
function beginPlaytestRun(){resetPlaytestRun();postPlaytest('LH_RUN_STARTED',{build:LH_BUILD,startedAt:playtestRunStartedAt});}
function recordPlaytestIncident(code,severity='warning',detail='',force=false){
 const now=performance.now(),lastAt=playtestIncidentAt.get(code)||-Infinity,cooldown=severity==='fatal'?1000:10000;if(!force&&now-lastAt<cooldown)return null;playtestIncidentAt.set(code,now);
 const incident={code,severity,detail:String(detail||'').slice(0,900),at:new Date().toISOString(),gameTime:Number(elapsed.toFixed(2)),gameTimeText:fmt(elapsed)};
 playtestIncidents.push(incident);if(playtestIncidents.length>40)playtestIncidents.shift();
 const snapshot=collectPlaytestSnapshot(code,null);playtestLastSnapshot=snapshot;window.__LH_PLAYTEST_LAST__=snapshot;postPlaytest('LH_INCIDENT',{incident,snapshot});return incident;
}
function trackPlaytestFrame(rawMs){
 if(document.hidden||paused||gameOver||elapsed<PERF_WARMUP||rawMs>3000)return;
 if(rawMs>500)recordPlaytestIncident('frame-freeze','critical',`단일 프레임 ${rawMs.toFixed(1)}ms`);
 else if(rawMs>250)recordPlaytestIncident('frame-stall','warning',`단일 프레임 ${rawMs.toFixed(1)}ms`);
}
function updatePlaytestHealth(dt){
 playtestHealthClock-=dt;if(playtestHealthClock>0)return;playtestHealthClock=1;
 const finite=[elapsed,player.x,player.y,player.hp,player.maxHp,player.speed,fps].every(Number.isFinite);
 if(!finite){recordPlaytestIncident('invalid-number','fatal','게임 핵심 상태에서 NaN 또는 Infinity 감지',true);if(!gameOver)endGame(false,'invalid-state');return;}
 if(player.hp<0||player.hp>player.maxHp*1.5){recordPlaytestIncident('invalid-hp','fatal',`HP ${player.hp} / ${player.maxHp}`,true);if(!gameOver)endGame(false,'invalid-state');return;}
 if(elapsed>=PERF_WARMUP){
  if(fps<30)playtestLowFpsSeconds+=1;else if(fps>38)playtestLowFpsSeconds=Math.max(0,playtestLowFpsSeconds-2);
  if(fps<15)playtestCriticalFpsSeconds+=1;else playtestCriticalFpsSeconds=Math.max(0,playtestCriticalFpsSeconds-2);
  if(playtestLowFpsSeconds>=4){recordPlaytestIncident('sustained-low-fps','warning',`약 4초간 FPS ${fps.toFixed(1)} 미만`);playtestLowFpsSeconds=0;}
  if(playtestCriticalFpsSeconds>=2){recordPlaytestIncident('critical-low-fps','critical',`약 2초간 FPS ${fps.toFixed(1)}`);playtestCriticalFpsSeconds=0;}
 }
 const congested=enemies.reduce((n,e)=>n+(((e.stuckTimer||0)>3||(e.wallBlockedTime||0)>2)?1:0),0);
 if(congested>=8)recordPlaytestIncident('enemy-congestion','warning',`정체 의심 적 ${congested}개`);
 if(enemies.length>PERF.enemyCap+8)recordPlaytestIncident('enemy-cap-overflow','critical',`적 ${enemies.length} / 제한 ${PERF.enemyCap}`);
 if(projectiles.length>280)recordPlaytestIncident('projectile-overflow','warning',`투사체 ${projectiles.length}개`);
 if(particles.length>245)recordPlaytestIncident('particle-overflow','warning',`파티클 ${particles.length}개`);
 if(clotFields.length>CLOT_FIELD_CAP)recordPlaytestIncident('clot-field-overflow','warning',`혈흔 ${clotFields.length} / 제한 ${CLOT_FIELD_CAP}`);
}
function finalizePlaytestRun(reason,completed){
 if(playtestFinished)return;playtestFinished=true;const snapshot=collectPlaytestSnapshot(reason,!!completed);playtestLastSnapshot=snapshot;window.__LH_PLAYTEST_LAST__=snapshot;postPlaytest('LH_RUN_ENDED',snapshot);
}
