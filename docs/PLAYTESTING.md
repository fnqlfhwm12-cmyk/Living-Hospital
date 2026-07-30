# 플레이테스트 운영

Living Hospital은 일반 플레이와 계측 플레이를 분리합니다.

## 주소

- 일반 플레이: `https://fnqlfhwm12-cmyk.github.io/Living-Hospital/`
- 계측 플레이: `https://fnqlfhwm12-cmyk.github.io/Living-Hospital/playtest.html`

일반 플레이 주소는 기존과 동일하며 화면에 테스트 도구가 표시되지 않습니다. 계측 플레이 주소는 최신 빌드를 iframe으로 실행하고 그 위에 작은 `기록` 버튼을 표시합니다.

## 기록되는 항목

- 실행 중인 게임 파일과 HTML 타이틀
- 기록 시간과 게임 타이머
- 평균·최저·최근 FPS 근사값
- 브라우저가 지원하는 경우 Long Task 횟수와 누적 시간
- 터치 입력 횟수
- 화면 방향 변경과 앱 전환 횟수
- JavaScript 오류와 처리되지 않은 Promise 오류
- 화면 크기, DPR, 브라우저 사용자 환경
- 게임의 `#debug` 표시 내용

FPS는 모니터 페이지의 `requestAnimationFrame`을 기준으로 측정하므로 실제 기기 GPU 프레임을 정밀 계측하는 전문 프로파일러와는 다릅니다. 버전 간 상대 비교와 급격한 성능 저하 탐지용으로 사용합니다.

## 사용 방법

1. 계측 플레이 주소를 iPhone Safari에서 가로 화면으로 엽니다.
2. 평소처럼 플레이합니다.
3. 문제가 발생하거나 한 판이 끝나면 화면 상단의 `기록`을 누릅니다.
4. `보고서 복사`를 누릅니다.
5. 복사된 보고서를 ChatGPT 대화 또는 GitHub의 `플레이테스트 보고` Issue에 붙여 넣습니다.
6. 영상이 있으면 보고서와 함께 첨부합니다.

`기록 초기화`는 수집된 측정치만 초기화하며 현재 게임 진행 상태는 유지합니다.

## 개인정보와 전송

현재 모니터는 데이터를 서버나 외부 서비스로 자동 전송하지 않습니다. 측정치는 브라우저 메모리에만 남고, 사용자가 `복사` 또는 `공유`를 선택할 때만 밖으로 나갑니다. 로그인 정보, 위치, 연락처, 저장된 파일은 수집하지 않습니다.

## 새 버전 배포 시 필수 갱신

새 안정 빌드를 배포할 때 다음 세 곳이 모두 같은 최신 파일을 가리켜야 합니다.

- `index.html`
- `playtest.html`의 iframe과 `GAME_FILE`
- `README.md`, `AGENTS.md`, `docs/PROJECT_STATUS.md`

GitHub Actions의 `Validate Living Hospital` 워크플로가 이 일치 여부와 기본 HTML·JavaScript 문법을 자동 검사합니다.

## 자동 검사 범위

- 최신 버전 파일 자동 탐색
- 최신 파일과 문서·실행 주소 참조 일치 여부
- 최신 게임 HTML과 `playtest.html`의 기본 구조
- 인라인 JavaScript 문법
- 중복 HTML `id`
- 병합 충돌 표시
- `index.html`이 존재하는 파일을 가리키는지

자동 검사는 실제 조작감, iPhone Safari 전용 동작, 발열, 진동, 사운드 체감까지 보증하지 않습니다. 해당 항목은 실제 기기 플레이테스트로 최종 확인합니다.
