import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { spawnSync } from 'node:child_process';

const root=process.cwd();
const fromVersion='v0.4.0.c',toVersion='v0.4.0.d';
const fromSlug='v040c',toSlug='v040d';
const fromFile='Living_Hospital_v0.4.0.c.html',toFile='Living_Hospital_v0.4.0.d.html';

function read(rel){return fs.readFileSync(path.join(root,rel),'utf8');}
function write(rel,content){const full=path.join(root,rel);fs.mkdirSync(path.dirname(full),{recursive:true});fs.writeFileSync(full,content,'utf8');}
function replaceRequired(source,needle,replacement,label){const first=source.indexOf(needle);if(first<0)throw new Error(`${label}: 교체 대상을 찾지 못했습니다.`);if(source.indexOf(needle,first+needle.length)>=0)throw new Error(`${label}: 교체 대상이 두 번 이상 발견되었습니다.`);return source.slice(0,first)+replacement+source.slice(first+needle.length);}

const baseParts=fs.readdirSync(path.join(root,fromSlug)).filter(name=>/^game\.gz\.part\d+\.txt$/.test(name)).sort();
if(!baseParts.length)throw new Error(`${fromSlug} 압축 파트를 찾지 못했습니다.`);
const packed=baseParts.map(name=>read(path.join(fromSlug,name))).join('').replace(/\s+/g,'');
let runtime=zlib.gunzipSync(Buffer.from(packed,'base64')).toString('utf8');
const patchFiles=fs.readdirSync(path.join(root,'scripts/v040d')).filter(name=>/^runtime\d+\.txt$/.test(name)).sort();
if(patchFiles.length!==4)throw new Error(`v040d 런타임 파트 수 오류: ${patchFiles.length}`);
const patch=patchFiles.map(name=>read(path.join('scripts/v040d',name))).join('');
runtime=replaceRequired(runtime,'ui.confirmSelectionBtn.onclick=',patch+'\nui.confirmSelectionBtn.onclick=','v0.4.0.d 런타임 삽입');

const tempRuntime=path.join(root,'.tmp-runtime-v040d.js');
fs.writeFileSync(tempRuntime,runtime,'utf8');
const syntax=spawnSync(process.execPath,['--check',tempRuntime],{encoding:'utf8'});
fs.rmSync(tempRuntime,{force:true});
if(syntax.status!==0)throw new Error(`런타임 문법 검사 실패\n${syntax.stderr||syntax.stdout}`);

const encoded=zlib.gzipSync(Buffer.from(runtime,'utf8'),{level:9}).toString('base64');
const chunks=[];for(let i=0;i<encoded.length;i+=64000)chunks.push(encoded.slice(i,i+64000));
fs.rmSync(path.join(root,toSlug),{recursive:true,force:true});
chunks.forEach((chunk,index)=>{const wrapped=chunk.match(/.{1,120}/g)?.join('\n')??'';write(path.join(toSlug,`game.gz.part${String(index+1).padStart(2,'0')}.txt`),wrapped+'\n');});

let loader=read(fromFile).replaceAll(fromVersion,toVersion).replaceAll(fromSlug,toSlug).replaceAll('040c','040d');
loader=loader.replace(/const parts=\[[^\]]+\];/,`const parts=[${chunks.map((_,index)=>`\"${toSlug}/game.gz.part${String(index+1).padStart(2,'0')}.txt\"`).join(',')}];`);
const css=`\n.relicHudItem.errorItem{font-family:monospace;border-color:#fff;animation:errorItemPulse .72s steps(2,end) infinite;transform:translateZ(0)}\n@keyframes errorItemPulse{0%,100%{filter:none;transform:translate(0,0)}50%{filter:contrast(1.7);transform:translate(1px,-1px)}}\n`;
loader=replaceRequired(loader,'</style>',css+'</style>','오류 아이템 HUD CSS');
write(toFile,loader);

for(const rel of ['index.html','playtest.html'])write(rel,read(rel).replaceAll(fromFile,toFile).replaceAll(fromVersion,toVersion).replaceAll('040c','040d'));
for(const rel of ['README.md','AGENTS.md','docs/PROJECT_STATUS.md'])write(rel,read(rel).replaceAll(fromFile,toFile).replaceAll(fromVersion,toVersion).replaceAll('040c','040d'));

console.log(`${toVersion} generated: ${chunks.length} runtime chunks`);
