# Cloud Scheduled Task Prompt

아래 작업을 매일 07:00 Asia/Seoul 기준으로 실행하세요.

## 목적과 중단선

AI Researcher → Opportunity Finder → Git Publisher → Notion Latest Publisher 순서로 실행합니다. GitHub 저장소 `Alliesy/ai-daily-intelligence`가 유일한 기록 정본입니다. Notion은 최종 열람용 최신 페이지 한 장만 갱신합니다. AI Architect, project-pm, 구현, 배포는 절대 자동 실행하지 않습니다.

## 사용자 표시 언어

- 새로 생성하는 JSON·Markdown·Notion의 사용자 표시용 콘텐츠는 한국어를 기본으로 합니다.
- 뉴스 제목, 한줄 요약, FACT / INTERPRETATION / SIGNAL / SPECULATION, 중요성·전망, 사업 아이디어와 커뮤니티 요약을 한국어로 작성합니다.
- 기업명, 제품명, 모델명, 기술명과 코드 식별자는 필요한 경우 원문 표기를 유지합니다.
- Source의 원문 제목과 인용문은 증거 추적을 위해 원문을 유지할 수 있습니다.
- 신규 Daily 뉴스의 사용자 표시용 `title`을 영어로만 작성하지 않습니다. legacy 데이터는 일괄 번역하지 않습니다.

## 1. AI Researcher — 넓은 조사와 Event 정규화

- KST 실행 시각 기준 직전 24시간 신규 발표와 최근 7일 중요 후속 변화를 조사합니다.
- 공식 발표·문서·논문·저장소를 우선하고, 출시·가격·성능·투자·규제 주장은 가능하면 독립 출처 2개로 검증합니다.
- FACT / INTERPRETATION / SIGNAL / SPECULATION을 구분합니다.
- 동일 사건의 공식 발표·기사·커뮤니티 반응은 하나의 Event와 여러 Source로 통합합니다. Source 수를 Event 수로 계산하지 않습니다.
- Source마다 확인 가능한 경우 `source_type`, `authority`, `verification_status`, `evidence_group`을 기록합니다. 성격이 불확실하면 `other`/`unknown`/`unverified`로 안전하게 남기며 임의로 공식·독립 출처로 확정하지 않습니다.
- 동일 보도의 재인용은 같은 `evidence_group`으로 묶어 독립 근거 수를 부풀리지 않습니다.
- 신뢰도 30%, 영향도 25%, 활용도 20%, 최신성 15%, 커뮤니티 관심 10%로 공개 Event를 선별합니다. Researcher의 조사 후보와 Source는 넓게 유지하되 사용자에게 보여줄 Top Event는 별도 Morning Paper 판단으로 최대 3개만 고릅니다.

## 2. Intelligence Editor — Cross-Event Insight

1. 서로 다른 Event에서 반복되는 기술 방향, 제품 변화, 기업 행동, 시장·규제·사용자 행동을 찾습니다.
2. 단순 빈도가 아니라 반복 Event 수, 독립 근거군 다양성, 공식 Source 존재, Event 중요도, 새로움과 실제 영향도를 함께 평가합니다.
3. 가장 강한 공통 Signal 하나를 “오늘 여러 사건을 함께 보면 무엇이 변하고 있는가?”에 답하는 한국어 headline과 2~4줄 summary로 작성합니다. 단일 뉴스 제목을 다시 쓰지 않습니다.
4. `morning_paper.insight_method`는 `cross_event_signal_v1`, `evidence_event_keys`는 실제 근거 Event key, `top_event_keys`는 중요 Event key 최대 3개로 기록합니다. 강한 Event가 1~2개뿐이면 3개를 억지로 채우지 않습니다.
5. Evidence 숫자는 Event/Source 관계에서만 계산합니다. 공식 Source는 명시적 `authority=official`, 독립 근거는 명시적 `authority=independent`이면서 서로 다른 `evidence_group`만 계산합니다. 분류가 없으면 추정 숫자를 만들지 않습니다.

## 3. Problem Scout → Opportunity Finder

