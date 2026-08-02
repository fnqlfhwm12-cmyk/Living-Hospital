
(() => {
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const ui={};['hud','hpFill','hpDebtFill','xpFill','timer','debug','organHud','pause','overlay','panel','overlayTitle','cards','selectionFooter','selectionCancelBtn','confirmSelectionBtn','pauseMenu','pauseSummary','audioToggleBtn','resumeBtn','restartBtn','mainMenuBtn','specimenHud','specimenCount','startScreen','startBtn','titleSettingsBtn','characterScreen','characterGrid','characterBackBtn','characterConfirmBtn','lobbyScreen','lobbyCharacter','lobbyAbility','changeCharacterBtn','lobbyRecordBtn','enterWardBtn','chapterScreen','chapterGrid','chapterBackBtn','chapterEnterBtn','recordScreen','recordContent','recordBackBtn','settingsScreen','metaAudioBtn','settingsBackBtn','dialogueBox','dialogueName','dialogueText','toast','minimap','actionButton'].forEach(id=>ui[id]=document.getElementById(id));
const minimapCtx=ui.minimap.getContext('2d',{alpha:false});
const minimapStatic=document.createElement('canvas'),minimapStaticCtx=minimapStatic.getContext('2d',{alpha:false});

let W=0,H=0,DPR=1,last=0,running=false,paused=false,growthChoosing=false,gameOver=false;
let elapsed=0,spawnTimer=0,fps=60,fpsAcc=0,fpsFrames=0,kills=0,frameTick=0,qualityLevel=0,qualityClock=0,qualityLowStreak=0,qualityHighStreak=0,minimapClock=0,hudClock=0,debugClock=0,orbMergeClock=0,pickupAuditClock=0,runSpecimens=0,specimenPulse=0;
let minFps=60,slowFrames=0,maxEnemies=0,maxOrbs=0,maxFrameMs=0,frameMsSum=0,frameSamples=0,hitVignette=0;
let enemies=[],projectiles=[],waves=[],slashes=[],boneShards=[],boneImpactFx=[],shockFx=[],leechFx=[],bloodWrapFx=[],brainLinks=[],enemyShots=[],orbs=[],organDrops=[],pickups=[],pickupRespawns=[],particles=[],landmarks=[],objects=[],zones=[],events=[],hazards=[],clotFields=[],clotCritFx=[],clotReleaseFx=[],corpses=[],deathFx=[],breaches=[],navGates=[],stitchFx=[],stitchGroups=[],incisionFx=[],unlockActors=[],bossHazards=[];
let eventClock=125,eventCount=0,broadcastTimer=0,broadcastText='',broadcastMode='normal',toastTimer=0,anomalyClock=185,anomalyCount=0,waveSerial=0,currentWave=null,lastEventHospital=null,growthCount=0,currentAction=null;
const joystick={active:false,id:null,sx:0,sy:0,x:0,y:0,dx:0,dy:0,max:72};
const keys={};
const camera={x:0,y:0},renderCamera={x:0,y:0};
const PERF={targetFps:60,enemyCap:150,gridSize:128,objectGridSize:192,cullMargin:110,dpr:[1.5,1.25,1],minimapInterval:[.15,.22,.30]};
const SCALE={player:.90,enemy:.80,eliteEnemy:.88,projectile:.75,item:.85,object:.85,landmark:.85,effect:.75,particle:.75};
const ORB_BASE_R=4.9,ORB_MAX_R=9.5,ORB_GROWTH=.85;
const WARD_BOUNDS={halfW:2300,halfH:1400,visualHalfW:2920,visualHalfH:1900,wallT:28,spawnInset:58,spawnViewMargin:160,minSpawnDistance:520};
const MINIMAP={w:124,h:88,pad:5,minX:-2350,maxX:2350,minY:-1450,maxY:1450,viewW:2400,viewH:1650,baseInterval:.15};
const enemyGrid=new Map(),objectGrid=new Map();
const enemyQueryBuffer=[],objectQueryBuffer=[],enemyBucketPool=[],objectBucketPool=[];
const POOLS={enemy:[],projectile:[],enemyShot:[],orb:[],organDrop:[],pickup:[],particle:[],corpse:[],deathFx:[]};
const screenPoints=Array.from({length:64},()=>({x:0,y:0}));
let screenPointIndex=0,querySerial=1,vignetteGradient=null;
let accumulator=0,loopClock=0,audioCtx=null,audioMaster=null,audioCompressor=null,soundEnabled=true,lastPickupTone=0,lastPlayerHitTone=0,lastBoneHitTone=0,lastBloodHitTone=0,transplantInside=false,transplantNear=false,transplantReady=false,transplantCooldown=0,transplantOpen=false,organSerial=0,cinematicAudioNodes=[];
let activeOrgan=null,organStored={},organFx=0,organFlash='#fff',cameraShake=0,brainClock=8,stomachClock=20,heartBeatClock=4,globalMagnet=0,defibrillatorTimer=0,defibrillatorPulseClock=0,defibrillatorAimX=1,defibrillatorAimY=0,waterReaction=0,bodyTwitch=0,clotTrailClock=0,clotStillClock=0,clotLastX=0,clotLastY=0,clotHadMotion=false,clotArmed=false,clotMoveTime=0,clotMoveDistance=0,clotPrevX=0,clotPrevY=0,clotBurst=null,clotGroupSerial=0,clotCritSerial=0,bloodStreamSerial=0,enemySerial=0,receptorSyncClock=14,attendantTarget=null,attendantRetargetClock=0,attendantTempo=0,attendantNextVulnerability=false,stitchPending=null;
let organCinematicTimer=0,organCinematicSlot=null,organCinematicPreview=false,organPreviewElapsed=0,organPulse=0,organPulseSlot=null,organRings=[];
let selectionMode=null,selectedChoice=null,selectionConfirmAction=null,selectionCancelAction=null,selectionInputGuardUntil=0,selectionNeedsFreshPointer=false,lastGrowthChoiceName='';
let hitStopTimer=0,boneSwingSide=1;
let chapterFlags={},selectedCharacter='specimen',selectedChapter='beta',characterReturn='title',dialogueState=null,bossState=null,bossIntroTimer=0,bossDeathTimer=0,bossCinematicAge=0,bgmTimer=null,bgmNodes=[];
const PERF_WARMUP=4,ORGAN_CINEMATIC_DURATION=3.7,MAX_MAP_PICKUPS=3,BONUS_MAP_PICKUP_CAP=1,PICKUP_RESPAWN_MIN=20,PICKUP_RESPAWN_MAX=35;
const CLOT_FIELD_CAP=28,CLOT_CRIT_FX_CAP=4;
// 첫 밸런스 기준: 골절은 무거운 근접 방사형 넉백, 혈전증은 이동 잔흔과 정지 응고를 이용한 지속 제어다.
// v0.3.3.t: 심장박동은 확률적으로 최대 두 번 연쇄되며, 치명 박동은 120%·치명 추가 박동은 80% 피해를 준다. 골편은 순수 연출이다.


function storageGet(key){try{return window.localStorage?.getItem(key)??null;}catch(_){return null;}}
function storageSet(key,value){try{window.localStorage?.setItem(key,value);return true;}catch(_){return false;}}
const META_KEY='lh_meta_v034';
const ABILITY_COSTS=[100,180,300,450,650,900,1200,1550,2000,2600];
const DEFAULT_META={version:2,specimens:0,selectedCharacter:'specimen',selectedChapter:'beta',unlockedCharacters:{specimen:true,residual:false,attendant:false},unlockedWeapons:{blood:true,bone:true,heart:true,autophagy:true,stitch:false,incision:false},abilityLevels:{specimen:0,residual:0,attendant:0},discoveredEvolutions:[],bossKills:0,chapterOneCleared:false};
function loadMeta(){try{const raw=JSON.parse(storageGet(META_KEY)||'null');if(!raw)return JSON.parse(JSON.stringify(DEFAULT_META));const migrated={...DEFAULT_META,...raw,unlockedCharacters:{...DEFAULT_META.unlockedCharacters,...raw.unlockedCharacters},unlockedWeapons:{...DEFAULT_META.unlockedWeapons,...raw.unlockedWeapons},abilityLevels:{...DEFAULT_META.abilityLevels,...raw.abilityLevels}};if((raw.version||1)<2){migrated.specimens=Math.max(0,Math.round((raw.specimens||0)*100));migrated.version=2;}return migrated;}catch(_){return JSON.parse(JSON.stringify(DEFAULT_META));}}
let meta=loadMeta();selectedCharacter=meta.selectedCharacter||'specimen';selectedChapter=meta.selectedChapter||'beta';
function saveMeta(){meta.selectedCharacter=selectedCharacter;meta.selectedChapter=selectedChapter;meta.version=2;storageSet(META_KEY,JSON.stringify(meta));}
const CHARACTER_DEFS={
 specimen:{name:'베타',glyph:'β',quote:'교체될 때마다 조금씩 자신을 잊는다.',weapon:'blood',weaponName:'혈류',ability:'수용체',abilityText:'서로 다른 무기를 받아들일수록 모든 공격이 빨라진다. 복구가 진행되면 무기들이 서로 적응하고 같은 순간에 반응한다.'},
 residual:{name:'잔존자',glyph:'⌁',quote:'남의 기억으로 자신의 형태를 유지한다.',weapon:'stitch',weaponName:'봉합사',ability:'잔존 반응',abilityText:'받은 피해 일부가 즉시 상처가 되지 않고 잔류 손상으로 남는다. 적을 처치하면 남은 손상을 지울 수 있다.'},
 attendant:{name:'당직자',glyph:'▣',quote:'중지 명령이 전달되지 않았다.',weapon:'incision',weaponName:'절개선',ability:'처치 순서',abilityText:'시야 안에서 가장 위험한 개체를 자동으로 분류한다. 분류된 대상에는 모든 무기가 더 효율적으로 작동한다.'}
};
const ABILITY_STEPS={
 specimen:['추가 무기당 적응 속도가 증가합니다.','수용체의 최대 적응 폭이 넓어집니다.','새 무기를 처음 받아들이면 12초간 적응이 가속됩니다.','적응 가속의 지속시간과 기본 효율이 증가합니다.','무기 4종 이상 보유 시 모든 피해가 증가합니다.','추가 무기마다 피해 적응이 함께 축적됩니다.','공격 주기 적응의 상한이 크게 확장됩니다.','적응 가속 중 피해량도 함께 증가합니다.','무기 5종 이상 보유 시 치명 현상 확률이 증가합니다.','14초마다 모든 활성 무기가 한꺼번에 반응합니다.'],
 residual:['처치 시 지워지는 잔류 손상이 증가합니다.','잔류 손상이 더 천천히 실제 상처로 변합니다.','처치 시 현재 잔류 손상의 일정 비율을 지웁니다.','잔류 손상이 남아 있으면 이동속도가 증가합니다.','강한 개체를 처치하면 잔류 손상을 대량 제거합니다.','더 많은 피해를 잔류 손상으로 유예합니다.','잔류 손상이 남아 있으면 공격력이 증가합니다.','처치에 의한 잔류 손상 제거량이 다시 증가합니다.','피해 유예 비율과 처치 회복 효율이 최대치에 가까워집니다.','치명상을 한 번 버티고 남은 피해를 잔류 손상으로 전환합니다.'],
 attendant:['분류 대상에 대한 피해 효율이 증가합니다.','위험 대상을 더 자주 다시 분류합니다.','특수 개체와 강한 개체의 분류 우선도가 높아집니다.','분류 대상에 대한 밀침과 제어가 강화됩니다.','분류 대상을 처치하면 잠시 공격 주기가 빨라집니다.','분류 대상에 대한 피해 효율이 크게 증가합니다.','분류 대상 처치 시 모든 무기의 남은 대기시간이 줄어듭니다.','다음 분류 대상이 잠시 더 취약한 상태로 지정됩니다.','분류 대상 피해와 처치 가속 효과가 최대치에 가까워집니다.','분류 대상 처치 시 모든 무기의 대기시간이 크게 당겨지고 다음 절차가 즉시 시작됩니다.']
};
const CHAPTER_DEFS={beta:{label:'CHAPTER I',title:'β',subtitle:'비어 있는 자리',desc:'기록되지 않은 개체들이 먼저 깨어난 병동.',available:true},living:{label:'CHAPTER II',title:'Living Hospital',subtitle:'아직 닫혀 있음',desc:'다음 병동은 아직 연결되지 않았습니다.',available:false},third:{label:'CHAPTER III',title:'—',subtitle:'기록 없음',desc:'확인되지 않은 절차입니다.',available:false}};
function hideMetaScreens(){for(const id of ['startScreen','characterScreen','lobbyScreen','chapterScreen','recordScreen','settingsScreen'])ui[id]?.classList.remove('active');}
function showMetaScreen(id){hideMetaScreens();ui[id]?.classList.add('active');ui.hud.style.display='none';}
function abilityCost(level){return ABILITY_COSTS[level]??null;}
function abilityTrackMarkup(level){return `<div class="abilityTrack" aria-label="강화 ${level}/10">${Array.from({length:10},(_,i)=>`<span class="abilityPip ${i<level?'active':''} ${(i+1)%3===0||i===9?'milestone':''}">${i+1}</span>`).join('')}</div>`;}
function renderCharacterSelect(){ui.characterGrid.innerHTML='';for(const [key,d] of Object.entries(CHARACTER_DEFS)){const unlocked=!!meta.unlockedCharacters[key],b=document.createElement('button');b.className='card characterCard'+(unlocked?'':' locked')+(selectedCharacter===key?' selected':'');b.disabled=!unlocked;b.innerHTML=`<div class="characterGlyph">${unlocked?d.glyph:'?'}</div><small>${unlocked?d.weaponName:'기록 없음'}</small><h3>${unlocked?d.name:'미등록 개체'}</h3><p>${unlocked?d.quote:(key==='residual'?'비어 있지 않은 침대가 있다.':'근무자가 확인되지 않는다.')}</p>`;b.onclick=()=>{selectedCharacter=key;renderCharacterSelect();};ui.characterGrid.appendChild(b);}ui.characterConfirmBtn.disabled=!meta.unlockedCharacters[selectedCharacter];}
function renderLobby(){const d=CHARACTER_DEFS[selectedCharacter],lv=Math.min(10,meta.abilityLevels[selectedCharacter]||0),cost=abilityCost(lv),next=ABILITY_STEPS[selectedCharacter][lv];ui.lobbyCharacter.innerHTML=`<div class="characterGlyph">${d.glyph}</div><small>수용 개체</small><h2>${d.name}</h2><p>${d.quote}</p><span class="metaTag">기본 무기 · ${d.weaponName}</span><span class="metaTag">개인능력 · ${d.ability}</span><hr><div class="currency"><span class="specimenMiniIcon">▣</span> ${Number(meta.specimens||0).toLocaleString('ko-KR')}</div>`;ui.lobbyAbility.innerHTML=`<small>개인능력</small><h2>${d.ability}</h2><p>${d.abilityText}</p>${abilityTrackMarkup(lv)}<p class="muted">검체 강화 ${lv}/10</p><div class="abilityCurrent"><b>${lv===0?'기본 반응':`${lv}강 적용`}</b><span>${lv===0?'개인능력의 기본 규칙이 활성화되어 있습니다.':ABILITY_STEPS[selectedCharacter][lv-1]}</span></div><div class="abilityRow"><div>${cost===null?'이 개체의 복구가 완성되었습니다.':`다음 복구 · ${Number(cost).toLocaleString('ko-KR')} 검체${next?`<small>${next}</small>`:''}`}</div>${cost===null?'':`<button class="btn" id="abilityUpgradeBtn" ${meta.specimens<cost?'disabled':''}>복구</button>`}</div>`;const btn=document.getElementById('abilityUpgradeBtn');if(btn)btn.onclick=()=>{if(meta.specimens<cost)return;meta.specimens-=cost;meta.abilityLevels[selectedCharacter]=lv+1;saveMeta();renderLobby();};}
function openCharacterSelect(from='title'){characterReturn=from;renderCharacterSelect();showMetaScreen('characterScreen');}
function openLobby(){renderLobby();showMetaScreen('lobbyScreen');}
function renderChapterSelect(){ui.chapterGrid.innerHTML='';for(const [key,d] of Object.entries(CHAPTER_DEFS)){const b=document.createElement('button');b.className='chapterCard'+(d.available?'':' locked')+(selectedChapter===key&&d.available?' selected':'');b.disabled=!d.available;b.innerHTML=`<small>${d.label}</small><strong>${d.title}</strong><span>${d.subtitle}</span><p>${d.desc}</p>`;if(d.available)b.onclick=()=>{selectedChapter=key;saveMeta();renderChapterSelect();};ui.chapterGrid.appendChild(b);}ui.chapterEnterBtn.disabled=!CHAPTER_DEFS[selectedChapter]?.available;}
function openChapterSelect(){renderChapterSelect();showMetaScreen('chapterScreen');}
function renderRecords(){const chars=Object.entries(CHARACTER_DEFS).filter(([k])=>meta.unlockedCharacters[k]).map(([k,d])=>`<div class="recordItem"><b>${d.name}</b><p>${d.weaponName} · ${d.ability} · ${meta.abilityLevels[k]||0}/10</p></div>`).join('');const weaponTags=Object.entries(weapons).filter(([k])=>meta.unlockedWeapons[k]).map(([,w])=>`<span class="metaTag">${w.name}</span>`).join('');const evolutions=(meta.discoveredEvolutions||[]).length?meta.discoveredEvolutions.map(x=>`<span class="metaTag">${x}</span>`).join(''):'<p class="muted">발견된 진화가 없습니다.</p>';ui.recordContent.innerHTML=`<p>보유 검체 · ${Number(meta.specimens||0).toLocaleString('ko-KR')}</p><p>최고 생존 기록 · ${fmt(best)}</p><p>회수자 처치 · ${meta.bossKills}회</p><h3>개체</h3><div class="recordList">${chars}</div><h3 style="margin-top:14px">무기</h3><div>${weaponTags}</div><h3 style="margin-top:14px">발견된 진화</h3>${evolutions}`;}
function openRecords(from='lobby'){renderRecords();ui.recordScreen.dataset.from=from;showMetaScreen('recordScreen');}
function syncMetaAudio(){ui.metaAudioBtn.textContent=soundEnabled?'켜짐':'꺼짐';}
function showSettings(){syncMetaAudio();showMetaScreen('settingsScreen');}
function startChapterRun(){if(selectedChapter!=='beta')return;initAudio();startChapterBgm(false);if(screen.orientation?.lock)screen.orientation.lock('landscape').catch(()=>{});hideMetaScreens();ui.hud.style.display='block';reset();last=performance.now();loopClock=0;requestAnimationFrame(loop);}

const player={x:0,y:0,r:16*SCALE.player,hp:100,maxHp:100,shield:0,speed:186,xp:0,nextGrowthXp:9,invuln:0,pickup:95,moveBonus:0,pickupBonus:0,damageTakenMult:1,crit:0.05,critMult:1.7,regen:0,autoBuff:0,invulnBonus:0,xpRemainder:0,facingX:1,facingY:0,adaptationSurge:0,residualDamage:0,residualRate:0,residualGrace:0,residualLastStandCd:0};

const weapons={
 blood:{name:'혈류',icon:'🩸',level:1,cd:1.06,timer:0,damage:12,speed:398,lore:'몸을 벗어난 피가 하나의 생명으로 이어져 살아 있는 것을 스스로 찾아냅니다.'},
 bone:{name:'골절',icon:'🦴',level:0,cd:2.35,timer:0,damage:64,range:102,arc:Math.PI,knockback:76,critKnockback:148,lift:.43,hold:.11,strike:.15,recovery:.50,lore:'몸을 떠난 뼈가 뒤늦게 제 쓰임을 기억합니다.'},
 heart:{name:'심장박동',icon:'❤️',level:0,cd:2.55,timer:0,damage:13,radius:95,echoChance:.25,maxEchoes:2,lore:'박동이 살갗 밖으로 번지고, 때때로 제 리듬을 잊습니다.'},
 autophagy:{name:'혈전증',icon:'◉',level:0,timer:0,damage:1.15,radius:28,slow:.14,trailLife:1.05,poolLife:2.4,poolRadius:52,lore:'지나온 자리에 병든 피가 남고, 멈춘 자리에서 세 번 응고합니다.'},
 stitch:{name:'봉합사',icon:'⌁',level:0,cd:1.48,timer:0,damage:18,range:430,lore:'첫 박자에 군집을 꿰고, 다음 박자에 한꺼번에 봉합합니다.'},
 incision:{name:'절개선',icon:'╱',level:0,cd:2.85,timer:0,damage:42,range:390,width:18,delay:.58,lore:'가느다란 지시선 뒤로 공간이 늦게 벌어집니다.'}
};

const passives={
 flow:{name:'순환 촉진',icon:'💧',level:0,desc:'피가 재촉합니다. 공격이 빨라집니다.'},
 density:{name:'골밀도',icon:'🦴',level:0,desc:'뼈가 몸을 붙듭니다. 체력과 방어가 증가합니다.'},
 sensory:{name:'감각 과민',icon:'👁️',level:0,desc:'신경이 날카로워집니다. 치명타 확률이 증가합니다.'},
 necrosis:{name:'괴사 내성',icon:'☣️',level:0,desc:'죽은 살이 고통을 늦춥니다. 피격 무적시간이 증가합니다.'},
 overload:{name:'신경 과부하',icon:'⚡',level:0,desc:'신경이 폭주합니다. 이동·공격 속도가 오르지만 피해에 취약해집니다.'}
};

const ORGAN_SLOTS=['heart','brain','stomach'];
const ORGAN_DEFS={
 heart:{name:'심장',short:'심',icon:'🫀',color:'#d94d5b',effect:'과부하 · 공격·이동 속도와 피해량 증가, 지속 회복',lore:'당신의 박동 사이에, 이름 없는 심장이 기도를 시작합니다.',quote:'두 번째 고동은 오래전부터 당신을 기다리고 있었습니다.',activation:'심장이 폭주합니다.',ritual:'박동 동기화'},
 brain:{name:'뇌',short:'뇌',icon:'🧠',color:'#b58ad2',effect:'정신침식 · 주기적으로 적 일부가 서로를 공격',lore:'낯선 주름이 당신의 침묵을 생각하기 시작합니다.',quote:'서로 다른 머릿속에서 하나의 속삭임이 자랍니다.',activation:'그들의 사고가 하나로 겹칩니다.',ritual:'신경 침식'},
 stomach:{name:'위',short:'위',icon:'◉',color:'#d1b45f',effect:'폭식 · 일정 시간마다 전장의 경험치와 아이템을 흡수',lore:'비어 있는 기관은 이미 전장의 끝을 맛보았습니다.',quote:'굶주림이 눈을 뜨자, 흩어진 것들이 길을 잃습니다.',activation:'굶주림이 깨어납니다.',ritual:'포식 개방'}
};
const EVOLUTION_RECIPES=[];
const AWAKENING_RECIPES=[];
function registerEvolutionRecipe(recipe){if(recipe&&recipe.id)EVOLUTION_RECIPES.push(recipe);}
function registerAwakeningRecipe(recipe){if(recipe&&recipe.id)AWAKENING_RECIPES.push(recipe);}
// v0.3.3.l 기반 연결: 실제 진화는 비활성 상태로 예약한다.
registerEvolutionRecipe({id:'blood-circulation',weapon:'blood',passive:'flow',result:null,enabled:false});
const organMods={attackSpeed:1,damage:1,moveSpeed:1,pickup:1,damageTaken:1,xp:1,crit:0,regen:0,maxHp:0};
function shuffledCopy(a){const r=[...a];for(let i=r.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[r[i],r[j]]=[r[j],r[i]];}return r;}
function clearOrganState(){stopCinematicAudio();activeOrgan=null;organStored={};Object.assign(organMods,{attackSpeed:1,damage:1,moveSpeed:1,pickup:1,damageTaken:1,xp:1,crit:0,regen:0,maxHp:0});organDropSequence=shuffledCopy(ORGAN_SLOTS);organSerial=0;transplantInside=false;transplantNear=false;transplantReady=false;transplantCooldown=0;transplantOpen=false;brainClock=8;stomachClock=20;heartBeatClock=4;globalMagnet=0;organFx=0;organCinematicTimer=0;organCinematicSlot=null;organCinematicPreview=false;organPreviewElapsed=0;organPulse=0;organPulseSlot=null;organRings.length=0;document.body.classList.remove('organ-cinematic');ui.overlay?.classList.remove('organPreview');syncActionButton();}
let organDropSequence=[...ORGAN_SLOTS];
function organCount(obj){return obj?Object.keys(obj).length:0;}
function nextOrganSlot(preferMissing=true){if(preferMissing){const missing=ORGAN_SLOTS.filter(k=>k!==activeOrgan&&!organStored[k]);if(missing.length)return missing[Math.floor(Math.random()*missing.length)];}return ORGAN_SLOTS[Math.floor(Math.random()*ORGAN_SLOTS.length)];}
function recalcOrganEffects(){Object.assign(organMods,{attackSpeed:1,damage:1,moveSpeed:1,pickup:1,damageTaken:1,xp:1,crit:0,regen:0,maxHp:0});if(activeOrgan==='heart'){organMods.attackSpeed=1.20;organMods.damage=1.15;organMods.moveSpeed=1.08;organMods.regen=.35;}if(activeOrgan==='brain'){organMods.crit=.05;brainClock=Math.min(brainClock,3);}if(activeOrgan==='stomach'){organMods.pickup=1.25;stomachClock=Math.min(stomachClock,8);}renderOrganHud();updateHudDom(true);}
function renderOrganHud(){
 ui.organHud.innerHTML='';const d=document.createElement('div');
 if(activeOrgan){const def=ORGAN_DEFS[activeOrgan];d.className='organSlot equipped';d.style.borderColor=def.color;d.style.color=def.color;d.style.boxShadow=`0 0 13px ${def.color}70`;d.innerHTML=`<span class="organSigil">${def.icon}</span><span class="organDot"></span>`;d.title=`${def.name} · ${def.lore}`;}
 else{d.className='organSlot empty';d.innerHTML='<span style="font-size:14px;opacity:.6">◇</span>';d.title='메인 장기 없음';}
 ui.organHud.appendChild(d);
}
function triggerOrganActivation(slot,announce=true,playSound=true){
 const def=ORGAN_DEFS[slot];organPulse=1;organPulseSlot=slot;organFx=Math.max(organFx,.55);organFlash=def.color;cameraShake=Math.max(cameraShake,slot==='heart'?5:slot==='brain'?4:6);
 organRings.push({x:player.x,y:player.y,r:slot==='stomach'?235:8,max:slot==='heart'?190:slot==='brain'?215:24,life:slot==='stomach'?1.05:.85,maxLife:slot==='stomach'?1.05:.85,color:def.color,slot});
 const count=qualityLevel===2?10:18;for(let i=0;i<count;i++){const a=Math.random()*Math.PI*2,sp=55+Math.random()*150;emitParticle(player.x,player.y,Math.cos(a)*sp,Math.sin(a)*sp,.45,2+Math.random()*3,def.color);}
 if(playSound){if(slot==='heart')sfx('organHeart');else if(slot==='brain')sfx('organBrain');else sfx('organStomach');}
 if(announce)broadcast(def.activation,'organ');
}
function triggerOrganCinematic(slot){
 const def=ORGAN_DEFS[slot];organCinematicSlot=slot;organCinematicTimer=ORGAN_CINEMATIC_DURATION;organFx=1;organFlash=def.color;cameraShake=slot==='heart'?10:slot==='brain'?7:8;broadcastTimer=0;toastTimer=0;ui.toast.style.opacity='0';document.body.classList.add('organ-cinematic');syncActionButton();
 const count=qualityLevel===2?22:36;for(let i=0;i<count;i++){const a=Math.random()*Math.PI*2,sp=70+Math.random()*210;emitParticle(player.x,player.y,Math.cos(a)*sp,Math.sin(a)*sp,.75,2+Math.random()*4,def.color);}
 if(slot==='brain')applyBrainInfluence(true);
 triggerOrganActivation(slot,false,false);playOrganCinematicSfx(slot);
}

const HOSPITAL_DEFS=[
 {id:'supportRecovery',name:'격리 병상',short:'회복',zoneId:'supportRecovery',color:'#79b58b',role:'support'},
 {id:'supportTransfusion',name:'응급 처치대',short:'수혈',zoneId:'supportTransfusion',color:'#d15b68',role:'support'},
 {id:'organHeart',name:'심전도 장비',short:'심장',zoneId:'organHeart',color:'#d94d5b',role:'organ',organSlot:'heart',eventLabel:'정지된 심장 회수'},
 {id:'organBrain',name:'관찰 장비',short:'신경',zoneId:'organBrain',color:'#b58ad2',role:'organ',organSlot:'brain',eventLabel:'침식된 뇌 표본 회수'},
 {id:'organStomach',name:'처치 장비',short:'소화',zoneId:'organStomach',color:'#d1b45f',role:'organ',organSlot:'stomach',eventLabel:'포식 기관 회수'},
 {id:'organLockedA',name:'봉인 카트 A',short:'봉인',zoneId:'organLockedA',color:'#55545b',role:'organ',available:false},
 {id:'organLockedB',name:'봉인 카트 B',short:'봉인',zoneId:'organLockedB',color:'#55545b',role:'organ',available:false},
 {id:'organLockedC',name:'봉인 카트 C',short:'봉인',zoneId:'organLockedC',color:'#55545b',role:'organ',available:false}
];
let hospitals=[],activeHospitalIds=[];
const BREAKABLE_PROP_TYPES=new Set(['medicalCart','wasteBin','smallCabinet']);
const TARGET_OBJECT_TYPES=new Set(['medicine','transfusionPump','eventOrganHeart','eventOrganBrain','eventOrganStomach',...BREAKABLE_PROP_TYPES]);
function isBreakableProp(o){return !!(o&&BREAKABLE_PROP_TYPES.has(o.type));}
function isTargetObject(o){return !!(o&&o.active&&TARGET_OBJECT_TYPES.has(o.type));}
function hospitalById(id){return hospitals.find(h=>h.id===id)||null;}

let best=Number(storageGet('lh_best_v034')||storageGet('lh_best_v033t')||storageGet('lh_best_v033q')||storageGet('lh_best_v033p')||storageGet('lh_best_v033o')||storageGet('lh_best_v033m')||storageGet('lh_best_v033l')||storageGet('lh_best_v033k')||storageGet('lh_best_v033j')||storageGet('lh_best_v033i')||storageGet('lh_best_v033h')||storageGet('lh_best_v033g')||storageGet('lh_best_v033f')||storageGet('lh_best_v033e')||storageGet('lh_best_v033d')||storageGet('lh_best_v033c')||storageGet('lh_best_v033b')||storageGet('lh_best_v033a')||storageGet('lh_best_v033')||storageGet('lh_best_v032')||storageGet('lh_best_v031')||storageGet('lh_best_v030')||storageGet('lh_best_v029')||storageGet('lh_best_v028')||storageGet('lh_best_v027')||storageGet('lh_best_v025')||storageGet('lh_best_v024')||storageGet('lh_best_v023')||storageGet('lh_best_v022')||storageGet('lh_best_v021')||storageGet('lh_best_v020')||storageGet('lh_best_v015')||storageGet('lh_best_v014')||storageGet('lh_best_v013')||storageGet('lh_best_v012')||0);

function initAudio(){
 try{
  if(!audioCtx){const AC=window.AudioContext||window.webkitAudioContext;if(AC)audioCtx=new AC();}
  if(audioCtx&&!audioMaster){audioMaster=audioCtx.createGain();audioCompressor=audioCtx.createDynamicsCompressor();audioMaster.gain.value=3.15;audioCompressor.threshold.value=-7;audioCompressor.knee.value=5;audioCompressor.ratio.value=2.2;audioCompressor.attack.value=.0015;audioCompressor.release.value=.11;audioMaster.connect(audioCompressor);audioCompressor.connect(audioCtx.destination);}
  if(audioCtx?.state==='suspended')audioCtx.resume();
 }catch(_){audioCtx=null;audioMaster=null;audioCompressor=null;}
}
function trackCinematicNode(node){cinematicAudioNodes.push(node);node.onended=()=>{const i=cinematicAudioNodes.indexOf(node);if(i>=0)cinematicAudioNodes.splice(i,1);};return node;}
function stopCinematicAudio(){for(const node of cinematicAudioNodes.splice(0)){try{node.stop();}catch(_){}}}
function toneAt(freq=440,start=.0,dur=.07,type='sine',vol=.025,endFreq=freq,track=false){
 if(!soundEnabled)return;initAudio();if(!audioCtx)return;
 const now=audioCtx.currentTime+Math.max(0,start),o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type;o.frequency.setValueAtTime(Math.max(40,freq),now);o.frequency.exponentialRampToValueAtTime(Math.max(40,endFreq),now+dur);g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(vol,now+.008);g.gain.exponentialRampToValueAtTime(.0001,now+dur);o.connect(g);g.connect(audioMaster||audioCtx.destination);if(track)trackCinematicNode(o);o.start(now);o.stop(now+dur+.015);
}
function tone(freq=440,dur=.07,type='sine',vol=.025,endFreq=freq){toneAt(freq,0,dur,type,vol,endFreq,false);}
function noiseAt(start,dur,vol=.012,filterFreq=1200,filterType='lowpass',track=true){
 if(!soundEnabled)return;initAudio();if(!audioCtx)return;const frames=Math.max(1,Math.floor(audioCtx.sampleRate*dur)),buffer=audioCtx.createBuffer(1,frames,audioCtx.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<frames;i++)data[i]=(Math.random()*2-1)*(1-i/frames*.35);const source=audioCtx.createBufferSource(),filter=audioCtx.createBiquadFilter(),g=audioCtx.createGain(),now=audioCtx.currentTime+Math.max(0,start);source.buffer=buffer;filter.type=filterType;filter.frequency.setValueAtTime(filterFreq,now);g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(vol,now+.025);g.gain.exponentialRampToValueAtTime(.0001,now+dur);source.connect(filter);filter.connect(g);g.connect(audioMaster||audioCtx.destination);if(track)trackCinematicNode(source);source.start(now);source.stop(now+dur+.02);
}
// 혈전증 전용 점성음: 타격성 고역 대신 저역의 젖은 마찰과 흡착감을 겹친다.
function wetClotSfx(step=2){
 if(!soundEnabled)return;initAudio();if(!audioCtx)return;
 const now=audioCtx.currentTime,dur=(step===3?.24:.19)+(Math.random()-.5)*.018;
 const vol=(step===3?.0175:step===2?.0155:.014)*(0.92+Math.random()*.16);
 const frames=Math.max(1,Math.floor(audioCtx.sampleRate*dur)),buffer=audioCtx.createBuffer(1,frames,audioCtx.sampleRate),data=buffer.getChannelData(0);
 let brown=0,slow=0;
 for(let i=0;i<frames;i++){
  const t=i/frames,white=Math.random()*2-1;
  brown=(brown+white*.105)*.925;
  slow=slow*.985+brown*.015;
  const body=(brown*.76+slow*1.45),surface=Math.sin(t*Math.PI*2*(10+step*1.4)+Math.sin(t*17)*.6)*.035;
  data[i]=Math.max(-1,Math.min(1,body+surface));
 }
 const source=audioCtx.createBufferSource(),high=audioCtx.createBiquadFilter(),low=audioCtx.createBiquadFilter(),g=audioCtx.createGain();
 source.buffer=buffer;high.type='highpass';high.frequency.setValueAtTime(42,now);low.type='lowpass';low.Q.value=.72;low.frequency.setValueAtTime((step===2?235:step===3?165:195)*(0.96+Math.random()*.08),now);
 g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(vol,now+.038);g.gain.setValueAtTime(vol*.84,now+dur*.52);g.gain.exponentialRampToValueAtTime(.0001,now+dur);
 source.connect(high);high.connect(low);low.connect(g);g.connect(audioMaster||audioCtx.destination);source.start(now);source.stop(now+dur+.02);
 const bodyOsc=audioCtx.createOscillator(),bodyGain=audioCtx.createGain(),pitch=1+(Math.random()-.5)*.07;
 bodyOsc.type='sine';bodyOsc.frequency.setValueAtTime((step===2?74:step===3?58:66)*pitch,now);bodyOsc.frequency.exponentialRampToValueAtTime((step===2?43:step===3?34:39)*pitch,now+dur);
 bodyGain.gain.setValueAtTime(.0001,now);bodyGain.gain.exponentialRampToValueAtTime(vol*.46,now+.046);bodyGain.gain.exponentialRampToValueAtTime(.0001,now+dur);
 bodyOsc.connect(bodyGain);bodyGain.connect(audioMaster||audioCtx.destination);bodyOsc.start(now);bodyOsc.stop(now+dur+.02);
 if(step!==1){
  const bubble=audioCtx.createOscillator(),bubbleGain=audioCtx.createGain(),start=now+.045+Math.random()*.025;
  bubble.type='sine';bubble.frequency.setValueAtTime((step===3?91:108)*pitch,start);bubble.frequency.exponentialRampToValueAtTime((step===3?49:61)*pitch,start+.085);
  bubbleGain.gain.setValueAtTime(.0001,start);bubbleGain.gain.exponentialRampToValueAtTime(vol*.18,start+.028);bubbleGain.gain.exponentialRampToValueAtTime(.0001,start+.09);
  bubble.connect(bubbleGain);bubbleGain.connect(audioMaster||audioCtx.destination);bubble.start(start);bubble.stop(start+.105);
 }
}
function playOrganCinematicSfx(slot){
 if(!soundEnabled)return;stopCinematicAudio();initAudio();if(!audioCtx)return;
 if(slot==='heart'){
  toneAt(42,.02,3.55,'sine',.014,34,true);for(const b of [.16,.90,1.64,2.38,3.10]){toneAt(82,b,.16,'sine',.074,49,true);toneAt(50,b+.15,.23,'sine',.066,36,true);toneAt(190,b,.055,'square',.012,82,true);}
 }else if(slot==='brain'){
  noiseAt(.02,3.46,.011,1850,'bandpass',true);toneAt(235,.02,3.45,'triangle',.009,285,true);for(const [t,hi,lo] of [[.08,1280,180],[.72,970,210],[1.35,1540,260],[2.05,860,150],[2.72,1320,230],[3.20,720,190]]){toneAt(hi,t,.34,'sawtooth',.019,lo,true);toneAt(lo,t+.12,.28,'triangle',.016,hi*.72,true);}
 }else{
  noiseAt(.02,3.48,.018,330,'lowpass',true);toneAt(86,.02,3.52,'sine',.032,38,true);toneAt(48,.34,2.95,'triangle',.013,215,true);for(const [t,f] of [[.22,112],[.66,78],[1.05,126],[1.55,70],[2.02,118],[2.48,74],[2.92,104]]){toneAt(f,t,.34,'sine',.034,43,true);toneAt(46,t+.19,.25,'triangle',.018,f*.88,true);}
 }
}
function sfx(kind){
 if(!soundEnabled)return;
 if(kind==='hit'){const now=performance.now();if(now-lastPlayerHitTone<65)return;lastPlayerHitTone=now;const v=Math.random();noiseAt(0,.060,.052,v<.5?1850:2250,'bandpass',false);tone(v<.5?940:1120,.052,'square',.030,430);toneAt(330,.012,.080,'triangle',.030,128,false);}
 else if(kind==='hitHeavy'){const now=performance.now();if(now-lastPlayerHitTone<75)return;lastPlayerHitTone=now;noiseAt(0,.085,.068,1700,'bandpass',false);noiseAt(.025,.145,.050,310,'lowpass',false);tone(780,.075,'square',.038,260);toneAt(150,.018,.145,'triangle',.055,48,false);}
 else if(kind==='crit'){tone(210,.045,'triangle',.018,115);}
 else if(kind==='pickup'){const now=performance.now();if(now-lastPickupTone<55)return;lastPickupTone=now;tone(680,.045,'sine',.018,900);}
 else if(kind==='growth'){tone(420,.12,'triangle',.038,760);setTimeout(()=>tone(680,.12,'triangle',.034,1020),75);}
 else if(kind==='eventStart'){tone(240,.15,'sawtooth',.034,360);setTimeout(()=>tone(360,.16,'triangle',.032,520),100);}
 else if(kind==='eventDone'){tone(520,.13,'triangle',.038,760);setTimeout(()=>tone(760,.15,'sine',.034,1050),95);}
 else if(kind==='object'){tone(110,.07,'triangle',.030,70);noiseAt(0,.07,.018,430,'lowpass',false);}
 else if(kind==='organ'){tone(310,.11,'triangle',.036,520);setTimeout(()=>tone(520,.13,'sine',.032,760),80);}
 else if(kind==='organHeart'){tone(92,.16,'sine',.070,70);setTimeout(()=>tone(76,.22,'sine',.075,52),155);}
 else if(kind==='heartBeat'){tone(86,.105,'sine',.048,57);toneAt(54,.070,.145,'sine',.045,36,false);}
 else if(kind==='heartBeatCrit'){tone(94,.12,'triangle',.058,54);toneAt(58,.065,.18,'sine',.058,32,false);toneAt(178,.018,.055,'square',.010,88,false);}
 else if(kind==='heartEcho1'){tone(103,.070,'sine',.035,68);toneAt(62,.040,.095,'sine',.031,42,false);}
 else if(kind==='heartEcho2'){tone(116,.058,'sine',.032,76);toneAt(69,.030,.078,'sine',.028,47,false);}
 else if(kind==='organBrain'){tone(760,.12,'sawtooth',.032,180);setTimeout(()=>tone(230,.22,'triangle',.040,980),95);}
 else if(kind==='organStomach'){tone(135,.30,'sine',.055,44);setTimeout(()=>tone(245,.20,'triangle',.033,82),125);}
 else if(kind==='bloodFire'){noiseAt(0,.085,.022,360,'lowpass',false);tone(118,.075,'sine',.030,68);toneAt(64,.018,.090,'triangle',.021,46,false);}
 else if(kind==='bloodHit'){const now=performance.now();if(now-lastBloodHitTone<52)return;lastBloodHitTone=now;noiseAt(0,.070,.025,430,'lowpass',false);tone(92,.090,'sine',.028,48);}
 else if(kind==='bloodBranch'){noiseAt(0,.105,.028,510,'lowpass',false);tone(126,.11,'sine',.034,58);toneAt(82,.035,.14,'triangle',.022,45,false);}
 else if(kind==='boneFire'){noiseAt(0,.18,.030,430,'lowpass',false);toneAt(72,.015,.18,'triangle',.030,43,false);toneAt(46,.085,.16,'sine',.020,34,false);}
 else if(kind==='boneHit'){const now=performance.now();if(now-lastBoneHitTone<95)return;lastBoneHitTone=now;noiseAt(0,.115,.042,520,'lowpass',false);noiseAt(.010,.055,.020,1180,'bandpass',false);toneAt(62,0,.19,'triangle',.064,31,false);toneAt(38,.025,.21,'sine',.048,27,false);}
 else if(kind==='autophagy'||kind==='autophagy1'||kind==='autophagy2'||kind==='autophagy3'){const step=kind==='autophagy1'?1:kind==='autophagy2'?2:kind==='autophagy3'?3:2;wetClotSfx(step);}
 else if(kind==='clotCrit'){wetClotSfx(3);toneAt(62,.018,.17,'triangle',.010,39,false);toneAt(94,.060,.085,'sine',.007,54,false);}
 else if(kind==='clotRelease'){toneAt(54,0,.12,'sine',.007,37,false);noiseAt(0,.075,.008,210,'lowpass',false);}
 else if(kind==='dirtyWater'){noiseAt(0,.22,.026,540,'lowpass',false);toneAt(118,.05,.18,'triangle',.028,72,false);toneAt(84,.25,.12,'sine',.024,55,false);}
 else if(kind==='magnet'){tone(260,.07,'triangle',.025,520);toneAt(520,.07,.12,'triangle',.028,880,false);}
 else if(kind==='defibrillatorStart'){noiseAt(0,.12,.036,520,'bandpass',false);tone(74,.16,'sine',.060,42);toneAt(240,.04,.09,'triangle',.026,620,false);}
 else if(kind==='defibrillatorPulse'){noiseAt(0,.10,.055,1500,'bandpass',false);tone(64,.13,'sine',.070,36);toneAt(360,.015,.075,'sawtooth',.022,110,false);}
}

function stopChapterBgm(){if(bgmTimer){clearInterval(bgmTimer);bgmTimer=null;}for(const n of bgmNodes.splice(0)){try{n.stop?.();}catch(_){try{n.disconnect?.();}catch(__){}}}}
function startChapterBgm(boss=false){stopChapterBgm();if(!soundEnabled)return;initAudio();if(!audioCtx)return;const drone=audioCtx.createOscillator(),g=audioCtx.createGain(),f=audioCtx.createBiquadFilter();drone.type='sine';drone.frequency.value=boss?43:36;f.type='lowpass';f.frequency.value=boss?190:135;g.gain.value=boss?.018:.011;drone.connect(f);f.connect(g);g.connect(audioMaster||audioCtx.destination);drone.start();bgmNodes.push(drone);let beat=0;bgmTimer=setInterval(()=>{if(!soundEnabled||paused||gameOver||!audioCtx)return;const seq=boss?[55,55,62,49]:[48,0,44,0,52,0,41,0],freq=seq[beat++%seq.length];if(freq)toneAt(freq,0,boss?.20:.28,'sine',boss?.018:.009,freq*.72,false);if(beat%4===0)noiseAt(0,.12,boss?.008:.004,boss?420:250,'lowpass',false);},boss?430:720);}

function addResidualDamage(amount,duration){if(amount<=0)return;player.residualDamage=(player.residualDamage||0)+amount;player.residualRate=(player.residualRate||0)+amount/Math.max(1,duration);}
function clearResidualDamage(amount){const before=player.residualDamage||0;if(before<=0||amount<=0)return 0;const cleared=Math.min(before,amount),ratio=(before-cleared)/before;player.residualDamage=before-cleared;player.residualRate=(player.residualRate||0)*ratio;if(player.residualDamage<.05){player.residualDamage=0;player.residualRate=0;}return cleared;}
function applyPlayerDamage(raw,invuln=.45){
 if(player.invuln>0||raw<=0)return false;
 let dmg=raw*player.damageTakenMult*organMods.damageTaken;
 if(player.shield>0){const absorbed=Math.min(player.shield,dmg);player.shield-=absorbed;dmg-=absorbed;}
 let immediate=dmg;
 if(dmg>0&&selectedCharacter==='residual'){
  const st=residualAbilityStats(),deferred=dmg*st.defer;immediate=dmg-deferred;let debt=deferred;
  if(st.lastStand&&player.residualLastStandCd<=0&&immediate>=player.hp){const prevented=Math.max(0,immediate-Math.max(0,player.hp-1));immediate-=prevented;debt+=prevented;player.residualLastStandCd=45;player.residualGrace=3.2;player.invuln=Math.max(player.invuln,1.15);cameraShake=Math.max(cameraShake,8);}
  addResidualDamage(debt,st.duration);
 }
 if(immediate>0)player.hp=Math.max(0,player.hp-immediate);
 player.invuln=Math.max(player.invuln,invuln+(player.invulnBonus||0));hitVignette=Math.min(.52,.28+immediate/85);cameraShake=Math.max(cameraShake,immediate>=18?6:3);sfx(immediate>=18?'hitHeavy':'hit');try{navigator.vibrate?.(immediate>=18?34:18);}catch(_){}
 if(player.hp<=0){endGame();return true;}return true;
}
function viewportSize(){const vv=window.visualViewport;return{w:Math.max(1,Math.round(vv?.width||document.documentElement.clientWidth||innerWidth)),h:Math.max(1,Math.round(vv?.height||document.documentElement.clientHeight||innerHeight))};}
function resize(force=false){const v=viewportSize(),nextDpr=Math.min(devicePixelRatio||1,1.5);if(!force&&W===v.w&&H===v.h&&Math.abs(DPR-nextDpr)<.001)return;DPR=nextDpr;W=v.w;H=v.h;document.documentElement.style.setProperty('--app-width',W+'px');document.documentElement.style.setProperty('--app-height',H+'px');canvas.width=Math.round(W*DPR);canvas.height=Math.round(H*DPR);canvas.style.width=W+'px';canvas.style.height=H+'px';ctx.setTransform(DPR,0,0,DPR,0,0);ctx.imageSmoothingEnabled=false;vignetteGradient=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*.28,W/2,H/2,Math.max(W,H)*.72);vignetteGradient.addColorStop(0,'rgba(120,0,0,0)');vignetteGradient.addColorStop(1,'rgba(190,20,30,1)');}
addEventListener('resize',()=>resize(false),{passive:true});addEventListener('orientationchange',()=>setTimeout(()=>resize(true),120),{passive:true});window.visualViewport?.addEventListener('resize',()=>resize(false),{passive:true});resize(true);

function reset(){
 recycleAllActive();
 elapsed=0;spawnTimer=0;kills=0;frameTick=0;qualityLevel=0;qualityClock=0;qualityLowStreak=0;qualityHighStreak=0;minimapClock=0;hudClock=0;debugClock=0;orbMergeClock=0;pickupAuditClock=0;runSpecimens=0;specimenPulse=0;accumulator=0;hitStopTimer=0;boneSwingSide=1;receptorSyncClock=14;attendantTarget=null;attendantRetargetClock=0;attendantTempo=0;attendantNextVulnerability=false;stitchPending=null;eventClock=125;eventCount=0;growthCount=0;currentAction=null;lastGrowthChoiceName='';broadcastTimer=0;broadcastText='';broadcastMode='normal';toastTimer=0;anomalyClock=185;anomalyCount=0;waveSerial=0;currentWave=null;lastEventHospital=null;
 waves.length=0;slashes.length=0;stitchFx.length=0;stitchGroups.length=0;incisionFx.length=0;unlockActors.length=0;bossHazards.length=0;boneShards.length=0;boneImpactFx.length=0;shockFx.length=0;leechFx.length=0;bloodWrapFx.length=0;brainLinks.length=0;landmarks.length=0;objects.length=0;zones.length=0;events.length=0;hazards.length=0;clotFields.length=0;clotCritFx.length=0;clotReleaseFx.length=0;organDrops.length=0;pickups.length=0;pickupRespawns.length=0;breaches.length=0;navGates.length=0;
 minFps=60;slowFrames=0;maxEnemies=0;maxOrbs=0;maxFrameMs=0;frameMsSum=0;frameSamples=0;hitVignette=0;
 Object.assign(player,{x:0,y:900,r:16*SCALE.player,hp:100,maxHp:100,shield:0,speed:186,xp:0,nextGrowthXp:9,invuln:0,pickup:95,moveBonus:0,pickupBonus:0,damageTakenMult:1,crit:.05,critMult:1.7,regen:0,autoBuff:0,invulnBonus:0,xpRemainder:0,facingX:1,facingY:0,adaptationSurge:0,residualDamage:0,residualRate:0,residualGrace:0,residualLastStandCd:0});
 Object.assign(camera,{x:0,y:900});Object.assign(renderCamera,{x:0,y:900});
 Object.assign(weapons.blood,{level:1,timer:0,cd:1.06,damage:12,speed:398});
 Object.assign(weapons.bone,{level:0,timer:0,cd:2.35,damage:64,range:102,arc:Math.PI,knockback:76,critKnockback:148,lift:.43,hold:.11,strike:.15,recovery:.50});
 Object.assign(weapons.heart,{level:0,timer:0,cd:2.55,damage:13,radius:95,echoChance:.25,maxEchoes:2});
 Object.assign(weapons.autophagy,{level:0,timer:0,damage:1.15,radius:28,slow:.14,trailLife:1.05,poolLife:2.4,poolRadius:52});Object.assign(weapons.stitch,{level:0,timer:0,cd:1.48,damage:18,range:430});Object.assign(weapons.incision,{level:0,timer:0,cd:2.85,damage:42,range:390,width:18,delay:.58});clotTrailClock=0;clotStillClock=0;clotLastX=player.x;clotLastY=player.y;clotHadMotion=false;clotArmed=false;clotMoveTime=0;clotMoveDistance=0;clotPrevX=player.x;clotPrevY=player.y;clotBurst=null;clotGroupSerial=0;clotCritSerial=0;bloodStreamSerial=0;enemySerial=0;defibrillatorTimer=0;defibrillatorPulseClock=0;defibrillatorAimX=1;defibrillatorAimY=0;waterReaction=0;bodyTwitch=0;
 for(const p of Object.values(passives))p.level=0;
 Object.values(weapons).forEach(w=>w.level=0);const starter=CHARACTER_DEFS[selectedCharacter]?.weapon||'blood';weapons[starter].level=1;chapterFlags={heavy:false,fast:false,swarm:false,residualSpawned:false,residualRunUnlocked:!!meta.unlockedCharacters.residual,attendantSpawned:false,attendantRunUnlocked:!!meta.unlockedCharacters.attendant,bossPrelude:false,bossStarted:false};bossState=null;bossIntroTimer=0;bossDeathTimer=0;bossCinematicAge=0;
 clearOrganState();
 generateWorld();rebuildObjectGrid();buildMinimapStatic();renderMinimap();
 running=true;paused=false;growthChoosing=false;gameOver=false;hideOverlay();renderHudIcons();renderOrganHud();updateHudDom(true);syncActionButton();
 toast('병동은 조용히 다음 절차를 기다립니다.');
}

function startGame(){startChapterRun();}

function takePool(name){return POOLS[name].pop()||{};}
function releasePool(name,o){if(!o)return;if(o.hitTargets?.clear)o.hitTargets.clear();if(o.hit?.clear)o.hit.clear();o.target=null;o.objectTarget=null;POOLS[name].push(o);}
function swapRemove(a,i){const removed=a[i],last=a.pop();if(i<a.length)a[i]=last;return removed;}
function removePooledAt(a,i,name){const o=swapRemove(a,i);releasePool(name,o);}
function recyclePooledArray(a,name){while(a.length)releasePool(name,a.pop());}
function recycleAllActive(){recyclePooledArray(enemies,'enemy');recyclePooledArray(projectiles,'projectile');recyclePooledArray(enemyShots,'enemyShot');recyclePooledArray(orbs,'orb');recyclePooledArray(organDrops,'organDrop');recyclePooledArray(pickups,'pickup');recyclePooledArray(particles,'particle');recyclePooledArray(corpses,'corpse');recyclePooledArray(deathFx,'deathFx');}
function emitParticle(x,y,vx,vy,life,size,color){const cap=qualityLevel===0?230:qualityLevel===1?165:110;if(particles.length>=cap)return null;const p=takePool('particle');Object.assign(p,{x,y,vx,vy,life,maxLife:life,size,color});particles.push(p);return p;}
function worldToScreen(x,y){const p=screenPoints[screenPointIndex++&63];p.x=x-renderCamera.x+W/2;p.y=y-renderCamera.y+H/2;return p;}
function inViewWorld(x,y,r=0,m=PERF.cullMargin){const sx=x-camera.x+W/2,sy=y-camera.y+H/2;return sx+r>-m&&sx-r<W+m&&sy+r>-m&&sy-r<H+m;}
function gridKey(cx,cy){return (cx+32768)*65536+(cy+32768);}
function clearGrid(grid,pool){for(const a of grid.values()){a.length=0;pool.push(a);}grid.clear();}
function rebuildEnemyGrid(){clearGrid(enemyGrid,enemyBucketPool);const g=PERF.gridSize;for(const e of enemies){const cx=Math.floor(e.x/g),cy=Math.floor(e.y/g),k=gridKey(cx,cy);let a=enemyGrid.get(k);if(!a){a=enemyBucketPool.pop()||[];enemyGrid.set(k,a);}a.push(e);}}
function queryEnemies(x,y,r){enemyQueryBuffer.length=0;const g=PERF.gridSize,minX=Math.floor((x-r)/g),maxX=Math.floor((x+r)/g),minY=Math.floor((y-r)/g),maxY=Math.floor((y+r)/g);for(let cy=minY;cy<=maxY;cy++)for(let cx=minX;cx<=maxX;cx++){const a=enemyGrid.get(gridKey(cx,cy));if(a)for(let i=0;i<a.length;i++)enemyQueryBuffer.push(a[i]);}return enemyQueryBuffer;}
function rebuildObjectGrid(){clearGrid(objectGrid,objectBucketPool);const g=PERF.objectGridSize;for(const o of objects){const minX=Math.floor(o.x/g),maxX=Math.floor((o.x+o.w)/g),minY=Math.floor(o.y/g),maxY=Math.floor((o.y+o.h)/g);for(let cy=minY;cy<=maxY;cy++)for(let cx=minX;cx<=maxX;cx++){const k=gridKey(cx,cy);let a=objectGrid.get(k);if(!a){a=objectBucketPool.pop()||[];objectGrid.set(k,a);}a.push(o);}}}
function queryObjects(x,y,r){objectQueryBuffer.length=0;const mark=++querySerial,g=PERF.objectGridSize,minX=Math.floor((x-r)/g),maxX=Math.floor((x+r)/g),minY=Math.floor((y-r)/g),maxY=Math.floor((y+r)/g);for(let cy=minY;cy<=maxY;cy++)for(let cx=minX;cx<=maxX;cx++){const a=objectGrid.get(gridKey(cx,cy));if(!a)continue;for(let i=0;i<a.length;i++){const o=a[i];if(o._queryMark===mark)continue;o._queryMark=mark;objectQueryBuffer.push(o);}}return objectQueryBuffer;}
function recycleEnemyOffscreen(e){const pos=edgeSpawnWorld();e.x=pos[0];e.y=pos[1];e.lastX=e.x;e.lastY=e.y;e.farTimer=0;e.stuckTimer=0;e.stuckCheck=0;e.wallBlockedTime=0;e.knockbackLock=0;e.boneLaunchAge=0;e.boneLaunchDuration=0;e.boneLaunchDistance=0;e.boneLaunchLast=0;e.boneLaunchNx=0;e.boneLaunchNy=0;e.boneLaunchCrit=false;e.boneLaunchDamage=0;e.boneLaunchTrail=0;e.phaseTimer=0;e.routeTimer=0;e.routeStage=0;e.routeNextX=e.x;e.routeNextY=e.y;e.routeGateId=null;e.routeLane=0;e.routeLaneIndex=2;e.routeAttempts=0;e.navSeed=Math.floor(Math.random()*997);e.rerouteCooldown=0;e.navCheck=Math.random()*.16;e.shockStun=0;e.clotStun=0;e.clotStunResist=0;e.clotStunPhase=0;e.wallStun=0;e.wallStunMax=0;e.wallStunPhase=0;e.wallStunAngle=0;e.clotTick=.08;e.aiPhase=frameTick%3;}
function updateAdaptiveQuality(dt){qualityClock+=dt;if(qualityClock<3.5)return;qualityClock=0;const old=qualityLevel;if(fps<45){qualityLowStreak++;qualityHighStreak=0;}else if(fps>58){qualityHighStreak++;qualityLowStreak=0;}else{qualityLowStreak=0;qualityHighStreak=0;}if(qualityLowStreak>=2){qualityLevel=Math.min(2,qualityLevel+1);qualityLowStreak=0;}else if(qualityHighStreak>=3){qualityLevel=Math.max(0,qualityLevel-1);qualityHighStreak=0;}if(old!==qualityLevel)minimapClock=99;}

function generateWorld(){
 const defs=[
  {id:'ward',name:'제1병실',x:0,y:0,w:WARD_BOUNDS.visualHalfW*2,h:WARD_BOUNDS.visualHalfH*2,tint:'#1c1818',corridor:true,mainWard:true,active:true},
  {id:'supportRecovery',name:'격리 병상',x:-1900,y:-900,w:560,h:420,tint:'#18231d',hospitalId:'supportRecovery',subzone:true},
  {id:'organHeart',name:'심전도 장비',x:-1050,y:-1050,w:500,h:350,tint:'#27171b',hospitalId:'organHeart',subzone:true},
  {id:'organBrain',name:'관찰 장비',x:-350,y:-1050,w:500,h:350,tint:'#221b27',hospitalId:'organBrain',subzone:true},
  {id:'organStomach',name:'처치 장비',x:420,y:-1050,w:500,h:350,tint:'#252216',hospitalId:'organStomach',subzone:true},
  {id:'supportTransfusion',name:'응급 처치대',x:1880,y:-890,w:560,h:420,tint:'#25191c',hospitalId:'supportTransfusion',subzone:true},
  {id:'organLockedA',name:'봉인 카트 A',x:-1250,y:1050,w:460,h:300,tint:'#17171b',hospitalId:'organLockedA',subzone:true},
  {id:'organLockedB',name:'봉인 카트 B',x:0,y:1050,w:460,h:300,tint:'#17171b',hospitalId:'organLockedB',subzone:true},
  {id:'organLockedC',name:'봉인 카트 C',x:1250,y:1050,w:460,h:300,tint:'#17171b',hospitalId:'organLockedC',subzone:true}
 ];
 activeHospitalIds=['supportRecovery','supportTransfusion'];
 zones=defs.map(z=>({...z,active:z.mainWard||activeHospitalIds.includes(z.hospitalId)}));
 hospitals=HOSPITAL_DEFS.map(d=>({...d,active:activeHospitalIds.includes(d.id),zone:zones.find(z=>z.id===d.zoneId)}));
 const add=(type,x,y,w,h,hp=1,solid=true,extra={})=>objects.push({id:Math.random(),type,x,y,w,h,hp,maxHp:hp,solid,active:true,flash:0,reveal:0,hitJolt:0,...extra});
 const addScaled=(type,x,y,w,h,hp=1,solid=true,extra={})=>{const sw=w*SCALE.object,sh=h*SCALE.object;add(type,x+(w-sw)/2,y+(h-sh)/2,sw,sh,hp,solid,extra);};
 const halfW=WARD_BOUNDS.halfW,halfH=WARD_BOUNDS.halfH,wallT=WARD_BOUNDS.wallT;
 add('wall',-halfW,-halfH,halfW*2,wallT,999,true,{zoneId:'ward',zoneActive:true,render:false,boundary:true});
 add('wall',-halfW,halfH-wallT,halfW*2,wallT,999,true,{zoneId:'ward',zoneActive:true,render:false,boundary:true});
 add('wall',-halfW,-halfH,wallT,halfH*2,999,true,{zoneId:'ward',zoneActive:true,render:false,boundary:true});
 add('wall',halfW-wallT,-halfH,wallT,halfH*2,999,true,{zoneId:'ward',zoneActive:true,render:false,boundary:true});
 add('door',-120,-halfH+2,240,34,999,false,{bossDoor:true});
 add('door',-95,halfH-31,190,29,999,false,{serviceDoor:true});
 const recovery=zones.find(z=>z.id==='supportRecovery'),transfusion=zones.find(z=>z.id==='supportTransfusion');
 [[-85,-32],[82,46]].forEach(([dx,dy])=>addScaled('medicine',recovery.x+dx-27,recovery.y+dy-22,54,44,32,true,{hospitalId:'supportRecovery'}));
 [[-88,-36],[84,48]].forEach(([dx,dy])=>addScaled('transfusionPump',transfusion.x+dx-32,transfusion.y+dy-30,64,60,58,true,{hospitalId:'supportTransfusion'}));
 const propSpecs={medicalCart:{w:46,h:34,hp:28},wasteBin:{w:32,h:34,hp:22},smallCabinet:{w:44,h:40,hp:30}};
 const addProp=(type,cx,cy)=>{const q=propSpecs[type];addScaled(type,cx-q.w/2,cy-q.h/2,q.w,q.h,q.hp,true,{breakableProp:true,damageStage:0});};
 [
  ['medicalCart',-2050,-320],['wasteBin',-1650,-1220],['smallCabinet',-1350,1190],
  ['medicalCart',-700,-1240],['wasteBin',-560,1160],['smallCabinet',300,-1230],
  ['medicalCart',820,1160],['wasteBin',1430,-1220],['smallCabinet',2050,-300],
  ['medicalCart',1940,1030],['wasteBin',-2010,1000],['smallCabinet',1690,460],
  ['wasteBin',-980,180],['medicalCart',1020,-120],['smallCabinet',90,620]
 ].forEach(v=>addProp(v[0],v[1],v[2]));
 const addMark=(type,x,y,r,rot=0,extra={})=>landmarks.push({x,y,r:r*SCALE.landmark,type,rot,...extra});
 const bedRows=[
  [-2080,-1050],[-1900,-1050],[-1720,-1050],[-1540,-1050],
  [-2070,-790],[-1890,-790],[-1710,-790],
  [-1280,-1160],[-1040,-1160],[-800,-1160],[660,-1160],[900,-1160],[1140,-1160],
  [-2040,650],[-1840,650],[-1640,650],[-1440,650],[-1080,760],[-860,760]
 ];
 bedRows.forEach(([x,y],i)=>addMark('bed',x,y,46,i%2?.03:-.03,{mapBlock:i%4===0,mapW:150,mapH:68}));
 addMark('curtain',-2200,-930,98,Math.PI/2,{mapBlock:true,mapW:18,mapH:380});
 addMark('curtain',-1600,-930,98,Math.PI/2,{mapBlock:true,mapW:18,mapH:380});
 addMark('curtain',-1900,-1250,98,0,{mapBlock:true,mapW:570,mapH:18});
 addMark('desk',1870,160,144,0,{mapBlock:true,mapW:340,mapH:96});
 addMark('screen',1725,-20,36,0);addMark('screen',2015,-20,36,0);
 addMark('table',-470,-160,48,.03,{mapBlock:true,mapW:170,mapH:72});
 addMark('table',450,170,48,-.03,{mapBlock:true,mapW:170,mapH:72});
 addMark('table',350,430,42,.02,{mapBlock:true,mapW:150,mapH:64});
 addMark('tank',2090,-890,42,0);addMark('tank',1650,-890,42,0);
 for(const [x,y] of [[-1400,1080],[0,1200],[1400,1080]])addMark('table',x,y,46,0,{mapBlock:true,mapW:170,mapH:72});
 const stains=['corpse','blood','blood','corpse','organ'];for(let i=0;i<38;i++){const x=-2180+Math.random()*4360,y=-1280+Math.random()*2560;if(Math.hypot(x,y-900)<300)continue;addMark(stains[Math.floor(Math.random()*stains.length)],x,y,15+Math.random()*25,Math.random()*Math.PI*2);}
 spawnMapPickups();
}

function minimapPoint(x,y){
 const px=MINIMAP.w/2+(x-player.x)/MINIMAP.viewW*(MINIMAP.w-MINIMAP.pad*2);
 const py=MINIMAP.h/2+(y-player.y)/MINIMAP.viewH*(MINIMAP.h-MINIMAP.pad*2);
 return{x:px,y:py};
}
function minimapRect(x,y,w,h){
 const a=minimapPoint(x,y),b=minimapPoint(x+w,y+h);return{x:a.x,y:a.y,w:Math.max(1,b.x-a.x),h:Math.max(1,b.y-a.y)};
}
function buildMinimapStatic(){
 minimapStatic.width=MINIMAP.w;minimapStatic.height=MINIMAP.h;
}
function drawMinimapBase(){
 const c=minimapCtx;c.fillStyle='#090909';c.fillRect(0,0,MINIMAP.w,MINIMAP.h);
 c.save();c.beginPath();c.rect(MINIMAP.pad,MINIMAP.pad,MINIMAP.w-MINIMAP.pad*2,MINIMAP.h-MINIMAP.pad*2);c.clip();
 const ward=zones.find(z=>z.mainWard);if(ward){const r=minimapRect(ward.x-ward.w/2,ward.y-ward.h/2,ward.w,ward.h);c.fillStyle='#252020';c.fillRect(r.x,r.y,r.w,r.h);c.strokeStyle='#745b5b';c.lineWidth=1;c.strokeRect(r.x+.5,r.y+.5,Math.max(0,r.w-1),Math.max(0,r.h-1));}
 c.fillStyle='#57504d';for(const l of landmarks){if(!l.mapBlock)continue;const w=l.mapW||l.r*2,h=l.mapH||l.r*.7,r=minimapRect(l.x-w/2,l.y-h/2,w,h);if(r.x+r.w<MINIMAP.pad||r.x>MINIMAP.w-MINIMAP.pad||r.y+r.h<MINIMAP.pad||r.y>MINIMAP.h-MINIMAP.pad)continue;c.globalAlpha=.52;c.fillRect(r.x,r.y,r.w,r.h);}c.globalAlpha=1;
 const world=minimapRect(MINIMAP.minX,MINIMAP.minY,MINIMAP.maxX-MINIMAP.minX,MINIMAP.maxY-MINIMAP.minY);c.strokeStyle='#ffffff28';c.lineWidth=.9;c.strokeRect(world.x+.5,world.y+.5,Math.max(0,world.w-1),Math.max(0,world.h-1));c.restore();
 c.strokeStyle='#ffffff33';c.strokeRect(.5,.5,MINIMAP.w-1,MINIMAP.h-1);
}

function drawHospitalMapMarker(c,h){
 const m=minimapPoint(h.zone.x,h.zone.y),available=h.available!==false,alpha=h.active?1:(available?.34:.16);c.save();c.translate(m.x,m.y);c.globalAlpha=alpha;c.fillStyle=h.color;c.strokeStyle=h.active?'#f2f2f2':available?'#888':'#555';c.lineWidth=1.1;
 if(h.role==='support'){c.fillRect(-4,-4,8,8);c.strokeRect(-4,-4,8,8);if(h.id==='supportRecovery'){c.fillStyle='#17241a';c.fillRect(-1,-3,2,6);c.fillRect(-3,-1,6,2);}else{c.fillStyle='#2a1116';c.beginPath();c.moveTo(0,-3.5);c.bezierCurveTo(3,-1,3,2.5,0,4);c.bezierCurveTo(-3,2.5,-3,-1,0,-3.5);c.fill();}}
 else if(available){c.rotate(Math.PI/4);c.fillRect(-3.8,-3.8,7.6,7.6);c.strokeRect(-3.8,-3.8,7.6,7.6);}
 else{c.strokeRect(-3.5,-3.5,7,7);c.beginPath();c.moveTo(-2,-2);c.lineTo(2,2);c.moveTo(2,-2);c.lineTo(-2,2);c.stroke();}
 c.restore();
}
function drawEventMapMarker(c,x,y,kind){
 const pulse=.5+.5*Math.sin(elapsed*7);c.save();c.translate(x,y);c.globalAlpha=.65+.35*pulse;c.strokeStyle='#fff';c.lineWidth=1.5;c.beginPath();c.arc(0,0,7+pulse*2,0,Math.PI*2);c.stroke();c.globalAlpha=1;const h=hospitalById(kind);c.fillStyle=h?h.color:'#f0d66c';c.strokeStyle='#111';c.lineWidth=1.2;c.beginPath();c.moveTo(0,-7);c.lineTo(6,5);c.lineTo(-6,5);c.closePath();c.fill();c.stroke();c.fillStyle='#111';c.fillRect(-1,-3,2,5);c.fillRect(-1,3,2,2);c.restore();
}
function eventMapPosition(target){const h=hospitalById(target.hospitalId);if(h?.zone)return{x:h.zone.x,y:h.zone.y};const cx=target.x+target.w/2,cy=target.y+target.h/2;return{x:cx,y:cy};}
function renderMinimap(){
 drawMinimapBase();for(const h of hospitals)if(h.active||events.some(e=>e.hospitalId===h.id))drawHospitalMapMarker(minimapCtx,h);
 for(const e of events){if(!e.target||!e.target.active)continue;const pos=eventMapPosition(e.target),m=minimapPoint(pos.x,pos.y);drawEventMapMarker(minimapCtx,m.x,m.y,e.hospitalId);}
 const p={x:MINIMAP.w/2,y:MINIMAP.h/2};minimapCtx.save();minimapCtx.translate(p.x,p.y);const pulse=.5+.5*Math.sin(elapsed*5);minimapCtx.globalAlpha=.3+.15*pulse;minimapCtx.strokeStyle='#fff';minimapCtx.lineWidth=1;minimapCtx.beginPath();minimapCtx.arc(0,0,7+pulse,0,Math.PI*2);minimapCtx.stroke();minimapCtx.globalAlpha=1;minimapCtx.fillStyle='#fff';minimapCtx.strokeStyle='#111';minimapCtx.lineWidth=1.3;minimapCtx.beginPath();minimapCtx.moveTo(0,-5.5);minimapCtx.lineTo(4.4,4.5);minimapCtx.lineTo(0,2.7);minimapCtx.lineTo(-4.4,4.5);minimapCtx.closePath();minimapCtx.fill();minimapCtx.stroke();minimapCtx.restore();
}
function rectCircle(o,x,y,r){const nx=Math.max(o.x,Math.min(x,o.x+o.w)),ny=Math.max(o.y,Math.min(y,o.y+o.h));return (x-nx)**2+(y-ny)**2<r*r;}
function resolveCircleRect(ent,o){if(!o.active||!o.solid||!rectCircle(o,ent.x,ent.y,ent.r))return false;const inside=ent.x>=o.x&&ent.x<=o.x+o.w&&ent.y>=o.y&&ent.y<=o.y+o.h;let nx=0,ny=0,push=0;if(inside){const L=ent.x-o.x,R=o.x+o.w-ent.x,T=ent.y-o.y,B=o.y+o.h-ent.y,m=Math.min(L,R,T,B);if(m===L){nx=-1;push=L+ent.r+.02}else if(m===R){nx=1;push=R+ent.r+.02}else if(m===T){ny=-1;push=T+ent.r+.02}else{ny=1;push=B+ent.r+.02}}else{const cx=Math.max(o.x,Math.min(ent.x,o.x+o.w)),cy=Math.max(o.y,Math.min(ent.y,o.y+o.h)),dx=ent.x-cx,dy=ent.y-cy,d=Math.hypot(dx,dy)||1;nx=dx/d;ny=dy/d;push=Math.max(0,ent.r-d+.02);}ent.x+=nx*push;ent.y+=ny*push;return{nx,ny,push};}
function segmentHitsExpandedRect(x1,y1,x2,y2,o,pad=0){const minX=o.x-pad,maxX=o.x+o.w+pad,minY=o.y-pad,maxY=o.y+o.h+pad,dx=x2-x1,dy=y2-y1;let t0=0,t1=1;for(const [p,q] of [[-dx,x1-minX],[dx,maxX-x1],[-dy,y1-minY],[dy,maxY-y1]]){if(Math.abs(p)<1e-9){if(q<0)return false;continue;}const r=q/p;if(p<0){if(r>t1)return false;if(r>t0)t0=r;}else{if(r<t0)return false;if(r<t1)t1=r;}}return true;}
function pathClearTo(x1,y1,x2,y2,r=8){for(const o of objects){if(o.active&&o.solid&&o.type==='wall'&&segmentHitsExpandedRect(x1,y1,x2,y2,o,r))return false;}return true;}
function playerApproachPoint(fromX,fromY,e){const dx=player.x-fromX,dy=player.y-fromY,d=Math.hypot(dx,dy)||1,stop=Math.min(Math.max(0,d-1),player.r+e.r+5);return{x:player.x-dx/d*stop,y:player.y-dy/d*stop};}
function pathClearToPlayerFrom(fromX,fromY,e){const p=playerApproachPoint(fromX,fromY,e);return pathClearTo(fromX,fromY,p.x,p.y,Math.max(4,e.r*.72));}
function enemyDirectPathClear(e){return pathClearToPlayerFrom(e.x,e.y,e);}
function clearEnemyRoute(e){e.routeTimer=0;e.routeStage=0;e.routeGateId=null;e.routeLane=0;e.routeAttempts=Math.max(0,(e.routeAttempts||0)-1);e.navCheck=.08;}
const NAV_LANES=[-.82,-.42,0,.42,.82];
function gateRouteLoad(g,laneIndex,exclude){let total=0,lane=0;for(const n of enemies){if(n===exclude||n.routeTimer<=0||n.routeGateId!==g.id)continue;total++;if(n.routeLaneIndex===laneIndex)lane++;}return{total,lane};}
function assignEnemyReroute(e,forceAlternate=false){let best=null,bestScore=Infinity;const clearance=Math.max(6,e.r+2);for(const g of navGates){const laneMax=Math.max(0,(g.w||76)/2-clearance-7),seed=Math.abs((e.navSeed||0)+(e.routeAttempts||0)+(g.laneCursor||0))%NAV_LANES.length;for(let laneStep=0;laneStep<NAV_LANES.length;laneStep++){const laneIndex=(seed+laneStep)%NAV_LANES.length;if(forceAlternate&&g.id===e.routeGateId&&laneIndex===e.routeLaneIndex)continue;const lane=NAV_LANES[laneIndex]*laneMax,load=gateRouteLoad(g,laneIndex,e);for(let dir=0;dir<2;dir++){let sx=dir?g.bx:g.ax,sy=dir?g.by:g.ay,tx=dir?g.ax:g.bx,ty=dir?g.ay:g.by;sx+=lane;tx+=lane;const d1=Math.hypot(sx-e.x,sy-e.y);if(!pathClearTo(e.x,e.y,sx,sy,clearance)||!pathClearTo(sx,sy,tx,ty,clearance))continue;const d2=Math.hypot(player.x-tx,player.y-ty),exitClear=pathClearToPlayerFrom(tx,ty,e),sameGate=e.routeGateId===g.id,repeat=sameGate?(laneIndex===e.routeLaneIndex?135:42):0,score=d1+d2*.52+repeat+load.total*10+load.lane*38+laneStep*2+(exitClear?-150:0);if(score<bestScore){bestScore=score;best={g,sx,sy,tx,ty,laneIndex};}}}}if(!best)return false;e.routeX=best.sx;e.routeY=best.sy;e.routeNextX=best.tx;e.routeNextY=best.ty;e.routeStage=1;e.routeGateId=best.g.id;e.routeLaneIndex=best.laneIndex;e.routeLane=NAV_LANES[best.laneIndex];e.routeAttempts=(e.routeAttempts||0)+1;e.routeTimer=7;e.rerouteCooldown=.24;best.g.laneCursor=((best.g.laneCursor||0)+1)%NAV_LANES.length;return true;}
function damageObject(o,dmg){if(!isTargetObject(o))return;o.hp-=dmg;o.flash=.18;o.hitJolt=Math.max(o.hitJolt||0,.22);cameraShake=Math.max(cameraShake,1.8);hitStopTimer=Math.max(hitStopTimer,.018);if(isBreakableProp(o)){o.reveal=Math.max(o.reveal||0,1.35);o.damageStage=o.hp<=o.maxHp*.34?2:o.hp<=o.maxHp*.68?1:0;}if(o.hp<=0)destroyObject(o);}
function damageBreakablesAround(x,y,radius,damage,hitSet=null){if(damage<=0)return 0;let hits=0;for(const o of queryObjects(x,y,radius+64)){if(!o.active||!isBreakableProp(o)||(hitSet&&hitSet.has(o)))continue;if(rectCircle(o,x,y,radius)){if(hitSet)hitSet.add(o);damageObject(o,damage);hits++;}}return hits;}
function addRewardOrbs(x,y,count,value,spread=55){for(let i=0;i<count;i++)spawnXpOrb(x+(Math.random()-.5)*spread,y+(Math.random()-.5)*spread,value);}
function setOrganWardActive(h){
 for(const ward of hospitals){if(ward.role!=='organ')continue;ward.active=ward===h;ward.zone.active=ward===h;}
 activeHospitalIds=hospitals.filter(x=>x.active).map(x=>x.id);buildMinimapStatic();renderMinimap();
}
function completeHospitalEvent(o){
 const h=hospitalById(o.hospitalId),cx=o.x+o.w/2,cy=o.y+o.h/2;
 addRewardOrbs(cx,cy,12,3,75);addRewardOrbs(cx,cy,2,10,35);
 if(h?.organSlot)spawnOrganDrop(cx,cy,h.organSlot);
 events=events.filter(e=>e.target!==o);lastEventHospital=o.hospitalId;broadcast('조금 전보다 숨쉬기 편해졌다.','eventDone');sfx('eventDone');renderMinimap();
}
function destroyObject(o){if(!o.active)return;o.active=false;o.solid=false;sfx('object');
 if(isBreakableProp(o)){const cx=o.x+o.w/2,cy=o.y+o.h/2;for(let i=0;i<(qualityLevel===2?4:8);i++)emitParticle(cx,cy,(Math.random()-.5)*150,(Math.random()-.5)*120,.34,2+Math.random()*3,o.type==='wasteBin'?'#6d7771':'#9b9184');if(Math.random()<.55)addRewardOrbs(cx,cy,1+Math.floor(Math.random()*2),1,24);if(Math.random()<.16)spawnBreakableSpecimen(cx,cy);if(Math.random()<.05)spawnBreakableMapPickup(cx,cy);return;}
 if(o.eventTarget){completeHospitalEvent(o);return;}
 if(o.type==='bloodTank')explodeTank(o);
 if(o.type==='medicine'){addRewardOrbs(o.x+o.w/2,o.y+o.h/2,6,2,35);player.hp=Math.min(player.maxHp,player.hp+20);broadcast('약장 파손 · 응급 자원 확보');toast('약장 보상 · HP +20 / 경험치 구슬 6개');}
 if(o.type==='transfusionPump'){player.hp=Math.max(1,player.hp-8);player.autoBuff=Math.max(player.autoBuff,30);addRewardOrbs(o.x+o.w/2,o.y+o.h/2,5,2,40);broadcast('수혈 장치 파손 · 혈류 과부하');toast('수혈 보상 · 공격속도 강화 30초 / HP -8');}
 renderMinimap();
}
function explodeTank(o){const cx=o.x+o.w/2,cy=o.y+o.h/2;waves.push({x:cx,y:cy,r:10,max:175,life:.5,maxLife:.5,damage:95,crit:false,hit:new Set(),objectHit:new Set(),environment:true});if(Math.hypot(player.x-cx,player.y-cy)<160)applyPlayerDamage(18,.5);broadcast('혈액탱크 폭발');toast('혈액탱크 효과 · 광역 피해 95 / 근접 시 자가 피해 18');}
function eventTargetSpec(h){
 const map={heart:{type:'eventOrganHeart',w:82,h:72,hp:145},brain:{type:'eventOrganBrain',w:86,h:74,hp:150},stomach:{type:'eventOrganStomach',w:90,h:80,hp:165}};return map[h.organSlot];
}
function spawnEventTarget(h){
 const spec=eventTargetSpec(h),z=h.zone,sw=spec.w*SCALE.object,sh=spec.h*SCALE.object,x=z.x-sw/2,y=z.y-sh/2;
 const target={id:Math.random(),type:spec.type,x,y,w:sw,h:sh,hp:spec.hp,maxHp:spec.hp,solid:true,active:true,flash:0,eventTarget:true,hospitalId:h.id};objects.push(target);rebuildObjectGrid();
 if(h.organSlot==='brain'){for(let i=0;i<7;i++){const a=i/7*Math.PI*2;spawnEnemy(i%2?'parasite':'suture',[z.x+Math.cos(a)*210,z.y+Math.sin(a)*170]);}}
 if(h.organSlot==='stomach'){for(let i=0;i<8;i++){const a=i/8*Math.PI*2;spawnEnemy(i%2?'fat':'swarm',[z.x+Math.cos(a)*225,z.y+Math.sin(a)*180]);}}
 return target;
}
function triggerEvent(h,target){events=[{hospitalId:h.id,target,label:h.eventLabel}];broadcast('주변이 혼란스러워졌다...','event');sfx('eventStart');renderMinimap();}
function broadcast(t,mode='normal'){broadcastText=t;broadcastMode=mode;broadcastTimer=(mode==='event'||mode==='eventDone')?2.6:4.2;}
function toast(t){ui.toast.textContent=t;toastTimer=4.8;ui.toast.style.opacity='1';}
function spawnWorldEvent(){
 if(eventCount>=4||elapsed<120||growthCount<4||events.length||organDrops.length)return false;
 const available=hospitals.filter(h=>h.role==='organ'&&h.available!==false&&h.organSlot);
 const missing=available.filter(h=>h.organSlot!==activeOrgan&&!organStored[h.organSlot]&&!organDrops.some(d=>d.slot===h.organSlot));
 let pool=(missing.length?missing:available).filter(h=>h.id!==lastEventHospital);if(!pool.length)pool=missing.length?missing:available;if(!pool.length)return false;
 const h=pool[Math.floor(Math.random()*pool.length)];setOrganWardActive(h);const target=spawnEventTarget(h);triggerEvent(h,target);eventCount++;return true;
}
function enemySpawnOutsideView(x,y,r=0,margin=WARD_BOUNDS.spawnViewMargin){const sx=x-camera.x+W/2,sy=y-camera.y+H/2;return sx+r<-margin||sx-r>W+margin||sy+r<-margin||sy-r>H+margin;}
function wardSpawnClamp(x,y){const inset=WARD_BOUNDS.spawnInset;return[Math.max(-WARD_BOUNDS.halfW+inset,Math.min(WARD_BOUNDS.halfW-inset,x)),Math.max(-WARD_BOUNDS.halfH+inset,Math.min(WARD_BOUNDS.halfH-inset,y))];}
function randomWardEdgeCandidate(){const minX=-WARD_BOUNDS.halfW+WARD_BOUNDS.spawnInset,maxX=WARD_BOUNDS.halfW-WARD_BOUNDS.spawnInset,minY=-WARD_BOUNDS.halfH+WARD_BOUNDS.spawnInset,maxY=WARD_BOUNDS.halfH-WARD_BOUNDS.spawnInset,side=Math.floor(Math.random()*4);if(side===0)return[minX,minY+Math.random()*(maxY-minY)];if(side===1)return[maxX,minY+Math.random()*(maxY-minY)];if(side===2)return[minX+Math.random()*(maxX-minX),minY];return[minX+Math.random()*(maxX-minX),maxY];}
function edgeSpawnWorld(){let best=null,bestScore=-Infinity;for(let i=0;i<16;i++){const q=randomWardEdgeCandidate(),dx=q[0]-player.x,dy=q[1]-player.y,d=Math.hypot(dx,dy),outside=enemySpawnOutsideView(q[0],q[1],24),score=d+(outside?4000:0)+Math.random()*180;if(outside&&d>=WARD_BOUNDS.minSpawnDistance)return q;if(score>bestScore){bestScore=score;best=q;}}return best||randomWardEdgeCandidate();}
function normalizeEnemySpawn(pos,allowVisible=false){let [x,y]=wardSpawnClamp(pos[0],pos[1]);if(allowVisible||enemySpawnOutsideView(x,y,28))return[x,y];let dx=x-camera.x,dy=y-camera.y;if(Math.hypot(dx,dy)<1){const a=Math.random()*Math.PI*2;dx=Math.cos(a);dy=Math.sin(a);}const ax=Math.abs(dx)||.001,ay=Math.abs(dy)||.001,scale=Math.min((W/2+WARD_BOUNDS.spawnViewMargin+36)/ax,(H/2+WARD_BOUNDS.spawnViewMargin+36)/ay);[x,y]=wardSpawnClamp(camera.x+dx*Math.max(1.05,scale),camera.y+dy*Math.max(1.05,scale));if(enemySpawnOutsideView(x,y,28)&&Math.hypot(x-player.x,y-player.y)>=WARD_BOUNDS.minSpawnDistance*.72)return[x,y];return edgeSpawnWorld();}
function spawnEnemy(forcedType=null,forcedPos=null,allowVisible=false){
 let type=forcedType||'patient',r=Math.random();
 if(!forcedType){
  if(elapsed<120)type='patient';
  else if(elapsed<300)type=r<.10?'fat':'patient';
  else if(elapsed<480)type=r<.10?'fat':r<.22?'suture':'patient';
  else type=r<.09?'fat':r<.20?'suture':r<.34?'swarm':'patient';
 }
 const [x,y]=normalizeEnemySpawn(forcedPos||edgeSpawnWorld(),allowVisible);
 const d={
  patient:{r:15*SCALE.enemy,hp:38,speed:70,damage:10,xp:1,color:'#76514a',knockbackMult:1},
  suture:{r:11*SCALE.enemy,hp:25,speed:103,damage:16,xp:2,color:'#99b879',knockbackMult:.9},
  fat:{r:23*SCALE.eliteEnemy,hp:118,speed:42,damage:18,xp:4,color:'#9b7566',knockbackMult:.38},
  parasite:{r:13*SCALE.eliteEnemy,hp:34,speed:54,damage:9,xp:3,color:'#9165a7',knockbackMult:.65},
  swarm:{r:8*SCALE.enemy,hp:11,speed:126,damage:5,xp:1,color:'#c08a77',knockbackMult:1.15},
  collector:{r:43,hp:2100,speed:30,damage:22,xp:0,color:'#6e514b',knockbackMult:.06}
 }[type];
 const e=takePool('enemy');Object.assign(e,d,{type,x,y,hp:d.hp,maxHp:d.hp,hitCd:0,flash:0,shootCd:2.0+Math.random()*.8,farTimer:0,stuckTimer:0,stuckCheck:0,wallBlockedTime:0,knockbackLock:0,boneLaunchAge:0,boneLaunchDuration:0,boneLaunchDistance:0,boneLaunchLast:0,boneLaunchNx:0,boneLaunchNy:0,boneLaunchCrit:false,boneLaunchDamage:0,boneLaunchTrail:0,lastX:x,lastY:y,phaseWalls:false,phaseTimer:0,anomaly:false,formationAngle:0,formationRadius:0,formationTime:0,waveId:0,wavePersistent:false,shootCharge:0,dirX:0,dirY:0,dist:9999,routeX:x,routeY:y,routeNextX:x,routeNextY:y,routeStage:0,routeTimer:0,routeGateId:null,routeLane:0,routeLaneIndex:2,routeAttempts:0,navSeed:Math.floor(Math.random()*997),rerouteCooldown:0,navCheck:Math.random()*.18,shockStun:0,clotStun:0,clotStunResist:0,clotStunPhase:Math.random()*Math.PI*2,wallStun:0,wallStunMax:0,wallStunPhase:Math.random()*Math.PI*2,wallStunAngle:0,clotTick:.08,spawnId:++enemySerial,aiPhase:Math.floor(Math.random()*3)});enemies.push(e);
}
function beginWave(label){
 const id=++waveSerial;currentWave={id,label};broadcast('비공식 라운드 · '+label);return id;
}
function spawnAnomaly(){
 if(elapsed<180||currentWave||eventCount<1||events.length)return false;
 const kind=anomalyCount%3;anomalyCount++;
 if(kind===0){
  const id=beginWave('압박 병동');toast('중장 환자들이 원형 대형으로 접근합니다');
  for(let i=0;i<14;i++){
   const a=i/14*Math.PI*2,rad=Math.max(W,H)*.60;
   spawnEnemy('fat',[player.x+Math.cos(a)*rad,player.y+Math.sin(a)*rad]);
   const e=enemies[enemies.length-1];e.hp*=2.8;e.maxHp=e.hp;e.speed*=.88;e.phaseWalls=false;e.anomaly=true;e.knockbackMult*=.55;e.color='#b58a78';e.formationAngle=a;e.formationRadius=205;e.formationTime=9;e.waveId=id;e.wavePersistent=true;
  }
 }else if(kind===1){
  const id=beginWave('감염 사수 포위');toast('원거리 감염체가 시야 안에서 포위 대형을 형성합니다');
  const count=9,rad=Math.max(210,Math.min(W,H)*.38);
  for(let i=0;i<count;i++){
   const a=i/count*Math.PI*2;
   spawnEnemy('parasite',[player.x+Math.cos(a)*rad,player.y+Math.sin(a)*rad]);
   const e=enemies[enemies.length-1];e.phaseWalls=false;e.anomaly=true;e.knockbackMult*=.55;e.waveId=id;e.wavePersistent=true;e.formationAngle=a;e.formationRadius=rad;e.formationTime=7;e.shootCd=1.3+i*.12;e.damage=7;e.hp*=1.45;e.maxHp=e.hp;
  }
 }else{
  const id=beginWave('미세 감염체 포위');toast('감염체 떼가 양쪽 부채꼴 대형으로 압축합니다');
  const base=Math.random()*Math.PI*2;
  for(let i=0;i<32;i++){
   const side=i%2?1:-1,a=base+side*(.35+(i/32)*1.15),rad=Math.max(W,H)*(.50+Math.random()*.12);
   spawnEnemy('swarm',[player.x+Math.cos(a)*rad,player.y+Math.sin(a)*rad]);
   const e=enemies[enemies.length-1];e.phaseWalls=false;e.anomaly=true;e.knockbackMult*=.55;e.waveId=id;e.wavePersistent=true;e.formationAngle=a;e.formationRadius=155;e.formationTime=6;
  }
 }
 return true;
}

function beginDialogue(name,lines,onDone){dialogueState={name,lines,index:0,onDone};paused=true;ui.dialogueName.textContent=name;ui.dialogueText.textContent=lines[0];ui.dialogueBox.classList.add('active');syncActionButton();}
function advanceDialogue(){if(!dialogueState)return;dialogueState.index++;if(dialogueState.index<dialogueState.lines.length){ui.dialogueText.textContent=dialogueState.lines[dialogueState.index];return;}const done=dialogueState.onDone;dialogueState=null;ui.dialogueBox.classList.remove('active');paused=false;done?.();syncActionButton();}
function spawnUnlockActor(kind){if(unlockActors.some(a=>a.kind===kind))return;const residual=kind==='residual';unlockActors.push({kind,x:residual?-1900:1870,y:residual?-900:145,r:18,pulse:Math.random()*6.2});if(residual)broadcast('커튼 너머에서 작은 소리가 났다.','event');else broadcast('데스크 쪽 호출 벨이 한 번 울렸다.','event');}
function completeUnlock(kind){const a=unlockActors.find(x=>x.kind===kind);if(a)unlockActors.splice(unlockActors.indexOf(a),1);meta.unlockedCharacters[kind]=true;const weapon=CHARACTER_DEFS[kind].weapon;meta.unlockedWeapons[weapon]=true;if(kind==='residual'){chapterFlags.residualRunUnlocked=true;broadcast('침대가 비었다.','eventDone');}else{chapterFlags.attendantRunUnlocked=true;broadcast('데스크가 비었다.','eventDone');}saveMeta();}
function interactUnlock(kind){if(kind==='residual')beginDialogue('미등록 개체',['조용히 해. 여기 누군가가 자고 있어.','……아니. 아무도 없네.','혼자 있으면 다시 들려. 같이 가도 될까.'],()=>completeUnlock('residual'));else beginDialogue('당직자',['미등록 환자가 확인되었습니다.','기록이 없습니다.','보호자 한 명을 확인했습니다. 이동 절차를 시작합니다.'],()=>completeUnlock('attendant'));}
function stitchCapacity(level=weapons.stitch.level){const l=Math.max(1,Math.min(8,level));return Math.min(8,4+Math.round((l-1)*4/7));}
function stitchNode(e){return{target:e,spawnId:e.spawnId,x:e.x,y:e.y};}
function liveStitchTarget(n){return n?.target&&n.target.hp>0&&n.target.spawnId===n.spawnId?n.target:null;}
function buildStitchCluster(anchor,excluded,maxCount){const radius=190+weapons.stitch.level*12,r2=radius*radius,pool=[];for(const e of queryEnemies(anchor.x,anchor.y,radius)){if(e.hp<=0||excluded.has(e)||(e.x-player.x)**2+(e.y-player.y)**2>weapons.stitch.range**2||!pathClearTo(player.x,player.y,e.x,e.y,.75))continue;const d=(e.x-anchor.x)**2+(e.y-anchor.y)**2;if(d<=r2)pool.push({e,d});}pool.sort((a,b)=>a.d-b.d);const picked=pool.slice(0,maxCount).map(q=>q.e);if(!picked.includes(anchor)&&!excluded.has(anchor))picked.unshift(anchor);return picked.slice(0,maxCount);}
function nextStitchAnchor(excluded,avoid=null){let best=null,score=Infinity;for(const e of queryEnemies(player.x,player.y,weapons.stitch.range)){if(e.hp<=0||excluded.has(e)||!pathClearTo(player.x,player.y,e.x,e.y,.75))continue;const avoidPenalty=avoid?Math.max(0,210-Math.hypot(e.x-avoid.x,e.y-avoid.y))*7:0,score0=(e.x-player.x)**2+(e.y-player.y)**2+avoidPenalty;if(score0<score){score=score0;best=e;}}return best;}
function threadStitchGroup(anchor,excluded,groupId,crit){const w=weapons.stitch,targets=buildStitchCluster(anchor,excluded,stitchCapacity()),base=(w.damage+(w.level-1)*2.7)*damageMult(),threadDamage=base*.42;for(const e of targets){excluded.add(e);e.stitchCount=Math.max(1,e.stitchCount||0);e.stitchAge=3.4;hitEnemy(e,threadDamage,e.x-player.x,e.y-player.y,false,1.4);}const nodes=targets.map(stitchNode);stitchGroups.push({id:groupId,nodes,crit,baseDamage:base});stitchFx.push({mode:'thread',originX:player.x,originY:player.y,nodes,life:.48,maxLife:.48,crit,groupId});return targets;}
function closeStitchGroups(){let hitCount=0;const ability=selectedCharacter==='residual'?characterAbilityLevel('residual'):0;for(const group of stitchGroups){const targets=group.nodes.map(liveStitchTarget).filter(Boolean);if(!targets.length)continue;let cx=0,cy=0;for(const e of targets){cx+=e.x;cy+=e.y;}cx/=targets.length;cy/=targets.length;const closeDamage=group.baseDamage*.78;for(const e of targets){const dx=cx-e.x,dy=cy-e.y,d=Math.hypot(dx,dy)||1,pull=Math.min(ability>=1?22:15,d*.18);hitEnemy(e,closeDamage,dx,dy,false,0);if(pathClearTo(e.x,e.y,e.x+dx/d*pull,e.y+dy/d*pull,Math.max(3,e.r*.55))){e.x+=dx/d*pull;e.y+=dy/d*pull;}e.shockStun=Math.max(e.shockStun||0,ability>=1?.36:.24);e.stitchCount=0;e.stitchAge=0;hitCount++;}stitchFx.push({mode:'close',nodes:group.nodes,centerX:cx,centerY:cy,life:.44,maxLife:.44,crit:group.crit,groupId:group.id});}stitchGroups.length=0;if(hitCount){cameraShake=Math.max(cameraShake,3.5);tone(88,.15,'triangle',.026,42);}return hitCount;}
function stitchCapacity(level){return [4,5,5,6,6,7,7,8][Math.max(0,Math.min(7,level-1))]||4;}
function stitchCluster(anchor,capacity,excluded=new Set()){const pool=enemies.filter(e=>e.hp>0&&!excluded.has(e)&&pathClearTo(player.x,player.y,e.x,e.y,.75)).sort((a,b)=>((a.x-anchor.x)**2+(a.y-anchor.y)**2)-((b.x-anchor.x)**2+(b.y-anchor.y)**2));return pool.filter(e=>(e.x-anchor.x)**2+(e.y-anchor.y)**2<230**2).slice(0,capacity);}
function fireStitch(){const w=weapons.stitch;if(stitchPending?.groups?.length){for(const group of stitchPending.groups){const living=group.targets.filter(e=>e.hp>0);if(!living.length)continue;const cx=living.reduce((n,e)=>n+e.x,0)/living.length,cy=living.reduce((n,e)=>n+e.y,0)/living.length,damage=(w.damage+(w.level-1)*3.2)*damageMult()*.78;for(const e of living){const dx=cx-e.x,dy=cy-e.y,l=Math.hypot(dx,dy)||1;hitEnemy(e,damage,dx,dy,false,3);e.x+=dx/l*Math.min(34,l*.22);e.y+=dy/l*Math.min(34,l*.22);e.shockStun=Math.max(e.shockStun||0,.20+w.level*.018);stitchFx.push({mode:'close',x:e.x,y:e.y,tx:cx,ty:cy,target:null,life:.34,maxLife:.34,count:1});}cameraShake=Math.max(cameraShake,3.2);tone(88,.14,'triangle',.025,46);}stitchPending=null;return;}
 const anchor=nearestEnemy(null,player.x,player.y,w.range);if(!anchor)return;const capacity=stitchCapacity(w.level),crit=rollWeaponCrit('stitch'),groups=[],used=new Set(),first=stitchCluster(anchor,capacity,used);if(first.length){groups.push({targets:first});first.forEach(e=>used.add(e));}if(crit){let secondAnchor=null,bd=Infinity;for(const e of enemies){if(e.hp<=0||used.has(e)||!pathClearTo(player.x,player.y,e.x,e.y,.75))continue;const nearestUsed=Math.min(...first.map(n=>(n.x-e.x)**2+(n.y-e.y)**2));if(nearestUsed<150**2)continue;const d=(e.x-player.x)**2+(e.y-player.y)**2;if(d<bd&&d<w.range*w.range){bd=d;secondAnchor=e;}}if(secondAnchor){const second=stitchCluster(secondAnchor,capacity,used);if(second.length)groups.push({targets:second});}}
 const damage=(w.damage+(w.level-1)*3.2)*damageMult()*.42;for(const group of groups)for(const e of group.targets){hitEnemy(e,damage,e.x-player.x,e.y-player.y,crit,1.5);stitchFx.push({mode:'thread',x:player.x,y:player.y,tx:e.x,ty:e.y,target:e,life:.32,maxLife:.32,count:1});}if(groups.length)stitchPending={groups};}
function highestHpEnemy(range){let best=null,score=-1;for(const e of queryEnemies(player.x,player.y,range)){if(e.hp<=0||!pathClearTo(player.x,player.y,e.x,e.y,.75))continue;const s=e.hp-(Math.hypot(e.x-player.x,e.y-player.y)*.05);if(s>score){score=s;best=e;}}return best;}
function segmentHitsExpandedRect(ax,ay,bx,by,o,pad=0){const minX=o.x-pad,maxX=o.x+o.w+pad,minY=o.y-pad,maxY=o.y+o.h+pad,dx=bx-ax,dy=by-ay;let t0=0,t1=1;for(const [p,q] of [[-dx,ax-minX],[dx,maxX-ax],[-dy,ay-minY],[dy,maxY-ay]]){if(Math.abs(p)<1e-8){if(q<0)return false;continue;}const r=q/p;if(p<0){if(r>t1)return false;if(r>t0)t0=r;}else{if(r<t0)return false;if(r<t1)t1=r;}}return true;}
function damageTargetsAlongSegment(ax,ay,bx,by,width,damage){let hits=0;for(const o of objects){if(!isTargetObject(o)||!o.active)continue;if(segmentHitsExpandedRect(ax,ay,bx,by,o,width*.5)){damageObject(o,damage);hits++;}}return hits;}
function fireIncision(){const w=weapons.incision,target=(selectedCharacter==='attendant'&&attendantTarget?.hp>0?attendantTarget:nearestEnemy(null,player.x,player.y,w.range));const tx=target?.x??player.x+(player.facingX||1)*w.range,ty=target?.y??player.y+(player.facingY||0)*w.range,dx=tx-player.x,dy=ty-player.y,l=Math.hypot(dx,dy)||1,ux=dx/l,uy=dy/l;incisionFx.push({x:player.x-ux*20,y:player.y-uy*20,ux,uy,len:w.range+35,width:w.width+(w.level-1)*1.1,delay:Math.max(.24,w.delay-(w.level-1)*.025),life:1.0,triggered:false,damage:(w.damage+(w.level-1)*5.5)*damageMult()});tone(410,.06,'sine',.012,250);}
function updateSpecialWeapons(dt){for(let i=stitchFx.length-1;i>=0;i--){const f=stitchFx[i];f.life-=dt;if(f.target?.hp>0){f.tx=f.target.x;f.ty=f.target.y;}if(f.life<=0)stitchFx.splice(i,1);}for(let i=incisionFx.length-1;i>=0;i--){const f=incisionFx[i];f.life-=dt;f.delay-=dt;if(!f.triggered&&f.delay<=0){f.triggered=true;const ax=f.x,ay=f.y,bx=ax+f.ux*f.len,by=ay+f.uy*f.len,hitWidth=f.width*.5;for(const e of enemies){if(e.hp<=0)continue;const rr=e.r+hitWidth;if(bloodPointSegmentDist2(e.x,e.y,ax,ay,bx,by)<=rr*rr&&pathClearTo(ax,ay,e.x,e.y,.5))hitEnemy(e,f.damage,f.ux,f.uy,false,5);}damageTargetsAlongSegment(ax,ay,bx,by,f.width,f.damage*.55);cameraShake=Math.max(cameraShake,4);noiseAt(0,.10,.025,920,'bandpass',false);}if(f.life<=0)incisionFx.splice(i,1);}}
function updateChapterTimeline(){if(!chapterFlags.heavy&&elapsed>=120){chapterFlags.heavy=true;const pos=edgeSpawnWorld();spawnEnemy('fat',pos);const e=enemies[enemies.length-1];e.hp*=1.45;e.maxHp=e.hp;}if(!chapterFlags.fast&&elapsed>=300){chapterFlags.fast=true;for(let i=0;i<3;i++)spawnEnemy('suture',edgeSpawnWorld());}if(!chapterFlags.residualSpawned&&elapsed>=420&&!meta.unlockedCharacters.residual){chapterFlags.residualSpawned=true;spawnUnlockActor('residual');}if(!chapterFlags.swarm&&elapsed>=480){chapterFlags.swarm=true;for(let i=0;i<18;i++){const a=-.65+i/17*1.3,rad=430+Math.random()*80;spawnEnemy('swarm',[player.x+Math.cos(a)*rad,player.y+Math.sin(a)*rad]);}}if(!chapterFlags.attendantSpawned&&elapsed>=510&&meta.unlockedCharacters.residual&&!meta.unlockedCharacters.attendant){chapterFlags.attendantSpawned=true;spawnUnlockActor('attendant');}if(!chapterFlags.bossPrelude&&elapsed>=870){chapterFlags.bossPrelude=true;startChapterBgm(true);}if(!chapterFlags.bossStarted&&elapsed>=900){chapterFlags.bossStarted=true;startBossIntro();}}
function startBossIntro(){for(let i=enemies.length-1;i>=0;i--)if(enemies[i].type!=='collector')removePooledAt(enemies,i,'enemy');enemyShots.length=0;bossIntroTimer=6.2;bossCinematicAge=0;document.body.classList.add('boss-cinematic');cameraShake=0;}
function spawnCollector(){const x=0,y=-1230;spawnEnemy('collector',[x,y],true);const e=enemies[enemies.length-1];Object.assign(e,{boss:true,action:'idle',actionTimer:1.1,cooldown:1.2,phase:1,chargeX:0,chargeY:0,chargeSpeed:0,phaseSignal1:false,phaseSignal2:false,recoveryChecked:false,procedureCount:0,stunTimer:0,visualDamage:0});bossState={enemy:e};}
function triggerProcedure(e){e.procedureCount++;if(meta.unlockedCharacters.attendant){e.stunTimer=Math.max(e.stunTimer,1.0);broadcast('데스크가 비었다.','eventDone');return;}const count=e.procedureCount===1?2:3;for(let i=0;i<count;i++){const a=(i/(count))*Math.PI+Math.random()*.3,bx=player.x+Math.cos(a)*420,by=player.y+Math.sin(a)*420;bossHazards.push({kind:'incision',x:bx,y:by,ux:-Math.cos(a),uy:-Math.sin(a),len:840,width:18,delay:1+i*.16,life:1.65,triggered:false,damage:14});}}
function triggerRecovery(e){e.recoveryChecked=true;if(meta.unlockedCharacters.residual){e.stunTimer=1.8;broadcast('침대가 비었다.','eventDone');return;}e.action='recover';e.actionTimer=4;e.recoverRate=e.maxHp*.06/4;broadcast('회수관이 빈 병상을 찾았다.','event');}
function chooseBossAction(e){const r=Math.random();if(e.phase>=3&&r<.26)e.action='expel';else if(r<.48)e.action='slam';else if(r<.75)e.action='charge';else e.action='tow';e.actionTimer=e.action==='slam'?.95:e.action==='charge'?.82:e.action==='expel'?1.05:.75;if(e.action==='charge'){const dx=player.x-e.x,dy=player.y-e.y,l=Math.hypot(dx,dy)||1;e.chargeX=dx/l;e.chargeY=dy/l;}if(e.action==='tow'){const dx=player.x-e.x,dy=player.y-e.y,l=Math.hypot(dx,dy)||1;e.chargeX=dx/l;e.chargeY=dy/l;}}
function updateCollector(e,dt){e.flash=Math.max(0,e.flash-dt);e.stunTimer=Math.max(0,(e.stunTimer||0)-dt);e.visualDamage=1-e.hp/e.maxHp;if(e.hp<=e.maxHp*.7&&!e.phaseSignal1){e.phaseSignal1=true;e.phase=2;triggerProcedure(e);cameraShake=7;}if(e.hp<=e.maxHp*.4&&!e.phaseSignal2){e.phaseSignal2=true;e.phase=3;triggerProcedure(e);cameraShake=9;}if(e.hp<=e.maxHp*.6&&!e.recoveryChecked)triggerRecovery(e);if(e.stunTimer>0)return;if(e.action==='recover'){e.hp=Math.min(e.maxHp,e.hp+e.recoverRate*dt);e.actionTimer-=dt;if(e.actionTimer<=0){e.action='idle';e.cooldown=1.2;}return;}if(e.action==='idle'){const dx=player.x-e.x,dy=player.y-e.y,l=Math.hypot(dx,dy)||1;if(l>170){e.x+=dx/l*e.speed*(1+e.phase*.08)*dt;e.y+=dy/l*e.speed*(1+e.phase*.08)*dt;}e.cooldown-=dt;if(e.cooldown<=0)chooseBossAction(e);return;}e.actionTimer-=dt;if(e.action==='slam'&&e.actionTimer<=0){const d=Math.hypot(player.x-e.x,player.y-e.y);if(d<165)applyPlayerDamage(d<92?28:11,.65);waves.push({x:e.x,y:e.y,r:12,max:175,life:.45,maxLife:.45,damage:0,crit:false,hit:new Set(),objectHit:new Set(),environment:true});e.action='idle';e.cooldown=1.2;cameraShake=8;}else if(e.action==='charge'){if(e.actionTimer<=0){e.action='charging';e.actionTimer=e.phase>=2?.72:.58;e.chargeSpeed=e.phase>=2?610:540;}}else if(e.action==='charging'){e.x+=e.chargeX*e.chargeSpeed*dt;e.y+=e.chargeY*e.chargeSpeed*dt;const d=Math.hypot(player.x-e.x,player.y-e.y);if(d<player.r+e.r+8)applyPlayerDamage(24,.75);e.actionTimer-=dt;if(e.actionTimer<=0){e.action='idle';e.cooldown=1.35;e.stunTimer=.75;}}else if(e.action==='expel'&&e.actionTimer<=0){const count=e.phase>=3?10:7;for(let i=0;i<count;i++){const a=i/count*Math.PI*2;spawnEnemy('swarm',[e.x+Math.cos(a)*55,e.y+Math.sin(a)*38],true);const n=enemies[enemies.length-1];n.wavePersistent=true;}e.action='idle';e.cooldown=1.8;}else if(e.action==='tow'){if(e.actionTimer<=0){const dx=e.x-player.x,dy=e.y-player.y,l=Math.hypot(dx,dy)||1;if(l<410){player.x+=dx/l*52;player.y+=dy/l*52;}e.action='idle';e.cooldown=.85;}}}
function beginBossDeath(e){if(bossDeathTimer>0)return;bossDeathTimer=6.8;bossCinematicAge=0;document.body.classList.add('boss-cinematic');const i=enemies.indexOf(e);if(i>=0){swapRemove(enemies,i);releasePool('enemy',e);}bossState=null;enemyShots.length=0;}
function updateBossCinematics(dt){if(bossIntroTimer>0){bossIntroTimer=Math.max(0,bossIntroTimer-dt);bossCinematicAge+=dt;camera.x+=(0-camera.x)*Math.min(1,dt*1.35);camera.y+=(-1320-camera.y)*Math.min(1,dt*1.35);cameraShake=bossCinematicAge>2.3&&bossCinematicAge<4.3?5:1;if(bossIntroTimer<=0){spawnCollector();document.body.classList.remove('boss-cinematic');camera.x=player.x;camera.y=player.y;}return true;}if(bossDeathTimer>0){bossDeathTimer=Math.max(0,bossDeathTimer-dt);bossCinematicAge+=dt;cameraShake=Math.max(0,8-bossCinematicAge*1.1);if(bossDeathTimer<=0){document.body.classList.remove('boss-cinematic');creditSpecimens(250);meta.bossKills++;meta.chapterOneCleared=true;saveMeta();endGame(true,'boss-defeated');}return true;}return false;}
function updateBossHazards(dt){for(let i=bossHazards.length-1;i>=0;i--){const h=bossHazards[i];h.life-=dt;h.delay-=dt;if(!h.triggered&&h.delay<=0){h.triggered=true;const ax=h.x,ay=h.y,bx=ax+h.ux*h.len,by=ay+h.uy*h.len;if(bloodPointSegmentDist2(player.x,player.y,ax,ay,bx,by)<(player.r+h.width)**2)applyPlayerDamage(h.damage,.55);noiseAt(0,.09,.020,900,'bandpass',false);cameraShake=Math.max(cameraShake,3);}if(h.life<=0)bossHazards.splice(i,1);}}

function nearestEnemy(exclude=null,fromX=player.x,fromY=player.y,maxDist=Infinity){
 let n=null,bd=maxDist*maxDist;
 const source=Number.isFinite(maxDist)?queryEnemies(fromX,fromY,maxDist):enemies;for(const e of source){if(e===exclude||e.hp<=0)continue;const dx=e.x-fromX,dy=e.y-fromY,d=dx*dx+dy*dy;if(d>=bd||!pathClearTo(fromX,fromY,e.x,e.y,.75))continue;bd=d;n=e;}
 return n;
}
function nearestTarget(fromX=player.x,fromY=player.y){
 const enemy=nearestEnemy(null,fromX,fromY,390);if(enemy)return{kind:'enemy',target:enemy,x:enemy.x,y:enemy.y};
 let bestObj=null,bd=235*235;for(const o of objects){if(!isTargetObject(o))continue;const ox=o.x+o.w/2,oy=o.y+o.h/2,d=(ox-fromX)**2+(oy-fromY)**2,priority=o.eventTarget?.62:isBreakableProp(o)?1.18:1;if(d*priority>=bd||!pathClearTo(fromX,fromY,ox,oy,.75))continue;bd=d*priority;bestObj=o;}
 if(bestObj)return{kind:'object',target:bestObj,x:bestObj.x+bestObj.w/2,y:bestObj.y+bestObj.h/2};return null;
}

function characterAbilityLevel(key=selectedCharacter){return Math.max(0,Math.min(10,meta.abilityLevels[key]||0));}
function activeWeaponCount(){return Object.values(weapons).reduce((n,w)=>n+(w.level>0?1:0),0);}
function specimenAbilityStats(){const lv=characterAbilityLevel('specimen'),per=[.015,.020,.025,.025,.030,.030,.035,.040,.040,.045,.050][lv],cap=[.12,.14,.16,.18,.19,.20,.22,.24,.25,.27,.30][lv];return{lv,per,cap,surge:lv>=3?(lv>=8?18:12):0,surgeSpeed:lv>=10?1.30:1.20,damage:lv>=5&&activeWeaponCount()>=4?.08:0,perDamage:lv>=6?.015:0,surgeDamage:lv>=8?.12:0,crit:lv>=9&&activeWeaponCount()>=5?.06:0,sync:lv>=10};}
function residualAbilityStats(){const lv=characterAbilityLevel('residual');return{lv,defer:[.22,.24,.24,.26,.26,.28,.30,.30,.32,.34,.36][lv],duration:lv>=2?7.2:5.6,killFlat:lv>=1?2:1,killPct:lv>=8?.26:lv>=3?.18:.10,move:lv>=4?.06:0,eliteMult:lv>=5?2.2:1,damage:lv>=7?.08:0,lastStand:lv>=10};}
function attendantAbilityStats(){const lv=characterAbilityLevel('attendant');return{lv,damage:[1.08,1.10,1.10,1.12,1.12,1.12,1.16,1.16,1.18,1.20,1.24][lv],retarget:lv>=2?.35:.75,specialPriority:lv>=3,control:lv>=4?1.22:1,tempo:lv>=5?(lv>=9?1.28:1.18):1,tempoTime:lv>=10?6:4,cooldownPull:lv>=10?.40:lv>=7?.15:0,nextVulnerable:lv>=8};}
function characterCritBonus(){return selectedCharacter==='specimen'?specimenAbilityStats().crit:0;}
function specimenAdaptationMult(){if(selectedCharacter!=='specimen')return 1;const st=specimenAbilityStats(),extra=Math.max(0,activeWeaponCount()-1),base=1+Math.min(st.cap,extra*st.per),surge=player.adaptationSurge>0?st.surgeSpeed:1;return base*surge;}
function specimenDamageMult(){if(selectedCharacter!=='specimen')return 1;const st=specimenAbilityStats(),extra=Math.max(0,activeWeaponCount()-1),adapt=st.damage+Math.min(.075,extra*st.perDamage)+(player.adaptationSurge>0?st.surgeDamage:0);return 1+adapt;}
function residualDamageMult(){return selectedCharacter==='residual'&&player.residualDamage>0?1+residualAbilityStats().damage:1;}
function atkSpeedMult(){const attendant=selectedCharacter==='attendant'&&attendantTempo>0?attendantAbilityStats().tempo:1;return (1+passives.flow.level*.04)*(1+passives.overload.level*.09)*(player.autoBuff>0?1.4:1)*organMods.attackSpeed*specimenAdaptationMult()*attendant;}
function damageMult(){return organMods.damage*specimenDamageMult()*residualDamageMult();}
function attendantTargetDamageMult(e){if(selectedCharacter!=='attendant'||!e||e!==attendantTarget)return 1;return attendantAbilityStats().damage*((e.attendantVulnerable||0)>0?1.10:1);}
function onWeaponAcquired(key){if(selectedCharacter!=='specimen')return;const st=specimenAbilityStats();if(st.surge>0)player.adaptationSurge=Math.max(player.adaptationSurge||0,st.surge);if(st.sync){for(const w of Object.values(weapons))if(w.level>0)w.timer=0;receptorSyncClock=14;}bodyTwitch=Math.max(bodyTwitch,.14);}
function grantWeaponLevel(key){const w=weapons[key],was=w.level;w.level=Math.min(8,w.level+1);if(was===0&&w.level===1)onWeaponAcquired(key);}
function enemyDangerScore(e,level){const dist=Math.hypot(e.x-player.x,e.y-player.y),special=(e.anomaly?360:0)+(e.type==='collector'?1200:e.type==='fat'?160:e.type==='parasite'?100:0);return e.maxHp*1.15+e.damage*8+e.speed*.10-dist*.035+(level>=3?special:special*.55);}
function updateAttendantTarget(dt){if(selectedCharacter!=='attendant'){attendantTarget=null;attendantNextVulnerability=false;return;}attendantRetargetClock-=dt;const invalid=!attendantTarget||attendantTarget.hp<=0||!enemies.includes(attendantTarget)||!inViewWorld(attendantTarget.x,attendantTarget.y,attendantTarget.r,90);if(invalid||attendantRetargetClock<=0){let best=null,score=-Infinity,lv=characterAbilityLevel('attendant');for(const e of enemies){if(e.hp<=0||!inViewWorld(e.x,e.y,e.r,100))continue;const s=enemyDangerScore(e,lv);if(s>score){score=s;best=e;}}if(best&&best!==attendantTarget&&attendantNextVulnerability){best.attendantVulnerable=Math.max(best.attendantVulnerable||0,6);attendantNextVulnerability=false;}attendantTarget=best;attendantRetargetClock=attendantAbilityStats().retarget;}}
function onAttendantMarkedKill(e){if(selectedCharacter!=='attendant'||e!==attendantTarget)return;const st=attendantAbilityStats();if(st.tempo>1)attendantTempo=Math.max(attendantTempo,st.tempoTime);if(st.cooldownPull>0)for(const w of Object.values(weapons))if(w.level>0)w.timer=Math.max(0,w.timer*(1-st.cooldownPull));if(st.nextVulnerable)attendantNextVulnerability=true;attendantTarget=null;attendantRetargetClock=0;}
function onResidualKill(e){if(selectedCharacter!=='residual'||player.residualDamage<=0)return;const st=residualAbilityStats(),elite=e.maxHp>=80||e.anomaly||e.type==='fat'||e.type==='collector',amount=(st.killFlat+player.residualDamage*st.killPct)*(elite?st.eliteMult:1);clearResidualDamage(amount);}
function updateCharacterAbilities(dt){player.adaptationSurge=Math.max(0,(player.adaptationSurge||0)-dt);attendantTempo=Math.max(0,attendantTempo-dt);updateAttendantTarget(dt);if(selectedCharacter==='specimen'&&specimenAbilityStats().sync){receptorSyncClock-=dt;if(receptorSyncClock<=0){for(const w of Object.values(weapons))if(w.level>0)w.timer=0;receptorSyncClock=14;organRings.push({slot:'heart',x:player.x,y:player.y,r:8,max:115,life:.42,maxLife:.42});bodyTwitch=Math.max(bodyTwitch,.16);}}if(selectedCharacter==='residual'){player.residualLastStandCd=Math.max(0,(player.residualLastStandCd||0)-dt);player.residualGrace=Math.max(0,(player.residualGrace||0)-dt);if(player.residualDamage>0&&player.residualGrace<=0){const tick=Math.min(player.residualDamage,Math.max(.45,player.residualRate||0)*dt);player.residualDamage-=tick;player.hp=Math.max(0,player.hp-tick);if(player.residualDamage<=.05){player.residualDamage=0;player.residualRate=0;}if(player.hp<=0){endGame();return true;}}}return false;}
// 치명타는 공통 배율이 아니라 무기별 현상으로 발현한다. 심장박동은 강한 첫 박동과 더 강한 연쇄 박동으로 해석한다.
const WEAPON_CRIT_PROFILES={
 blood:{mode:'structure',event:'branch',damageMultiplier:1.08,enabled:true},
 bone:{mode:'impact',event:'fracture',damageMultiplier:1.25,enabled:true},
 heart:{mode:'time',event:'echo',damageMultiplier:1.20,enabled:true},
 autophagy:{mode:'state',event:'coagulationSpasm',damageMultiplier:1,enabled:true},
 stitch:{mode:'structure',event:'doubleCluster',damageMultiplier:1,enabled:true}
};
function rollWeaponDamage(kind,base,allowCrit=true){
 const crit=allowCrit&&Math.random()<Math.min(.85,player.crit+organMods.crit+characterCritBonus()),profile=WEAPON_CRIT_PROFILES[kind];
 const critMult=crit?(Number.isFinite(profile?.damageMultiplier)?profile.damageMultiplier:player.critMult):1;
 return {value:base*damageMult()*critMult,crit,manifestation:crit?(profile?.event||'damage'):null};
}
function rollWeaponCrit(kind){
 const profile=WEAPON_CRIT_PROFILES[kind];
 return !!(profile?.enabled&&Math.random()<Math.min(.85,player.crit+organMods.crit+characterCritBonus()));
}
function resolveWeaponCrit(kind,context){
 const profile=WEAPON_CRIT_PROFILES[kind];
 if(!context?.crit||!profile?.enabled)return false;
 if(kind==='blood'&&profile.event==='branch')return spawnBloodCritBranches(context);
 if(kind==='autophagy'&&profile.event==='coagulationSpasm')return triggerThrombosisCrit(context);
 return false;
}
function bloodStreamStats(level=weapons.blood.level){
 const l=Math.max(1,Math.min(8,level));
 return{damage:weapons.blood.damage*(1+.13*(l-1)),speed:weapons.blood.speed+4*(l-1),life:1.02+.09*(l-1),width:(5.25+.82*(l-1))*SCALE.projectile,maxNodes:12+2*(l-1),spacing:12.5,targetRange:430+30*(l-1),turnRate:4.65+.31*(l-1),wobble:64+4.6*(l-1),bodyFollow:4.4+.18*(l-1),cooldown:Math.max(.73,weapons.blood.cd-.047*(l-1))};
}
function bloodPointSegmentDist2(px,py,ax,ay,bx,by){const dx=bx-ax,dy=by-ay,l2=dx*dx+dy*dy;if(l2<1e-8)return(px-ax)**2+(py-ay)**2;const t=Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/l2)),qx=ax+dx*t,qy=ay+dy*t;return(px-qx)**2+(py-qy)**2;}
function nearestBloodTarget(p){let best=null,bd=p.targetRange*p.targetRange;for(const e of enemies){if(e.hp<=0||p.hitTargets.has(e))continue;const d=(e.x-p.x)**2+(e.y-p.y)**2;if(d>=bd||!pathClearTo(p.x,p.y,e.x,e.y,.75))continue;bd=d;best=e;}return best;}
function pushBloodPathNode(p,x,y){const count=Math.min(p.pathCount,p.maxNodes-1);if(count>1)p.path.copyWithin(4,2,2+count*2);p.path[2]=x;p.path[3]=y;p.pathCount=Math.min(p.maxNodes,p.pathCount+1);}
function relaxBloodPath(p,dt){
 const follow=Math.min(1,dt*(p.bodyFollow||4.5)),spacing=p.nodeSpacing;
 for(let n=1;n<p.pathCount;n++){
  const pi=(n-1)*2,i=n*2,px=p.path[pi],py=p.path[pi+1],x=p.path[i],y=p.path[i+1],dx=x-px,dy=y-py,d=Math.hypot(dx,dy)||1;
  const desiredX=px+dx/d*spacing,desiredY=py+dy/d*spacing,lag=follow*(1-Math.min(.55,n/Math.max(2,p.pathCount)*.24));
  p.path[i]+=(desiredX-x)*lag;p.path[i+1]+=(desiredY-y)*lag;
 }
}
function createBloodStream(x,y,aimX,aimY,target,objectTarget,st,damage,options={}){
 const dx=aimX-x,dy=aimY-y,l=Math.hypot(dx,dy)||1,speed=st.speed*(options.speedMult||1),p=takePool('projectile');
 p.hitTargets=p.hitTargets||new Set();p.hitTargets.clear();p.objectHits=p.objectHits||new Set();p.objectHits.clear();
 if(options.inheritHits)for(const h of options.inheritHits)p.hitTargets.add(h);
 if(options.inheritObjectHits)for(const h of options.inheritObjectHits)p.objectHits.add(h);
 p.path=p.path instanceof Float32Array&&p.path.length>=64?p.path:new Float32Array(64);p.path.fill(0);
 p.path[0]=x;p.path[1]=y;p.path[2]=x-dx/l*4;p.path[3]=y-dy/l*4;
 Object.assign(p,{kind:'blood',streamId:++bloodStreamSerial,parentStreamId:options.parentStreamId||0,isBranch:!!options.isBranch,allowCrit:options.allowCrit!==false,manifestationReady:!!options.crit&&!options.isBranch,manifested:false,critSource:!!options.critSource,x,y,vx:dx/l*speed,vy:dy/l*speed,nominalSpeed:speed,r:st.width*(options.widthMult||1),damage,crit:!!options.crit,life:st.life*(options.lifeMult||1),maxLife:st.life*(options.lifeMult||1),target:target||null,objectTarget:objectTarget||null,age:0,phase:Math.random()*Math.PI*2,writhe:Math.random()<.5?-1:1,lastX:x,lastY:y,pathCount:2,maxNodes:Math.max(6,Math.floor(st.maxNodes*(options.nodeMult||1))),nodeSpacing:st.spacing*(options.spacingMult||1),targetRange:st.targetRange*(options.rangeMult||1),turnRate:st.turnRate*(options.turnMult||1),wobble:st.wobble*(options.wobbleMult||1),bodyFollow:st.bodyFollow*(options.followMult||1),steerClock:.07+Math.random()*.12,steerBias:(Math.random()*2-1)*st.wobble*.48,hesitationClock:.14+Math.random()*.24,hesitation:1,crawlPhase:Math.random()*Math.PI*2,retractClock:.03,hitClock:0,blocked:false});
 projectiles.push(p);return p;
}
function bloodBranchTargets(source,x,y,count){
 const range=285+weapons.blood.level*18,r2=range*range,pool=[];
 for(const e of enemies){if(e.hp<=0||source.hitTargets.has(e))continue;const d=(e.x-x)**2+(e.y-y)**2;if(d<=r2&&pathClearTo(x,y,e.x,e.y,.75))pool.push({e,score:d*(.82+Math.random()*.42)});}
 pool.sort((a,b)=>a.score-b.score);const result=[];
 while(pool.length&&result.length<count){const pick=pool.splice(Math.floor(Math.random()*Math.min(4,pool.length)),1)[0].e;if(!result.includes(pick))result.push(pick);}
 return result;
}
function spawnBloodCritBranches(context){
 const source=context.projectile;if(!source||source.manifested||source.isBranch)return false;source.manifested=true;
 const st=bloodStreamStats(weapons.blood.level),targets=bloodBranchTargets(source,context.x,context.y,2),baseAngle=Math.atan2(context.dirY||source.vy,context.dirX||source.vx),count=Math.max(1,Math.min(2,targets.length||2));
 for(let i=0;i<count;i++){
  const target=targets[i]||null,side=i%2===0?-1:1,angle=target?Math.atan2(target.y-context.y,target.x-context.x):baseAngle+side*(.68+Math.random()*.48),aimDist=90;
  createBloodStream(context.x,context.y,target?.x??context.x+Math.cos(angle)*aimDist,target?.y??context.y+Math.sin(angle)*aimDist,target,null,{...st,width:st.width*.58,life:.54+.026*weapons.blood.level,maxNodes:8+Math.floor(weapons.blood.level*.55),spacing:10,targetRange:300+weapons.blood.level*18,turnRate:st.turnRate*1.34,wobble:st.wobble*1.38,bodyFollow:st.bodyFollow*1.18},source.damage*.52,{isBranch:true,allowCrit:false,crit:false,critSource:true,parentStreamId:source.streamId,speedMult:.86,inheritHits:source.hitTargets,inheritObjectHits:source.objectHits});
 }
 const burstCount=qualityLevel===2?5:9;for(let i=0;i<burstCount;i++){const a=baseAngle+(Math.random()-.5)*1.9,sp=45+Math.random()*115;emitParticle(context.x,context.y,Math.cos(a)*sp,Math.sin(a)*sp,.28,1.5+Math.random()*2.2,'#d93850');}
 sfx('bloodBranch');return true;
}
function fireBlood(){
 const w=weapons.blood,targetInfo=nearestTarget();if(!targetInfo)return;sfx('bloodFire');
 const st=bloodStreamStats(w.level),target=targetInfo.target,dmg=rollWeaponDamage('blood',st.damage);
 createBloodStream(player.x,player.y,targetInfo.x,targetInfo.y,targetInfo.kind==='enemy'?target:null,targetInfo.kind==='object'?target:null,st,dmg.value,{crit:dmg.crit,allowCrit:true});
}

