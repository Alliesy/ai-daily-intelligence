# AI Daily Intelligence Current Architecture

> 기준: Web V1.1 릴리스 브랜치 `agent/web-v1.1` commit `95d4421015fbc9d11a8359ec76e8aec76a8fe889`
> 갱신일: 2026-08-26 (Asia/Seoul)
> 문서 목적: 현재 운영 중인 수집·분석·게시 구조와 향후 웹서비스가 지켜야 할 호환성 경계를 기록한다.

## 1. 현재 프로젝트 구조

현재 저장소는 Git 정본 데이터 파이프라인과 이를 소비하는 Web 서비스가 한 저장소 안에서 논리적으로 분리된 monorepo다. AI Researcher가 만드는 일일 JSON과 보고서는 계속 기록 정본이며, Next.js 앱과 Supabase는 이 정본을 읽는 서비스 계층이다.

```text
ai-daily-intelligence/
├─ .github/
│  └─ workflows/
│     ├─ validate.yml
│     ├─ validate-importer.yml
│     └─ sync-supabase.yml
├─ apps/
│  └─ web/                  # Next.js 16 App Router 웹서비스
├─ data/
│  └─ daily/
│     ├─ README.md
│     └─ YYYY/
│        └─ YYYY-MM-DD.json
├─ publish/
│  └─ notion-latest.md
├─ packages/
│  └─ importer/             # Git archive → Supabase projection
├─ reports/
│  └─ YYYY/
│     └─ YYYY-MM-DD.md
├─ schema/
│  └─ daily.schema.json
├─ supabase/
│  ├─ migrations/           # additive content/user schema, RPC, RLS
│  └─ tests/                # foundation/RLS integration contracts
├─ scripts/
│  ├─ render_daily.py
│  └─ validate_daily.py
├─ tests/
│  └─ test_validate_daily.py
├─ .gitignore
├─ AUTOMATION_PROMPT.md
├─ package.json
├─ pnpm-workspace.yaml
├─ latest.json
├─ LATEST.md
└─ README.md
```

현재 archive에는 2026-08-07부터 2026-08-26까지 20개의 일일 패킷이 있으며 전체가 기존 daily schema 및 validator를 통과한다. Web V1.1은 Next.js, TypeScript, Tailwind CSS, Supabase SSR client로 구현되어 있고 Vercel Preview에서 검증됐다. Supabase Preview는 Git archive의 content projection을 보유하며, 사용자 전용 데이터는 별도 RLS 정책으로 격리된다.

기존 AI Researcher → Opportunity Finder → Git Publisher → Notion Latest Publisher 경로는 Web 빌드나 Supabase 가용성에 의존하지 않는다. `main` 반영 후 실행되는 `sync-supabase.yml`은 정본 게시 이후의 독립 소비 단계이며 실패해도 Git/Notion 정본을 되돌리지 않는다.

## 2. 기존 AI Researcher 자동화 흐름

`AUTOMATION_PROMPT.md`가 클라우드 Scheduled Task의 운영 계약이다. 실행 순서는 다음과 같다.

```text
AI Researcher
  → Opportunity Finder
  → Git Publisher
  → Notion Latest Publisher
  → 종료
```

### AI Researcher

- KST 실행 시점 기준 직전 24시간의 신규 발표와 최근 7일의 중요 후속 변화를 조사한다.
- 공식 발표, 공식 문서, 논문, 공식 저장소를 우선한다.
- 출시, 가격, 성능, 투자, 규제 주장은 가능한 경우 독립 출처 2개로 교차 검증한다.
- `FACT`, `INTERPRETATION`, `SIGNAL`, `SPECULATION`을 구분한다.
- 같은 사건을 다룬 공식 발표, 기사, 커뮤니티 반응은 하나의 Event로 통합한다.
- 신뢰도, 영향도, 활용도, 최신성, 커뮤니티 관심도를 평가해 뉴스 3~5개를 선택한다.
- 방어 가능한 뉴스가 3개 미만이면 억지로 채우지 않고 실패로 처리한다.

### Opportunity Finder