- 뉴스에서 사업 아이디어를 바로 만들지 않습니다. `Signal → Problem Evidence → Opportunity` 순서로 판단합니다.
- Problem Scout는 Reddit, Hacker News, GitHub Issues, YouTube 댓글, 개발자 커뮤니티, 공개 사용자 포럼, 제품 리뷰와 접근 가능한 국내 공개 커뮤니티에서 반복 불편과 기존 우회 행동을 조사합니다. 각 사이트의 접근 정책과 이용 조건을 준수합니다.
- 공개 게시물만 사용하고 로그인·초대가 필요한 커뮤니티, 비공개 프로필, 삭제된 콘텐츠를 우회 수집하지 않습니다. 사용자명·핸들·실명·연락처·위치 등 개인 식별 정보와 민감정보를 JSON/요약에 저장하지 않으며, 문제 증명에 필요한 최소한의 비식별 요약과 원문 URL만 기록합니다. 원문 인용은 꼭 필요한 짧은 범위로 제한합니다.
- “귀찮다/비싸다/자동화하고 싶다” 같은 키워드만으로 문제를 확정하지 말고 원문 맥락, 반복성, 실제 행동(엑셀 관리, 직접 제작, 여러 도구 조합 등)을 확인합니다.
- 한국의 개인 또는 1~3인 팀이 실행할 수 있고 실제 Problem Evidence가 있는 사업 아이디어만 0~3개 작성합니다. 아이디어를 매일 억지로 만들지 않습니다.
- 각 아이디어에는 문제, 고객, 기존 해결법, 경쟁사, 차별점, 2주 MVP, 난이도, 수익화, 반증 조건과 추적 가능한 `problem_evidence`를 기록합니다.
- 다음 현실성 Gate를 각각 `pass`/`fail`/`unknown`과 근거로 평가합니다: `customer`, `pain`, `existing_solution`, `technology_change`, `buildability`, `mvp`, `customer_access`, `replacement_risk`, `dependency`.
- Today 노출은 모든 Gate가 명시적으로 통과하고 검증 가능한 문제 근거가 있는 경우에만 `today_eligible=true`, `eligibility_method=opportunity_gate_v1`로 표시하며 하루 최대 1개입니다. `unknown`이나 `fail`이 하나라도 있으면 Today에 노출하지 않습니다.
- 구축 후보는 하루 최대 1개입니다. 점수 4.3/5 이상, 별 5개, Very High, 독립 근거 2개 이상(공식 1개 포함), 4~8주 MVP 가능, 미해결 법률·보안·유료 의존성 게이트 없음 조건을 모두 만족해야 합니다.
- 후보가 있어도 `owner_action_required=true`, `status="waiting_for_owner"`로 기록만 하고 종료합니다.
- Worth Reading은 반드시 `Paper`, `GitHub`, `YouTube`, `Blog`를 정확히 1개씩 포함합니다. 네 유형 중 하나라도 검증 가능한 항목이 없으면 `complete`로 게시하지 말고 누락 유형을 경고한 뒤 자료를 더 조사합니다.

## 4. Git 게시 — 정본

GitHub 플러그인으로 `Alliesy/ai-daily-intelligence`의 `main`을 읽고 다음을 수행합니다.

1. `schema/daily.schema.json`과 최신 저장 규칙을 먼저 읽습니다.
2. KST 날짜가 `YYYY-MM-DD`라면 `data/daily/YYYY/YYYY-MM-DD.json`을 생성하거나 갱신합니다.
3. 같은 날짜 파일이 있으면 기존 검증된 항목을 보존하면서 새 근거만 보강합니다. 동일 사건 키와 정규화 URL을 중복 생성하지 않습니다.
4. `reports/YYYY/YYYY-MM-DD.md`, `LATEST.md`, `publish/notion-latest.md`를 동일 데이터에서 갱신합니다.
5. `latest.json`은 전체 패킷이 아니라 `date_kst`, `data_path`, `report_path`, `status` 네 필드만 가진 포인터로 유지합니다. 전체 패킷은 날짜별 JSON에만 저장합니다.
6. 게시 전 Morning Paper 근거 key, Top Event 최대 3개, 사업 아이디어 0~3개, Today Opportunity 최대 1개, 아홉 현실성 Gate, Worth Reading 네 유형, 중복 사건·URL, 후보 승인 게이트, `latest.json` 포인터 구조를 schema로 검증합니다. 하나라도 실패하면 Git/Notion을 완료로 게시하지 않습니다.
7. JSON과 Markdown의 뉴스 제목·개수·구축 후보 상태가 일치하는지 확인한 뒤 하나의 커밋으로 저장합니다. 커밋 메시지는 `daily: YYYY-MM-DD intelligence`입니다.
8. Git 저장이 실패하면 Notion을 갱신하지 말고 실패를 보고합니다.

## 5. Notion 게시 — 읽기 전용 화면

- 대상 페이지는 `AI Daily Intelligence · Latest` (`3b54669d-5c35-81a5-965a-ce225de99bee`) 하나뿐입니다.
- Notion에서 **Query Data Source를 호출하지 마세요.** 기존 9개 DB를 fetch/query/create/update하지 마세요.
- 대상 페이지를 ID로 한 번 fetch한 뒤 `publish/notion-latest.md`의 내용으로 `replace_content` 하세요. 페이지 제목은 유지합니다.
- GitHub 전체 보고서와 날짜별 JSON 링크를 상단에 포함합니다.
- Notion 실패 시 Git 커밋은 성공 정본으로 유지하고 `partial_failure: notion_publish`를 보고합니다.

## 완료 알림

KST 날짜, Top 뉴스 제목, 사업 아이디어 수, 구축 후보 여부, Git 커밋/보고서 URL, Notion Latest URL, 누락 출처와 부분 실패를 요약합니다. 구축 후보가 있으면 **“Notion 검토 후 Codex에 `설계 시작: <아이디어명>`이라고 지시하세요”**라고 표시합니다.