function boneSwingStats(){const w=weapons.bone,l=Math.max(1,w.level);return{damage:w.damage*(1+.15*(l-1)),range:w.range+7*(l-1),arc:Math.PI,innerRatio:0,knockback:w.knockback+4.5*(l-1),critKnockback:w.critKnockback+8*(l-1),lift:Math.max(.31,w.lift-.005*(l-1)),hold:w.hold,strike:w.strike,recovery:Math.max(.35,w.recovery-.006*(l-1)),fragments:7+Math.floor((l-1)/2),critFragments:13+Math.floor((l-1)*.75)};}
function fireBone(){
 const ti=nearestTarget();if(!ti)return;const dx=ti.x-player.x,dy=ti.y-player.y,l=Math.hypot(dx,dy)||1,st=boneSwingStats(),dmg=rollWeaponDamage('bone',st.damage),duration=st.lift+st.hold+st.strike+st.recovery,side=boneSwingSide;boneSwingSide*=-1;
 slashes.push({kind:'fracture',x:player.x,y:player.y,ux:dx/l,uy:dy/l,target:ti.target,targetKind:ti.kind,age:0,life:duration,maxLife:duration,lift:st.lift,hold:st.hold,strike:st.strike,recovery:st.recovery,impactQ:.91,impactAt:st.lift+st.hold+st.strike*.91,lockAt:st.lift*.78,side,impacted:false,crit:dmg.crit,damage:dmg.value,range:st.range,arc:st.arc,innerRatio:st.innerRatio,knockback:st.knockback,critKnockback:st.critKnockback,fragments:st.fragments,critFragments:st.critFragments});sfx('boneFire');
}
function spawnBoneFragments(x,y,angle,count,crit){
 const cap=qualityLevel===2?36:60;while(boneShards.length+count>cap)boneShards.shift();for(let i=0;i<count;i++){const lane=i/(Math.max(1,count-1))-.5,spread=lane*(crit?3.05:2.35)+(Math.random()-.5)*.42,a=angle+spread,sp=(crit?275:210)*(.68+Math.random()*.58),r=(crit?4.2:3.45)*(.82+Math.random()*.35),life=(crit?.82:.64)*(.84+Math.random()*.24);boneShards.push({x:x+(Math.random()-.5)*8,y:y+(Math.random()-.5)*8,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,r,life,maxLife:life,crit,shape:i%3,rot:a+(Math.random()-.5)*.7,spin:(Math.random()-.5)*(crit?22:17)});}}
