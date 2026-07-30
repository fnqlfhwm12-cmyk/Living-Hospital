import fs from 'node:fs';

const read = file => fs.readFileSync(file, 'utf8');
const write = (file, content) => fs.writeFileSync(file, content, 'utf8');

function replaceOnce(text, before, after, label) {
  const index = text.indexOf(before);
  if (index < 0) throw new Error(`교체 지점 없음: ${label}`);
  if (text.indexOf(before, index + before.length) >= 0) throw new Error(`교체 지점 중복: ${label}`);
  return text.slice(0, index) + after + text.slice(index + before.length);
}

function insertBefore(text, marker, addition, label) {
  const index = text.indexOf(marker);
  if (index < 0) throw new Error(`삽입 지점 없음: ${label}`);
  return text.slice(0, index) + addition + '\n' + text.slice(index);
}

function replaceFileRef(file, from, to) {
  let text = read(file);
  if (!text.includes(from)) throw new Error(`${file}에 ${from} 참조 없음`);
  write(file, text.split(from).join(to));
}

const sourceFile = 'Living_Hospital_v0.3.3.t.html';
const targetFile = 'Living_Hospital_v0.3.3.u.html';
const telemetry = read('scripts/v033u_telemetry.js').trim();
let game = read(sourceFile);

game = replaceOnce(game, '<title>Living Hospital Prototype v0.3.3.t</title>', '<title>Living Hospital Prototype v0.3.3.u</title>', '문서 제목');
game = replaceOnce(game, '<h2>Prototype v0.3.3.t · 불규칙 심장박동 · 골절 파편 연출화</h2>', '<h2>Prototype v0.3.3.u · 자동 플레이 기록 · 오류 계측</h2>', '시작 화면 버전');
game = replaceOnce(game, '<p class="muted">불규칙 연쇄 박동 · 전용 치명타 · 가속되는 추가 파동 · 무해한 골편</p>', '<p class="muted">플레이 종료 자동 보고 · 치명 오류 자동 기록 · 성능 이상 감지 · t 전투 기준 유지</p>', '시작 화면 설명');
game = replaceOnce(game, 'const CLOT_FIELD_CAP=28,CLOT_CRIT_FX_CAP=4;', `const CLOT_FIELD_CAP=28,CLOT_CRIT_FX_CAP=4;\n${telemetry}`, '계측 인터페이스');
game = replaceOnce(game, '// v0.3.3.t: 심장박동은 확률적으로 최대 두 번 연쇄되며, 치명 박동은 120%·치명 추가 박동은 80% 피해를 준다. 골편은 순수 연출이다.', '// v0.3.3.u: t 전투 기준을 유지하며 플레이 종료·치명 오류·성능 이상을 자동 기록한다.\n// v0.3.3.t: 심장박동은 확률적으로 최대 두 번 연쇄되며, 치명 박동은 120%·치명 추가 박동은 80% 피해를 준다. 골편은 순수 연출이다.', '버전 주석');
game = replaceOnce(game, "let best=Number(localStorage.getItem('lh_best_v033t')||", "let best=Number(localStorage.getItem('lh_best_v033u')||localStorage.getItem('lh_best_v033t')||", '최고 기록 로드');
game = replaceOnce(game, "localStorage.setItem('lh_best_v033t',String(best));", "localStorage.setItem('lh_best_v033u',String(best));", '최고 기록 저장');
game = replaceOnce(game, 'running=true;paused=false;growthChoosing=false;gameOver=false;hideOverlay();renderHudIcons();renderOrganHud();updateHudDom(true);syncActionButton();', 'running=true;paused=false;growthChoosing=false;gameOver=false;hideOverlay();renderHudIcons();renderOrganHud();updateHudDom(true);syncActionButton();beginPlaytestRun();', '플레이 시작 이벤트');
game = replaceOnce(game, 'if(hudClock<=0){hudClock=.1;updateHudDom(false);}if(debugClock<=0){debugClock=.25;updateDebugDom();}', 'if(hudClock<=0){hudClock=.1;updateHudDom(false);}if(debugClock<=0){debugClock=.25;updateDebugDom();}updatePlaytestHealth(dt);', '상태 감시');
game = replaceOnce(game, 'function endGame(completed=false){', "function endGame(completed=false,reason=completed?'time-limit':'player-death'){", '종료 함수 인자');
game = replaceOnce(game, "document.getElementById('again').onclick=()=>{reset();last=performance.now();loopClock=0;};", "document.getElementById('again').onclick=()=>{reset();last=performance.now();loopClock=0;};finalizePlaytestRun(reason,completed);", '종료 자동 보고');
game = replaceOnce(game, 'if(delta<frameMs*.92)return;loopClock=now;', 'trackPlaytestFrame(rawDelta);if(delta<frameMs*.92)return;loopClock=now;', '프레임 지연 기록');
game = insertBefore(game, "ui.confirmSelectionBtn.onclick=", "addEventListener('error',event=>{recordPlaytestIncident('javascript-error','fatal',`${event.message||event.error||'알 수 없는 오류'} @ ${event.filename||'unknown'}:${event.lineno||0}`,true);});\naddEventListener('unhandledrejection',event=>{const reason=event.reason?.stack||event.reason?.message||event.reason||'알 수 없는 Promise 오류';recordPlaytestIncident('unhandled-promise','fatal',reason,true);});", '런타임 오류 감지');

