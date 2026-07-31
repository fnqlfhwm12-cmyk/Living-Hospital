import fs from 'node:fs';
import zlib from 'node:zlib';

const repo='.';
const partPaths=[1,2,3,4].map(i=>`${repo}/v034/game.gz.part${String(i).padStart(2,'0')}.txt`);
const packed=partPaths.map(p=>fs.readFileSync(p,'utf8')).join('').replace(/\s+/g,'');
let source=zlib.gunzipSync(Buffer.from(packed,'base64')).toString('utf8');

function replaceOnce(oldText,newText,label){
  if(!source.includes(oldText)) throw new Error(`${label} 위치를 찾지 못했습니다.`);
  source=source.replace(oldText,newText);
}

replaceOnce(
  "const MINIMAP={w:124,h:88,pad:5,minX:-2050,maxX:2050,minY:-1150,maxY:1150,baseInterval:.15};",
  "const MINIMAP={w:124,h:88,pad:5,minX:-2050,maxX:2050,minY:-1150,maxY:1150,viewW:1900,viewH:1348,baseInterval:.15};",
  'MINIMAP 설정'
);

replaceOnce(`function minimapPoint(x,y){
 const px=MINIMAP.pad+(x-MINIMAP.minX)/(MINIMAP.maxX-MINIMAP.minX)*(MINIMAP.w-MINIMAP.pad*2);
 const py=MINIMAP.pad+(y-MINIMAP.minY)/(MINIMAP.maxY-MINIMAP.minY)*(MINIMAP.h-MINIMAP.pad*2);
 return{x:Math.max(MINIMAP.pad,Math.min(MINIMAP.w-MINIMAP.pad,px)),y:Math.max(MINIMAP.pad,Math.min(MINIMAP.h-MINIMAP.pad,py))};
}`,
`function minimapPoint(x,y){
 const px=MINIMAP.w/2+(x-player.x)/MINIMAP.viewW*(MINIMAP.w-MINIMAP.pad*2);
 const py=MINIMAP.h/2+(y-player.y)/MINIMAP.viewH*(MINIMAP.h-MINIMAP.pad*2);
 return{x:px,y:py};
}`,'minimapPoint');

replaceOnce(`function buildMinimapStatic(){
 minimapStatic.width=MINIMAP.w;minimapStatic.height=MINIMAP.h;minimapStaticCtx.fillStyle='#090909';minimapStaticCtx.fillRect(0,0,MINIMAP.w,MINIMAP.h);
 for(const z of zones){const r=minimapRect(z.x-z.w/2,z.y-z.h/2,z.w,z.h);minimapStaticCtx.fillStyle=z.corridor?'#2b2020':z.active?'#202526':'#111415';minimapStaticCtx.fillRect(r.x,r.y,r.w,r.h);minimapStaticCtx.strokeStyle=z.corridor?'#654c4c':z.active?'#777':'#333';minimapStaticCtx.lineWidth=.8;minimapStaticCtx.strokeRect(r.x+.5,r.y+.5,Math.max(0,r.w-1),Math.max(0,r.h-1));}
 minimapStaticCtx.strokeStyle='#ffffff33';minimapStaticCtx.strokeRect(.5,.5,MINIMAP.w-1,MINIMAP.h-1);
}`,
`function buildMinimapStatic(){
 minimapStatic.width=MINIMAP.w;minimapStatic.height=MINIMAP.h;
}
function drawMinimapBase(){
 const c=minimapCtx;c.fillStyle='#090909';c.fillRect(0,0,MINIMAP.w,MINIMAP.h);
 c.save();c.beginPath();c.rect(MINIMAP.pad,MINIMAP.pad,MINIMAP.w-MINIMAP.pad*2,MINIMAP.h-MINIMAP.pad*2);c.clip();
 for(const z of zones){const r=minimapRect(z.x-z.w/2,z.y-z.h/2,z.w,z.h);if(r.x+r.w<MINIMAP.pad||r.x>MINIMAP.w-MINIMAP.pad||r.y+r.h<MINIMAP.pad||r.y>MINIMAP.h-MINIMAP.pad)continue;c.fillStyle=z.corridor?'#2b2020':z.active?'#202526':'#111415';c.fillRect(r.x,r.y,r.w,r.h);c.strokeStyle=z.corridor?'#654c4c':z.active?'#777':'#333';c.lineWidth=.8;c.strokeRect(r.x+.5,r.y+.5,Math.max(0,r.w-1),Math.max(0,r.h-1));}
 const world=minimapRect(MINIMAP.minX,MINIMAP.minY,MINIMAP.maxX-MINIMAP.minX,MINIMAP.maxY-MINIMAP.minY);c.strokeStyle='#ffffff28';c.lineWidth=.9;c.strokeRect(world.x+.5,world.y+.5,Math.max(0,world.w-1),Math.max(0,world.h-1));c.restore();
 c.strokeStyle='#ffffff33';c.strokeRect(.5,.5,MINIMAP.w-1,MINIMAP.h-1);
}`,'buildMinimapStatic');

