import fs from 'node:fs';
import zlib from 'node:zlib';

const parts=[1,2,3,4].map(i=>`v034c/game.gz.part${String(i).padStart(2,'0')}.txt`);
const packed=parts.map(p=>fs.readFileSync(p,'utf8')).join('').replace(/\s+/g,'');
const source=zlib.gunzipSync(Buffer.from(packed,'base64')).toString('utf8');
const lines=source.split('\n');
const terms=[
  'defibrillator','전기충격','defibrillatorTimer','defibrillatorPulseClock',
  'destroyObject','damageObject','spawnPickup','spawnMap','pickups.push','specimens',
  'assignEnemyReroute','routeTimer','pathClearTo','wallBlockedTime','stuckTimer','navCheck',
  'transplantStation','actionButton','currentAction','syncActionButton','이식'
];
const selected=new Set();
for(let i=0;i<lines.length;i++){
  if(terms.some(t=>lines[i].includes(t))){
    for(let j=Math.max(0,i-3);j<=Math.min(lines.length-1,i+5);j++)selected.add(j);
  }
}
const ordered=[...selected].sort((a,b)=>a-b);
let out=`sourceLength=${source.length}\nlineCount=${lines.length}\n`;
let last=-2;
for(const i of ordered){
  if(i>last+1)out+='\n---\n';
  out+=`${i+1}: ${lines[i]}\n`;
  last=i;
}
fs.mkdirSync('tmp',{recursive:true});
fs.writeFileSync('tmp/v034c-next-inspect.txt',out);
console.log('inspection written',ordered.length);
