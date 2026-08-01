# Living Hospital

모바일 가로 화면을 기준으로 제작 중인 싱글 파일 HTML 액션 로그라이크 프로토타입입니다.

- 현재 저장소 기준 빌드: **v0.3.4.h**
- 현재 실행 파일: [`Living_Hospital_v0.3.4.h.html`](./Living_Hospital_v0.3.4.h.html)
- 일반 플레이: `https://fnqlfhwm12-cmyk.github.io/Living-Hospital/`
- 계측 플레이: `https://fnqlfhwm12-cmyk.github.io/Living-Hospital/playtest.html`
- 주 테스트 환경: **iPhone / Safari 계열 웹뷰 / 가로 화면**
- 목표 플레이 타임: **30~45분**
- 시각 방향: **귀엽지만 그로테스크한 병원·실험실 세계**

## 저장소 운영 원칙

1. 기존 버전 파일은 덮어쓰지 않고 보존합니다.
2. 수정본은 `Living_Hospital_v0.3.4.html`처럼 새 버전 파일로 생성합니다.
3. 실제 작업 시작 전 가장 최신 HTML과 문서를 먼저 확인합니다.
4. 코드 변경과 함께 `docs/CHANGELOG.md`와 `docs/PROJECT_STATUS.md`를 갱신합니다.
5. iPhone 가로 화면, 프레임 유지, 발열 억제를 기능 추가보다 우선합니다.
6. 새 안정 빌드를 배포할 때 `index.html`과 `playtest.html`의 연결 대상을 함께 갱신합니다.
7. Pull Request와 `main` 반영 전 `Validate Living Hospital` GitHub Actions 검사를 통과해야 합니다.

## 플레이테스트

일반 플레이 주소는 게임만 실행합니다. 계측 플레이 주소는 게임 코드를 수정하지 않고 외부 모니터 페이지에서 FPS 근사값, Long Task, 터치 횟수, 화면 방향 변경, 브라우저 오류 등을 기록합니다.

플레이 후 계측 화면의 `기록 → 보고서 복사`를 누르면 ChatGPT 대화나 GitHub Issue에 바로 붙여 넣을 수 있는 보고서가 생성됩니다. 데이터는 자동 전송되지 않습니다.

자세한 절차와 측정 한계는 [`docs/PLAYTESTING.md`](./docs/PLAYTESTING.md)를 확인합니다.

## 자동 검사

`.github/workflows/validate.yml`은 저장소 변경과 Pull Request마다 `scripts/validate_repo.mjs`를 실행합니다.

주요 검사 항목:

- 최신 버전 파일과 문서·실행 주소의 참조 일치
- 최신 게임 HTML 및 계측 페이지의 JavaScript 문법
- 중복 HTML `id`
- 병합 충돌 표시
- 존재하지 않는 실행 파일 참조

## 문서

- [`AGENTS.md`](./AGENTS.md): ChatGPT·Codex 등 작업 에이전트용 필수 규칙
- [`docs/PROJECT_STATUS.md`](./docs/PROJECT_STATUS.md): 현재 상태와 다음 작업 후보
- [`docs/PROJECT_RULES.md`](./docs/PROJECT_RULES.md): 고정된 게임 디자인·기술 원칙
- [`docs/CHANGELOG.md`](./docs/CHANGELOG.md): 버전별 변경 기록
- [`docs/ROADMAP.md`](./docs/ROADMAP.md): 중장기 작업 순서
- [`docs/PLAYTESTING.md`](./docs/PLAYTESTING.md): 계측 플레이와 보고 절차

## 권장 작업 흐름

`최신 코드 확인 → 변경 계획 확정 → 작업 브랜치 생성 → 새 버전 파일 작성 → 자동 검사 → 코드 검토 → iPhone 계측 플레이 → 보고서·영상 분석 → 문서 갱신 → main 반영 → Pages 배포`

저장소는 공개 상태이지만 별도 라이선스는 아직 지정하지 않았습니다.
