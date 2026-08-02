import fs from 'node:fs';

const file='scripts/build_v040a.mjs';
let source=fs.readFileSync(file,'utf8');
function replaceOnce(needle,replacement,label){
 const at=source.indexOf(needle);
 if(at<0)throw new Error(`${label}: target missing`);
 if(source.indexOf(needle,at+needle.length)>=0)throw new Error(`${label}: duplicate target`);
 source=source.slice(0,at)+replacement+source.slice(at+needle.length);
}

replaceOnce(
 "structureAddNode('passiveLab','passive','rightLab',1050,-600,true);",
 "structureAddNode('organLab','organ','rightLab',1050,-600,true);",
 'organ room node'
);
replaceOnce(
 "o.nodeType==='relic'?'◆':o.nodeType==='specimen'?'▣':'▲'",
 "o.nodeType==='relic'?'◆':o.nodeType==='organ'?'◉':o.nodeType==='specimen'?'▣':'▲'",
 'organ node icon'
);
replaceOnce(
 "function structureClaimNode(node){node.claimed=true;structureClaimedNodes.add(node.nodeId);updateStructureHud();renderMinimap();syncActionButton();}",
 "function structureOrganChoices(){\n const keys=shuffledCopy(ORGAN_SLOTS).slice(0,3);return keys.map(slot=>{const d=ORGAN_DEFS[slot];return{icon:d.icon,type:'장기',name:d.name,desc:d.lore,apply(){organStored[slot]=true;transplantOrgan(slot);renderOrganHud();}};});\n}\nfunction structureClaimNode(node){node.claimed=true;structureClaimedNodes.add(node.nodeId);updateStructureHud();renderMinimap();syncActionButton();}",
 'organ reward choices'
);
replaceOnce(
 "const choices=node.nodeType==='weapon'?structureWeaponChoices():node.nodeType==='passive'?structurePassiveChoices():structureRelicChoices();",
 "const choices=node.nodeType==='weapon'?structureWeaponChoices():node.nodeType==='passive'?structurePassiveChoices():node.nodeType==='organ'?structureOrganChoices():structureRelicChoices();",
 'organ reward routing'
);
replaceOnce(
 "const title=node.nodeType==='weapon'?'어느 반응을 깨울 것인가':node.nodeType==='passive'?'몸이 새로운 규칙을 기억합니다':'병원이 버리지 못한 물건';",
 "const title=node.nodeType==='weapon'?'어느 반응을 깨울 것인가':node.nodeType==='passive'?'몸이 새로운 규칙을 기억합니다':node.nodeType==='organ'?'당신의 빈자리가 반응합니다':'병원이 버리지 못한 물건';",
 'organ reward title'
);
replaceOnce(
 "6. 장기 1개 교체식 구조 유지\\n7. 유물 최대 3개 보유 골격 추가",
 "6. 관찰실의 장기 보상에서 기존 장기 3종 중 하나를 이식하는 경로 추가\\n7. 장기 1개 교체식 구조 유지 및 유물 최대 3개 보유 골격 추가",
 'project status organ note'
);
replaceOnce(
 "- 패시브 무제한 비중복 수집, 장기 1개 유지, 유물 3칸 골격 추가\\n",
 "- 패시브 무제한 비중복 수집, 관찰실 장기 선택, 장기 1개 유지, 유물 3칸 골격 추가\\n",
 'changelog organ note'
);
replaceOnce(
 "- 패시브는 레벨 없이 누적되고, 유물은 최대 세 개까지 보유합니다.\\n",
 "- 패시브는 레벨 없이 누적되고, 관찰실에서 장기를 교체하며, 유물은 최대 세 개까지 보유합니다.\\n",
 'update note organ'
);

fs.writeFileSync(file,source,'utf8');
fs.rmSync('scripts/patch_v040a_organ.mjs',{force:true});
console.log('v0.4.0.a organ route patched');