replaceOnce(`function renderMinimap(){
 minimapCtx.drawImage(minimapStatic,0,0);for(const h of hospitals)drawHospitalMapMarker(minimapCtx,h);
 for(const e of events){if(!e.target||!e.target.active)continue;const pos=eventMapPosition(e.target),m=minimapPoint(pos.x,pos.y);drawEventMapMarker(minimapCtx,m.x,m.y,e.hospitalId);}
 const p=minimapPoint(player.x,player.y);minimapCtx.save();minimapCtx.translate(p.x,p.y);minimapCtx.fillStyle='#fff';minimapCtx.strokeStyle='#111';minimapCtx.lineWidth=1.3;minimapCtx.beginPath();minimapCtx.moveTo(0,-5);minimapCtx.lineTo(4.2,4.4);minimapCtx.lineTo(0,2.6);minimapCtx.lineTo(-4.2,4.4);minimapCtx.closePath();minimapCtx.fill();minimapCtx.stroke();minimapCtx.restore();
}`,
`function renderMinimap(){
 drawMinimapBase();for(const h of hospitals)drawHospitalMapMarker(minimapCtx,h);
 for(const e of events){if(!e.target||!e.target.active)continue;const pos=eventMapPosition(e.target),m=minimapPoint(pos.x,pos.y);drawEventMapMarker(minimapCtx,m.x,m.y,e.hospitalId);}
 const p={x:MINIMAP.w/2,y:MINIMAP.h/2};minimapCtx.save();minimapCtx.translate(p.x,p.y);const pulse=.5+.5*Math.sin(elapsed*5);minimapCtx.globalAlpha=.3+.15*pulse;minimapCtx.strokeStyle='#fff';minimapCtx.lineWidth=1;minimapCtx.beginPath();minimapCtx.arc(0,0,7+pulse,0,Math.PI*2);minimapCtx.stroke();minimapCtx.globalAlpha=1;minimapCtx.fillStyle='#fff';minimapCtx.strokeStyle='#111';minimapCtx.lineWidth=1.3;minimapCtx.beginPath();minimapCtx.moveTo(0,-5.5);minimapCtx.lineTo(4.4,4.5);minimapCtx.lineTo(0,2.7);minimapCtx.lineTo(-4.4,4.5);minimapCtx.closePath();minimapCtx.fill();minimapCtx.stroke();minimapCtx.restore();
}`,'renderMinimap');

new Function(source);
const compressed=zlib.gzipSync(Buffer.from(source,'utf8'),{level:9});
const encoded=compressed.toString('base64');
fs.mkdirSync(`${repo}/v034b`,{recursive:true});
const size=Math.ceil(encoded.length/4);
for(let i=0;i<4;i++) fs.writeFileSync(`${repo}/v034b/game.gz.part${String(i+1).padStart(2,'0')}.txt`,encoded.slice(i*size,(i+1)*size));

let loader=fs.readFileSync(`${repo}/Living_Hospital_v0.3.4.html`,'utf8');
loader=loader.replace('Living Hospital v0.3.4 · Chapter 1','Living Hospital v0.3.4.b · Chapter 1').replaceAll('v034/game.gz.part','v034b/game.gz.part');
fs.writeFileSync(`${repo}/Living_Hospital_v0.3.4.b.html`,loader);
const redirect=`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta http-equiv="refresh" content="0;url=./Living_Hospital_v0.3.4.b.html?v=034b"><title>Living Hospital</title><script>location.replace('./Living_Hospital_v0.3.4.b.html?v=034b')</script></head><body><a href="./Living_Hospital_v0.3.4.b.html?v=034b">Living Hospital 실행</a></body></html>`;
fs.writeFileSync(`${repo}/index.html`,redirect);
fs.writeFileSync(`${repo}/stable-v034b.html`,redirect);
console.log('v0.3.4.b generated',source.length,compressed.length);
