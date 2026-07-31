import fs from 'node:fs';
import zlib from 'node:zlib';
const parts=[1,2,3,4].map(i=>`v034c/game.gz.part${String(i).padStart(2,'0')}.txt`);
const packed=parts.map(p=>fs.readFileSync(p,'utf8')).join('').replace(/\s+/g,'');
const source=zlib.gunzipSync(Buffer.from(packed,'base64')).toString('utf8');
const lines=source.split('\n');
const sections=[[350,390],[720,780],[790,850],[850,920],[920,1040],[1070,1110]];
fs.mkdirSync('tmp',{recursive:true});
for(const [a,b] of sections){const text=lines.slice(a-1,b).map((x,i)=>`${a+i}: ${x}`).join('\n');fs.writeFileSync(`tmp/v034c-lines-${a}-${b}.txt`,text);}
console.log('sections written');
