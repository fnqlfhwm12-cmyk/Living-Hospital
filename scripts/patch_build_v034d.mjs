import fs from 'node:fs';

const path='scripts/build_v034d.mjs';
let text=fs.readFileSync(path,'utf8');
const start=text.indexOf('replaceOnce(\n  "const launched=updateEnemyBoneLaunch');
const marker="  '우회 중 직접 추적 복귀'\n);";
const markerAt=text.indexOf(marker,start);
if(start<0||markerAt<0)throw new Error('기존 우회 치환 블록을 찾지 못했습니다.');
const end=markerAt+marker.length;
const replacement=`replaceOnce(
  "const launched=updateEnemyBoneLaunch(e,dt),curDx=player.x-e.x,curDy=player.y-e.y,dist2=curDx*curDx+curDy*curDy,coagulated=e.clotStun>0,wallStunned=e.wallStun>0,hardStunned=coagulated||wallStunned,controlMult=hardStunned?0:(e.shockStun>0?.16:1)*(1-clotSlow),moveSpeed=e.speed*controlMult,navEligible=!launched&&!hardStunned&&e.charm<=0&&!(e.anomaly&&e.formationTime>0);",
  "const launched=updateEnemyBoneLaunch(e,dt),curDx=player.x-e.x,curDy=player.y-e.y,dist2=curDx*curDx+curDy*curDy,coagulated=e.clotStun>0,wallStunned=e.wallStun>0,hardStunned=coagulated||wallStunned,controlMult=hardStunned?0:(e.shockStun>0?.16:1)*(1-clotSlow),moveSpeed=e.speed*controlMult,navEligible=!launched&&!hardStunned&&e.charm<=0&&!(e.anomaly&&e.formationTime>0),directPath=navEligible?enemyDirectPathClear(e):false;",
  '직접 경로 상태 계산'
);
replaceOnce(
  "if(navEligible&&e.routeTimer<=0&&e.navCheck<=0&&e.knockbackLock<=0){e.navCheck=.16+e.aiPhase*.025;if(!pathClearTo(e.x,e.y,player.x,player.y,e.r+2))assignEnemyReroute(e);}",
  "if(navEligible&&e.routeTimer>0&&e.navCheck<=0){e.navCheck=.15+e.aiPhase*.018;if(directPath){clearEnemyRoute(e);e.wallBlockedTime=0;}}\\n   if(navEligible&&e.routeTimer<=0&&e.navCheck<=0&&e.knockbackLock<=0){e.navCheck=.16+e.aiPhase*.025;if(!directPath)assignEnemyReroute(e);}",
  '우회 중 직접 추적 복귀'
);`;
text=text.slice(0,start)+replacement+text.slice(end);
fs.writeFileSync(path,text);
console.log('v0.3.4.d build script patched');