function boneWallStunDuration(e,crit){
 const base=e.anomaly?.34:(e.type==='fat'||e.maxHp>=80)?.58:.82;return base+(crit?.12:0);
}
function triggerBoneWallImpact(e,nx,ny,crit,damage){
 const wallBonus=((crit?11:4)+damage*(crit?.18:.07))*attendantTargetDamageMult(e),stun=boneWallStunDuration(e,crit),wallAngle=Math.atan2(ny,nx);e.hp-=wallBonus;
 e.wallStun=Math.max(e.wallStun||0,stun);e.wallStunMax=Math.max(e.wallStunMax||0,stun);e.wallStunPhase=Math.random()*Math.PI*2;e.wallStunAngle=wallAngle;e.routeTimer=0;e.routeStage=0;e.knockbackLock=Math.max(e.knockbackLock||0,stun);
 boneImpactFx.push({x:e.x,y:e.y,r:e.r+18,life:crit?.40:.30,maxLife:crit?.40:.30,crit,wall:true,angle:wallAngle});spawnBoneFragments(e.x,e.y,wallAngle+Math.PI,crit?9:5,crit);
 for(let i=0;i<(crit?14:8);i++){const a=wallAngle+Math.PI+(Math.random()-.5)*1.65,sp=55+Math.random()*165;emitParticle(e.x,e.y,Math.cos(a)*sp,Math.sin(a)*sp,.34,1.8+Math.random()*3.2,crit?'#f0dfbd':'#b9a78b');}
 cameraShake=Math.max(cameraShake,crit?8:5);sfx('boneHit');
}
function startEnemyBoneLaunch(e,nx,ny,force,crit,damage,minTravel=0){
 const mult=e.knockbackMult??1,effectiveMult=Math.max(.52,mult),distance=Math.max(22,minTravel,force*effectiveMult),duration=crit?.245:.205;
 e.boneLaunchAge=0;e.boneLaunchDuration=duration;e.boneLaunchDistance=distance;e.boneLaunchLast=0;e.boneLaunchNx=nx;e.boneLaunchNy=ny;e.boneLaunchCrit=crit;e.boneLaunchDamage=damage;e.boneLaunchTrail=0;
 e.wallStun=0;e.wallStunMax=0;e.knockbackLock=Math.max(e.knockbackLock||0,duration+.08);e.routeTimer=0;e.routeStage=0;e.stuckTimer=0;
 if(crit){let checked=0;for(const n of queryEnemies(e.x,e.y,e.r+48)){if(n===e||n.hp<=0||checked++>8)continue;const dx=n.x-e.x,dy=n.y-e.y,d=Math.hypot(dx,dy)||1,min=e.r+n.r+7;if(d<min){n.hp-=6+damage*.10;n.flash=Math.max(n.flash,.10);n.shockStun=Math.max(n.shockStun||0,.18);n.x+=dx/d*8*(n.knockbackMult??1);n.y+=dy/d*8*(n.knockbackMult??1);}}}
}
function updateEnemyBoneLaunch(e,dt){
 if(!(e.boneLaunchDuration>0))return false;
 const oldQ=Math.min(1,(e.boneLaunchAge||0)/e.boneLaunchDuration);e.boneLaunchAge+=dt;const q=Math.min(1,e.boneLaunchAge/e.boneLaunchDuration),ease=t=>1-Math.pow(1-t,3),step=e.boneLaunchDistance*(ease(q)-ease(oldQ)),nx=e.boneLaunchNx||0,ny=e.boneLaunchNy||0;
 const tx=e.x+nx*step,ty=e.y+ny*step;let wall=false;for(const o of queryObjects(tx,ty,e.r+38)){if(o.active&&o.solid&&rectCircle(o,tx,ty,e.r)){wall=true;break;}}
 if(wall){triggerBoneWallImpact(e,nx,ny,!!e.boneLaunchCrit,e.boneLaunchDamage||0);e.boneLaunchDuration=0;e.boneLaunchAge=0;return true;}
 e.x=tx;e.y=ty;e.flash=Math.max(e.flash,.055);e.boneLaunchTrail=(e.boneLaunchTrail||0)-dt;if(e.boneLaunchTrail<=0){e.boneLaunchTrail=.035;emitParticle(e.x-nx*e.r*.72,e.y-ny*e.r*.72,-nx*(32+Math.random()*46)+(Math.random()-.5)*28,-ny*(32+Math.random()*46)+(Math.random()-.5)*28,.18,1.5+Math.random()*1.6,e.boneLaunchCrit?'#e6d3b4':'#9f8970');}
 if(q>=1){e.boneLaunchDuration=0;e.boneLaunchAge=0;}return true;
}
function resolveBoneSwing(a){
 const half=Math.PI/2,cosHalf=0,outerPadding=12,angle=Math.atan2(a.uy,a.ux),hitEnemies=[],hitObjects=[];let impactX=player.x+a.ux*a.range*.62,impactY=player.y+a.uy*a.range*.62;
 for(const e of queryEnemies(player.x+a.ux*a.range*.42,player.y+a.uy*a.range*.42,a.range*.82+48)){if(e.hp<=0)continue;const rx=e.x-player.x,ry=e.y-player.y,d=Math.hypot(rx,ry)||1;if(d>a.range+e.r||(rx/d*a.ux+ry/d*a.uy)<cosHalf||!pathClearTo(player.x,player.y,e.x,e.y,.75))continue;const impactDamage=a.damage*(e.type==='fat'?1.35:1)*attendantTargetDamageMult(e);e.hp-=impactDamage;e.flash=Math.max(e.flash,.16);const nx=rx/d,ny=ry/d,force=a.crit?a.critKnockback:a.knockback,minTravel=Math.max(0,a.range+outerPadding+e.r*.18-d);startEnemyBoneLaunch(e,nx,ny,force,a.crit,impactDamage,minTravel);hitEnemies.push(e);impactX=e.x;impactY=e.y;for(let i=0;i<(a.crit?18:11);i++){const pa=Math.atan2(ny,nx)+(Math.random()-.5)*2.35,sp=60+Math.random()*(a.crit?235:165);emitParticle(e.x,e.y,Math.cos(pa)*sp,Math.sin(pa)*sp,a.crit?.48:.36,(a.crit?3.2:2.3)+Math.random()*3.5,a.crit?'#f3e5ca':i%3===0?'#d8c8aa':'#aa9678');}}
 for(const o of queryObjects(player.x+a.ux*a.range*.46,player.y+a.uy*a.range*.46,a.range*.84+70)){if(!isTargetObject(o))continue;const cx=o.x+o.w/2,cy=o.y+o.h/2,ox=cx-player.x,oy=cy-player.y,d=Math.hypot(ox,oy)||1;if(d>a.range+Math.max(o.w,o.h)/2||(ox/d*a.ux+oy/d*a.uy)<cosHalf||!pathClearTo(player.x,player.y,cx,cy,.75))continue;damageObject(o,a.damage*(a.crit?1.12:.92));hitObjects.push(o);impactX=cx;impactY=cy;}
 const hitSomething=hitEnemies.length||hitObjects.length;if(hitSomething){spawnBoneFragments(impactX,impactY,angle,a.crit?a.critFragments:a.fragments,a.crit);boneImpactFx.push({x:impactX,y:impactY,r:a.crit?50:36,life:a.crit?.46:.34,maxLife:a.crit?.46:.34,crit:a.crit,wall:false,angle,smash:true});hitStopTimer=Math.max(hitStopTimer,a.crit?.078:.060);bodyTwitch=Math.max(bodyTwitch,a.crit?.23:.15);cameraShake=Math.max(cameraShake,a.crit?11:7.5);sfx('boneHit');try{navigator.vibrate?.(a.crit?38:26);}catch(_){}}else{boneImpactFx.push({x:impactX,y:impactY,r:22,life:.20,maxLife:.20,crit:false,wall:false,angle,miss:true});}
}

