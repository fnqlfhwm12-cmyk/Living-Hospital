import fs from 'node:fs';

const path='scripts/build_v034d.mjs';
let text=fs.readFileSync(path,'utf8');

function replaceBlock(startNeedle,endMarker,replacement,label){
 const start=text.indexOf(startNeedle);
 const markerAt=text.indexOf(endMarker,start);
 if(start<0||markerAt<0)throw new Error(`${label} 블록을 찾지 못했습니다.`);
 const end=markerAt+endMarker.length;
 text=text.slice(0,start)+replacement+text.slice(end);
}

replaceBlock(
 'replaceOnce(\n  "const launched=updateEnemyBoneLaunch',
 "  '우회 중 직접 추적 복귀'\n);",
 `replaceOnce(
  "const launched=updateEnemyBoneLaunch(e,dt),curDx=player.x-e.x,curDy=player.y-e.y,dist2=curDx*curDx+curDy*curDy,coagulated=e.clotStun>0,wallStunned=e.wallStun>0,hardStunned=coagulated||wallStunned,controlMult=hardStunned?0:(e.shockStun>0?.16:1)*(1-clotSlow),moveSpeed=e.speed*controlMult,navEligible=!launched&&!hardStunned&&e.charm<=0&&!(e.anomaly&&e.formationTime>0);",
  "const launched=updateEnemyBoneLaunch(e,dt),curDx=player.x-e.x,curDy=player.y-e.y,dist2=curDx*curDx+curDy*curDy,coagulated=e.clotStun>0,wallStunned=e.wallStun>0,hardStunned=coagulated||wallStunned,controlMult=hardStunned?0:(e.shockStun>0?.16:1)*(1-clotSlow),moveSpeed=e.speed*controlMult,navEligible=!launched&&!hardStunned&&e.charm<=0&&!(e.anomaly&&e.formationTime>0),directPath=navEligible?enemyDirectPathClear(e):false;",
  '직접 경로 상태 계산'
);
replaceOnce(
  "if(navEligible&&e.routeTimer<=0&&e.navCheck<=0&&e.knockbackLock<=0){e.navCheck=.16+e.aiPhase*.025;if(!pathClearTo(e.x,e.y,player.x,player.y,e.r+2))assignEnemyReroute(e);}",
  "if(navEligible&&e.routeTimer>0&&e.navCheck<=0){e.navCheck=.15+e.aiPhase*.018;if(directPath){clearEnemyRoute(e);e.wallBlockedTime=0;}}\\n   if(navEligible&&e.routeTimer<=0&&e.navCheck<=0&&e.knockbackLock<=0){e.navCheck=.16+e.aiPhase*.025;if(!directPath)assignEnemyReroute(e);}",
  '우회 중 직접 추적 복귀'
);`,
 '우회 치환'
);

replaceBlock(
 'replaceOnce(\n  "else if(o.type===\'magnet\')',
 "  '검체 획득 처리'\n);",
 `replaceOnce(
  "else if(o.type==='defibrillator'){defibrillatorTimer=7.5;defibrillatorPulseClock=0;bodyTwitch=Math.max(bodyTwitch,.32);sfx('defibrillatorStart');cameraShake=Math.max(cameraShake,5);}",
  "else if(o.type==='defibrillator'){defibrillatorTimer=7.5;defibrillatorPulseClock=0;bodyTwitch=Math.max(bodyTwitch,.32);sfx('defibrillatorStart');cameraShake=Math.max(cameraShake,5);}else if(o.type==='specimen'){meta.specimens=(meta.specimens||0)+1;saveMeta();toast('검체 +1');tone(420,.06,'triangle',.018,690);for(let i=0;i<7;i++)emitParticle(player.x,player.y,(Math.random()-.5)*95,(Math.random()-.5)*95,.32,2+Math.random()*2,'#d7a7b4');}",
  '검체 획득 처리'
);`,
 '검체 획득 치환'
);

fs.writeFileSync(path,text);
console.log('v0.3.4.d build script patched');
