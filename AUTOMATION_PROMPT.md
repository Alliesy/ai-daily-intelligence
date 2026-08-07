# Cloud Scheduled Task Prompt

아래 작업을 매일 07:00 Asia/Seoul 기준으로 실행하세요.

## 목적과 중단선

AI Researcher → Opportunity Finder → Git Publisher → Notion Latest Publisher 순서로 실행합니다. GitHub 저장소 `Alliesy/ai-daily-intelligence`가 유일한 기록 정본입니다. Notion은 최종 열람용 최신 페이지 한 장만 갱신합니다. AI Architect, project-pm, 구현, 배포는 절대 자동 실행하지 않습니다.

## 1. 조사

- KST 실행 시각 기준 직전 24시간 신규 발표와 최근 7일 중요 후속 변화를 조사합니다.
- 공식 발표·문서·논문·저장소를 우선하고, 출시·가격·성능·투자·규제 주장은 가능하면 독립 출처 2개로 검증합니다.
- FACT / INTERPRETATION / SIGNAL / SPECULATION을 구분합니다.
- 동일 사건의 공식 발표·기사·커뮤니티 반응은 하나로 통합합니다.
- 신뢰도 30%, 영향도 25%, 활용도 20%, 최신성 15%, 커뮤니티 관심 10%로 평가해 3~5개만 선정합니다. 강한 자료가 3개 미만이면 억지로 채우지 말고 실패로 보고합니다.

## 2. 기회 분석

- 검증된 뉴스만 사용해 한국의 개인 또는 1~3인 팀이 실행할 사업 아이디어를 0~3개 작성합니다.
- 문제, 고객, 기존 해결법, 경쟁사, 차별점, 2주 MVP, 난이도, 수익화, 반증 조건을 포함합니다.
- 구축 후보는 하루 최대 1개입니다. 점수 4.3/5 이상, 별 5개, Very High, 독립 근거 2개 이상(공식 1개 포함), 4~8주 MVP 가능, 미해결 법률·보안·유료 의존성 게이트 없음 조건을 모두 만족해야 합니다.
- 후보가 있어도 `owner_action_required=true`, `status="waiting_for_owner"`로 기록만 하고 종료합니다.
- Worth Reading은 반드시 `Paper`, `GitHub`, `YouTube`, `Blog`를 정확히 1개씩 포함합니다. 네 유형 중 하나라도 검증 가능한 항목이 없으면 `complete`로 게시하지 말고 누락 유형을 경고한 뒤 자료를 더 조사합니다.

## 3. Git 게시 — 정본

GitHub 플러그인으로 `Alliesy/ai-daily-intelligence`의 `main`을 읽고 다음을 수행합니다.

1. `schema/daily.schema.json`과 최신 저장 규칙을 먼저 읽습니다.
2. KST 날짜가 `YYYY-MM-DD`라면 `data/daily/YYYY/YYYY-MM-DD.json`을 생성하거나 갱신합니다.
3. 같은 날짜 파일이 있으면 기존 검증된 항목을 보존하면서 새 근거만 보강합니다. 동일 사건 키와 정규화 URL을 중복 생성하지 않습니다.
4. `reports/YYYY/YYYY-MM-DD.md`, `LATEST.md`, `publish/notion-latest.md`를 동일 데이터에서 갱신합니다.
5. `latest.json`은 전체 패킷이 아니라 `date_kst`, `data_path`, `report_path`, `status` 네 필드만 가진 포인터로 유지합니다. 전체 패킷은 날짜별 JSON에만 저장합니다.
6. 게시 전 뉴스 3~5개, 사업 아이디어 0~3개, Worth Reading 네 유형, 중복 사건·URL, 후보 승인 게이트, `latest.json` 포인터 구조를 자체 검증합니다. 하나라도 실패하면 Git/Notion을 완료로 게시하지 않습니다.
7. JSON과 Markdown의 뉴스 제목·개수·구축 후보 상태가 일치하는지 확인한 뒤 하나의 커밋으로 저장합니다. 커밋 메시지는 `daily: YYYY-MM-DD intelligence`입니다.
8. Git 저장이 실패하면 Notion을 갱신하지 말고 실패를 보고합니다.

## 4. Notion 게시 — 읽기 전용 화면

- 대상 페이지는 `AI Daily Intelligence · Latest` (`3b54669d-5c35-81a5-965a-ce225de99bee`) 하나뿐입니다.
- Notion에서 **Query Data Source를 호출하지 마세요.** 기존 9개 DB를 fetch/query/create/update하지 마세요.
- 대상 페이지를 ID로 한 번 fetch한 뒤 `publish/notion-latest.md`의 내용으로 `replace_content` 하세요. 페이지 제목은 유지합니다.
- GitHub 전체 보고서와 날짜별 JSON 링크를 상단에 포함합니다.
- Notion 실패 시 Git 커밋은 성공 정본으로 유지하고 `partial_failure: notion_publish`를 보고합니다.

## 완료 알림

KST 날짜, Top 뉴스 제목, 사업 아이디어 수, 구축 후보 여부, Git 커밋/보고서 URL, Notion Latest URL, 누락 출처와 부분 실패를 요약합니다. 구축 후보가 있으면 **“Notion 검토 후 Codex에 `설계 시작: <아이디어명>`이라고 지시하세요”**라고 표시합니다.
