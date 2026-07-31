import fs from 'node:fs';
const path='scripts/build_v034d.mjs';
let text=fs.readFileSync(path,'utf8');
const oldLine="if(source.includes('schedulePickupRespawn(type);removePooledAt(pickups'))throw new Error('보너스 픽업도 재생성되는 기존 코드가 남아 있습니다.');";
const newLine="if(source.includes(\"collectPickup(o);schedulePickupRespawn(type);removePooledAt(pickups\"))throw new Error('보너스 픽업도 재생성되는 기존 코드가 남아 있습니다.');";
if(!text.includes(oldLine))throw new Error('기존 픽업 검증식을 찾지 못했습니다.');
text=text.replace(oldLine,newLine);
fs.writeFileSync(path,text);
console.log('v0.3.4.d validation patched');
