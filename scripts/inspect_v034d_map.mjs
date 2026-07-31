import fs from 'node:fs';
import zlib from 'node:zlib';

const parts=[1,2,3,4].map(i=>`v034d/game.gz.part${String(i).padStart(2,'0')}.txt`);
const packed=parts.map(p=>fs.readFileSync(p,'utf8')).join('').replace(/\s+/g,'');
const source=zlib.gunzipSync(Buffer.from(packed,'base64')).toString('utf8');
const lines=source.split('\n');

fs.mkdirSync('tmp/v034d-map-inspect',{recursive:true});
fs.writeFileSync('tmp/v034d-map-inspect/source.js',source);

const needles=[
  'function reset(',
  'function buildMinimapStatic',
  'function drawMinimapBase',
  'function minimapPoint',
  'function drawObject',
  'function spawnEnemy',
  'function randomPickupPosition',
  'function assignEnemyReroute',
  'navGates',
  'unlockActors',
  'hospitals',
  'zones=',
  "type:'wall'",
  "type:'transplantStation'",
  "role:'unlock'",
  'WORLD',
  'worldW',
  'worldH'
];

const found=[];
for(const needle of needles){
  const matches=[];
  for(let i=0;i<lines.length;i++)if(lines[i].includes(needle))matches.push(i);
  found.push({needle,matches:matches.map(i=>i+1)});
  for(const i of matches){
    const a=Math.max(0,i-18),b=Math.min(lines.length,i+28);
    const safe=needle.replace(/[^a-zA-Z0-9가-힣]+/g,'_').slice(0,48)||'match';
    const body=lines.slice(a,b).map((line,j)=>`${a+j+1}: ${line}`).join('\n');
    fs.writeFileSync(`tmp/v034d-map-inspect/${safe}-${i+1}.txt`,body);
  }
}
fs.writeFileSync('tmp/v034d-map-inspect/index.json',JSON.stringify({lineCount:lines.length,found},null,2));
console.log(`source lines: ${lines.length}`);
console.log(JSON.stringify(found,null,2));
