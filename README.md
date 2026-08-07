# AI Daily Intelligence

매일의 AI 신호를 **Git에 영구 보존**하고, Notion에는 사람이 읽을 최신 브리핑 한 장만 게시하는 개인 Intelligence OS입니다.

## 운영 원칙

- **정본(Source of Truth): Git** — 날짜별 JSON과 Markdown은 커밋 이력으로 보존합니다.
- **보기(View): Notion** — `AI Daily Intelligence · Latest` 한 페이지만 교체합니다.
- **Notion DB 조회 금지** — 일일 실행에서 `Query Data Source`와 9개 관계형 DB를 사용하지 않습니다.
- **멱등성** — 같은 KST 날짜는 같은 경로를 갱신하고 중복 파일을 만들지 않습니다.
- **승인 게이트** — 구축 후보는 기록만 하며, 사용자가 Notion을 검토한 뒤 지시하기 전에는 설계·구현하지 않습니다.

## 저장 구조

```text
data/daily/YYYY/YYYY-MM-DD.json   # 기계 판독용 정본
reports/YYYY/YYYY-MM-DD.md        # 사람이 읽는 전체 브리핑
latest.json                       # 최신 정본을 가리키는 포인터
LATEST.md                         # GitHub 첫 화면용 최신 브리핑
publish/notion-latest.md          # Notion 단일 페이지 게시용 본문
schema/daily.schema.json          # 데이터 계약
scripts/validate_daily.py         # 무의존성 검증기
scripts/render_daily.py           # JSON → Markdown 렌더러
```

## 일일 클라우드 흐름

1. 공식 자료 우선으로 최근 24시간을 조사하고 출처를 교차 검증합니다.
2. `schema/daily.schema.json` 형식으로 날짜별 JSON을 생성합니다.
3. 동일 날짜 파일이 있으면 새 파일 대신 보강합니다.
4. 전체 보고서와 최신 포인터/렌더링 파일을 함께 갱신해 한 커밋으로 저장합니다.
5. Notion의 고정 페이지 한 장만 `publish/notion-latest.md` 내용으로 교체합니다.
6. 구축 후보가 있으면 `owner_action_required: true`로 표시하고 종료합니다.

클라우드 Scheduled task에 넣을 정확한 프롬프트는 [AUTOMATION_PROMPT.md](AUTOMATION_PROMPT.md)에 있습니다.

## 로컬 검증

```powershell
python scripts/validate_daily.py data/daily/2026/2026-08-07.json
python scripts/render_daily.py data/daily/2026/2026-08-07.json
```

검증기는 뉴스 3~5개, 중복 URL·사건 키, 날짜/URL, 출처, 구축 후보 승인 게이트를 검사합니다. 오류가 있으면 Git/Notion 게시를 완료로 간주하면 안 됩니다.

## Notion 게시 대상

- Hub: [AI Daily Intelligence](https://app.notion.com/p/3b44669d5c3580a2acdac89379458539)
- Latest: [AI Daily Intelligence · Latest](https://app.notion.com/p/3b54669d5c3581a5965ace225de99bee)

Notion 게시는 `fetch page → replace_content`만 허용합니다. `query_data_sources`, 데이터베이스 생성/수정, 관계 검증은 일일 루틴에서 호출하지 않습니다.