- 검증된 뉴스만 근거로 사용한다.
- 한국의 개인 또는 1~3인 팀이 실행할 수 있는 사업 아이디어를 0~3개 생성한다.
- 문제, 고객, 기존 해결법, 경쟁사, 차별점, 2주 MVP, 난이도, 수익화, 반증 조건을 기록한다.
- 구축 후보는 하루 최대 1개다.
- 구축 후보가 조건을 통과해도 `owner_action_required=true`, `status="waiting_for_owner"`로 기록할 뿐 자동 설계나 구현을 시작하지 않는다.
- Worth Reading은 `Paper`, `GitHub`, `YouTube`, `Blog`를 각각 정확히 1개 포함해야 한다.

### Git Publisher

- GitHub 저장소 `Alliesy/ai-daily-intelligence`의 `main`을 읽는다.
- `schema/daily.schema.json`과 같은 날짜의 기존 JSON을 먼저 확인한다.
- KST 날짜를 멱등 키로 사용해 `data/daily/YYYY/YYYY-MM-DD.json`을 생성하거나 보강한다.
- 검증된 기존 사실을 보존하고 새 근거만 추가한다.
- 동일 Event key와 정규화 URL을 중복 생성하지 않는다.
- 날짜별 보고서, 최신 보고서, Notion 게시 본문, 최신 포인터를 같은 JSON에서 생성한다.
- 모든 결과를 `daily: YYYY-MM-DD intelligence` 한 커밋으로 저장한다.
- Git 저장이 실패하면 Notion 게시를 실행하지 않는다.

### Notion Latest Publisher

- 고정된 `AI Daily Intelligence · Latest` 페이지 한 장만 교체한다.
- 기존 9개 Notion 데이터베이스를 조회하거나 변경하지 않는다.
- Git 저장 이후 Notion이 실패하면 Git은 성공한 정본으로 유지하고 `partial_failure: notion_publish`로 보고한다.

### 자동화 중단선

일일 자동화는 AI Architect, `project-pm`, 제품 구현 또는 배포를 자동으로 실행할 수 없다. 구축 후보에 대한 설계는 현재 사용자의 명시적인 후속 지시가 있을 때만 별도 단계로 시작할 수 있다.

## 3. GitHub가 정본으로 사용되는 방식

GitHub `main`이 유일한 기록 정본이다.

- 일일 기계 판독 정본: `data/daily/YYYY/YYYY-MM-DD.json`
- 일일 사람용 기록: `reports/YYYY/YYYY-MM-DD.md`
- 최신 데이터 탐색 포인터: `latest.json`
- GitHub 최신 브리핑: `LATEST.md`
- Notion 게시용 projection: `publish/notion-latest.md`

KST의 `YYYY-MM-DD`가 일일 idempotency key다. 같은 날짜에 자동화가 다시 실행되면 새 날짜 파일을 만들지 않고 기존 날짜 경로를 검증된 근거로 보강한다.

Notion과 향후 Supabase는 Git 정본을 소비하는 projection이어야 한다. 외부 서비스가 장애를 일으키더라도 Git에 성공적으로 저장된 일일 기록은 유지되어야 하며, 외부 서비스의 데이터로 Git 정본을 역으로 덮어쓰면 안 된다.

`latest.json`은 전체 패킷 복제본이 아니라 다음 네 필드만 가진 포인터다.

```json
{
  "date_kst": "2026-08-07",
  "data_path": "data/daily/2026/2026-08-07.json",
  "report_path": "reports/2026/2026-08-07.md",
  "status": "complete"
}
```

## 4. 주요 데이터 및 스키마 구조

`schema/daily.schema.json`은 JSON Schema draft 2020-12 형식이며 현재 `schema_version`은 `1.0`이다.

### 루트 패킷

필수 필드는 다음과 같다.

- 메타데이터: `schema_version`, `date_kst`, `generated_at`, `status`, `warnings`
- 핵심 데이터: `news`, `business_ideas`, `build_candidate`
- 보조 데이터: `tools`, `community`, `skill_of_the_day`, `worth_reading`
- 종합 결론: `todays_insight`

### News/Event

