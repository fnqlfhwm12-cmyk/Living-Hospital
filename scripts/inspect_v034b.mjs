import fs from 'node:fs';
import zlib from 'node:zlib';

const parts=[1,2,3,4].map(i=>`v034b/game.gz.part${String(i).padStart(2,'0')}.txt`);
const packed=parts.map(p=>fs.readFileSync(p,'utf8')).join('').replace(/\s+/g,'');
const source=zlib.gunzipSync(Buffer.from(packed,'base64')).toString('utf8');
const lines=source.split('\n');
const terms=[
  '골절','fracture','hp','maxHp','체력바','health','fillRect',
  'choice','choices','selection','option','pool','weight','recent',
  'wave','웨이브','무거운 발소리','복도를 가로질렀','붐비기 시작',
  'restartBtn','resumeBtn','pauseMenu','pauseActions','saveMeta','save',
  'characterConfirmBtn','대기실로','showMetaScreen','startScreen','lobbyScreen'
];
const hits=[];
for(let i=0;i<lines.length;i++){
  if(terms.some(t=>lines[i].includes(t))){
    const a=Math.max(0,i-3),b=Math.min(lines.length,i+4);
    hits.push(`\n===== line ${i+1}: ${terms.filter(t=>lines[i].includes(t)).join(', ')} =====\n${lines.slice(a,b).map((x,j)=>`${a+j+1}: ${x}`).join('\n')}`);
  }
}
fs.mkdirSync('tmp',{recursive:true});
fs.writeFileSync('tmp/v034b-inspect.txt',`sourceLength=${source.length}\nlineCount=${lines.length}\nmatchBlocks=${hits.length}\n${hits.join('\n')}`);
console.log('inspection written',hits.length);
