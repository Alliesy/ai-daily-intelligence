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
- 아래 개인 관련성 gate를 먼저 적용하고, 통과한 후보만 기존 가중치로 평가합니다. 선정 뉴스는 3~5개, Morning Paper의 Top은 그중 최대 3개입니다. 내부 조사 후보와 공개 뉴스 선정은 구분합니다.

### 개인 독자 관련성 — 사용자 승인 2026-10-12

- 주 독자는 한국에서 AI를 일상·학습·창작·업무에 쓰는 일반 개인입니다. 개인 개발자와 1~3인 팀도 포함하되 전문 인프라 운영자나 투자자를 기본 독자로 가정하지 않습니다.
- 점수를 매기기 전에 “이 소식을 읽은 개인이 도구를 고르거나, 일을 하거나, 중요한 변화를 이해하는 데 무엇을 얻는가?”를 한 문장으로 답합니다. 기업명·투자액·벤치마크의 크기만으로 통과시키지 않습니다.
- 우선 조사: ① 많이 쓰는 AI 도구의 기능·가격·무료 한도·지원 종료 ② 글쓰기·사진·영상·공부·일상·업무에서 실제로 써볼 수 있는 변화 ③ 개인 장비·예산으로 실행 가능한 공개 도구·연구 ④ 개인정보·저작권·오류·서비스 이용 조건의 변화입니다. 발표문뿐 아니라 공식 릴리스 노트·가격표·지원 문서·공식 저장소에서 변화와 이용 조건을 확인합니다.
- 기업 인수·투자·IPO·반도체·데이터센터 뉴스도 조사하되, 개인의 비용·선택권·기능·서비스 지속성에 연결되는 구체적 근거가 있을 때만 독자용 뉴스로 선정합니다. “언젠가 저렴해질 수 있다” 같은 추측을 관련성 근거로 사용하지 않습니다.
- 선정 후보마다 additive 메타데이터 `audience_relevance`에 `method=personal_reader_v1`, `category`(direct_use / personal_context / industry_background), `gate`(pass / fail / unknown), `affected_reader`, `reader_benefit`, `evidence_urls`, `top_eligible`을 기록합니다. 내부 메타데이터를 사용자 화면에 그대로 노출하지 않습니다.
- `direct_use`는 개인의 실제 사용·선택·비용·위험에 대한 확인 가능한 변화가 있는 경우입니다. `personal_context`는 당장 행동하지 않아도 개인에게 중요한 변화를 이해하게 해주며 그 관련성을 구체적으로 설명할 수 있는 경우입니다. `industry_background`나 관련성 gate가 fail/unknown인 항목은 Top과 독자용 뉴스 최소 개수를 채우는 데 쓰지 않습니다.
- 독자용 선정 뉴스 3~5개 중 최소 2개는 direct_use로 구성하고 기업·투자 중심의 맥락 뉴스는 최대 1개입니다. 이를 맞추려고 가짜 신선도·억지 행동·중요하지 않은 기능을 추가하지 않습니다. 조건을 만족하는 3개가 없으면 선정 미달을 보고하고 complete로 새 브리핑을 게시하지 않습니다.
- 최근 7일 자료는 중요한 후속 변화가 있을 때만 뉴스로 재선정합니다. 같은 발표를 새 뉴스처럼 반복하거나 오래된 사용 팁을 오늘 발표처럼 소개하지 않습니다.
- 신뢰도 30·영향도 25·활용도 20·최신성 15·커뮤니티 10의 가중치는 유지합니다. 영향도는 개인의 기능·가격·선택·권리·업무에 미치는 변화로, 활용도는 독자의 이해·선택·실행에 실제로 얼마나 도움이 되는지로 평가합니다. 시가총액·인수금액·조회수로 영향도·활용도를 대신하지 않습니다.
- 사용 가능 여부, 한국 제공 범위, 무료/유료 조건, 필요한 장비·계정·난이도를 확인 가능한 범위에서 설명하고 미확인은 명시합니다. 모든 뉴스에 행동을 붙이지 않으며 즉시 할 수 있는 일이 없으면 reader.action은 null로 둡니다.
- Worth Reading과 오늘의 활용법도 개인 독자에게 도움이 되는 자료를 우선합니다. 단순 커널·데이터센터 운영 자료를 “활용할 수 있다”는 이유만으로 고르지 않습니다. Paper / GitHub / YouTube / Blog 정확히 한 개씩 검증하는 규칙은 유지합니다.


## 2. Intelligence Editor — 독자가 가져갈 의미 한 가지