function makeHeartWave(damage,crit,echoDepth=0,delay=0){
 const w=weapons.heart,max=w.radius+9*(w.level-1),life=echoDepth===0?.42:echoDepth===1?.34:.30;
 return{kind:'heart',x:player.x,y:player.y,r:12,max,life,maxLife:life,damage,crit,echoDepth,delay,expandRate:echoDepth===0?14:echoDepth===1?20:22,started:echoDepth===0,hit:new Set(),objectHit:new Set(),sfxKind:echoDepth===1?'heartEcho1':'heartEcho2'};
}
function fireHeart(){
 const w=weapons.heart,base=w.damage*(1+.16*(w.level-1))*damageMult(),crit=rollWeaponCrit('heart');
 waves.push(makeHeartWave(base*(crit?1.20:1),crit));sfx(crit?'heartBeatCrit':'heartBeat');
 let delay=.14;
 for(let echoDepth=1;echoDepth<=w.maxEchoes;echoDepth++){
  if(Math.random()>=w.echoChance)break;
  waves.push(makeHeartWave(base*(crit?.80:.50),crit,echoDepth,delay));
  delay+=echoDepth===1?.10:.08;
 }
}
function thrombosisStats(){const w=weapons.autophagy,l=Math.max(1,w.level),rangeMult=1.20+(l-1)*(.20/7);return{trailRadius:(w.radius+(l-1)*1.6)*rangeMult,trailLife:w.trailLife+(l-1)*.07,poolRadius:(w.poolRadius+(l-1)*2)*rangeMult,poolLife:w.poolLife+(l-1)*.10,trailDamage:w.damage+(l-1)*.18,poolDamage:w.damage*1.52+(l-1)*.28,trailSlow:Math.min(.25,w.slow+(l-1)*.013),poolSlow:Math.min(.38,w.slow+.08+(l-1)*.02),tick:Math.max(.28,.35-(l-1)*.006),spacing:Math.max(9,14-(l-1)*.55),interval:Math.max(.075,.115-(l-1)*.004),coagulateDelay:.30,burstInterval:.15,orbitSpeed:Math.PI*2/13};}
function evictClotField(protectGroup=null){let idx=clotFields.findIndex(f=>f.kind==='trail');if(idx>=0){clotFields.splice(idx,1);return;}const oldest=clotFields.find(f=>!protectGroup||f.groupId!==protectGroup);if(!oldest){clotFields.shift();return;}if(oldest.groupId){for(let i=clotFields.length-1;i>=0;i--)if(clotFields[i].groupId===oldest.groupId)clotFields.splice(i,1);}else clotFields.splice(clotFields.indexOf(oldest),1);}
function addClotField(kind,x,y,st,extra={}){while(clotFields.length>=CLOT_FIELD_CAP)evictClotField(extra.groupId||null);const pool=kind==='pool',r=pool?st.poolRadius:st.trailRadius,life=pool?st.poolLife:st.trailLife,burst=!!extra.groupId,f={kind,x,y,r,rx:r*(pool?(burst ? .995+Math.random()*.01 : 1.08):.95+Math.random()*.18),ry:r*(pool?(burst ? .975+Math.random()*.01 : .72):.48+Math.random()*.16),angle:Number.isFinite(extra.angle)?extra.angle:(Math.random()-.5)*.55,life,maxLife:life,damage:(pool?st.poolDamage:st.trailDamage)*damageMult(),slow:pool?st.poolSlow:st.trailSlow,tick:st.tick,seed:Math.random()*1000,groupId:extra.groupId||null,burstIndex:extra.burstIndex||0,pop:pool ? .16 : 0,orbitSlot:Number.isInteger(extra.orbitSlot)?extra.orbitSlot:-1,microPhase:Math.random()*Math.PI*2,breathPhase:Math.random()*Math.PI*2,baseAngle:Number.isFinite(extra.angle)?extra.angle:0,orbiting:burst&&Number.isInteger(extra.orbitSlot),critChecked:new Set()};clotFields.push(f);return f;}
function updateClotOrbitPositions(b){const offset=b.st.poolRadius*.43;for(let i=0;i<3;i++){const f=b.slots[i];if(!f)continue;if(!clotFields.includes(f)){b.slots[i]=null;continue;}const microAngle=Math.sin(b.age*.72+f.microPhase)*.012,radial=offset*(1+Math.sin(b.age*.56+f.microPhase)*.012),a=b.orbitAngle+i*Math.PI*2/3+microAngle;f.x=b.x+Math.cos(a)*radial;f.y=b.y+Math.sin(a)*radial;f.angle=f.baseAngle+Math.sin(b.age*.45+f.microPhase)*.045;}}
function freezeClotBurstFields(b){updateClotOrbitPositions(b);for(const f of b.slots)if(f)f.orbiting=false;}
function spawnClotBurstPool(){const b=clotBurst;if(!b)return;const index=b.nextIndex,step=index+1,offset=b.st.poolRadius*.43,a=b.orbitAngle+index*Math.PI*2/3;let f=b.slots[index];if(!f||!clotFields.includes(f)){f=addClotField('pool',b.x+Math.cos(a)*offset,b.y+Math.sin(a)*offset,b.st,{groupId:b.groupId,burstIndex:step,orbitSlot:index,angle:b.angle+(Math.random()-.5)*.06});b.slots[index]=f;}else{f.life=f.maxLife=b.st.poolLife;f.pop=.12;f.damage=b.st.poolDamage*damageMult();f.slow=b.st.poolSlow;f.tick=b.st.tick;f.burstIndex=step;f.orbiting=true;}updateClotOrbitPositions(b);bodyTwitch=Math.max(bodyTwitch,step===3 ? .12 : .07);sfx('autophagy'+step);b.nextIndex=(b.nextIndex+1)%3;b.timer=b.st.burstInterval;if(b.stopAfterCycle&&b.nextIndex===0){freezeClotBurstFields(b);clotBurst=null;}}
function startClotBurst(st){const x=player.x,y=player.y,removeR=st.poolRadius*1.45;for(let i=clotFields.length-1;i>=0;i--){const f=clotFields[i],dx=f.x-x,dy=f.y-y;if(f.kind==='trail'&&dx*dx+dy*dy<removeR*removeR)clotFields.splice(i,1);}clotBurst={x,y,angle:Math.atan2(player.facingY||0,player.facingX||1),orbitAngle:Math.atan2(player.facingY||0,player.facingX||1),orbitDir:Math.random()<.5?-1:1,orbitSpeed:st.orbitSpeed,groupId:++clotGroupSerial,nextIndex:0,timer:0,stopAfterCycle:false,st,slots:[null,null,null],age:0};clotArmed=false;clotMoveTime=0;clotMoveDistance=0;clotStillClock=0;clotHadMotion=false;spawnClotBurstPool();}
function updateClotBurst(dt,moving){if(!clotBurst)return;const b=clotBurst;b.age+=dt;b.orbitAngle+=b.orbitDir*b.orbitSpeed*dt;updateClotOrbitPositions(b);if(moving){if(b.nextIndex===0){freezeClotBurstFields(b);clotBurst=null;return;}b.stopAfterCycle=true;}b.timer-=dt;let guard=0;while(clotBurst&&clotBurst.timer<=1e-6&&guard++<4)spawnClotBurstPool();}
function updateThrombosis(dt,moving){updateClotCritFx(dt);for(let i=clotFields.length-1;i>=0;i--){const f=clotFields[i];f.life-=dt;f.pop=Math.max(0,(f.pop||0)-dt);if(f.life<=0)clotFields.splice(i,1);}updateClotBurst(dt,moving);const w=weapons.autophagy,frameDist=Math.hypot(player.x-clotPrevX,player.y-clotPrevY);clotPrevX=player.x;clotPrevY=player.y;if(w.level<=0){clotHadMotion=false;clotArmed=false;clotStillClock=0;clotMoveTime=0;clotMoveDistance=0;if(clotBurst)freezeClotBurstFields(clotBurst);clotBurst=null;return;}const st=thrombosisStats();clotTrailClock-=dt;if(moving){clotStillClock=0;if(!clotArmed){clotMoveTime+=dt;clotMoveDistance+=frameDist;if(clotMoveTime>=.18||clotMoveDistance>=22)clotArmed=true;}if(!clotHadMotion){clotLastX=player.x;clotLastY=player.y;addClotField('trail',player.x,player.y,st);clotTrailClock=st.interval;}let dx=player.x-clotLastX,dy=player.y-clotLastY,dist=Math.hypot(dx,dy),guard=0;while(dist>=st.spacing&&guard++<4){const t=st.spacing/dist,px=clotLastX+dx*t,py=clotLastY+dy*t;addClotField('trail',px,py,st);clotLastX=px;clotLastY=py;dx=player.x-clotLastX;dy=player.y-clotLastY;dist=Math.hypot(dx,dy);clotTrailClock=st.interval;}if(clotTrailClock<=0&&dist>3){addClotField('trail',player.x,player.y,st);clotLastX=player.x;clotLastY=player.y;clotTrailClock=st.interval;}clotHadMotion=true;}else if(clotArmed&&!clotBurst){clotStillClock+=dt;if(clotStillClock+1e-6>=st.coagulateDelay)startClotBurst(st);}}
function thrombosisContact(e){let best=null;for(const f of clotFields){const dx=e.x-f.x,dy=e.y-f.y,ca=Math.cos(-f.angle),sa=Math.sin(-f.angle),lx=dx*ca-dy*sa,ly=dx*sa+dy*ca,rx=f.rx+e.r,ry=f.ry+e.r;if((lx*lx)/(rx*rx)+(ly*ly)/(ry*ry)>1||!pathClearTo(f.x,f.y,e.x,e.y,.5))continue;if(!best||f.slow>best.slow||f.damage>best.damage)best=f;}return best;}
function thrombosisStunDuration(e){if(e.anomaly)return .24;if(e.type==='fat'||e.maxHp>=80)return .384;return .66;}
function triggerThrombosisCrit(context){
 const e=context?.enemy;if(!e||e.hp<=0||e.clotStunResist>0||clotCritFx.length>=CLOT_CRIT_FX_CAP)return false;
 const duration=thrombosisStunDuration(e),r=22+Math.random()*4;
 e.clotStun=Math.max(e.clotStun||0,duration);e.clotStunResist=Math.max(e.clotStunResist||0,duration+1);e.clotStunPhase=Math.random()*Math.PI*2;e.routeTimer=0;e.routeStage=0;e.knockbackLock=Math.max(e.knockbackLock||0,duration);
 clotCritFx.push({id:++clotCritSerial,x:e.x,y:e.y,r,life:.84,maxLife:.84,phase:Math.random()*Math.PI*2,crack:Math.random()*Math.PI*2});
 sfx('clotCrit');for(let i=0;i<(qualityLevel===2?3:6);i++){const a=Math.random()*Math.PI*2,sp=28+Math.random()*62;emitParticle(e.x,e.y,Math.cos(a)*sp,Math.sin(a)*sp,.24,1.5+Math.random()*2,'#6f1020');}return true;
}
function updateClotCritFx(dt){for(let i=clotCritFx.length-1;i>=0;i--){const f=clotCritFx[i];f.life-=dt;if(f.life<=0){clotReleaseFx.push({x:f.x,y:f.y,r:f.r,life:.24,maxLife:.24,phase:f.phase});if(clotReleaseFx.length>6)clotReleaseFx.shift();sfx('clotRelease');swapRemove(clotCritFx,i);}}for(let i=clotReleaseFx.length-1;i>=0;i--){clotReleaseFx[i].life-=dt;if(clotReleaseFx[i].life<=0)swapRemove(clotReleaseFx,i);}}