write(targetFile, game);
write('playtest.html', read('scripts/v033u_playtest.html'));
replaceFileRef('index.html', sourceFile, targetFile);
for (const file of ['README.md', 'AGENTS.md', 'docs/PROJECT_STATUS.md']) replaceFileRef(file, sourceFile, targetFile);

let readme = read('README.md').replace('현재 저장소 기준 빌드: **v0.3.3.t**', '현재 저장소 기준 빌드: **v0.3.3.u**');
write('README.md', readme);

let agents = read('AGENTS.md').replace('현재 기준선은 `Living_Hospital_v0.3.3.t.html`입니다.', '현재 기준선은 `Living_Hospital_v0.3.3.u.html`입니다.');
write('AGENTS.md', agents);

let status = read('docs/PROJECT_STATUS.md');
status = status.replace('저장소 기준 최신 빌드: **v0.3.3.t**', '저장소 기준 최신 빌드: **v0.3.3.u**');
status = status.replace('다음 버전 후보는 **v0.3.3.u**입니다.', '다음 버전 후보는 **v0.3.3.v**입니다.');
status = status.replace('- 심장박동 추가타의 확산 속도와 리듬 조정', '- v0.3.3.u 자동 보고 결과를 기준으로 심장박동 추가타의 확산 속도와 리듬 재검토');
write('docs/PROJECT_STATUS.md', status);

let changelog = read('docs/CHANGELOG.md');
if (!changelog.includes('## v0.3.3.u')) {
  changelog = changelog.replace('## v0.3.3.t', `## v0.3.3.u

전투 밸런스는 v0.3.3.t 기준을 유지하고 플레이테스트 자동 계측을 게임 본체에 연결했습니다.

- 플레이 종료 시 게임 내부 스냅샷 생성
- 계측 페이지에서 종료 보고서 자동 표시
- JavaScript 오류와 처리되지 않은 Promise 오류 자동 기록
- 500ms 이상 프레임 정지와 250ms 이상 프레임 지연 감지
- 지속 저프레임, 적 정체, 개체 수 상한 초과 감지
- 플레이 시간, 처치 수, FPS, 프레임 지연, 개체 수, HP, 위치, 장기·무기·패시브 구성 기록
- 경고는 백그라운드 기록, 치명·심각 오류는 보고서 자동 표시
- 수동 기록 버튼은 비상용으로 축소
- 계측 정보 자동 외부 전송 없음

## v0.3.3.t`);
}
write('docs/CHANGELOG.md', changelog);

let testing = read('docs/PLAYTESTING.md');
testing = testing.replace('계측 플레이 주소는 최신 빌드를 iframe으로 실행하고 그 위에 작은 `기록` 버튼을 표시합니다.', '계측 플레이 주소는 최신 빌드를 iframe으로 실행합니다. 수동 기록 버튼은 비상용이며, 정상 플레이 종료나 치명적 오류·심각한 성능 이상이 발생하면 기록창이 자동으로 열립니다.');
testing = testing.replace(/## 사용 방법[\s\S]*?`기록 초기화`는 수집된 측정치만 초기화하며 현재 게임 진행 상태는 유지합니다\./, `## 사용 방법

1. 계측 플레이 주소를 iPhone Safari에서 가로 화면으로 엽니다.
2. 평소처럼 플레이합니다.
3. 플레이 종료 시 기록창이 자동으로 열립니다.
4. 치명적 오류나 심각한 성능 이상도 자동으로 기록창을 엽니다.
5. 일반 경고는 플레이를 방해하지 않고 보고서 내부에 누적됩니다.
6. \`보고서 복사\` 또는 \`공유\`를 사용해 ChatGPT 대화에 전달합니다.

오른쪽 아래의 작은 \`R\` 버튼은 자동 표시가 실패했을 때 사용하는 비상용 수동 기록입니다. \`기록 초기화\`는 수집된 측정치만 초기화하며 현재 게임 진행 상태는 유지합니다.`);
write('docs/PLAYTESTING.md', testing);

console.log(`생성 완료: ${targetFile}`);
