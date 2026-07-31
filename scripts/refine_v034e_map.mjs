import fs from 'node:fs';
import zlib from 'node:zlib';

const parts=[1,2,3,4].map(i=>`v034e/game.gz.part${String(i).padStart(2,'0')}.txt`);
const packed=parts.map(path=>fs.readFileSync(path,'utf8')).join('').replace(/\s+/g,'');
let source=zlib.gunzipSync(Buffer.from(packed,'base64')).toString('utf8');

function replaceOnce(oldText,newText,label){
 if(!source.includes(oldText))throw new Error(`${label} 위치를 찾지 못했습니다.`);
 source=source.replace(oldText,newText);
}

replaceOnce(
 "Object.assign(camera,{x:0,y:0});Object.assign(renderCamera,{x:0,y:0});",
 "Object.assign(camera,{x:0,y:620});Object.assign(renderCamera,{x:0,y:620});",
 '시작 카메라'
);
replaceOnce(
 "[-880,-760],[-680,-760],[-480,-760],[-280,-760],[0,-760],[220,-760],[440,-760],[660,-760],",
 "[-880,-760],[-680,-760],[-480,-760],[480,-760],[680,-760],[880,-760],",
 '북측 중앙 진입로'
);
replaceOnce(
 "addMark('curtain',-1710,-650,92,0,{vertical:true,mapBlock:true,mapW:18,mapH:330});\n addMark('curtain',-1190,-650,92,0,{vertical:true,mapBlock:true,mapW:18,mapH:330});\n addMark('curtain',-1450,-850,92,Math.PI/2,{mapBlock:true,mapW:500,mapH:18});",
 "addMark('curtain',-1710,-650,92,Math.PI/2,{mapBlock:true,mapW:18,mapH:330});\n addMark('curtain',-1190,-650,92,Math.PI/2,{mapBlock:true,mapW:18,mapH:330});\n addMark('curtain',-1450,-850,92,0,{mapBlock:true,mapW:500,mapH:18});",
 '격리 커튼 방향'
);
replaceOnce(
 "addMark('table',220,520,42,.02,{mapBlock:true,mapW:150,mapH:64});",
 "addMark('table',350,430,42,.02,{mapBlock:true,mapW:150,mapH:64});",
 '시작 구역 장비섬'
);
replaceOnce(
 "for(const [x,y] of [[-1050,690],[0,690],[1050,690]])addMark('table',x,y,44,0,{mapBlock:true,mapW:160,mapH:68});",
 "for(const [x,y] of [[-1050,730],[0,840],[1050,730]])addMark('table',x,y,44,0,{mapBlock:true,mapW:160,mapH:68});",
 '남측 봉인 카트'
);
replaceOnce(
 "camera.y+=(-790-camera.y)*Math.min(1,dt*1.35);",
 "camera.y+=(-870-camera.y)*Math.min(1,dt*1.35);",
 '보스 이송문 카메라'
);

new Function(source);
for(const required of [
 "Object.assign(camera,{x:0,y:620})",
 "[-480,-760],[480,-760]",
 "addMark('curtain',-1710,-650,92,Math.PI/2",
 "[[ -1050,730]".replace(' ',''),
 "camera.y+=(-870-camera.y)"
])if(!source.replace(/\s+/g,'').includes(required.replace(/\s+/g,'')))throw new Error(`최종 배치 검증 실패: ${required}`);
if(source.includes("[-280,-760],[0,-760],[220,-760]"))throw new Error('북측 중앙 침대가 남아 있습니다.');

const compressed=zlib.gzipSync(Buffer.from(source,'utf8'),{level:9}),encoded=compressed.toString('base64'),partSize=Math.ceil(encoded.length/4);
for(let i=0;i<4;i++)fs.writeFileSync(parts[i],encoded.slice(i*partSize,(i+1)*partSize));
const rebuilt=parts.map(path=>fs.readFileSync(path,'utf8')).join('');
const decoded=zlib.gunzipSync(Buffer.from(rebuilt,'base64')).toString('utf8');
if(decoded!==source)throw new Error('최종 런타임 재조립 불일치');
new Function(decoded);
console.log(`v0.3.4.e map refined: ${compressed.length} gzip bytes`);