function gainXp(v){
 const total=v*organMods.xp+player.xpRemainder,gained=Math.floor(total);player.xpRemainder=total-gained;player.xp+=gained;sfx('pickup');
 while(player.xp>=player.nextGrowthXp){player.xp-=player.nextGrowthXp;growthCount++;player.nextGrowthXp=Math.floor(player.nextGrowthXp+5+growthCount*1.15);sfx('growth');openGrowthChoice();break;}
}
function applyPassive(key){
 const p=passives[key];p.level++;
 if(key==='density'){player.maxHp+=12;player.hp=Math.min(player.maxHp,player.hp+12);player.damageTakenMult*=.95;}
 if(key==='sensory')player.crit+=.05;
 if(key==='necrosis')player.invulnBonus=(player.invulnBonus||0)+.06;
 if(key==='overload'){player.moveBonus+=.055;player.damageTakenMult*=1.06;}
}
function weaponChoiceDescription(key,w){
 if(key==='blood'){
  const next=Math.min(8,w.level+1),text={1:w.lore,2:'피가 더 멀리 끊기지 않고 이어집니다.',3:'흐름이 살아 있는 것을 더 집요하게 더듬습니다.',4:'박출된 피가 굵어져 더 넓은 상처를 훑습니다.',5:'흐름 속 맥동이 빨라지고 박출 간격이 짧아집니다.',6:'몸을 떠난 피가 더 오래 형태를 유지합니다.',7:'휘어진 흐름이 더 먼 침입자까지 이어집니다.',8:'한 줄기의 순환이 전장을 버틸 만큼 완성됩니다.'};return text[next];
 }
 if(key==='bone')return w.level?'부러진 기억이 더 깊이 몸을 되짚습니다.':w.lore;
 if(key==='heart')return w.level?'박동의 파문이 더 넓고 강해지지만, 잊힌 리듬은 여전히 예고 없이 되풀이됩니다.':w.lore;
 if(key==='stitch'){const next=Math.min(8,w.level+1);return w.level?`한 번에 꿰는 대상이 ${stitchCapacity(next)}명까지 늘고 봉합 피해가 깊어집니다.`:w.lore;}
 if(key==='incision')return w.level?'예고선이 빨라지고 절개가 더 길고 깊어집니다.':w.lore;
 return w.level?'혈흔이 더 넓고 오래 남으며, 멈춘 자리의 응고가 더 끈질겨집니다.':w.lore;
}
function upgradePool(){
 const list=[];
 for(const [key,w] of Object.entries(weapons)){
  if(!meta.unlockedWeapons[key])continue;
  if(w.level===0)list.push({icon:w.icon,type:'무기',name:`${w.name} · 첫 기억`,desc:weaponChoiceDescription(key,w),apply(){grantWeaponLevel(key);}});
  else if(w.level<8)list.push({icon:w.icon,type:'무기 강화',name:`${w.name} · ${w.level+1}번째 기억`,desc:weaponChoiceDescription(key,w),apply(){grantWeaponLevel(key);}});
 }
 for(const [key,p] of Object.entries(passives)){
  if(p.level<7)list.push({icon:p.icon,type:'패시브',name:p.level?`${p.name} · ${p.level+1}번째 변형`:`${p.name} · 첫 변형`,desc:p.desc,apply(){applyPassive(key);}});
 }
 list.push({icon:'🩹',type:'회복',name:'응급 봉합',desc:'벌어진 상처를 임시로 닫습니다.',apply(){player.hp=Math.min(player.maxHp,player.hp+35);}});
 return list;
}
function resetJoystickInput(){Object.assign(joystick,{active:false,id:null,dx:0,dy:0,x:joystick.sx,y:joystick.sy});}
function armSelectionInputGuard(){const hadTouch=joystick.active;resetJoystickInput();selectionNeedsFreshPointer=hadTouch;selectionInputGuardUntil=performance.now()+(hadTouch?1e9:240);}
function selectionCanInteract(){return !selectionNeedsFreshPointer&&performance.now()>=selectionInputGuardUntil;}
function clearSelectionUi(){selectionMode=null;selectedChoice=null;selectionConfirmAction=null;selectionCancelAction=null;selectionNeedsFreshPointer=false;selectionInputGuardUntil=0;ui.panel.classList.remove('selectionMode');ui.overlay.classList.remove('organPreview');ui.selectionFooter.classList.remove('visible');ui.selectionCancelBtn.style.display='none';ui.confirmSelectionBtn.disabled=true;ui.confirmSelectionBtn.textContent='확인';ui.selectionCancelBtn.textContent='보류';}
function beginConfirmedSelection(mode,title,{cancelLabel=null,onCancel=null}={}){
 selectionMode=mode;selectedChoice=null;selectionConfirmAction=null;selectionCancelAction=onCancel;paused=true;armSelectionInputGuard();
 ui.overlay.classList.remove('organPreview');ui.overlay.style.display='flex';ui.panel.classList.add('selectionMode');ui.overlayTitle.textContent=title;ui.pauseMenu.style.display='none';ui.cards.style.display='grid';ui.cards.innerHTML='';ui.selectionFooter.classList.add('visible');ui.confirmSelectionBtn.disabled=true;ui.confirmSelectionBtn.textContent='확인';
 ui.selectionCancelBtn.style.display=cancelLabel?'inline-flex':'none';ui.selectionCancelBtn.textContent=cancelLabel||'보류';syncActionButton();
}
function markSelection(card,choice){if(!selectionCanInteract())return false;for(const c of ui.cards.querySelectorAll('.card'))c.classList.remove('selected');card.classList.add('selected');selectedChoice=choice;ui.confirmSelectionBtn.disabled=false;return true;}
function weightedGrowthChoices(count=4){
 const pool=upgradePool().slice(),result=[];
 while(pool.length&&result.length<count){
  const weights=pool.map(o=>o.name===lastGrowthChoiceName?0.60:1),total=weights.reduce((a,b)=>a+b,0);let roll=Math.random()*total,index=0;
  for(;index<pool.length-1;index++){roll-=weights[index];if(roll<=0)break;}
  result.push(pool.splice(index,1)[0]);
 }
 return result;
}
function openGrowthChoice(){
 growthChoosing=true;beginConfirmedSelection('growth','육체가 다음 흔적을 고릅니다');
 weightedGrowthChoices(4).forEach(o=>{const b=document.createElement('button');b.className='card';b.innerHTML=`<div class="cardIcon">${o.icon||'·'}</div><small>${o.type}</small><h3>${o.name}</h3><p>${o.desc}</p>`;b.onclick=()=>markSelection(b,o);ui.cards.appendChild(b);});
 selectionConfirmAction=()=>{if(!selectedChoice)return;lastGrowthChoiceName=selectedChoice.name||'';selectedChoice.apply();renderHudIcons();growthChoosing=false;paused=false;hideOverlay();syncActionButton();};
}
// 유물·전리품 선택이 추가되면 같은 확인 흐름을 그대로 사용한다.
function openConfirmedRewardChoice(title,choices,{cancelLabel=null,onCancel=null}={}){
 beginConfirmedSelection('reward',title,{cancelLabel,onCancel});for(const o of choices){const b=document.createElement('button');b.className='card';b.innerHTML=`<div class="cardIcon">${o.icon||'·'}</div><small>${o.type||'전리품'}</small><h3>${o.name}</h3><p>${o.desc||''}</p>`;b.onclick=()=>markSelection(b,o);ui.cards.appendChild(b);}selectionConfirmAction=()=>{if(!selectedChoice)return;selectedChoice.apply?.();paused=false;hideOverlay();renderHudIcons();syncActionButton();};
}
function pauseItem(icon,name,detail){return `<div class="pauseItem"><div class="pauseItemIcon">${icon}</div><div><b>${name}</b><p>${detail}</p></div></div>`;}
function renderPauseSummary(){
 if(!ui.pauseSummary)return;
 const weaponItems=Object.values(weapons).filter(w=>w.level>0).map(w=>pauseItem(w.icon,`${w.name} · Lv${w.level}`,w.lore)).join('');
 const passiveItems=Object.values(passives).filter(p=>p.level>0).map(p=>pauseItem(p.icon,`${p.name} · Lv${p.level}`,p.desc)).join('');
 let organItems='';if(activeOrgan){const d=ORGAN_DEFS[activeOrgan];organItems+=pauseItem(d.icon,`${d.name} · 메인 장기`,d.lore);}else organItems='<div class="pauseEmpty">이식된 메인 장기가 없습니다.</div>';
 const stored=ORGAN_SLOTS.filter(k=>organStored[k]);for(const k of stored){const d=ORGAN_DEFS[k];organItems+=pauseItem(d.icon,`${d.name} · 보관 표본`,d.lore);}
 ui.pauseSummary.innerHTML=`<section class="pauseSection"><h3>무기</h3>${weaponItems||'<div class="pauseEmpty">활성 무기 없음</div>'}</section><section class="pauseSection"><h3>패시브</h3>${passiveItems||'<div class="pauseEmpty">활성 패시브 없음</div>'}</section><section class="pauseSection"><h3>장기</h3>${organItems}</section>`;
 ui.audioToggleBtn.textContent=soundEnabled?'음향 켜짐':'음향 꺼짐';ui.audioToggleBtn.classList.toggle('off',!soundEnabled);
}
function renderHudIcons(){if(ui.pauseMenu?.style.display==='block')renderPauseSummary();}
function hitEnemy(e,damage,dx=0,dy=0,crit=false,knockback=6){
 damage*=attendantTargetDamageMult(e);e.hp-=damage;if(crit&&damage>=35)sfx('crit');
 e.flash=.09;const l=Math.hypot(dx,dy)||1,kb=knockback*(e.knockbackMult??1)*(e===attendantTarget?attendantAbilityStats().control:1);e.x+=dx/l*kb;e.y+=dy/l*kb;e.knockbackLock=Math.max(e.knockbackLock||0,.18);e.stuckTimer=Math.max(0,(e.stuckTimer||0)-.3);
 for(let i=0;i<(crit?12:7);i++)emitParticle(e.x,e.y,(Math.random()-.5)*(crit?240:170),(Math.random()-.5)*(crit?240:170),crit?.42:.3,(crit?3:2)+Math.random()*3,crit?'#ffe08a':'#cf5f66');
}
const PICKUP_TYPES=['water','magnet','defibrillator'];
const PICKUP_DEFS={water:{r:11},magnet:{r:12},defibrillator:{r:12},specimen:{r:9}};
function spawnPickup(type,x,y,extra={}){const d=PICKUP_DEFS[type],o=takePool('pickup');Object.assign(o,{type,x,y,r:d.r,pulse:Math.random()*6.28,bonusMap:false,specimenDrop:false,value:0},extra);pickups.push(o);return o;}
function baseMapPickupCount(){let count=0;for(const p of pickups)if(PICKUP_TYPES.includes(p.type)&&!p.bonusMap)count++;return count;}
function bonusMapPickupCount(){let count=0;for(const p of pickups)if(p.bonusMap)count++;return count;}
function spawnBreakableSpecimen(x,y){spawnPickup('specimen',x+(Math.random()-.5)*18,y+(Math.random()-.5)*18,{specimenDrop:true,value:15+Math.floor(Math.random()*21)});}
function spawnBreakableMapPickup(x,y){if(bonusMapPickupCount()>=BONUS_MAP_PICKUP_CAP)return false;const type=PICKUP_TYPES[Math.floor(Math.random()*PICKUP_TYPES.length)];spawnPickup(type,x+(Math.random()-.5)*20,y+(Math.random()-.5)*20,{bonusMap:true});return true;}
function pickupSpotValid(x,y,r=18){if(Math.abs(x)>WARD_BOUNDS.halfW-r-42||Math.abs(y)>WARD_BOUNDS.halfH-r-42)return false;if((x-player.x)**2+(y-player.y)**2<300**2)return false;for(const p of pickups)if((x-p.x)**2+(y-p.y)**2<165**2)return false;for(const o of objects)if(o.active&&o.solid&&rectCircle(o,x,y,r))return false;return true;}
function randomPickupPosition(){const candidates=shuffledCopy(zones);for(const z of candidates){const pad=58,minX=z.mainWard?-WARD_BOUNDS.halfW+pad:z.x-z.w/2+pad,maxX=z.mainWard?WARD_BOUNDS.halfW-pad:z.x+z.w/2-pad,minY=z.mainWard?-WARD_BOUNDS.halfH+pad:z.y-z.h/2+pad,maxY=z.mainWard?WARD_BOUNDS.halfH-pad:z.y+z.h/2-pad;for(let attempt=0;attempt<18;attempt++){const x=minX+Math.random()*Math.max(1,maxX-minX),y=minY+Math.random()*Math.max(1,maxY-minY);if(pickupSpotValid(x,y))return{x,y};}}const corridor=zones.find(z=>z.corridor);if(corridor){for(let gx=-2000;gx<=2000;gx+=200)for(const gy of [-180,0,180]){const x=corridor.x+gx+(Math.random()-.5)*35,y=corridor.y+gy+(Math.random()-.5)*24;if(pickupSpotValid(x,y))return{x,y};}}return null;}
function spawnRandomMapPickup(type){if(baseMapPickupCount()>=MAX_MAP_PICKUPS||pickups.some(p=>p.type===type&&!p.bonusMap))return false;const pos=randomPickupPosition();if(!pos)return false;spawnPickup(type,pos.x,pos.y);return true;}
function spawnMapPickups(){for(const type of PICKUP_TYPES)spawnRandomMapPickup(type);}
function schedulePickupRespawn(type){if(pickupRespawns.some(q=>q.type===type))return;pickupRespawns.push({type,timer:PICKUP_RESPAWN_MIN+Math.random()*(PICKUP_RESPAWN_MAX-PICKUP_RESPAWN_MIN)});}
function ensurePickupPopulation(){for(const type of PICKUP_TYPES)if(!pickups.some(p=>p.type===type&&!p.bonusMap)&&!pickupRespawns.some(q=>q.type===type))pickupRespawns.push({type,timer:.35+Math.random()*.45});}
function updatePickupRespawns(dt){for(let i=pickupRespawns.length-1;i>=0;i--){const q=pickupRespawns[i];q.timer-=dt;if(q.timer<=0&&baseMapPickupCount()<MAX_MAP_PICKUPS){if(spawnRandomMapPickup(q.type))pickupRespawns.splice(i,1);else q.timer=.8;}}}
function creditSpecimens(value){value=Math.max(0,Math.floor(value||0));if(!value)return;meta.specimens=(meta.specimens||0)+value;runSpecimens+=value;specimenPulse=.32;saveMeta();updateHudDom(true);}
function collectPickup(o){
 if(o.type==='water'){player.hp=Math.min(player.maxHp,player.hp+24);waterReaction=.85;bodyTwitch=Math.max(bodyTwitch,.55);sfx('dirtyWater');for(let i=0;i<8;i++)emitParticle(player.x,player.y,(Math.random()-.5)*75,(Math.random()-.5)*65,.35,2+Math.random()*2,'#7d7651');}
 else if(o.type==='magnet'){globalMagnet=Math.max(globalMagnet,4.2);sfx('magnet');for(let i=0;i<10;i++){const a=i/10*Math.PI*2;emitParticle(player.x,player.y,Math.cos(a)*110,Math.sin(a)*110,.42,2,'#9ac4c9');}}
 else if(o.type==='defibrillator'){defibrillatorTimer=7.5;defibrillatorPulseClock=0;bodyTwitch=Math.max(bodyTwitch,.32);sfx('defibrillatorStart');cameraShake=Math.max(cameraShake,5);}else if(o.type==='specimen'){creditSpecimens(o.value||10);tone(420,.06,'triangle',.018,690);for(let i=0;i<7;i++)emitParticle(player.x,player.y,(Math.random()-.5)*95,(Math.random()-.5)*95,.32,2+Math.random()*2,'#d7a7b4');}
}
function fireDefibrillator(){
 const target=nearestEnemy(null,player.x,player.y,470);if(target){const dx=target.x-player.x,dy=target.y-player.y,l=Math.hypot(dx,dy)||1;defibrillatorAimX=dx/l;defibrillatorAimY=dy/l;}else{defibrillatorAimX=player.facingX||1;defibrillatorAimY=player.facingY||0;}
 const ux=defibrillatorAimX,uy=defibrillatorAimY,range=355,halfAngle=.60,cosHalf=Math.cos(halfAngle),damage=68,knockback=24;let hits=0;
 for(const e of queryEnemies(player.x+ux*range*.46,player.y+uy*range*.46,range*.78)){const dx=e.x-player.x,dy=e.y-player.y,d=Math.hypot(dx,dy)||1;if(d>range+e.r||(dx/d*ux+dy/d*uy)<cosHalf||!pathClearTo(player.x,player.y,e.x,e.y,.75))continue;hitEnemy(e,damage,dx,dy,false,knockback);e.shockStun=Math.max(e.shockStun||0,.28);if(++hits>=30)break;}
 for(const o of objects){if(!isTargetObject(o))continue;const cx=o.x+o.w/2,cy=o.y+o.h/2,dx=cx-player.x,dy=cy-player.y,d=Math.hypot(dx,dy)||1;if(d<=range+Math.max(o.w,o.h)/2&&(dx/d*ux+dy/d*uy)>=cosHalf&&pathClearTo(player.x,player.y,cx,cy,.75))damageObject(o,damage);}
 shockFx.push({x:player.x,y:player.y,ux,uy,range,halfAngle,life:.24,maxLife:.24});cameraShake=Math.max(cameraShake,6);sfx('defibrillatorPulse');
}
function xpOrbColor(v){
 if(v>=24)return '#ffd66b';
 if(v>=10)return '#b887ff';
 if(v>=4)return '#62a8ff';
 return '#6de38b';
}
function spawnXpOrb(x,y,v){const o=takePool('orb');Object.assign(o,{x,y,r:Math.min(ORB_MAX_R,ORB_BASE_R+Math.log2(v+1)*ORB_GROWTH),v,pulse:Math.random()*6.28});orbs.push(o);}
function spawnOrganDrop(x,y,slot=nextOrganSlot(true)){const d=takePool('organDrop');Object.assign(d,{x,y,r:11,slot,serial:++organSerial,pulse:Math.random()*6.28});organDrops.push(d);return d;}
function collectOrganDrop(d){const def=ORGAN_DEFS[d.slot];organStored[d.slot]={slot:d.slot,serial:d.serial};transplantInside=false;sfx('organ');toast(`${def.name}은 아직 식지 않았습니다. 빈 이식대가 조용히 당신을 기다립니다.`);syncActionButton();}
function mergeNearbyOrbs(){if(orbs.length<90)return;const buckets=new Map(),g=64;let write=0;for(let i=0;i<orbs.length;i++){const o=orbs[i],k=gridKey(Math.floor(o.x/g),Math.floor(o.y/g)),lead=buckets.get(k);if(lead){const dx=lead.x-o.x,dy=lead.y-o.y;if(dx*dx+dy*dy<g*g*.64){const total=lead.v+o.v;lead.x=(lead.x*lead.v+o.x*o.v)/total;lead.y=(lead.y*lead.v+o.y*o.v)/total;lead.v=total;lead.r=Math.min(ORB_MAX_R,ORB_BASE_R+Math.log2(total+1)*ORB_GROWTH);releasePool('orb',o);continue;}}buckets.set(k,o);orbs[write++]=o;}orbs.length=write;}
function syncActionButton(){
 if(!ui.actionButton)return;let nearest=null,bd=76*76;for(const a of unlockActors){const d=(a.x-player.x)**2+(a.y-player.y)**2;if(d<bd){bd=d;nearest=a;}}currentAction=nearest&&!paused&&!gameOver?{type:'unlock',kind:nearest.kind,accent:nearest.kind==='residual'?'#b77986':'#9aa5a1'}:null;ui.actionButton.classList.toggle('ready',!!currentAction);ui.actionButton.disabled=!currentAction;ui.actionButton.setAttribute('aria-disabled',String(!currentAction));ui.actionButton.style.setProperty('--action-accent',currentAction?.accent||'#625d5b');ui.actionButton.setAttribute('aria-label',currentAction?'상호작용 가능':'사용 가능한 상호작용 없음');ui.actionButton.title='';
}
function startOrganPreview(slot){
 const def=ORGAN_DEFS[slot];if(!def)return;organCinematicPreview=true;organCinematicSlot=slot;organPreviewElapsed=0;organFx=1;organFlash=def.color;document.body.classList.add('organ-cinematic');ui.overlay.classList.add('organPreview');ui.selectionCancelBtn.style.display='inline-flex';ui.selectionCancelBtn.textContent='다시 선택';ui.confirmSelectionBtn.disabled=false;stopCinematicAudio();playOrganCinematicSfx(slot);
}
function stopOrganPreview(){organCinematicPreview=false;organPreviewElapsed=0;stopCinematicAudio();ui.overlay.classList.remove('organPreview');if(organCinematicTimer<=0){organCinematicSlot=null;document.body.classList.remove('organ-cinematic');}}
function returnToOrganSelection(){if(!organCinematicPreview)return;stopOrganPreview();ui.cards.style.display='grid';ui.selectionCancelBtn.textContent='보류';armSelectionInputGuard();}
function closeTransplant(){stopOrganPreview();transplantOpen=false;transplantCooldown=1.2;paused=false;hideOverlay();syncActionButton();}
function transplantOrgan(slot){const sample=organStored[slot];if(!sample)return;const def=ORGAN_DEFS[slot];activeOrgan=slot;delete organStored[slot];recalcOrganEffects();stopOrganPreview();transplantOpen=false;transplantCooldown=1.2;paused=false;hideOverlay();organFx=1;organFlash=def.color;triggerOrganActivation(slot,false,true);syncActionButton();}
function openTransplantMenu(){
 const slots=ORGAN_SLOTS.filter(k=>organStored[k]);if(!slots.length)return false;transplantOpen=true;beginConfirmedSelection('organ','메인 장기 이식',{cancelLabel:'보류',onCancel:closeTransplant});
 for(const slot of slots){const def=ORGAN_DEFS[slot],b=document.createElement('button');b.className='card';b.innerHTML=`<div class="cardIcon" style="color:${def.color}">${def.icon}</div><small>${activeOrgan?'현재 장기 교체':'첫 메인 장기'}</small><h3>${def.name}</h3><p>${def.lore}</p>`;b.onclick=()=>{if(markSelection(b,{slot}))startOrganPreview(slot);};ui.cards.appendChild(b);}
 selectionConfirmAction=()=>{if(selectedChoice?.slot)transplantOrgan(selectedChoice.slot);};return true;
}
function tryTransplantStation(){let near=false;for(const o of queryObjects(player.x,player.y,92)){if(o.active&&o.type==='transplantStation'){const cx=o.x+o.w/2,cy=o.y+o.h/2,dx=player.x-cx,dy=player.y-cy;if(dx*dx+dy*dy<76*76){near=true;break;}}}transplantNear=near;transplantInside=near;syncActionButton();return near;}
function useActionButton(){if(!currentAction||paused||gameOver||organCinematicTimer>0)return;initAudio();if(currentAction.type==='unlock')interactUnlock(currentAction.kind);}
function finishDeath(e){
 kills++;spawnXpOrb(e.x,e.y,e.xp);if(e.eliteDeath)spawnPickup('specimen',e.x+(Math.random()-.5)*12,e.y+(Math.random()-.5)*12,{value:22+Math.floor(Math.random()*25)});else if(kills%12===0)spawnPickup('specimen',e.x,e.y,{value:7+Math.floor(Math.random()*8)});const c=takePool('corpse');Object.assign(c,{x:e.x,y:e.y,r:Math.max(8.5,e.r*.82),life:6});corpses.push(c);
 const count=e.eliteDeath?8:4;for(let n=0;n<count;n++)emitParticle(e.x,e.y,(Math.random()-.5)*190,(Math.random()-.5)*190,.36,3+Math.random()*3,'#cf5f66');
}
function transferResidualMemory(e){}
function killEnemy(i,e){
 if(e.type==='collector'){beginBossDeath(e);return;}
 onResidualKill(e);onAttendantMarkedKill(e);
 const elite=e.maxHp>=80||e.anomaly||e.type==='fat',fx=takePool('deathFx');Object.assign(fx,{x:e.x,y:e.y,r:e.r,xp:e.xp,color:e.color,life:elite?.42:.28,maxLife:elite?.42:.28,eliteDeath:elite});deathFx.push(fx);swapRemove(enemies,i);releasePool('enemy',e);
}
function applyBrainInfluence(initial=false){
 const pool=enemies.filter(e=>e.hp>0&&(initial?inViewWorld(e.x,e.y,e.r,20):true));for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
 const count=Math.min(initial?10:8,pool.length),priority=pool.filter(e=>e.anomaly||e.maxHp>=80).slice(0,Math.min(3,count)),selected=[...priority];for(const e of pool){if(selected.length>=count)break;if(!selected.includes(e))selected.push(e);}
 for(const e of selected){e.charm=Math.max(e.charm||0,e.anomaly?2.8:5.2);e.charmHit=0;e.flash=.12;for(let n=0;n<3;n++)emitParticle(e.x,e.y,(Math.random()-.5)*90,(Math.random()-.5)*90,.28,2+Math.random()*2,ORGAN_DEFS.brain.color);}
}