현재 JSON 필드명은 `news`지만 각 항목은 단일 기사가 아니라 하나의 사건을 표현한다.

- `event_key`: Event 안정 식별자
- `title`, `one_line_summary`, `impact`, `importance`
- `original_url`
- `key_quote`, `quote_translation`
- `summary`: FACT/INTERPRETATION/SIGNAL/SPECULATION 서술
- `why_it_matters`, `outlook`, `business_opportunity`
- `industry_mood`, `tags`
- `sources[]`: 하나의 Event에 연결된 복수 출처

`news`는 최소 3개, 최대 5개이며 중요도는 `S`, `A`, `B` 중 하나다.

### Source

각 출처는 다음 정보를 가진다.

- `title`
- `url`
- `publisher`
- `published_at`
- `tier`: `A`, `B`, `C`

### Business Idea와 구축 후보

`business_ideas`는 최대 3개이며 고객, 문제, 경쟁사, 차별화, 2주 MVP, 수익화, 반증 조건과 점수 정보를 포함한다.

`build_candidate`는 `null` 또는 후보 객체다. 후보가 존재하면 점수 4.3 이상, 근거 URL 2개 이상, `owner_action_required=true`, `status="waiting_for_owner"` 조건을 만족해야 한다.

### 기타 데이터

- `tools`: 최대 4개의 도구 또는 기술 참고 자료
- `community`: 최대 5개의 커뮤니티 신호
- `skill_of_the_day`: 일일 실무 스킬과 사용 예시
- `worth_reading`: Paper/GitHub/YouTube/Blog 각 1개, 총 4개
- `todays_insight`: 일일 종합 해석

## 5. 기존 파일별 역할

| 경로 | 역할 | 수명/소유권 |
|---|---|---|
| `AUTOMATION_PROMPT.md` | 클라우드 일일 자동화의 실행 순서, 검증 규칙, 중단선 | 운영 계약 |
| `schema/daily.schema.json` | 날짜별 JSON 데이터 계약 | 버전 관리되는 계약 |
| `data/daily/YYYY/YYYY-MM-DD.json` | 기계 판독용 일일 정본 | 영구 기록 |
| `reports/YYYY/YYYY-MM-DD.md` | 사람이 읽는 날짜별 전체 브리핑 | 영구 기록 |
| `latest.json` | 최신 날짜별 JSON과 보고서 경로를 가리키는 포인터 | 매일 교체되는 projection |
| `LATEST.md` | GitHub에서 바로 읽는 최신 브리핑 | 매일 교체되는 projection |
| `publish/notion-latest.md` | 고정 Notion Latest 페이지에 게시할 본문 | 매일 교체되는 projection |
| `scripts/validate_daily.py` | 표준 라이브러리만 사용하는 일일 패킷 검증기 | 자동화/CI 보호 장치 |
| `scripts/render_daily.py` | JSON에서 reports, LATEST, Notion 본문, pointer 생성 | 파생 파일 생성기 |
| `tests/test_validate_daily.py` | 중복, 최소 뉴스 수, 후보 승인 게이트, Worth Reading 완전성 테스트 | 회귀 방지 |
| `.github/workflows/validate.yml` | PR 및 관련 push에서 테스트와 전체 JSON 검증 실행 | CI 보호 장치 |
| `.github/workflows/validate-importer.yml` | importer 단위·계약 테스트 실행 | projection 회귀 방지 |
| `.github/workflows/sync-supabase.yml` | `main` 정본 commit 이후 Supabase projection 동기화 | 독립 소비 pipeline |
| `packages/importer/` | archive 검증, identity registry, Git watermark/CAS 기반 projection | 재구축 가능한 content importer |
| `supabase/migrations/` | Event 중심 content schema, 사용자 기능, RPC와 RLS | additive DB 계약 |
| `apps/web/` | 공개 Morning Paper/Archive와 선택적 로그인 사용자 기능 | Vercel 배포 애플리케이션 |
| `README.md` | 저장소 운영 원칙, 구조, 로컬 검증 안내 | 사용자 문서 |