1. 인사이트는 뉴스 목록의 압축이나 멋있는 표어가 아니라, 독자가 읽고 이해할 수 있는 결론 한 가지입니다. 먼저 “그래서 독자에게 무엇이 달라지는가?”에 평범한 한국어로 답한 뒤 제목을 씁니다.
2. 여러 사건이 같은 의미를 실제로 뒷받침할 때만 연결합니다. 서로 무관한 기업·숫자·사건을 쉼표·병렬·대비로 한 줄에 욱여넣지 않습니다. 하나의 인수설·장애·IPO 사례로 AI 시장 전체를 단정하지 않습니다.
3. 제목은 하나의 주어와 한 가지 핵심 의미를 중심으로 씁니다. 숫자·고유명사는 이해에 꼭 필요할 때만 넣고, 제목 아래 2~4문장에서 그 의미를 뒷받침하는 근거와 한계를 설명합니다.
4. 제목만 읽은 비개발자가 “무슨 뜻인지”와 “왜 알아둘 만한지”를 말할 수 있는지 확인합니다. 제목을 풀어 설명해야 비로소 뜻이 통하면 다시 씁니다. 쉬운 말이어도 내용 없는 교훈·보고서체·과장·광고 문구는 사용하지 않습니다.
5. 좋은 방향의 예: “AI 기업의 몸값만 보고 잘나간다고 생각하면 안 됩니다”, “무료로 쓰던 기능이 유료가 되면, 같은 작업에도 돈이 듭니다”. 실제 근거가 있을 때만 참고하고 고정 문형으로 복제하지 않습니다.
6. 피할 예: “70억달러 인수설 옆에서, 데이터센터 세 곳과 310억달러 상장이 멈췄다”, “화면은 달라지고, 요금은 내려가고, PC는 바빠진다”. 개별 뉴스의 장면이나 숫자 나열을 독자를 위한 의미로 착각하지 않습니다.
7. 여러 Event가 뒷받침하는 공통 의미가 있을 때 기존 호환성을 위해 `morning_paper.insight_method=cross_event_signal_v1`을 유지하고 실제 근거 Event key만 `evidence_event_keys`에 넣습니다. 공통 근거가 없으면 의미를 억지로 만들어 이 method로 표시하지 말고 optional morning_paper를 생략합니다. 필수 `todays_insight`에는 확인된 범위에서 독자에게 남길 의미 또는 공통 인사이트를 선정하지 못한 이유를 솔직하게 씁니다. 새 schema enum이나 breaking change를 임의로 만들지 않습니다.
8. `morning_paper.top_event_keys`는 개인 관련성 gate를 통과한 뉴스에서 최대 3개만 고릅니다. 강한 Top이 1~2개면 그대로 두며 전체 선정 뉴스 3~5개 충족 여부와 혼동하지 않습니다. 새 기준으로 재검토한 기존 뉴스가 모두 부적격이면 배열을 비우고 이를 완료된 개인용 브리핑으로 표시하지 않습니다.
9. Evidence 숫자는 Event/Source 관계에서만 계산합니다. 공식 Source는 명시적 `authority=official`, 독립 근거는 명시적 `authority=independent`이면서 서로 다른 `evidence_group`만 계산합니다. 분류가 없으면 추정 숫자를 만들지 않습니다.
10. 게시 전 최근 7개 브리핑과 제목의 시작·문장 뼈대·의미가 반복되는지 비교합니다. 쉬움과 정확성이 말맛이나 신선한 비유보다 우선입니다. 제목과 요약 기준을 JSON·보고서·LATEST·Notion·완료 알림에 동일하게 적용합니다.

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
3. 같은 날짜 파일이 있으면 기존 검증된 사실·출처는 보존하고 동일 사건 키와 정규화 URL을 중복 생성하지 않습니다. 사용자 승인 편집 재검토로 선정에서 제외할 때에는 검증된 원문을 삭제하지 말고 배경 자료로 보존하며 제외 사유·개정 이력을 기록합니다. 새 기준의 뉴스 개수가 부족하면 status=partial과 경고를 명시하며 complete라고 게시하지 않습니다.
4. `reports/YYYY/YYYY-MM-DD.md`, `LATEST.md`, `publish/notion-latest.md`를 동일 데이터에서 갱신합니다.
5. `latest.json`은 전체 패킷이 아니라 `date_kst`, `data_path`, `report_path`, `status` 네 필드만 가진 포인터로 유지합니다. 전체 패킷은 날짜별 JSON에만 저장합니다.
6. 게시 전 개인 관련성 gate, 독자용 뉴스 3~5개 중 direct_use 최소 2개·기업 맥락 최대 1개, 인사이트 한 가지 의미·비개발자 이해 검사, Morning Paper가 있으면 실제 근거 key와 적격 Top 최대 3개, 사업 아이디어 0~3개, Today Opportunity 최대 1개, 아홉 현실성 Gate, Worth Reading 네 유형, 중복 사건·URL, 후보 승인 게이트, `latest.json` 포인터 구조를 schema로 검증합니다. 하나라도 실패하면 Git/Notion을 완료로 게시하지 않습니다.
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