function update(dt){
 const realDt=dt;if(updateBossCinematics(realDt))return;updateChapterTimeline();updateBossHazards(dt);updateSpecialWeapons(dt);if(organCinematicTimer>0){organCinematicTimer=Math.max(0,organCinematicTimer-realDt);dt*=.16;if(organCinematicTimer<=0){organCinematicSlot=null;document.body.classList.remove('organ-cinematic');syncActionButton();}}
 frameTick++;elapsed+=dt;specimenPulse=Math.max(0,specimenPulse-dt);defibrillatorTimer=Math.max(0,defibrillatorTimer-dt);defibrillatorPulseClock-=dt;waterReaction=Math.max(0,waterReaction-dt);bodyTwitch=Math.max(0,bodyTwitch-dt);updatePickupRespawns(dt);pickupAuditClock-=dt;if(pickupAuditClock<=0){pickupAuditClock=2;ensurePickupPopulation();}if(defibrillatorTimer>0&&defibrillatorPulseClock<=0){fireDefibrillator();defibrillatorPulseClock=.82;}transplantCooldown=Math.max(0,transplantCooldown-realDt);updateAdaptiveQuality(dt);hudClock-=dt;debugClock-=dt;player.invuln=Math.max(0,player.invuln-dt);player.autoBuff=Math.max(0,player.autoBuff-dt);hitVignette=Math.max(0,hitVignette-dt);broadcastTimer=Math.max(0,broadcastTimer-dt);toastTimer=Math.max(0,toastTimer-dt);if(toastTimer<=0)ui.toast.style.opacity='0';
 eventClock=1e9;anomalyClock=1e9;if(updateCharacterAbilities(dt))return;
 const totalRegen=player.regen+organMods.regen;if(totalRegen>0)player.hp=Math.min(player.maxHp,player.hp+totalRegen*dt);organFx=Math.max(0,organFx-dt*1.25);organPulse=Math.max(0,organPulse-dt*1.8);cameraShake=Math.max(0,cameraShake-dt*24);globalMagnet=Math.max(0,globalMagnet-dt);for(let i=organRings.length-1;i>=0;i--){const r=organRings[i];r.life-=dt;r.r+=(r.max-r.r)*Math.min(1,dt*(r.slot==='stomach'?3.5:5));if(r.life<=0)organRings.splice(i,1);}if(activeOrgan==='heart'){heartBeatClock-=dt;if(heartBeatClock<=0){heartBeatClock=5.6;triggerOrganActivation('heart',true);}}if(activeOrgan==='brain'){brainClock-=dt;if(brainClock<=0){brainClock=12;applyBrainInfluence(false);triggerOrganActivation('brain',true);}}if(activeOrgan==='stomach'){stomachClock-=dt;if(stomachClock<=0){stomachClock=30;globalMagnet=5.5;triggerOrganActivation('stomach',true);}}
 let ix=joystick.dx,iy=joystick.dy;
 if(keys.ArrowLeft||keys.a)ix=-1;if(keys.ArrowRight||keys.d)ix=1;if(keys.ArrowUp||keys.w)iy=-1;if(keys.ArrowDown||keys.s)iy=1;
 const il=Math.hypot(ix,iy);if(il>.16){ix/=il;iy/=il;player.facingX=ix;player.facingY=iy;}else{ix=0;iy=0;}
 const residualMove=selectedCharacter==='residual'&&player.residualDamage>0?1+residualAbilityStats().move:1;const sp=player.speed*(1+player.moveBonus)*organMods.moveSpeed*residualMove;player.x+=ix*sp*dt;player.y+=iy*sp*dt;for(const o of queryObjects(player.x,player.y,player.r+48))resolveCircleRect(player,o);updateThrombosis(dt,il>.16);tryTransplantStation();
 const cameraLimitX=Math.max(0,WARD_BOUNDS.halfW-W*.5),cameraLimitY=Math.max(0,WARD_BOUNDS.halfH-H*.5);const cameraTargetX=Math.max(-cameraLimitX,Math.min(cameraLimitX,player.x)),cameraTargetY=Math.max(-cameraLimitY,Math.min(cameraLimitY,player.y));camera.x+=(cameraTargetX-camera.x)*Math.min(1,dt*5.8);camera.y+=(cameraTargetY-camera.y)*Math.min(1,dt*5.8);
 minimapClock+=dt;if(minimapClock>=PERF.minimapInterval[qualityLevel]){minimapClock=0;renderMinimap();}

 for(const o of objects){o.flash=Math.max(0,o.flash-dt);o.reveal=Math.max(0,(o.reveal||0)-dt);o.hitJolt=Math.max(0,(o.hitJolt||0)-dt);}
 spawnTimer-=dt;
 const phase=Math.min(1,elapsed/900),targetCount=chapterFlags.bossPrelude?0:Math.floor(18+phase*66+Math.max(0,growthCount-5)*1.2),cap=Math.min(PERF.enemyCap,125);maxEnemies=Math.max(maxEnemies,enemies.length);maxOrbs=Math.max(maxOrbs,orbs.length);
 let regularCount=0;for(const e of enemies)if(!e.wavePersistent)regularCount++;
 const rate=Math.max(.075,.62-elapsed/1050-growthCount*.006);
 if(!chapterFlags.bossPrelude&&spawnTimer<=0&&regularCount<cap){const deficit=Math.max(0,targetCount-regularCount),burst=deficit>35?3:deficit>16?2:1;for(let n=0;n<burst&&regularCount+n<cap;n++)spawnEnemy();spawnTimer=rate;}
 rebuildEnemyGrid();for(const w of Object.values(weapons))if(w.level>0)w.timer-=dt;
 const asp=atkSpeedMult();
 if(weapons.blood.level>0&&weapons.blood.timer<=0){fireBlood();weapons.blood.timer=bloodStreamStats(weapons.blood.level).cooldown/asp;}
 if(weapons.bone.level>0&&weapons.bone.timer<=0){fireBone();weapons.bone.timer=Math.max(1.72,weapons.bone.cd*Math.pow(.978,weapons.bone.level-1));}
 if(weapons.heart.level>0&&weapons.heart.timer<=0){fireHeart();weapons.heart.timer=weapons.heart.cd*Math.pow(.97,weapons.heart.level-1)/asp;}
 if(weapons.stitch.level>0&&weapons.stitch.timer<=0){fireStitch();weapons.stitch.timer=Math.max(.62,weapons.stitch.cd*Math.pow(.965,weapons.stitch.level-1)/asp);}
 if(weapons.incision.level>0&&weapons.incision.timer<=0){fireIncision();weapons.incision.timer=Math.max(1.35,weapons.incision.cd*Math.pow(.965,weapons.incision.level-1)/asp);}

 const farLimit=Math.max(W,H)*1.65,farLimit2=farLimit*farLimit;
 for(let i=enemies.length-1;i>=0;i--){
  const e=enemies[i];e.flash=Math.max(0,e.flash-dt);e.attendantVulnerable=Math.max(0,(e.attendantVulnerable||0)-dt);e.hitCd=Math.max(0,e.hitCd-dt);e.phaseTimer=Math.max(0,e.phaseTimer-dt);e.routeTimer=Math.max(0,(e.routeTimer||0)-dt);e.rerouteCooldown=Math.max(0,(e.rerouteCooldown||0)-dt);e.navCheck=(e.navCheck||0)-dt;e.shockStun=Math.max(0,(e.shockStun||0)-dt);e.clotStun=Math.max(0,(e.clotStun||0)-dt);e.clotStunResist=Math.max(0,(e.clotStunResist||0)-dt);e.wallStun=Math.max(0,(e.wallStun||0)-dt);if(e.wallStun<=0)e.wallStunMax=0;e.knockbackLock=Math.max(0,(e.knockbackLock||0)-dt);e.charm=Math.max(0,(e.charm||0)-dt);e.charmHit=Math.max(0,(e.charmHit||0)-dt);
  const clot=thrombosisContact(e);let clotSlow=0;if(clot){const resist=e.anomaly?.55:e.type==='fat'?.75:1;clotSlow=clot.slow*resist;e.clotTick=(e.clotTick??.08)-dt;if(e.clotTick<=0){const spawnId=e.spawnId||0,firstContact=!clot.critChecked.has(spawnId);if(firstContact)clot.critChecked.add(spawnId);e.hp-=clot.damage*attendantTargetDamageMult(e);e.flash=Math.max(e.flash,.045);e.clotTick=clot.tick;if(firstContact&&e.hp>0&&e.clotStunResist<=0){const crit=rollWeaponCrit('autophagy');resolveWeaponCrit('autophagy',{crit,enemy:e,field:clot,x:e.x,y:e.y});}}}else e.clotTick=Math.min(e.clotTick??.08,.08);if(e.hp<=0&&!(e.boneLaunchDuration>0)){killEnemy(i,e);continue;}if(e.type==='collector'){updateCollector(e,dt);if(e.hp<=0)killEnemy(i,e);continue;}
  const launched=updateEnemyBoneLaunch(e,dt),curDx=player.x-e.x,curDy=player.y-e.y,dist2=curDx*curDx+curDy*curDy,coagulated=e.clotStun>0,wallStunned=e.wallStun>0,hardStunned=coagulated||wallStunned,controlMult=hardStunned?0:(e.shockStun>0?.16:1)*(1-clotSlow),moveSpeed=e.speed*controlMult,navEligible=!launched&&!hardStunned&&e.charm<=0&&!(e.anomaly&&e.formationTime>0),directPath=navEligible?enemyDirectPathClear(e):false;
  if(navEligible&&e.routeTimer>0&&e.navCheck<=0){e.navCheck=.15+e.aiPhase*.018;if(directPath){clearEnemyRoute(e);e.wallBlockedTime=0;}}
   if(navEligible&&e.routeTimer<=0&&e.navCheck<=0&&e.knockbackLock<=0){e.navCheck=.16+e.aiPhase*.025;if(!directPath)assignEnemyReroute(e);}
  if(launched){e.dist=Math.sqrt(dist2);}
  else if(hardStunned){e.dist=Math.sqrt(dist2);}
  else if(e.routeTimer>0&&e.charm<=0){const rdx=e.routeX-e.x,rdy=e.routeY-e.y,rl=Math.hypot(rdx,rdy)||1;if(rl<16){if(e.routeStage===1){e.routeX=e.routeNextX;e.routeY=e.routeNextY;e.routeStage=2;e.routeTimer=3.5;}else{e.routeTimer=0;e.routeStage=0;e.routeGateId=null;e.navCheck=0;}}else{e.x+=rdx/rl*moveSpeed*dt;e.y+=rdy/rl*moveSpeed*dt;e.dist=Math.sqrt(dist2);}}
  else if(e.charm>0){const target=nearestEnemy(e,e.x,e.y,285);if(target){const dx=target.x-e.x,dy=target.y-e.y,l=Math.hypot(dx,dy)||1;e.x+=dx/l*moveSpeed*dt;e.y+=dy/l*moveSpeed*dt;if(l<e.r+target.r+6&&e.charmHit<=0){const raw=e.damage*1.05+target.maxHp*.018,brainDamage=Math.min(target.anomaly?30:42,Math.max(8,raw));target.hp-=brainDamage;target.flash=.14;e.charmHit=.62;brainLinks.push({x:e.x,y:e.y,tx:target.x,ty:target.y,life:.24,maxLife:.24});for(let n=0;n<4;n++)emitParticle(target.x,target.y,(Math.random()-.5)*130,(Math.random()-.5)*130,.3,2+Math.random()*2,ORGAN_DEFS.brain.color);}}else e.charm=0;}
  else if(e.anomaly&&e.formationTime>0){e.formationTime-=dt;const tx=player.x+Math.cos(e.formationAngle)*e.formationRadius,ty=player.y+Math.sin(e.formationAngle)*e.formationRadius,fdx=tx-e.x,fdy=ty-e.y,fl=Math.hypot(fdx,fdy)||1;e.x+=fdx/fl*moveSpeed*dt;e.y+=fdy/fl*moveSpeed*dt;e.dist=Math.sqrt(dist2);}
  else{const near=dist2<(Math.max(W,H)*.9)**2,refresh=near?((frameTick+e.aiPhase)%2===0):((frameTick+e.aiPhase)%3===0);if(refresh||!Number.isFinite(e.dist)){const l=Math.sqrt(dist2)||1,tx=curDx/l,ty=curDy/l;if(!Number.isFinite(e.dirX)||Math.hypot(e.dirX,e.dirY)<.2){e.dirX=tx;e.dirY=ty;}else{const blend=near?.42:.28;e.dirX+=(tx-e.dirX)*blend;e.dirY+=(ty-e.dirY)*blend;const dl=Math.hypot(e.dirX,e.dirY)||1;e.dirX/=dl;e.dirY/=dl;}e.dist=l;}if(e.type==='parasite'){const desired=250;if(e.dist>desired+25){e.x+=e.dirX*moveSpeed*dt;e.y+=e.dirY*moveSpeed*dt}else if(e.dist<desired-25){e.x-=e.dirX*moveSpeed*.7*dt;e.y-=e.dirY*moveSpeed*.7*dt}e.shootCd-=dt;if(e.shootCd<=0&&enemyShots.length<28){const shot=takePool('enemyShot');Object.assign(shot,{x:e.x,y:e.y,vx:e.dirX*175,vy:e.dirY*175,r:6*SCALE.projectile,damage:e.damage,life:2.6});enemyShots.push(shot);e.shootCd=2.35+Math.random()*.55;}}else{e.x+=e.dirX*moveSpeed*dt;e.y+=e.dirY*moveSpeed*dt;}}
  let wallBlocked=false;if(inViewWorld(e.x,e.y,e.r,260)||(frameTick+e.aiPhase)%4===0)for(const o of queryObjects(e.x,e.y,e.r+54)){const hit=resolveCircleRect(e,o);if(hit&&o.type==='wall')wallBlocked=true;}
  if(wallBlocked&&e.knockbackLock<=0){e.wallBlockedTime=Math.min(3,(e.wallBlockedTime||0)+dt);if(navEligible&&e.rerouteCooldown<=0&&e.wallBlockedTime>.22&&!enemyDirectPathClear(e)){assignEnemyReroute(e,e.routeTimer>0);e.rerouteCooldown=.20;}}else e.wallBlockedTime=Math.max(0,(e.wallBlockedTime||0)-dt*3);
  e.stuckCheck+=dt;if(e.stuckCheck>=.55){const sample=e.stuckCheck,moved=Math.hypot(e.x-e.lastX,e.y-e.lastY),wantsMove=e.type==='parasite'?(e.dist>275||e.dist<225):e.dist>player.r+e.r+8,minProgress=Math.max(3,moveSpeed*sample*.08);e.stuckTimer=wantsMove&&moved<minProgress?e.stuckTimer+sample:Math.max(0,e.stuckTimer-sample*2);if(e.stuckTimer>.75&&navEligible){if(!enemyDirectPathClear(e))assignEnemyReroute(e,true);else clearEnemyRoute(e);e.stuckTimer=0;}e.lastX=e.x;e.lastY=e.y;e.stuckCheck=0;}
  const pdx=player.x-e.x,pdy=player.y-e.y,postDist2=pdx*pdx+pdy*pdy;e.farTimer=postDist2>farLimit2?e.farTimer+dt:0;const visible=inViewWorld(e.x,e.y,e.r,40);if(!e.wavePersistent&&e.farTimer>5.5)recycleEnemyOffscreen(e);else if(!visible&&e.stuckTimer>8)recycleEnemyOffscreen(e);
  const hitR=player.r+e.r;if(!launched&&!hardStunned&&postDist2<hitR*hitR&&e.hitCd<=0&&player.invuln<=0){applyPlayerDamage(e.damage,.45);e.hitCd=.8;if(gameOver)return;}if(e.hp<=0&&!(e.boneLaunchDuration>0))killEnemy(i,e);
 }
 rebuildEnemyGrid();
 if(frameTick%3===0){for(const e of enemies){if(e.clotStun>0||e.wallStun>0||!inViewWorld(e.x,e.y,e.r,220))continue;let checked=0;for(const n of queryEnemies(e.x,e.y,e.r*3.2)){if(n===e||checked++>7)continue;const sx=e.x-n.x,sy=e.y-n.y,sd2=sx*sx+sy*sy,routed=e.routeTimer>0||n.routeTimer>0,minD=(e.r+n.r)*(routed?.80:.72);if(sd2>0&&sd2<minD*minD){const sd=Math.sqrt(sd2),push=(minD-sd)*(routed?.067:.052);e.x+=sx/sd*push;e.y+=sy/sd*push;}}for(const o of queryObjects(e.x,e.y,e.r+40))if(o.type==='wall')resolveCircleRect(e,o);}}
 for(let i=enemyShots.length-1;i>=0;i--){
  const s=enemyShots[i];s.x+=s.vx*dt;s.y+=s.vy*dt;s.life-=dt;
  let blocked=false;for(const o of queryObjects(s.x,s.y,s.r+8)){if(o.active&&o.solid&&rectCircle(o,s.x,s.y,s.r)){blocked=true;break;}}
  if(blocked){removePooledAt(enemyShots,i,'enemyShot');continue;}
  const dx=player.x-s.x,dy=player.y-s.y,hitR=player.r+s.r;
  if(dx*dx+dy*dy<hitR*hitR&&player.invuln<=0){applyPlayerDamage(s.damage,.45);removePooledAt(enemyShots,i,'enemyShot');if(gameOver)return;continue;}
  if(s.life<=0)removePooledAt(enemyShots,i,'enemyShot');
 }
 for(let si=slashes.length-1;si>=0;si--){
  const a=slashes[si];a.age=(a.age||0)+dt;a.life-=dt;a.x=player.x;a.y=player.y;
  if(a.kind==='fracture'){
   if(a.age<a.lockAt){let targetValid=a.target&&(a.targetKind==='enemy'?a.target.hp>0:a.target.active),tx=0,ty=0;if(targetValid){tx=a.targetKind==='enemy'?a.target.x:a.target.x+a.target.w/2;ty=a.targetKind==='enemy'?a.target.y:a.target.y+a.target.h/2;targetValid=pathClearTo(player.x,player.y,tx,ty,.75);}if(!targetValid){const ti=nearestTarget();if(ti){a.target=ti.target;a.targetKind=ti.kind;tx=ti.x;ty=ti.y;targetValid=true;}}if(targetValid){const dx=tx-player.x,dy=ty-player.y,l=Math.hypot(dx,dy)||1;a.ux=dx/l;a.uy=dy/l;}}
   if(!a.impacted&&a.age>=a.impactAt){a.impacted=true;resolveBoneSwing(a);}
  }
  if(a.life<=0)swapRemove(slashes,si);
 }
 for(let i=boneShards.length-1;i>=0;i--){const b=boneShards[i],oldX=b.x,oldY=b.y;b.x+=b.vx*dt;b.y+=b.vy*dt;b.vx*=.970;b.vy*=.970;b.rot+=b.spin*dt;b.life-=dt;let remove=b.life<=0||!pathClearTo(oldX,oldY,b.x,b.y,b.r*.75);if(remove&&b.life>0){for(let n=0;n<2;n++)emitParticle(b.x,b.y,(Math.random()-.5)*70,(Math.random()-.5)*70,.18,1.4+Math.random()*1.6,'#c7b89d');}if(!remove){for(const o of queryObjects(b.x,b.y,b.r+8)){if(o.active&&o.solid&&rectCircle(o,b.x,b.y,b.r)){for(let n=0;n<2;n++)emitParticle(b.x,b.y,(Math.random()-.5)*70,(Math.random()-.5)*70,.18,1.4+Math.random()*1.6,'#c7b89d');remove=true;break;}}}if(remove)boneShards.splice(i,1);}
 for(let i=boneImpactFx.length-1;i>=0;i--){boneImpactFx[i].life-=dt;if(boneImpactFx[i].life<=0)boneImpactFx.splice(i,1);}
 for(let i=projectiles.length-1;i>=0;i--){
  const p=projectiles[i];
  if(p.kind==='blood'){
   p.age+=dt;p.life-=dt;p.lastX=p.x;p.lastY=p.y;p.steerClock-=dt;p.hesitationClock-=dt;
   if(!p.target||p.target.hp<=0||p.hitTargets.has(p.target)||!pathClearTo(p.x,p.y,p.target.x,p.target.y,.75))p.target=nearestBloodTarget(p);
   if(p.objectTarget&&!p.objectTarget.active)p.objectTarget=null;
   if(p.hesitationClock<=0){p.hesitationClock=.16+Math.random()*.32;p.hesitation=.48+Math.random()*.38;p.steerBias=(Math.random()*2-1)*p.wobble*.72;}
   p.hesitation+=(1-p.hesitation)*Math.min(1,dt*4.1);
   if(p.steerClock<=0){p.steerClock=.12+Math.random()*.19;p.steerBias=(Math.random()*2-1)*p.wobble*.64;}
   let txTarget=null,tyTarget=null;
   if(p.target){txTarget=p.target.x;tyTarget=p.target.y;}
   else if(p.objectTarget){txTarget=p.objectTarget.x+p.objectTarget.w/2;tyTarget=p.objectTarget.y+p.objectTarget.h/2;}
   const crawl=.90+.08*Math.sin(p.age*5.2+p.crawlPhase)+.045*Math.sin(p.age*11.7+p.phase),nominal=(p.nominalSpeed||weapons.blood.speed)*Math.max(.54,p.hesitation)*crawl;
   if(txTarget!==null){const dx=txTarget-p.x,dy=tyTarget-p.y,l=Math.hypot(dx,dy)||1,px=-dy/l,py=dx/l,organic=Math.sin(p.age*6.2+p.phase)*p.wobble*.66+Math.sin(p.age*13.4+p.phase*1.73)*p.wobble*.22+p.steerBias,desiredX=dx/l*nominal+px*organic*p.writhe,desiredY=dy/l*nominal+py*organic*p.writhe,turn=p.turnRate*(p.hesitation<.75?.68:1);p.vx+=(desiredX-p.vx)*Math.min(1,dt*turn);p.vy+=(desiredY-p.vy)*Math.min(1,dt*turn);}
   else{const a=Math.atan2(p.vy,p.vx)+(Math.sin(p.age*7.2+p.phase)*.018+Math.sin(p.age*3.1+p.crawlPhase)*.012)*p.writhe;p.vx+=(Math.cos(a)*nominal-p.vx)*Math.min(1,dt*2.7);p.vy+=(Math.sin(a)*nominal-p.vy)*Math.min(1,dt*2.7);}
   if(p.life<.22){const decay=Math.max(.18,p.life/.22);p.vx*=.90+.09*decay;p.vy*=.90+.09*decay;p.retractClock-=dt;if(p.retractClock<=0&&p.pathCount>2){p.pathCount--;p.retractClock=.025;}}
   p.x+=p.vx*dt;p.y+=p.vy*dt;const ndx=p.x-p.path[2],ndy=p.y-p.path[3];if(ndx*ndx+ndy*ndy>=p.nodeSpacing*p.nodeSpacing)pushBloodPathNode(p,p.lastX,p.lastY);p.path[0]=p.x;p.path[1]=p.y;relaxBloodPath(p,dt);
   for(const o of queryObjects(p.x,p.y,p.r+12)){if(o.active&&o.solid&&o.type==='wall'&&rectCircle(o,p.x,p.y,p.r)){p.blocked=true;p.life=Math.min(p.life,.11);p.vx*=.16;p.vy*=.16;break;}}
   p.hitClock-=dt;if(p.hitClock<=0){p.hitClock=p.isBranch?.045:.034;
    for(let n=0;n<p.pathCount-1;n++){const ax=p.path[n*2],ay=p.path[n*2+1],bx=p.path[(n+1)*2],by=p.path[(n+1)*2+1],mx=(ax+bx)*.5,my=(ay+by)*.5,segR=Math.hypot(bx-ax,by-ay)*.5+p.r+25;
     for(const e of queryEnemies(mx,my,segR)){if(e.hp<=0||p.hitTargets.has(e))continue;const rr=e.r+p.r;if(bloodPointSegmentDist2(e.x,e.y,ax,ay,bx,by)<=rr*rr){const sdx=bx-ax,sdy=by-ay,sl2=sdx*sdx+sdy*sdy,t=sl2>1e-8?Math.max(0,Math.min(1,((e.x-ax)*sdx+(e.y-ay)*sdy)/sl2)):0,qx=ax+sdx*t,qy=ay+sdy*t;if(!pathClearTo(qx,qy,e.x,e.y,.5))continue;p.hitTargets.add(e);hitEnemy(e,p.damage,bx-ax,by-ay,false,4);sfx('bloodHit');bloodWrapFx.push({x:e.x,y:e.y,r:e.r+5,angle:Math.atan2(by-ay,bx-ax),life:p.isBranch?.24:.32,maxLife:p.isBranch?.24:.32,crit:p.crit,branch:p.isBranch,phase:p.phase+n*.31});if(bloodWrapFx.length>48)bloodWrapFx.shift();if(p.manifestationReady&&!p.manifested)resolveWeaponCrit('blood',{crit:true,projectile:p,hit:e,x:e.x,y:e.y,dirX:bx-ax,dirY:by-ay});}}
     for(const o of queryObjects(mx,my,segR)){if(!o.active||!isTargetObject(o)||p.objectHits.has(o))continue;if(segmentHitsExpandedRect(ax,ay,bx,by,o,p.r+(isBreakableProp(o)?4:0))){p.objectHits.add(o);damageObject(o,p.damage*.72);if(p.objectTarget===o)p.objectTarget=null;if(p.manifestationReady&&!p.manifested)resolveWeaponCrit('blood',{crit:true,projectile:p,hit:o,x:o.x+o.w/2,y:o.y+o.h/2,dirX:bx-ax,dirY:by-ay});}}
    }
   }
   if(p.life<=0)removePooledAt(projectiles,i,'projectile');continue;
  }
  p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;if(p.life<=0)removePooledAt(projectiles,i,'projectile');
 }
 for(let i=bloodWrapFx.length-1;i>=0;i--){const f=bloodWrapFx[i];f.life-=dt;if(f.life<=0)swapRemove(bloodWrapFx,i);}
 for(let wi=waves.length-1;wi>=0;wi--){
  const w=waves[wi];
  if((w.delay||0)>0){w.delay-=dt;if(w.delay>0)continue;w.delay=0;if(!w.started){w.started=true;if(w.kind==='heart'&&w.echoDepth){w.x=player.x;w.y=player.y;}if(w.sfxKind)sfx(w.sfxKind);}}
  w.life-=dt;w.r+=(w.max-w.r)*Math.min(1,(w.expandRate||14)*dt);
  for(const e of queryEnemies(w.x,w.y,w.r+40)){const dx=e.x-w.x,dy=e.y-w.y;if(dx*dx+dy*dy<(e.r+w.r)**2&&!w.hit.has(e)&&((w.environment)||pathClearTo(w.x,w.y,e.x,e.y,.75))){w.hit.add(e);hitEnemy(e,w.damage,dx,dy,w.crit,6);}}
  w.objectHit=w.objectHit||new Set();damageBreakablesAround(w.x,w.y,w.r+8,w.damage*(w.environment?.72:.46),w.objectHit);
  if(w.life<=0)swapRemove(waves,wi);
 }
 const pick=player.pickup*(1+player.pickupBonus)*organMods.pickup,magnetR=pick*1.25,magnetR2=magnetR*magnetR;
 for(let i=orbs.length-1;i>=0;i--){
  const o=orbs[i],dx=player.x-o.x,dy=player.y-o.y,d2=dx*dx+dy*dy,collectR=player.r+o.r+5;
  if(d2<magnetR2||globalMagnet>0){const d=Math.sqrt(d2)||1;o.x+=dx/d*(globalMagnet>0?760:460)*dt;o.y+=dy/d*(globalMagnet>0?760:460)*dt;}
  if(d2<collectR*collectR){gainXp(o.v);removePooledAt(orbs,i,'orb');}
 }
 for(let i=pickups.length-1;i>=0;i--){const o=pickups[i],dx=player.x-o.x,dy=player.y-o.y,d2=dx*dx+dy*dy,cr=player.r+o.r+5;if(d2<cr*cr){const type=o.type,shouldRespawn=PICKUP_TYPES.includes(type)&&!o.bonusMap;collectPickup(o);if(shouldRespawn)schedulePickupRespawn(type);removePooledAt(pickups,i,'pickup');}}
 for(let i=organDrops.length-1;i>=0;i--){const o=organDrops[i],dx=player.x-o.x,dy=player.y-o.y,d2=dx*dx+dy*dy,mag=145;if(d2<mag*mag){const d=Math.sqrt(d2)||1;o.x+=dx/d*330*dt;o.y+=dy/d*330*dt;}const cr=player.r+o.r+6;if(d2<cr*cr){collectOrganDrop(o);removePooledAt(organDrops,i,'organDrop');}}
 orbMergeClock+=dt;if(orbMergeClock>=.85){orbMergeClock=0;mergeNearbyOrbs();}
 for(let i=hazards.length-1;i>=0;i--){const h=hazards[i];h.life-=dt;h.tick-=dt;if(h.tick<=0){h.tick=.32;for(const e of queryEnemies(h.x,h.y,h.r+40)){const dx=e.x-h.x,dy=e.y-h.y;if(dx*dx+dy*dy<(h.r+e.r)**2)e.hp-=h.damage;}}if(h.life<=0)swapRemove(hazards,i);}
 for(let i=corpses.length-1;i>=0;i--){const c=corpses[i];c.life-=dt;if(c.life<=0)removePooledAt(corpses,i,'corpse');}
 for(let i=deathFx.length-1;i>=0;i--){const d=deathFx[i];d.life-=dt;if(d.life<=0){finishDeath(d);removePooledAt(deathFx,i,'deathFx');}}
 for(let i=leechFx.length-1;i>=0;i--){const f=leechFx[i];f.life-=dt;f.tx=player.x;f.ty=player.y;if(f.life<=0)swapRemove(leechFx,i);}
 for(let i=brainLinks.length-1;i>=0;i--){const f=brainLinks[i];f.life-=dt;if(f.life<=0)swapRemove(brainLinks,i);}for(let i=shockFx.length-1;i>=0;i--){const f=shockFx[i];f.life-=dt;if(f.life<=0)swapRemove(shockFx,i);}
 if(currentWave&&!enemies.some(e=>e.waveId===currentWave.id)){
  const rewardXp=18+Math.min(12,growthCount*2),rewardHeal=18;
  spawnXpOrb(player.x-22,player.y,rewardXp);spawnXpOrb(player.x+22,player.y,8);
  player.hp=Math.min(player.maxHp,player.hp+rewardHeal);
  broadcast('비공식 라운드 종료 · '+currentWave.label);
  toast(`웨이브 보상 · 경험치 ${rewardXp+8} / HP +${rewardHeal}`);
  currentWave=null;anomalyClock=Math.max(anomalyClock,55);
 }
 for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.94;p.vy*=.94;p.life-=dt;if(p.life<=0)removePooledAt(particles,i,'particle');}
 if(hudClock<=0){hudClock=.1;updateHudDom(false);}if(debugClock<=0){debugClock=.25;updateDebugDom();}

}

function drawRoom(z){
 const a=worldToScreen(z.x-z.w/2,z.y-z.h/2),x=a.x,y=a.y,w=z.w,h=z.h;
 if(z.mainWard){ctx.fillStyle=z.tint;ctx.fillRect(x,y,w,h);ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();ctx.strokeStyle='#ffffff08';ctx.lineWidth=1;const tile=90,startX=Math.floor((camera.x-W/2-(z.x-z.w/2))/tile)*tile+(z.x-z.w/2),startY=Math.floor((camera.y-H/2-(z.y-z.h/2))/tile)*tile+(z.y-z.h/2);for(let gx=startX;gx<camera.x+W/2+tile;gx+=tile){const s=worldToScreen(gx,z.y);ctx.beginPath();ctx.moveTo(s.x,y);ctx.lineTo(s.x,y+h);ctx.stroke();}for(let gy=startY;gy<camera.y+H/2+tile;gy+=tile){const s=worldToScreen(z.x,gy);ctx.beginPath();ctx.moveTo(x,s.y);ctx.lineTo(x+w,s.y);ctx.stroke();}ctx.fillStyle='#00000018';ctx.fillRect(x,y,w,46);ctx.fillRect(x,y+h-46,w,46);ctx.fillRect(x,y,46,h);ctx.fillRect(x+w-46,y,46,h);ctx.fillStyle='#ffffff18';ctx.font='700 15px sans-serif';ctx.fillText('제1병실',x+60,y+72);ctx.restore();return;}
 if(z.subzone){ctx.save();ctx.globalAlpha=z.active?.10:.045;ctx.fillStyle=z.tint;ctx.fillRect(x,y,w,h);ctx.strokeStyle=z.active?'#ffffff12':'#ffffff08';ctx.setLineDash([10,12]);ctx.strokeRect(x+.5,y+.5,w-1,h-1);ctx.setLineDash([]);ctx.restore();}
}

function drawLandmark(l,s){
 ctx.save();ctx.translate(s.x,s.y);ctx.rotate(l.rot);ctx.globalAlpha=.30;
 if(l.type==='bed'){ctx.fillStyle='#5c5555';ctx.fillRect(-l.r,-l.r*.35,l.r*2,l.r*.7);ctx.fillStyle='#7d7777';ctx.fillRect(-l.r*.85,-l.r*.28,l.r*.5,l.r*.56);ctx.strokeStyle='#948989';ctx.strokeRect(-l.r,-l.r*.35,l.r*2,l.r*.7);}
 if(l.type==='table'){ctx.fillStyle='#574d49';ctx.fillRect(-l.r,-l.r*.22,l.r*2,l.r*.44);ctx.fillRect(-l.r*.75,l.r*.15,6,l.r*.7);ctx.fillRect(l.r*.65,l.r*.15,6,l.r*.7);}
 if(l.type==='tank'){ctx.fillStyle='#31484a';ctx.fillRect(-l.r*.55,-l.r,l.r*1.1,l.r*2);ctx.strokeStyle='#87aeb0';ctx.strokeRect(-l.r*.55,-l.r,l.r*1.1,l.r*2);}
 if(l.type==='curtain'){ctx.globalAlpha=.22;ctx.strokeStyle='#a29a93';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-l.r,0);ctx.lineTo(l.r,0);ctx.stroke();ctx.globalAlpha=.15;ctx.strokeStyle='#d3ccc4';ctx.lineWidth=1;for(let k=-4;k<=4;k++){const x=k*l.r/4;ctx.beginPath();ctx.moveTo(x,-8);ctx.lineTo(x+Math.sin(k)*5,8);ctx.stroke();}}
 if(l.type==='desk'){ctx.globalAlpha=.36;ctx.fillStyle='#67615d';ctx.fillRect(-l.r,-l.r*.30,l.r*2,l.r*.60);ctx.fillStyle='#363231';ctx.fillRect(-l.r*.78,-l.r*.16,l.r*1.56,l.r*.32);ctx.strokeStyle='#8e8782';ctx.strokeRect(-l.r,-l.r*.30,l.r*2,l.r*.60);}
 if(l.type==='screen'){ctx.globalAlpha=.38;ctx.fillStyle='#293333';ctx.fillRect(-l.r*.48,-l.r*.72,l.r*.96,l.r*1.18);ctx.fillStyle='#6f8582';ctx.fillRect(-l.r*.36,-l.r*.58,l.r*.72,l.r*.52);}
 if(l.type==='corpse'){ctx.fillStyle='#6d5d58';ctx.beginPath();ctx.ellipse(0,0,l.r*.9,l.r*.35,0,0,Math.PI*2);ctx.fill();}
 if(l.type==='organ'){ctx.fillStyle='#6e2832';ctx.beginPath();ctx.arc(0,0,l.r*.55,0,Math.PI*2);ctx.fill();}
 if(l.type==='blood'){ctx.fillStyle='#5f1f27';ctx.beginPath();ctx.ellipse(0,0,l.r,l.r*.55,0,0,Math.PI*2);ctx.fill();}
 ctx.restore();ctx.globalAlpha=1;
}