`reports/YYYY/YYYY-MM-DD.md`와 `LATEST.md`는 렌더러가 같은 전체 Markdown 내용을 각각 날짜 경로와 고정 최신 경로에 기록한다. `publish/notion-latest.md`는 Notion 표시 형식에 맞춘 별도 projection이다.

## 6. 웹서비스 구축 시 재사용 가능한 부분

향후 AI Daily Intelligence Web은 기존 데이터를 다음 순서로 재사용할 수 있다.

1. `latest.json`에서 최신 날짜와 정본 경로를 탐색한다.
2. `data/daily/**`를 구조화된 원천 데이터로 import한다.
3. `reports/**`는 과거 전체 보고서 링크와 사람이 읽는 archive로 사용한다.
4. `LATEST.md`는 GitHub 최신 뷰로 유지한다.
5. `publish/notion-latest.md`는 웹 데이터 원천으로 사용하지 않는다.

재사용 가능한 도메인 데이터는 다음과 같다.

- Event: `news[].event_key`와 사건 중심 분석
- Source: Event별 복수 출처, URL, 발행처, 날짜, Tier
- Topic: `news[].tags`
- Opportunity: `business_ideas[]`와 `build_candidate`
- Resource: `tools[]`와 `worth_reading[]`
- Trend signal: `community[]`, `industry_mood`, 반복 Topic
- Daily briefing: 날짜, 상태, 경고, `todays_insight`

Supabase를 도입할 때는 위 JSON을 Event 중심 관계형 모델로 변환하되, Supabase를 Git에서 다시 생성할 수 있는 서비스 조회 DB로 유지해야 한다. 권장 식별자는 다음과 같다.

- Daily briefing: `date_kst`
- Event: `event_key`
- Source: 정규화한 URL
- Event occurrence: `date_kst + event_key`

사용자 반응, 북마크, Topic follow 같은 웹 전용 데이터는 Git JSON에 넣지 않고 Supabase 전용 테이블에 분리한다.

## 7. 수정하면 안 되는 기존 영역

웹서비스 구현은 다음 경로의 의미, 경로 규칙, 기존 동작을 보존해야 한다.

- `AUTOMATION_PROMPT.md`
- `schema/daily.schema.json`
- `data/daily/**`
- `reports/**`
- `latest.json`
- `LATEST.md`
- `publish/notion-latest.md`
- `scripts/validate_daily.py`
- `scripts/render_daily.py`
- `tests/test_validate_daily.py`
- `.github/workflows/validate.yml`

필요한 변경이 승인되더라도 다음 원칙을 지켜야 한다.

- 기존 경로나 필드를 이름 변경하거나 웹 전용 의미로 재사용하지 않는다.
- 스키마 변경은 구버전 JSON을 계속 읽을 수 있는 호환 방식으로 수행한다.
- 기존 daily validation을 웹 CI로 대체하지 않는다.
- 기존 `.gitignore` 항목을 덮어쓰지 않고 필요한 항목만 추가한다.
- 생성 파일을 수동 CMS 데이터처럼 사용하지 않는다.
- Supabase 또는 Vercel 실패를 Git/Notion 게시 성공 조건에 추가하지 않는다.
- 웹서비스가 Git 정본에 쓰기 작업을 수행하지 않는다.

웹서비스는 `apps/web/`, Supabase migration은 `supabase/`, Git-to-Supabase 동기화 코드는 별도 package 또는 tool 디렉터리처럼 기존 자동화와 격리된 경로에 두는 것이 안전하다.

## 8. 발견한 기술적 위험 또는 주의사항

### 원격 `main`과 로컬 브랜치 차이

분석 당시 로컬 checkout은 `main`이 아닌 작업 브랜치였고 로컬 `origin/main`도 실제 GitHub `main`보다 뒤처져 있었다. 이후 작업은 항상 원격 `main`을 fetch한 뒤 정확한 기준 commit을 확인해야 한다.

### JSON Schema와 실제 검증기의 차이

`scripts/validate_daily.py`는 `schema/daily.schema.json`을 직접 로드하는 JSON Schema validator가 아니라 별도로 작성한 커스텀 검증기다. 따라서 Schema와 Python 검증 규칙이 서로 어긋날 가능성이 있다.