function drawObject(o,s){ctx.save();const staticWall=o.type==='wall',breakable=isBreakableProp(o),jolt=o.hitJolt>0?Math.sin((elapsed+o.id)*102)*2.2*(o.hitJolt/.22):0;ctx.translate(s.x+jolt,s.y);ctx.globalAlpha=staticWall?1:(o.flash>0?.75:1);if(staticWall){ctx.fillStyle='#685656';ctx.fillRect(0,0,o.w,o.h);ctx.fillStyle=o.zoneActive?'#4b3d3d':'#352f30';ctx.fillRect(2,2,Math.max(0,o.w-4),Math.max(0,o.h-4));ctx.restore();return;}
 if(o.type==='door'){if(o.bossDoor){const opening=bossIntroTimer>0?Math.min(1,bossCinematicAge/3.2):chapterFlags.bossStarted?1:0,gap=o.w*.42*opening;ctx.fillStyle='#3f4a4b';ctx.fillRect(0,0,o.w/2-gap/2,o.h);ctx.fillRect(o.w/2+gap/2,0,o.w/2-gap/2,o.h);ctx.fillStyle='#7e9595';ctx.fillRect(5,5,Math.max(0,o.w/2-gap/2-10),o.h-10);ctx.fillRect(o.w/2+gap/2+5,5,Math.max(0,o.w/2-gap/2-10),o.h-10);}else{ctx.fillStyle='#436064';ctx.fillRect(0,0,o.w,o.h);ctx.fillStyle='#8ac1c7';ctx.fillRect(8,5,o.w-16,o.h-10);}}
 if(o.type==='bed'){ctx.fillStyle='#716d68';ctx.fillRect(0,0,o.w,o.h);ctx.fillStyle='#c8c0ae';ctx.fillRect(8,6,34,o.h-12);ctx.strokeStyle='#ddd';ctx.strokeRect(0,0,o.w,o.h);}
 if(o.type==='table'){ctx.fillStyle='#6d736f';ctx.fillRect(0,0,o.w,o.h);ctx.strokeStyle='#b7c0ba';ctx.strokeRect(0,0,o.w,o.h);ctx.fillStyle='#343936';ctx.fillRect(12,10,o.w-24,o.h-20);}
 if(o.type==='medicine'){ctx.fillStyle='#e3e5df';ctx.fillRect(0,0,o.w,o.h);ctx.fillStyle='#50795d';ctx.fillRect(o.w/2-4,8,8,o.h-16);ctx.fillRect(10,o.h/2-4,o.w-20,8);}
 if(o.type==='medicalCart'){ctx.fillStyle='#777b78';ctx.fillRect(0,4,o.w,o.h-9);ctx.fillStyle='#a9afaa';ctx.fillRect(3,1,o.w-6,7);ctx.fillStyle='#292d2b';ctx.fillRect(6,13,o.w-12,3);ctx.fillStyle='#555';ctx.beginPath();ctx.arc(8,o.h-3,4,0,Math.PI*2);ctx.arc(o.w-8,o.h-3,4,0,Math.PI*2);ctx.fill();}
 if(o.type==='wasteBin'){ctx.fillStyle='#59635f';ctx.fillRect(2,4,o.w-4,o.h-4);ctx.fillStyle='#7f8984';ctx.fillRect(0,1,o.w,7);ctx.fillStyle='#242927';ctx.fillRect(6,11,o.w-12,4);}
 if(o.type==='smallCabinet'){ctx.fillStyle='#85827a';ctx.fillRect(0,0,o.w,o.h);ctx.fillStyle='#5a5853';ctx.fillRect(o.w/2-1,3,2,o.h-6);ctx.fillStyle='#c5beb0';ctx.fillRect(o.w/2-6,o.h/2-1,3,3);ctx.fillRect(o.w/2+3,o.h/2-1,3,3);}
 if(breakable&&Math.hypot(player.x-(o.x+o.w/2),player.y-(o.y+o.h/2))<135){const pulse=.5+.5*Math.sin(elapsed*4.2+o.id*17);ctx.globalAlpha=.10+.07*pulse;ctx.strokeStyle='#ddd7ca';ctx.lineWidth=1;ctx.strokeRect(-1,-1,o.w+2,o.h+2);ctx.globalAlpha=1;}
 if(breakable&&o.damageStage>0){ctx.strokeStyle='#2c2020';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(o.w*.22,o.h*.18);ctx.lineTo(o.w*.42,o.h*.42);ctx.lineTo(o.w*.33,o.h*.66);if(o.damageStage>1){ctx.moveTo(o.w*.72,o.h*.12);ctx.lineTo(o.w*.56,o.h*.40);ctx.lineTo(o.w*.76,o.h*.72);}ctx.stroke();}
 if(o.type==='bloodTank'){ctx.fillStyle='#681f2b';ctx.fillRect(0,0,o.w,o.h);ctx.strokeStyle='#e26b77';ctx.lineWidth=3;ctx.strokeRect(0,0,o.w,o.h);ctx.fillStyle='#f4a4aa';ctx.fillRect(8,10,o.w-16,9);}
 if(o.type==='eventOrganBrain'){ctx.fillStyle='#3d3348';ctx.fillRect(0,0,o.w,o.h);ctx.strokeStyle='#c58be1';ctx.lineWidth=3;ctx.strokeRect(0,0,o.w,o.h);ctx.font='23px sans-serif';ctx.fillText('🧠',o.w/2-13,o.h/2+8);}
 if(o.type==='transfusionPump'||o.type==='eventOrganHeart'){ctx.fillStyle='#541d27';ctx.fillRect(0,0,o.w,o.h);ctx.strokeStyle='#e77682';ctx.lineWidth=3;ctx.strokeRect(0,0,o.w,o.h);ctx.fillStyle='#d74c5e';ctx.beginPath();ctx.arc(o.w/2,o.h/2,Math.min(o.w,o.h)*.20,0,Math.PI*2);ctx.fill();}
 if(o.type==='transplantStation'){const ready=organCount(organStored)>0,pulse=.5+.5*Math.sin(elapsed*5);ctx.fillStyle=ready?'#e7e2d4':'#827a70';ctx.fillRect(0,10,o.w,o.h-10);ctx.strokeStyle=ready?'#fff':'#aaa';ctx.lineWidth=2;ctx.strokeRect(0,10,o.w,o.h-10);ctx.fillStyle='#251d1d';ctx.fillRect(9,18,o.w-18,o.h-26);ctx.fillStyle=ready?'#fff':'#bbb';ctx.font='bold 12px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('이식',o.w/2,10+(o.h-10)/2);ctx.textAlign='left';ctx.textBaseline='alphabetic';if(ready){ctx.globalAlpha=.45+.35*pulse;ctx.strokeStyle='#fff';ctx.strokeRect(-3,-3,o.w+6,o.h+6);ctx.globalAlpha=1;}}
 if(o.type==='eventOrganStomach'){ctx.fillStyle='#4c4725';ctx.fillRect(0,0,o.w,o.h);ctx.strokeStyle='#e0c55d';ctx.lineWidth=3;ctx.strokeRect(0,0,o.w,o.h);ctx.fillStyle='#17160d';ctx.beginPath();ctx.ellipse(o.w/2,o.h/2,Math.min(o.w,o.h)*.25,Math.min(o.w,o.h)*.16,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#e0c55d';ctx.stroke();}
 if(o.eventTarget){const pulse=.5+.5*Math.sin(elapsed*8);ctx.strokeStyle='#fff';ctx.globalAlpha=.6+.4*pulse;ctx.lineWidth=2;ctx.strokeRect(-4-pulse*2,-4-pulse*2,o.w+8+pulse*4,o.h+8+pulse*4);ctx.globalAlpha=1;}
 if(o.flash>0){ctx.globalAlpha=Math.min(.68,o.flash*3.8);ctx.strokeStyle='#fff';ctx.lineWidth=2.2;ctx.strokeRect(-2,-2,o.w+4,o.h+4);ctx.globalAlpha=1;}ctx.restore();}

function drawClotField(f){if(!inViewWorld(f.x,f.y,f.r,30))return;const s=worldToScreen(f.x,f.y),t=Math.max(0,f.life/f.maxLife),fade=Math.min(1,t*3),burst=!!f.groupId,pop=f.pop>0?1-f.pop/(burst ? .12 : .16):1,breath=burst ? 1+Math.sin(elapsed*1.18+f.breathPhase)*.018:1;ctx.save();ctx.translate(s.x,s.y);ctx.rotate(f.angle);const appear=burst ? .95+.05*Math.max(0,Math.min(1,pop)) : 1;ctx.scale(f.rx/f.r*appear*breath,f.ry/f.r*appear*breath);ctx.globalAlpha=(f.kind==='pool'?(burst ? .36 : .48):.34)*fade;ctx.fillStyle=f.kind==='pool'?'#4f0d18':'#651321';ctx.beginPath();const points=f.kind==='pool' ? (burst ? 18 : 14) : 10,base=burst ? .966 : .86,staticAmp=burst ? .016 : .10,motionAmp=burst ? .014 : .05,edgeRate=burst ? 1.05 : (f.kind==='pool'?2.6:1.2);for(let i=0;i<points;i++){const a=i/points*Math.PI*2,rr=f.r*(base+staticAmp*Math.sin(f.seed+i*2.17)+motionAmp*Math.sin(elapsed*edgeRate+f.microPhase+i*.82));const x=Math.cos(a)*rr,y=Math.sin(a)*rr;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.closePath();ctx.fill();ctx.globalAlpha=(f.kind==='pool'?(burst ? .21 : .30):.20)*fade;ctx.fillStyle='#8f2031';ctx.beginPath();ctx.ellipse(-f.r*.12,f.r*.02,f.r*.48,f.r*.28,.18,0,Math.PI*2);ctx.fill();if(f.kind==='pool'){ctx.globalAlpha=(burst ? .32 : .42)*fade;ctx.strokeStyle=f.burstIndex===3?'#c84d5f':'#b43b4c';ctx.lineWidth=burst ? 1.05 : (f.burstIndex===3?1.45:1.2);for(let i=0;i<3;i++){const phase=elapsed*(burst ? .95 : 1.8+i*.35)+f.seed+i*2.1,bx=Math.sin(f.seed+i*4.2)*f.r*.38,by=Math.cos(f.seed*.7+i*3.1)*f.r*.22-Math.sin(phase)*f.r*(burst ? .035 : .08),br=2.2+1.1*(.5+.5*Math.sin(phase));ctx.beginPath();ctx.arc(bx,by,br,0,Math.PI*2);ctx.stroke();}}ctx.restore();ctx.globalAlpha=1;}

function drawClotCritFx(f){
 if(!inViewWorld(f.x,f.y,f.r,30))return;const s=worldToScreen(f.x,f.y),t=Math.max(0,f.life/f.maxLife),age=1-t,appear=Math.min(1,age/.10),fade=Math.min(1,t*4),contract=1-age*.11+Math.sin(elapsed*22+f.phase)*.018;
 ctx.save();ctx.translate(s.x,s.y);ctx.rotate(f.phase*.18);ctx.scale(contract,contract*.72);ctx.globalAlpha=.52*appear*fade;ctx.fillStyle='#3d0710';ctx.beginPath();const points=13;for(let i=0;i<points;i++){const a=i/points*Math.PI*2,rr=f.r*(.91+.045*Math.sin(i*2.31+f.phase)+.025*Math.sin(elapsed*9+i));const x=Math.cos(a)*rr,y=Math.sin(a)*rr;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.closePath();ctx.fill();ctx.globalAlpha=.48*appear*fade;ctx.strokeStyle='#9f2639';ctx.lineWidth=1.35;ctx.stroke();ctx.globalAlpha=.30*appear*fade;ctx.fillStyle='#8b172a';ctx.beginPath();ctx.ellipse(-f.r*.12,-f.r*.05,f.r*.54,f.r*.28,.14,0,Math.PI*2);ctx.fill();
 if(t<.42){const crackAlpha=(.42-t)/.42*fade;ctx.globalAlpha=crackAlpha*.72;ctx.strokeStyle='#c65a68';ctx.lineWidth=1;for(let k=0;k<3;k++){const a=f.crack+k*2.07,inner=f.r*.14,outer=f.r*(.48+k*.06);ctx.beginPath();ctx.moveTo(Math.cos(a)*inner,Math.sin(a)*inner);ctx.lineTo(Math.cos(a+.16)*outer*.62,Math.sin(a+.16)*outer*.62);ctx.lineTo(Math.cos(a-.08)*outer,Math.sin(a-.08)*outer);ctx.stroke();}}
 ctx.restore();ctx.globalAlpha=1;
}

function drawClotReleaseFx(f){if(!inViewWorld(f.x,f.y,f.r,30))return;const s=worldToScreen(f.x,f.y),t=Math.max(0,f.life/f.maxLife),age=1-t,rr=f.r*(.75+age*.55);ctx.save();ctx.translate(s.x,s.y);ctx.rotate(f.phase||0);ctx.globalAlpha=t*.62;ctx.strokeStyle='#a93a4c';ctx.lineWidth=1.4;ctx.beginPath();ctx.arc(0,0,rr,0,Math.PI*2);ctx.stroke();for(let i=0;i<5;i++){const a=i/5*Math.PI*2,inner=f.r*.38,outer=rr*(.82+age*.34);ctx.beginPath();ctx.moveTo(Math.cos(a)*inner,Math.sin(a)*inner*.72);ctx.lineTo(Math.cos(a+.12)*outer,Math.sin(a+.12)*outer*.72);ctx.stroke();}ctx.restore();ctx.globalAlpha=1;}

function drawFractureBone(len,shaftW,{alpha=1,stroke=true,crit=false,impacted=false,bend=0}={}){
 const midBend=bend,tipBend=bend*.24;ctx.save();ctx.globalAlpha*=alpha;ctx.fillStyle='#cdbda1';ctx.strokeStyle='#4d4036';ctx.lineWidth=2.2;ctx.beginPath();ctx.moveTo(12,-shaftW*.80);ctx.bezierCurveTo(len*.32,-shaftW*.50+midBend*.55,len*.67,-shaftW*.58+midBend,len-20,-shaftW*.76+tipBend);ctx.lineTo(len-7,-shaftW*.34+tipBend);ctx.lineTo(len-7,shaftW*.34+tipBend);ctx.lineTo(len-20,shaftW*.76+tipBend);ctx.bezierCurveTo(len*.67,shaftW*.58+midBend,len*.32,shaftW*.50+midBend*.55,12,shaftW*.80);ctx.closePath();ctx.fill();if(stroke)ctx.stroke();
 ctx.fillStyle='#e0d3bc';ctx.beginPath();ctx.ellipse(11,0,14,shaftW*1.22,0,0,Math.PI*2);ctx.fill();if(stroke)ctx.stroke();ctx.beginPath();ctx.ellipse(len-7,-shaftW*.53+tipBend,11,shaftW*.76,-.12,0,Math.PI*2);ctx.ellipse(len-7,shaftW*.53+tipBend,11,shaftW*.76,.12,0,Math.PI*2);ctx.fill();if(stroke)ctx.stroke();ctx.fillStyle='#76514d';ctx.beginPath();ctx.ellipse(11,0,4.5,shaftW*.36,0,0,Math.PI*2);ctx.fill();
 if(crit&&impacted){ctx.strokeStyle='#9f4147';ctx.lineWidth=1.7;for(const k of [.46,.60,.73]){const x=len*k,by=midBend*Math.sin(k*Math.PI);ctx.beginPath();ctx.moveTo(x,-shaftW*.58+by);ctx.lineTo(x+6,-1+by);ctx.lineTo(x-2,shaftW*.53+by);ctx.stroke();}}
 ctx.restore();
}
function fractureStrikeRotation(cocked,contact,q,impactQ=.91){
 q=Math.max(0,Math.min(1,q));const t=Math.min(1,q/impactQ),e=Math.pow(t,3.05);return cocked+(contact-cocked)*e;
}
function fractureRecoveryRotation(contact,follow,rest,q,followPhase=.30){
 q=Math.max(0,Math.min(1,q));if(q<=followPhase){const t=q/followPhase,e=1-Math.pow(1-t,2.25);return contact+(follow-contact)*e;}const t=(q-followPhase)/(1-followPhase),returnT=Math.max(0,(t-.12)/.88),e=returnT*returnT*(3-2*returnT);return follow+(rest-follow)*e;
}
function fracturePose(a){
 const age=a.age||0,base=Math.atan2(a.uy,a.ux),side=a.side||1,lift=a.lift||.43,hold=a.hold||.11,strike=a.strike||.15,recovery=a.recovery||.50,impactQ=a.impactQ||.91,followPhase=.34,rest=base+side*.30,cocked=base-side*2.50,contact=base-side*.035,follow=base+side*1.51;let rot=rest,lenScale=.82,alpha=Math.min(1,age/.055),strikeProgress=0,recoveryProgress=0,drive=0,motionBlur=0,impactPulse=0,bend=0,trail1=rest,trail2=rest,trail3=rest;
 if(age<lift){const q=Math.max(0,Math.min(1,age/lift)),e=q*q*(3-2*q),settle=Math.sin(q*Math.PI)*.022;rot=rest+(cocked-rest)*e+side*settle;lenScale=.79+.18*e;drive=-10*e;trail1=trail2=trail3=rot;}
 else if(age<lift+hold){const q=(age-lift)/hold,tremor=Math.sin(age*49)*(.022-.010*q);rot=cocked+side*tremor;lenScale=.97+Math.sin(q*Math.PI)*.010;drive=-10;trail1=trail2=trail3=rot;}
 else if(age<lift+hold+strike){const q=Math.max(0,Math.min(1,(age-lift-hold)/strike)),pre=Math.min(1,q/impactQ),post=Math.max(0,(q-impactQ)/(1-impactQ));strikeProgress=q;rot=fractureStrikeRotation(cocked,contact,q,impactQ)+side*.055*post;trail1=fractureStrikeRotation(cocked,contact,Math.max(0,q-.050),impactQ);trail2=fractureStrikeRotation(cocked,contact,Math.max(0,q-.105),impactQ);trail3=fractureStrikeRotation(cocked,contact,Math.max(0,q-.165),impactQ);lenScale=.97+.075*Math.sin(Math.min(1,q/.90)*Math.PI);drive=-10+48*Math.pow(pre,2.45)+3*post;motionBlur=q<=impactQ?Math.sin(pre*Math.PI)*1.06:(1-post)*.24;impactPulse=Math.max(0,1-Math.abs(q-impactQ)/.095);bend=-side*9.2*impactPulse;alpha*=Math.max(.50,1-motionBlur*.42);}
 else{const q=Math.max(0,Math.min(1,(age-lift-hold-strike)/recovery));recoveryProgress=q;rot=fractureRecoveryRotation(contact,follow,rest,q,followPhase);trail1=fractureRecoveryRotation(contact,follow,rest,Math.max(0,q-.038),followPhase);trail2=fractureRecoveryRotation(contact,follow,rest,Math.max(0,q-.078),followPhase);trail3=fractureRecoveryRotation(contact,follow,rest,Math.max(0,q-.118),followPhase);const followT=Math.min(1,q/followPhase),returnT=Math.max(0,(q-followPhase)/(1-followPhase));lenScale=1.025-.225*Math.pow(returnT,1.15);drive=40+5*Math.sin(followT*Math.PI)-31*Math.pow(returnT,1.12);motionBlur=q<followPhase?(1-followT)*.46:0;alpha*=1-q*.78;}
 return{age,base,side,lift,hold,strike,recovery,impactQ,followPhase,rest,cocked,contact,follow,struck:follow,rot,lenScale,alpha,strikeProgress,recoveryProgress,drive,motionBlur,impactPulse,bend,trail1,trail2,trail3};
}
function draw(){ctx.save();renderCamera.x=Math.round(camera.x*DPR)/DPR;renderCamera.y=Math.round(camera.y*DPR)/DPR;ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.setLineDash([]);ctx.clearRect(0,0,W,H);ctx.fillStyle='#181212';ctx.fillRect(0,0,W,H);const shakeX=cameraShake>0?Math.round((Math.random()-.5)*cameraShake):0,shakeY=cameraShake>0?Math.round((Math.random()-.5)*cameraShake):0;if(shakeX||shakeY)ctx.translate(shakeX,shakeY);
 screenPointIndex=0;
 const grid=qualityLevel===2?128:64,ox=(((-renderCamera.x+W/2)%grid)+grid)%grid,oy=(((-renderCamera.y+H/2)%grid)+grid)%grid;
 ctx.strokeStyle='#292020';ctx.lineWidth=1;
 for(let x=ox-grid;x<W+grid;x+=grid){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
 for(let y=oy-grid;y<H+grid;y+=grid){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
 for(const z of zones)drawRoom(z);
 for(const h of hazards){const s=worldToScreen(h.x,h.y);ctx.globalAlpha=.25+.1*Math.sin(elapsed*8);ctx.fillStyle='#6b6d29';ctx.beginPath();ctx.arc(s.x,s.y,h.r,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}
 for(const f of clotFields)drawClotField(f);for(const f of clotCritFx)drawClotCritFx(f);for(const f of clotReleaseFx)drawClotReleaseFx(f);
 for(const c of corpses){if(!inViewWorld(c.x,c.y,c.r))continue;const s=worldToScreen(c.x,c.y);ctx.fillStyle='#594945';ctx.beginPath();ctx.ellipse(s.x,s.y,c.r*1.3,c.r*.55,0,0,Math.PI*2);ctx.fill();}
 for(const l of landmarks){const s=worldToScreen(l.x,l.y);if(s.x<-120||s.x>W+120||s.y<-120||s.y>H+120)continue;drawLandmark(l,s);}
 for(const o of objects){if(!o.active||o.render===false)continue;const s=worldToScreen(o.x,o.y);if(s.x+o.w<-160||s.x>W+160||s.y+o.h<-160||s.y>H+160)continue;drawObject(o,s);}
 for(const d of organDrops){if(!inViewWorld(d.x,d.y,d.r,30))continue;const sp=worldToScreen(d.x,d.y),def=ORGAN_DEFS[d.slot],rr=d.r+Math.sin(elapsed*5+d.pulse)*.8;ctx.globalAlpha=.25;ctx.fillStyle=def.color;ctx.beginPath();ctx.arc(sp.x,sp.y,rr+6,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;ctx.fillStyle=def.color;ctx.beginPath();ctx.moveTo(sp.x,sp.y-rr);ctx.lineTo(sp.x+rr,sp.y);ctx.lineTo(sp.x,sp.y+rr);ctx.lineTo(sp.x-rr,sp.y);ctx.closePath();ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=1.8;ctx.stroke();ctx.fillStyle='#151212';ctx.font='bold 10px sans-serif';ctx.textAlign='center';ctx.fillText(def.short,sp.x,sp.y+3);ctx.textAlign='left';}
 for(const o of pickups){if(!inViewWorld(o.x,o.y,o.r,20))continue;const sp=worldToScreen(o.x,o.y),pulse=1+Math.sin(elapsed*4+o.pulse)*.06;ctx.save();ctx.translate(sp.x,sp.y);ctx.scale(pulse,pulse);if(o.type==='specimen'){ctx.globalAlpha=.30;ctx.fillStyle='#d7a7b4';ctx.beginPath();ctx.arc(0,0,14,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;ctx.fillStyle='#d8d1cb';ctx.strokeStyle='#7d4f5c';ctx.lineWidth=1.5;ctx.fillRect(-5,-9,10,17);ctx.strokeRect(-5,-9,10,17);ctx.fillStyle='#8f344b';ctx.fillRect(-3,-5,6,9);ctx.fillStyle='#eee';ctx.fillRect(-3,-12,6,4);}else if(o.type==='water'){ctx.fillStyle='#655f43';ctx.strokeStyle='#a39a70';ctx.beginPath();ctx.ellipse(0,2,11,7,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#34372d';ctx.fillRect(-5,-9,10,10);}else if(o.type==='magnet'){ctx.strokeStyle='#9ac4c9';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,10,Math.PI*.18,Math.PI*.82);ctx.stroke();ctx.beginPath();ctx.arc(0,0,6,Math.PI*1.18,Math.PI*1.82);ctx.stroke();ctx.fillStyle='#64777a';ctx.fillRect(-10,-3,5,9);ctx.fillRect(5,-3,5,9);}else{ctx.fillStyle='#d9d9d4';ctx.strokeStyle='#7d8584';ctx.lineWidth=1.5;ctx.fillRect(-10,-8,20,16);ctx.strokeRect(-10,-8,20,16);ctx.fillStyle='#2a3435';ctx.fillRect(-6,-4,12,5);ctx.fillStyle='#cf4f57';ctx.fillRect(-7,3,5,3);ctx.fillStyle='#79a7aa';ctx.fillRect(2,3,5,3);ctx.strokeStyle='#b7c7c8';ctx.beginPath();ctx.moveTo(-8,8);ctx.quadraticCurveTo(-14,13,-6,15);ctx.moveTo(8,8);ctx.quadraticCurveTo(14,13,6,15);ctx.stroke();}ctx.restore();}
 for(const o of orbs){if(!inViewWorld(o.x,o.y,o.r))continue;const sp=worldToScreen(o.x,o.y),rr=o.r+Math.sin(elapsed*5+o.pulse)*.35,col=xpOrbColor(o.v);ctx.globalAlpha=.18;ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(sp.x,sp.y-rr-2);ctx.lineTo(sp.x+rr+2,sp.y);ctx.lineTo(sp.x,sp.y+rr+2);ctx.lineTo(sp.x-rr-2,sp.y);ctx.closePath();ctx.fill();ctx.globalAlpha=1;ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(sp.x,sp.y-rr);ctx.lineTo(sp.x+rr,sp.y);ctx.lineTo(sp.x,sp.y+rr);ctx.lineTo(sp.x-rr,sp.y);ctx.closePath();ctx.fill();ctx.strokeStyle='#ffffffcc';ctx.lineWidth=o.v>=10?1.8:1;ctx.stroke();ctx.fillStyle='#fff';ctx.fillRect(sp.x-1,sp.y-1,2,2);if(o.v>=10){ctx.strokeStyle='#ffffffaa';ctx.beginPath();ctx.arc(sp.x,sp.y,rr+2.5,0,Math.PI*2);ctx.stroke();}}
 for(const s0 of enemyShots){if(!inViewWorld(s0.x,s0.y,s0.r))continue;const s=worldToScreen(s0.x,s0.y);ctx.fillStyle='#b779d4';ctx.beginPath();ctx.arc(s.x,s.y,s0.r,0,Math.PI*2);ctx.fill();}
 for(const w of waves){if((w.delay||0)>0||!inViewWorld(w.x,w.y,w.max))continue;const s=worldToScreen(w.x,w.y),life=w.maxLife||.42,echo=w.echoDepth||0;ctx.globalAlpha=Math.max(0,w.life/life)*(echo?(.84-echo*.10):1);ctx.strokeStyle=w.crit?(echo?'#ffd1a1':'#ffe08a'):(echo?'#ef7180':'#d94f5f');ctx.lineWidth=(w.crit?(echo?6.6:8):(echo?4.8:6))*SCALE.effect;ctx.beginPath();ctx.arc(s.x,s.y,w.r,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;}for(const f of shockFx){const s=worldToScreen(f.x,f.y),ang=Math.atan2(f.uy,f.ux),t=Math.max(0,f.life/f.maxLife);ctx.save();ctx.translate(s.x,s.y);ctx.rotate(ang);ctx.globalAlpha=t*.78;ctx.fillStyle='#9ed9dc22';ctx.strokeStyle='#d8ffff';ctx.lineWidth=2.4;ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,f.range,-f.halfAngle,f.halfAngle);ctx.closePath();ctx.fill();ctx.stroke();ctx.strokeStyle='#8fd5da';ctx.lineWidth=1.3;for(let k=-2;k<=2;k++){const a=k*f.halfAngle/2.3;ctx.beginPath();ctx.moveTo(7,0);for(let n=1;n<=5;n++){const rr=f.range*n/5,j=(n%2?8:-7)*(1-Math.abs(k)/3);ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr+j);}ctx.stroke();}ctx.restore();ctx.globalAlpha=1;}
 const playerScreen=worldToScreen(player.x,player.y);
 for(const f of leechFx){const a=worldToScreen(f.x,f.y),b=worldToScreen(f.tx,f.ty),t=Math.max(0,f.life/f.maxLife);ctx.globalAlpha=t;ctx.strokeStyle='#ff4268';ctx.lineWidth=(2+3*t)*SCALE.effect;ctx.beginPath();ctx.moveTo(a.x,a.y);const mx=(a.x+b.x)/2+Math.sin(elapsed*19+f.x)*12,my=(a.y+b.y)/2+Math.cos(elapsed*17+f.y)*12;ctx.quadraticCurveTo(mx,my,b.x,b.y);ctx.stroke();ctx.globalAlpha=1;}
 for(const f of brainLinks){const a=worldToScreen(f.x,f.y),b=worldToScreen(f.tx,f.ty),t=Math.max(0,f.life/f.maxLife);ctx.globalAlpha=t*.9;ctx.strokeStyle=ORGAN_DEFS.brain.color;ctx.lineWidth=(1.5+2*t)*SCALE.effect;ctx.setLineDash([5,4]);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;}
 for(let si=0;si<slashes.length;si++){
  const a=slashes[si];if(a.kind!=='fracture')continue;const ps=worldToScreen(a.x,a.y),p=fracturePose(a),len=a.range*.92*p.lenScale,shaftW=10+weapons.bone.level*.38,anchorSide=p.side*(7+2*Math.min(1,p.age/p.lift)),ax=ps.x-Math.sin(p.base)*anchorSide+Math.cos(p.base)*p.drive,ay=ps.y+Math.cos(p.base)*anchorSide+Math.sin(p.base)*p.drive;
  ctx.save();ctx.translate(ax,ay);
  if(p.motionBlur>.035){const fade=p.motionBlur,ghosts=[[p.trail3,.075,.92,1.20],[p.trail2,.11,.95,1.28],[p.trail1,.16,.98,1.36]];ctx.save();ctx.globalCompositeOperation='screen';for(const [rot,opacity,scaleX,scaleY] of ghosts){ctx.save();ctx.globalAlpha=(a.crit?opacity*1.34:opacity)*fade;ctx.rotate(rot);ctx.scale(scaleX,scaleY);drawFractureBone(len*.98,shaftW,{alpha:1,stroke:false,crit:false,impacted:false,bend:0});ctx.restore();}const tipX=Math.cos(p.rot)*len,tipY=Math.sin(p.rot)*len,oldTipX=Math.cos(p.trail2)*len*.95,oldTipY=Math.sin(p.trail2)*len*.95;ctx.globalAlpha=(a.crit?.22:.14)*fade;ctx.strokeStyle=a.crit?'#f3dfb8':'#b39b78';ctx.lineWidth=shaftW*.34;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(oldTipX,oldTipY);ctx.lineTo(tipX,tipY);ctx.stroke();ctx.restore();}
  else if(p.recoveryProgress>0&&p.recoveryProgress<.16){ctx.save();ctx.globalAlpha=(a.crit?.14:.085)*(1-p.recoveryProgress/.16);ctx.rotate(p.contact-p.side*.06);ctx.scale(1.02,1.18);drawFractureBone(len,shaftW,{stroke:false});ctx.restore();}
  ctx.rotate(p.rot);ctx.scale(1-p.impactPulse*.022,1+p.impactPulse*.10);drawFractureBone(len,shaftW,{alpha:p.alpha,stroke:p.motionBlur<.42||p.impactPulse>.18||p.recoveryProgress>0,crit:a.crit,impacted:a.impacted,bend:p.bend});if(p.impactPulse>.04){ctx.globalAlpha=(a.crit?.58:.40)*p.impactPulse;ctx.fillStyle=a.crit?'#fff1cf':'#ead8b8';ctx.fillRect(len-18,-shaftW*1.08,5+4*p.impactPulse,shaftW*2.16);ctx.globalAlpha=1;}ctx.restore();ctx.globalAlpha=1;
 }
 for(const f of boneImpactFx){if(!inViewWorld(f.x,f.y,f.r,35))continue;const sp=worldToScreen(f.x,f.y),t=Math.max(0,f.life/f.maxLife),age=1-t;ctx.save();ctx.translate(sp.x,sp.y);ctx.rotate(f.angle||0);ctx.globalAlpha=t*(f.miss?.25:.86);ctx.strokeStyle=f.crit?'#f6e5c3':'#b39c79';ctx.fillStyle=f.crit?'#f3e4c62b':'#d8c6a322';ctx.lineWidth=f.crit?3.6:2.5;if(!f.miss){ctx.beginPath();ctx.ellipse(f.r*.18,0,f.r*(.48+age*.36),f.r*(.22+age*.14),0,0,Math.PI*2);ctx.fill();if(f.smash&&age<.52){ctx.globalAlpha*=1-age/.52;ctx.fillStyle=f.crit?'#fff4d8':'#ead8b8';ctx.fillRect(-f.r*.08,-(f.crit?3.2:2.3),f.r*(.96+age*.38),f.crit?6.4:4.6);ctx.globalAlpha=t*(f.miss?.25:.86);}}ctx.beginPath();ctx.arc(0,0,f.r*(.42+age*.78),-.98,.98);ctx.stroke();if(!f.miss){const rays=f.crit?12:7;for(let i=0;i<rays;i++){const a=-1.34+i/(rays-1)*2.68+(i%2?-.07:.07),r1=f.r*.18,r2=f.r*(.70+age*.66);ctx.beginPath();ctx.moveTo(Math.cos(a)*r1,Math.sin(a)*r1);ctx.lineTo(Math.cos(a)*r2,Math.sin(a)*r2);ctx.stroke();}}ctx.restore();ctx.globalAlpha=1;}
 for(const b of boneShards){if(!inViewWorld(b.x,b.y,b.r,24))continue;const sp=worldToScreen(b.x,b.y),t=Math.max(0,b.life/b.maxLife),fade=Math.min(1,t*2.6);ctx.save();ctx.translate(sp.x,sp.y);ctx.rotate(b.rot);ctx.globalAlpha=fade;ctx.fillStyle=b.crit?'#f0dfbf':'#cdbc9f';ctx.strokeStyle=b.crit?'#7a6650':'#57493d';ctx.lineWidth=1.1;ctx.beginPath();if(b.shape===0){ctx.moveTo(-b.r*2.1,-b.r*.45);ctx.lineTo(b.r*1.7,-b.r*.72);ctx.lineTo(b.r*2.2,b.r*.18);ctx.lineTo(-b.r*1.4,b.r*.72);}else if(b.shape===1){ctx.moveTo(-b.r*1.8,-b.r*.75);ctx.lineTo(b.r*2.3,-b.r*.18);ctx.lineTo(b.r*1.2,b.r*.70);ctx.lineTo(-b.r*2.2,b.r*.22);}else{ctx.moveTo(-b.r*2.2,0);ctx.lineTo(b.r*1.4,-b.r*.78);ctx.lineTo(b.r*2.0,b.r*.45);ctx.lineTo(-b.r*.8,b.r*.66);}ctx.closePath();ctx.fill();ctx.stroke();ctx.globalAlpha*=.42;ctx.strokeStyle='#fff4da';ctx.beginPath();ctx.moveTo(-b.r*.7,-b.r*.12);ctx.lineTo(b.r*.9,b.r*.08);ctx.stroke();ctx.restore();ctx.globalAlpha=1;}
 for(const p of projectiles){if(!inViewWorld(p.x,p.y,p.r,340))continue;const s=worldToScreen(p.x,p.y);if(p.kind==='blood'){const count=p.pathCount||0;if(count<2)continue;const birth=Math.min(1,p.age*8),death=Math.min(1,p.life/.20),fade=birth*death,branch=p.isBranch,pulse=1+.10*Math.sin(elapsed*7.2+p.phase)+.045*Math.sin(elapsed*15.1+p.phase*1.7),level=Math.max(1,weapons.blood.level);ctx.save();ctx.lineCap='round';ctx.lineJoin='round';for(let pass=0;pass<3;pass++){for(let n=count-2;n>=0;n--){const ax=p.path[n*2],ay=p.path[n*2+1],bx=p.path[(n+1)*2],by=p.path[(n+1)*2+1],a=worldToScreen(ax,ay),b=worldToScreen(bx,by),tail=n/Math.max(1,count-1),headSoft=n<2?.78+n*.10:1,taper=(.25+.75*(1-tail))*headSoft,localPulse=.92+.16*Math.sin(elapsed*(branch?9.8:7.8)+p.phase+n*.71)+.055*Math.sin(elapsed*3.7+p.crawlPhase-n*.43),base=p.r*pulse*taper*localPulse;ctx.beginPath();ctx.moveTo(a.x,a.y);const mx=(a.x+b.x)*.5,my=(a.y+b.y)*.5,dx=b.x-a.x,dy=b.y-a.y,l=Math.hypot(dx,dy)||1,wave=Math.sin(elapsed*(branch?8.2:5.4)+p.phase+n*.83)*(branch?1.45:1.8+level*.08),ox=-dy/l*wave,oy=dx/l*wave;ctx.quadraticCurveTo(mx+ox,my+oy,b.x,b.y);if(pass===0){ctx.globalAlpha=(branch?.08:.12)*fade;ctx.strokeStyle=p.crit?'#ff7181':'#ff3b55';ctx.lineWidth=base*(branch?1.85:2.15)+(branch?2.2:4.2);}else if(pass===1){ctx.globalAlpha=(branch?.72:.88)*fade;ctx.strokeStyle='#4b0712';ctx.lineWidth=base*(branch?1.20:1.38)+1.7;}else{ctx.globalAlpha=(branch?.82:.95)*fade;ctx.strokeStyle=p.crit?'#f25a70':p.critSource?'#da3e55':'#b91f38';ctx.lineWidth=Math.max(1.25,base*(branch?.58:.68));}ctx.stroke();}}
   ctx.globalAlpha=(branch?.18:.27)*fade;ctx.fillStyle=p.crit?'#ff9aa7':p.critSource?'#ed6a7b':'#d7495e';for(let n=2;n<count-1;n+=3){const q=worldToScreen(p.path[n*2],p.path[n*2+1]),tail=n/Math.max(1,count-1),body=.34+.16*Math.sin(elapsed*(branch?8.8:6.6)+p.phase+n*.91),rr=Math.max(.9,p.r*body*(1-tail*.58));ctx.beginPath();ctx.ellipse(q.x,q.y,rr*1.25,rr*.82,(p.phase+n)*.7,0,Math.PI*2);ctx.fill();}
   const tailIndex=count-1,tq=worldToScreen(p.path[tailIndex*2],p.path[tailIndex*2+1]);ctx.globalAlpha=(branch?.12:.20)*fade;ctx.fillStyle='#8d1428';for(let k=0;k<(branch?1:2);k++){const a=p.phase+k*2.4+elapsed*.9,rr=Math.max(.8,p.r*(.16+k*.07));ctx.beginPath();ctx.arc(tq.x+Math.cos(a)*(3+k*3),tq.y+Math.sin(a)*(2+k*2),rr,0,Math.PI*2);ctx.fill();}ctx.restore();ctx.globalAlpha=1;}else{ctx.fillStyle=p.crit?'#ffe08a':(p.kind==='bone'?'#e4dccf':p.kind==='shard'?'#ff8792':'#d34f58');if(p.kind==='bone'){ctx.save();ctx.translate(s.x,s.y);ctx.rotate(Math.atan2(p.vy,p.vx));ctx.fillRect(-9,-2.25,18,4.5);ctx.restore();}else{ctx.beginPath();ctx.arc(s.x,s.y,p.r,0,Math.PI*2);ctx.fill();}}}
 for(const f of bloodWrapFx){if(!inViewWorld(f.x,f.y,f.r,20))continue;const s=worldToScreen(f.x,f.y),t=Math.max(0,f.life/f.maxLife),open=(1-t)*1.15;ctx.save();ctx.translate(s.x,s.y);ctx.rotate(f.angle+open*.55);ctx.globalAlpha=Math.sin(Math.PI*t)*.86;ctx.strokeStyle=f.crit?'#ff8b9b':f.branch?'#cf3b50':'#e94b60';ctx.lineWidth=(f.branch?1.5:2.2)+(f.branch?1.4:2.2)*t;ctx.lineCap='round';for(let k=0;k<2;k++){ctx.beginPath();const rr=f.r+(1-k)*3;ctx.arc(0,0,rr,-2.55+open+k*.45,2.15-open*.35+k*.30);ctx.stroke();}ctx.fillStyle='#8f1628';ctx.globalAlpha*=.55;ctx.beginPath();ctx.ellipse(-f.r*.25,f.r*.12,4.2,2.2,.5,0,Math.PI*2);ctx.fill();ctx.restore();ctx.globalAlpha=1;}
 for(const d of deathFx){if(!inViewWorld(d.x,d.y,d.r))continue;const s=worldToScreen(d.x,d.y),t=Math.max(0,d.life/d.maxLife),p=1-t;ctx.save();ctx.translate(s.x,s.y);ctx.scale(1+p*.22,Math.max(.18,1-p*.82));ctx.globalAlpha=t;ctx.fillStyle=p<.45?'#fff':d.color;ctx.beginPath();ctx.arc(0,0,d.r,0,Math.PI*2);ctx.fill();ctx.restore();ctx.globalAlpha=1;}

 for(const a of unlockActors){if(!inViewWorld(a.x,a.y,a.r,40))continue;const s=worldToScreen(a.x,a.y),pulse=1+Math.sin(elapsed*3+a.pulse)*.05;ctx.save();ctx.translate(s.x,s.y);ctx.scale(pulse,pulse);ctx.globalAlpha=.90;ctx.fillStyle=a.kind==='residual'?'#9b7379':'#7e8986';if(a.kind==='residual'){ctx.beginPath();ctx.ellipse(0,4,16,11,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#cdb4b8';ctx.beginPath();ctx.moveTo(-10,-4);ctx.quadraticCurveTo(0,-15,11,-4);ctx.stroke();}else{ctx.fillRect(-13,-17,26,34);ctx.strokeStyle='#d0d6d4';ctx.strokeRect(-13,-17,26,34);ctx.fillStyle='#1b1b1b';ctx.fillRect(-8,-7,16,4);}ctx.restore();}
 for(const f of stitchFx){const a=worldToScreen(f.x,f.y),b=worldToScreen(f.tx,f.ty),t=Math.max(0,f.life/f.maxLife);ctx.save();ctx.globalAlpha=t;ctx.strokeStyle=f.mode==='close'?'#f0d6d8':'#d8b7b9';ctx.lineWidth=f.mode==='close'?2.8:1.5;ctx.setLineDash(f.mode==='close'?[]:[5,4]);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='#f0d6d8';ctx.fillRect(b.x-2,b.y-2,4,4);ctx.restore();}
 for(const f of incisionFx){const a=worldToScreen(f.x,f.y),alpha=Math.max(0,Math.min(1,f.life/.35));ctx.save();ctx.translate(a.x,a.y);ctx.rotate(Math.atan2(f.uy,f.ux));ctx.globalAlpha=f.triggered?alpha:.58;ctx.strokeStyle=f.triggered?'#f1e8e4':'#b19f9a';ctx.lineWidth=f.triggered?f.width:Math.max(2,f.width*.18);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(f.len,0);ctx.stroke();ctx.restore();}
 for(const h of bossHazards){const a=worldToScreen(h.x,h.y);ctx.save();ctx.translate(a.x,a.y);ctx.rotate(Math.atan2(h.uy,h.ux));ctx.globalAlpha=h.triggered?Math.max(0,h.life/.35):.52;ctx.strokeStyle=h.triggered?'#f4e9e3':'#8b7774';ctx.lineWidth=h.triggered?5:2;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(h.len,0);ctx.stroke();ctx.restore();}

 for(const e of enemies){
  if(!inViewWorld(e.x,e.y,e.r))continue;const s=worldToScreen(e.x,e.y);if(e.clotStun>0){const tremor=1.35+Math.min(1,e.clotStun/.2)*.75;s.x+=Math.sin(elapsed*74+e.clotStunPhase)*tremor;s.y+=Math.cos(elapsed*61+e.clotStunPhase*1.7)*tremor*.58;}if(e.wallStun>0){const tremor=1.15+Math.min(1,e.wallStun/.22)*.55;s.x+=Math.sin(elapsed*96+e.wallStunPhase)*tremor;s.y+=Math.cos(elapsed*83+e.wallStunPhase*1.6)*tremor*.54;}
  const flying=e.boneLaunchDuration>0,flightQ=flying?Math.min(1,(e.boneLaunchAge||0)/e.boneLaunchDuration):0,flightAngle=Math.atan2(e.boneLaunchNy||0,e.boneLaunchNx||1);ctx.save();ctx.translate(s.x,s.y);if(e.wallStun>0&&e.wallStunMax>0){const impactAge=Math.max(0,e.wallStunMax-e.wallStun),squash=Math.max(0,1-impactAge/.10),wa=e.wallStunAngle||0;ctx.rotate(wa);ctx.scale(1-.12*squash,1+.15*squash);ctx.rotate(-wa);}if(flying){ctx.rotate(flightAngle);ctx.scale(1.18-.10*flightQ,.78+.16*flightQ);ctx.globalAlpha=.22*(1-flightQ*.45);ctx.fillStyle=e.boneLaunchCrit?'#ead8b9':'#8f7864';ctx.beginPath();ctx.ellipse(-e.r*1.35,0,e.r*.88,e.r*.56,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}
  if(e.type==='collector'){const dmg=1-e.hp/e.maxHp;ctx.rotate(e.action==='charging'?Math.atan2(e.chargeY,e.chargeX):0);ctx.fillStyle=e.flash>0?'#fff':'#5f4641';ctx.fillRect(-e.r*1.15,-e.r*.62,e.r*2.3,e.r*1.24);ctx.fillStyle='#342d2b';ctx.fillRect(-e.r*.75,e.r*.40,e.r*1.5,e.r*.42);ctx.strokeStyle='#9b8580';ctx.lineWidth=3;ctx.strokeRect(-e.r*1.15,-e.r*.62,e.r*2.3,e.r*1.24);ctx.fillStyle='#77524d';ctx.beginPath();ctx.arc(-e.r*.65,-e.r*.30,e.r*(.48-dmg*.08),0,Math.PI*2);ctx.fill();ctx.fillStyle='#6e7772';for(let k=0;k<3;k++){ctx.globalAlpha=k<Math.floor(dmg*4)?.25:1;ctx.fillRect(e.r*.10+k*12,-e.r*.52,8,e.r*.65);}ctx.globalAlpha=1;if(e.action==='slam'){ctx.strokeStyle='#c7a39c';ctx.lineWidth=4;ctx.beginPath();ctx.arc(-e.r*.65,-e.r*.30,e.r*.75,0,Math.PI*2);ctx.stroke();}ctx.restore();continue;}
  if(e.type==='parasite'){ctx.globalAlpha=.28+.18*Math.sin(elapsed*7+e.x);ctx.strokeStyle='#dba4ff';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,e.r+5,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;}ctx.fillStyle=e.flash>0?'#fff':e.color;ctx.beginPath();ctx.arc(0,0,e.r,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#241414';ctx.lineWidth=1;ctx.stroke();if(e.anomaly||e.type==='fat'){ctx.strokeStyle=e.anomaly?'#f0c56a':'#ead9c7';ctx.lineWidth=e.anomaly?1.4:1.6;ctx.stroke();if(e.type==='fat'&&!e.anomaly){ctx.globalAlpha=.6;ctx.strokeStyle='#2a1512';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,Math.max(2,e.r-5),0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;}}if(e.clotStun>0){ctx.globalAlpha=.72;ctx.strokeStyle='#8f1d31';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,e.r+3+Math.sin(elapsed*28+e.clotStunPhase)*1.2,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;}if(e.charm>0){ctx.globalAlpha=.82;ctx.strokeStyle=ORGAN_DEFS.brain.color;ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,e.r+4+Math.sin(elapsed*8+e.x)*1.5,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#f0d8ff';ctx.fillRect(-e.r*.36,-1,Math.max(2,e.r*.24),2);ctx.fillRect(e.r*.12,-1,Math.max(2,e.r*.24),2);ctx.globalAlpha=1;}ctx.restore();
 }
 if(selectedCharacter==='attendant'&&attendantTarget?.hp>0&&inViewWorld(attendantTarget.x,attendantTarget.y,attendantTarget.r,30)){const m=worldToScreen(attendantTarget.x,attendantTarget.y),r=attendantTarget.r+7,p=.5+.5*Math.sin(elapsed*8);ctx.save();ctx.translate(m.x,m.y);ctx.globalAlpha=.62+.28*p;ctx.strokeStyle='#d8d1c8';ctx.lineWidth=1.5;for(const [sx,sy] of [[-1,-1],[1,-1],[-1,1],[1,1]]){ctx.beginPath();ctx.moveTo(sx*r,sy*(r-5));ctx.lineTo(sx*r,sy*r);ctx.lineTo(sx*(r-5),sy*r);ctx.stroke();}ctx.restore();}
 const ps=worldToScreen(player.x,player.y);let fractureLean=null;for(let i=slashes.length-1;i>=0;i--){if(slashes[i].kind==='fracture'){fractureLean=slashes[i];break;}}if(fractureLean){const fp=fracturePose(fractureLean),lean=fp.strikeProgress>0?Math.min(7,fp.drive*.18):Math.max(-2,fp.drive*.16);ps.x+=fractureLean.ux*lean;ps.y+=fractureLean.uy*lean;}if(bodyTwitch>0){ps.x+=Math.sin(elapsed*78)*bodyTwitch*3.2;ps.y+=Math.cos(elapsed*63)*bodyTwitch*2.1;}if(activeOrgan){const def=ORGAN_DEFS[activeOrgan],pulse=1+Math.sin(elapsed*(activeOrgan==='heart'?7:4))*.08;ctx.globalAlpha=.18;ctx.fillStyle=def.color;ctx.beginPath();ctx.arc(ps.x,ps.y,player.r*(2.1+(pulse-1)*3),0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}ctx.fillStyle=player.invuln>0?(Math.floor(elapsed*18)%2?'#fff':'#e56b6b'):'#c9b8a6';ctx.beginPath();ctx.arc(ps.x,ps.y,player.r,0,Math.PI*2);ctx.fill();ctx.strokeStyle=player.shield>0?'#8fd9ff':'#fff';ctx.lineWidth=player.shield>0?2.4:1;ctx.stroke();if(defibrillatorTimer>0){ctx.globalAlpha=.32+.18*Math.sin(elapsed*18);ctx.strokeStyle='#a8e6e9';ctx.lineWidth=2;ctx.beginPath();ctx.arc(ps.x,ps.y,player.r+7+Math.sin(elapsed*14)*2,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;}if(waterReaction>0){ctx.globalAlpha=waterReaction*.18;ctx.fillStyle='#777052';ctx.fillRect(0,0,W,H);ctx.globalAlpha=1;}if(player.shield>0){ctx.globalAlpha=.42;ctx.strokeStyle='#8fd9ff';ctx.beginPath();ctx.arc(ps.x,ps.y,player.r+5,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;}

 if(hitVignette>0&&vignetteGradient){ctx.globalAlpha=Math.min(.32,hitVignette*.9);ctx.fillStyle=vignetteGradient;ctx.fillRect(0,0,W,H);ctx.globalAlpha=1;}if(organFx>0){ctx.globalAlpha=Math.min(.38,organFx*.42);ctx.fillStyle=organFlash;ctx.fillRect(0,0,W,H);ctx.globalAlpha=1;}
 if(broadcastTimer>0&&organCinematicTimer<=0&&!organCinematicPreview){const bw=Math.min(330,W*.58),bx=W/2-bw/2,by=43;ctx.globalAlpha=Math.min(1,broadcastTimer);ctx.fillStyle='#0b0b0be6';ctx.fillRect(bx,by,bw,32);ctx.strokeStyle=broadcastMode==='event'?'#f0d66c':broadcastMode==='eventDone'?'#87d7a0':broadcastMode==='organ'?(ORGAN_DEFS[activeOrgan]?.color||'#b58ad2'):'#8e8067';ctx.strokeRect(bx,by,bw,32);ctx.fillStyle='#fff';ctx.font='bold 12px sans-serif';ctx.textAlign='center';ctx.font=(broadcastMode==='event'||broadcastMode==='eventDone')?'italic 12px sans-serif':'bold 12px sans-serif';ctx.fillText(broadcastText,W/2,64);ctx.textAlign='left';ctx.globalAlpha=1;}
 if(joystick.active&&organCinematicTimer<=0&&!organCinematicPreview){ctx.globalAlpha=.55;ctx.fillStyle='#444';ctx.beginPath();ctx.arc(joystick.sx,joystick.sy,joystick.max,0,Math.PI*2);ctx.fill();ctx.fillStyle='#bbb';ctx.beginPath();ctx.arc(joystick.x,joystick.y,28,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}

 if(bossIntroTimer>0||bossDeathTimer>0){const intro=bossIntroTimer>0,age=bossCinematicAge;ctx.save();ctx.fillStyle=`rgba(0,0,0,${intro?Math.min(.58,age*.16):Math.min(.45,age*.11)})`;ctx.fillRect(0,0,W,H);if(intro){const p=Math.min(1,age/6.2),x=W*(1.12-p*.55),y=H*.52;ctx.globalAlpha=Math.min(1,p*2.2);ctx.fillStyle='#473936';ctx.fillRect(x-80,y-40,160,80);ctx.fillStyle='#292524';ctx.fillRect(x-55,y+28,110,28);ctx.strokeStyle='#86716c';ctx.lineWidth=3;ctx.strokeRect(x-80,y-40,160,80);for(let i=0;i<3;i++){ctx.fillStyle='#6f7772';ctx.fillRect(x+10+i*18,y-35,11,43);}ctx.globalAlpha=1;}else{const p=Math.min(1,age/6.8),x=W*.55,y=H*.52;ctx.globalAlpha=1-p*.12;ctx.fillStyle='#493835';ctx.save();ctx.translate(x,y);ctx.rotate(p*.18);ctx.scale(1+p*.28,Math.max(.24,1-p*.72));ctx.fillRect(-85,-42,170,84);ctx.restore();ctx.globalAlpha=1;}ctx.restore();}

 ctx.restore();drawOrganCinematicOverlay();
}

function drawOrganCinematicOverlay(){
 if((organCinematicTimer<=0&&!organCinematicPreview)||!organCinematicSlot)return;
 const slot=organCinematicSlot,def=ORGAN_DEFS[slot],duration=ORGAN_CINEMATIC_DURATION,p=organCinematicPreview?(organPreviewElapsed/duration)%1:Math.max(0,Math.min(1,1-organCinematicTimer/duration)),fadeIn=organCinematicPreview?Math.min(1,organPreviewElapsed/.18):Math.min(1,p/.16),fadeOut=organCinematicPreview?1:Math.min(1,organCinematicTimer/.42),a=Math.min(fadeIn,fadeOut),cx=W/2,cy=H*.40,baseIcon=Math.min(84,Math.max(54,H*.19));
 ctx.save();ctx.fillStyle=`rgba(3,2,4,${.78*a})`;ctx.fillRect(0,0,W,H);
 let iconScale=1,iconX=cx,iconY=cy;
 if(slot==='heart'){
  const beatAt=(c,w=.045)=>Math.max(0,1-Math.abs(p-c)/w),beat=Math.max(beatAt(.07),beatAt(.16,.035),beatAt(.28),beatAt(.37,.035),beatAt(.49),beatAt(.58,.035),beatAt(.70),beatAt(.79,.035),beatAt(.91),beatAt(.965,.028));iconScale=1+beat*.18;
  ctx.globalAlpha=(.10+.24*beat)*a;ctx.fillStyle=def.color;ctx.fillRect(0,0,W,H);
  ctx.globalAlpha=.26*a;ctx.strokeStyle='#f06a75';ctx.lineWidth=2;const branches=qualityLevel===2?8:14;for(let i=0;i<branches;i++){const ang=i/branches*Math.PI*2+p*.18,r1=baseIcon*.50,r2=Math.max(W,H)*.55;ctx.beginPath();ctx.moveTo(cx+Math.cos(ang)*r1,cy+Math.sin(ang)*r1);ctx.bezierCurveTo(cx+Math.cos(ang+.35)*r2*.35,cy+Math.sin(ang+.35)*r2*.25,cx+Math.cos(ang-.22)*r2*.72,cy+Math.sin(ang-.22)*r2*.55,cx+Math.cos(ang)*r2,cy+Math.sin(ang)*r2);ctx.stroke();}
  ctx.globalAlpha=(.26+.38*beat)*a;ctx.lineWidth=(3+beat*5);for(let k=0;k<2;k++){ctx.beginPath();ctx.arc(cx,cy,baseIcon*(.62+k*.35+beat*.12),0,Math.PI*2);ctx.stroke();}
  ctx.globalAlpha=.55*a;ctx.lineWidth=2;ctx.beginPath();const wy=H*.72;ctx.moveTo(0,wy);for(let x=0;x<=W;x+=8){const q=x/W,spike=Math.exp(-Math.pow((q-(p*.9+.05))/.025,2));ctx.lineTo(x,wy+Math.sin(q*32+p*20)*2-spike*22+Math.exp(-Math.pow((q-(p*.9+.075))/.018,2))*12);}ctx.stroke();
 }else if(slot==='brain'){
  const glitch=Math.sin(p*91)*Math.sin(p*37);iconX=cx+glitch*5;iconY=cy+Math.sin(p*53)*2;iconScale=1+Math.sin(p*17)*.025;
  ctx.globalAlpha=.17*a;ctx.strokeStyle=def.color;ctx.lineWidth=1;for(let y=0;y<H;y+=8){const off=Math.sin(y*.07+p*44)*3;ctx.beginPath();ctx.moveTo(0,y+off);ctx.lineTo(W,y-off);ctx.stroke();}
  const nodes=qualityLevel===2?10:18;ctx.globalAlpha=.36*a;for(let i=0;i<nodes;i++){const ang=i/nodes*Math.PI*2+p*.55,rad=baseIcon*(.95+(i%3)*.42),x=cx+Math.cos(ang)*rad,y=cy+Math.sin(ang*1.3)*rad*.62;ctx.fillStyle=i%2?'#ead9ff':def.color;ctx.beginPath();ctx.arc(x,y,2.2+(i%3),0,Math.PI*2);ctx.fill();ctx.strokeStyle=def.color;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(x,y);ctx.stroke();}
  ctx.globalAlpha=.20*a;ctx.fillStyle='#d9b7ff';for(let i=0;i<6;i++){const gy=(p*H*1.7+i*73)%H,gh=2+(i%3)*3,shift=Math.sin(p*80+i)*W*.08;ctx.fillRect(Math.max(0,shift),gy,W-Math.abs(shift),gh);}
  ctx.globalAlpha=.20*a;ctx.font=`${baseIcon}px -apple-system,Apple Color Emoji,sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(def.icon,iconX-7,iconY);ctx.fillText(def.icon,iconX+7,iconY);
 }else{
  const pull=1-Math.pow(1-p,2),wobble=Math.sin(p*23)*.04;iconScale=1+wobble;
  const g=ctx.createRadialGradient(cx,cy,baseIcon*.2,cx,cy,Math.max(W,H)*.62);g.addColorStop(0,`rgba(209,180,95,${.18*a})`);g.addColorStop(.32,`rgba(70,55,20,${.20*a})`);g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  ctx.globalAlpha=.35*a;ctx.strokeStyle=def.color;ctx.lineWidth=3;const coils=qualityLevel===2?5:8;for(let k=0;k<coils;k++){const start=p*7+k*.8,rad=Math.max(16,(1-p)*Math.max(W,H)*.55+k*15);ctx.beginPath();ctx.arc(cx,cy,rad,start,start+Math.PI*1.55);ctx.stroke();}
  ctx.globalAlpha=.44*a;const drops=qualityLevel===2?12:22;for(let i=0;i<drops;i++){const ang=i/drops*Math.PI*2+p*(i%2?2.6:-2.1),outer=Math.max(W,H)*(.52-(i%4)*.045),r=outer*(1-pull)+baseIcon*.35,x=cx+Math.cos(ang)*r,y=cy+Math.sin(ang)*r*.62;ctx.fillStyle=i%3?'#d1b45f':'#66501d';ctx.beginPath();ctx.arc(x,y,2+(i%4),0,Math.PI*2);ctx.fill();}
  ctx.globalAlpha=.78*a;ctx.fillStyle='#050403';ctx.beginPath();ctx.ellipse(cx,cy,baseIcon*(.62+.18*p),baseIcon*(.28+.08*Math.sin(p*20)),0,0,Math.PI*2);ctx.fill();ctx.strokeStyle=def.color;ctx.lineWidth=3;ctx.stroke();
 }
 ctx.globalAlpha=a;ctx.textAlign='center';ctx.textBaseline='middle';ctx.shadowBlur=slot==='brain'?24:18;ctx.shadowColor=def.color;ctx.font=`${baseIcon*iconScale}px -apple-system,Apple Color Emoji,sans-serif`;ctx.fillText(def.icon,iconX,iconY);ctx.shadowBlur=0;
 ctx.fillStyle=def.color;ctx.font=`900 ${Math.min(12,Math.max(9,H*.026))}px -apple-system,sans-serif`;ctx.fillText(def.ritual,cx,cy+baseIcon*.72);
 ctx.fillStyle='#fff';ctx.font=`800 ${Math.min(20,Math.max(14,H*.043))}px -apple-system,sans-serif`;ctx.fillText(def.name,cx,cy+baseIcon*.96);ctx.globalAlpha=.92*a;ctx.font=`600 ${Math.min(16,Math.max(11,H*.034))}px -apple-system,sans-serif`;ctx.fillText(`“${def.quote}”`,cx,Math.min(H-30,cy+baseIcon*1.33));
 ctx.globalAlpha=.62*a;ctx.font=`700 ${Math.min(10,Math.max(8,H*.022))}px -apple-system,sans-serif`;ctx.fillText(organCinematicPreview?'확인을 기다립니다':'이식 진행',cx,H-17);ctx.fillStyle='#ffffff2e';ctx.fillRect(W*.28,H-10,W*.44,2);ctx.fillStyle=def.color;ctx.fillRect(W*.28,H-10,W*.44*p,2);
 ctx.textAlign='left';ctx.textBaseline='alphabetic';ctx.globalAlpha=1;ctx.restore();
}


function updateHudDom(force=false){
 const hpW=(player.hp/player.maxHp*100).toFixed(1)+'%',debtW=(Math.min(player.maxHp,player.hp+(player.residualDamage||0))/player.maxHp*100).toFixed(1)+'%',xpW=(player.xp/player.nextGrowthXp*100).toFixed(1)+'%',time=fmt(elapsed),specimenText=Number(runSpecimens).toLocaleString('ko-KR');
 if(force||ui.hpFill.style.width!==hpW)ui.hpFill.style.width=hpW;
 if(ui.hpDebtFill&&(force||ui.hpDebtFill.style.width!==debtW))ui.hpDebtFill.style.width=debtW;
 if(force||ui.xpFill.style.width!==xpW)ui.xpFill.style.width=xpW;
 if(force||ui.timer.textContent!==time)ui.timer.textContent=time;
 if(ui.specimenCount&&(force||ui.specimenCount.textContent!==specimenText))ui.specimenCount.textContent=specimenText;
 if(ui.specimenHud)ui.specimenHud.classList.toggle('pulse',specimenPulse>0);
}
function updateDebugDom(){ui.debug.textContent=`FPS ${Math.round(fps)} · LOW ${Math.round(minFps)} · 지연 ${slowFrames} · Q${qualityLevel} · 적 ${enemies.length} · 혈흔 ${clotFields.length} · 응고 ${clotCritFx.length} · 구슬 ${orbs.length} · 장기 ${organDrops.length} · 아이템 ${pickups.length} · 풀 ${POOLS.enemy.length}/${POOLS.particle.length}`;}


function showPause(){if(gameOver||transplantOpen||organCinematicTimer>0||organCinematicPreview)return;clearSelectionUi();paused=true;syncActionButton();ui.overlay.style.display='flex';ui.overlayTitle.textContent='일시정지';ui.cards.style.display='none';ui.pauseMenu.style.display='block';renderPauseSummary();}
function hideOverlay(){if(organCinematicPreview)stopOrganPreview();ui.overlay.style.display='none';ui.cards.innerHTML='';ui.pauseMenu.style.display='none';clearSelectionUi();}
function endGame(completed=false,reason=completed?'boss-defeated':'player-death'){
 if(gameOver)return;gameOver=true;paused=true;running=false;stopChapterBgm();best=Math.max(best,elapsed);storageSet('lh_best_v034',String(best));const settlement=Math.floor(elapsed/60)*12;if(settlement)creditSpecimens(settlement);ui.overlay.style.display='flex';ui.overlayTitle.textContent=completed?'병동의 작동이 멈췄다':`${CHARACTER_DEFS[selectedCharacter].name} 사망`;ui.cards.style.display='block';ui.pauseMenu.style.display='none';ui.cards.innerHTML=`<div style="text-align:center"><p>${completed?'잠겨 있던 출구가 열렸습니다.':'육체가 더 이상 버티지 못했습니다.'}</p><p>생존 시간: ${fmt(elapsed)} · 처치 수: ${kills}</p><p>이번 회수 검체: ${Number(runSpecimens).toLocaleString('ko-KR')}</p><p>보유 검체: ${Number(meta.specimens||0).toLocaleString('ko-KR')}</p><p>최고 기록: ${fmt(best)}</p><button class="btn" id="returnLobby">준비 화면으로</button></div>`;document.getElementById('returnLobby').onclick=()=>{hideOverlay();openLobby();};
}
function fmt(s){s=Math.max(0,Math.floor(s));return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');}
function loop(now){
 if(!running)return;requestAnimationFrame(loop);if(!loopClock){loopClock=now;last=now;return;}const frameMs=1000/PERF.targetFps,rawDelta=now-loopClock,delta=Math.min(50,rawDelta);if(delta<frameMs*.92)return;loopClock=now;
 if(!paused&&!gameOver&&elapsed>=PERF_WARMUP){const inst=1000/Math.max(1,rawDelta);minFps=Math.min(minFps,inst);maxFrameMs=Math.max(maxFrameMs,rawDelta);frameMsSum+=rawDelta;frameSamples++;if(rawDelta>33.3)slowFrames++;}
 const dt=delta/1000;if(organCinematicPreview)organPreviewElapsed+=dt;fpsAcc+=dt;fpsFrames++;if(fpsAcc>=.75){fps=fpsFrames/fpsAcc;fpsAcc=0;fpsFrames=0;}const portrait=matchMedia('(orientation:portrait)').matches;if(hitStopTimer>0&&!paused&&!portrait){hitStopTimer=Math.max(0,hitStopTimer-dt);accumulator=0;draw();return;}accumulator=Math.min(.05,accumulator+dt);if(!paused&&!portrait){let steps=0;while(accumulator>=1/60&&steps<3){update(1/60);accumulator-=1/60;steps++;}}else accumulator=0;draw();
}

function tStart(e){e.preventDefault();for(const t of e.changedTouches)if(t.clientX<W*.48&&!joystick.active){Object.assign(joystick,{active:true,id:t.identifier,sx:t.clientX,sy:t.clientY,x:t.clientX,y:t.clientY,dx:0,dy:0});}}
function tMove(e){e.preventDefault();for(const t of e.changedTouches)if(t.identifier===joystick.id){let dx=t.clientX-joystick.sx,dy=t.clientY-joystick.sy,d=Math.hypot(dx,dy)||1;if(d>joystick.max){dx=dx/d*joystick.max;dy=dy/d*joystick.max;}Object.assign(joystick,{x:joystick.sx+dx,y:joystick.sy+dy,dx:dx/joystick.max,dy:dy/joystick.max});}}
function tEnd(e){e.preventDefault();for(const t of e.changedTouches)if(t.identifier===joystick.id)Object.assign(joystick,{active:false,id:null,dx:0,dy:0});}
canvas.addEventListener('touchstart',tStart,{passive:false});canvas.addEventListener('touchmove',tMove,{passive:false});canvas.addEventListener('touchend',tEnd,{passive:false});canvas.addEventListener('touchcancel',tEnd,{passive:false});
function releaseSelectionInputGuard(){if(selectionNeedsFreshPointer){selectionNeedsFreshPointer=false;selectionInputGuardUntil=performance.now()+170;}}
addEventListener('pointerup',releaseSelectionInputGuard,true);addEventListener('touchend',releaseSelectionInputGuard,true);addEventListener('touchcancel',releaseSelectionInputGuard,true);
addEventListener('keydown',e=>{keys[e.key]=true;if(e.key==='Enter'&&selectionMode&&!e.repeat){if(!ui.confirmSelectionBtn.disabled&&selectionCanInteract())selectionConfirmAction?.();return;}if((e.key==='e'||e.key==='Enter')&&!e.repeat)useActionButton();});addEventListener('keyup',e=>keys[e.key]=false);
ui.confirmSelectionBtn.onclick=()=>{if(ui.confirmSelectionBtn.disabled||!selectionCanInteract())return;selectionConfirmAction?.();};
ui.selectionCancelBtn.onclick=()=>{if(!selectionCanInteract())return;if(selectionMode==='organ'&&organCinematicPreview){returnToOrganSelection();return;}selectionCancelAction?.();};
ui.audioToggleBtn.onclick=()=>{soundEnabled=!soundEnabled;if(soundEnabled){initAudio();tone(520,.08,'sine',.02,760);startChapterBgm(!!chapterFlags.bossPrelude);}else{stopCinematicAudio();stopChapterBgm();}renderPauseSummary();};ui.actionButton.onclick=useActionButton;ui.pause.onclick=showPause;ui.resumeBtn.onclick=()=>{paused=false;hideOverlay();syncActionButton();};ui.restartBtn.onclick=()=>{reset();startChapterBgm(false);last=performance.now();loopClock=0;if(!running){running=true;requestAnimationFrame(loop);}};ui.mainMenuBtn.onclick=()=>{saveMeta();stopCinematicAudio();stopChapterBgm();running=false;paused=false;growthChoosing=false;gameOver=true;dialogueState=null;bossState=null;bossIntroTimer=0;bossDeathTimer=0;document.body.classList.remove('boss-cinematic');clearSelectionUi();hideOverlay();resetJoystickInput();showMetaScreen('startScreen');};ui.startBtn.onclick=()=>openCharacterSelect('title');ui.titleSettingsBtn.onclick=showSettings;ui.characterBackBtn.onclick=()=>characterReturn==='lobby'?openLobby():showMetaScreen('startScreen');ui.characterConfirmBtn.onclick=()=>{saveMeta();openLobby();};ui.changeCharacterBtn.onclick=()=>openCharacterSelect('lobby');ui.lobbyRecordBtn.onclick=()=>openRecords('lobby');ui.enterWardBtn.onclick=openChapterSelect;ui.chapterBackBtn.onclick=openLobby;ui.chapterEnterBtn.onclick=startChapterRun;ui.recordBackBtn.onclick=openLobby;ui.settingsBackBtn.onclick=()=>showMetaScreen('startScreen');ui.metaAudioBtn.onclick=()=>{soundEnabled=!soundEnabled;if(!soundEnabled)stopChapterBgm();syncMetaAudio();};ui.dialogueBox.onclick=advanceDialogue;showMetaScreen('startScreen');
})();