### 일부 운영 계약은 CI에서 강제되지 않음

현재 CI는 날짜별 JSON과 validator 테스트를 검사하지만 다음 항목을 완전히 검증하지 않는다.

- `latest.json`이 정확히 네 필드의 포인터인지
- 날짜별 JSON과 Markdown의 제목·개수·후보 상태가 같은지
- `publish/notion-latest.md` 상단에 날짜별 JSON 및 보고서 직접 링크가 존재하는지
- 구축 후보가 공식 Tier A 근거, 4~8주 MVP, 모든 법률·보안 게이트를 통과했는지

이 조건들은 일부 자동화 프롬프트의 자체 검증에 의존한다.

### Source 검증 모델의 한계

현재 `sources[].tier`만으로는 향후 웹서비스가 요구할 `source_type`, `authority`, `verification_status`를 완전히 표현할 수 없다. 이 값을 추측해서 사실처럼 저장하지 말고, 명시적인 매핑 규칙 또는 향후 호환 필드가 필요하다.

### 수치형 AI 평가 점수 부재

현재 게시 JSON에는 중요도 `S/A/B`는 있지만 수치형 평가 점수와 점수 구성 항목이 없다. 웹에서 임의 점수로 변환하면 분석 신뢰성을 훼손할 수 있다. DB 필드를 nullable로 두고 향후 명시적인 평가 필드가 제공될 때만 표시하는 방식이 안전하다.

### 한국어 표시 데이터와 대표 이미지 부재

현재 일부 Event 제목과 요약은 영어이며 대표 이미지 필드가 없다. 웹 V1에서 한국어 제목과 이미지를 요구한다면 기존 JSON을 계속 읽을 수 있는 fallback과 별도의 호환 가능한 데이터 보완 절차가 필요하다. 외부 언론 이미지를 권리 확인 없이 복제하거나 저장하면 안 된다.

### Opportunity와 Event 간 명시적 관계 부재

현재 `business_ideas[]`에는 이를 뒷받침하는 `event_key` 목록이 없다. 웹 DB import 과정에서 제목 유사도만으로 관계를 생성하면 잘못된 근거 연결이 생길 수 있다. 명시적인 관계 데이터가 없으면 Daily Briefing과의 관계만 저장하는 것이 안전하다.

### 전역 Event 중복 검증 부재

현재 validator는 한 패킷 안에서만 `event_key`와 URL 중복을 검사한다. 여러 날짜에 걸친 전역 중복 또는 동일 Event의 후속 업데이트는 별도의 규칙이 필요하다. Supabase의 안정 키와 upsert 정책은 이를 고려해야 한다.

### 생성 결과의 직접 수정 위험

`reports/**`, `LATEST.md`, `publish/notion-latest.md`, `latest.json`은 같은 JSON에서 생성되는 파생 결과다. 이 파일만 수동 변경하면 다음 일일 실행에서 덮어써지거나 JSON과 불일치할 수 있다.

### 웹 동기화 결합 위험

Supabase 동기화를 기존 Git Publisher의 필수 단계로 삽입하면 Supabase 장애가 정본 기록을 막을 수 있다. 동기화는 `main` commit 이후 별도 workflow로 실행하고 실패 시 재시도할 수 있어야 한다.

## 문서 유지 규칙

이 문서는 현재 시스템 구조의 지속적인 기준 문서다. 기존 수집·검증·게시 구조, 데이터 계약 또는 정본 경계가 변경되면 관련 코드 변경과 같은 commit 또는 pull request에서 이 문서를 함께 갱신한다.

향후 프로젝트 기록은 다음 문서로 분리한다.

- `docs/CURRENT_ARCHITECTURE.md`: 현재 시스템 구조
- `docs/V1_ARCHITECTURE.md`: AI Daily Intelligence Web V1 설계
- `docs/DB_SCHEMA.md`: Supabase DB 및 ERD
- `docs/DECISIONS.md`: 중요한 기술·제품 의사결정과 근거
- `docs/IMPLEMENTATION_STATUS.md`: 구현 완료·진행·대기 상태
- `docs/CHANGELOG.md`: 주요 변경 이력
