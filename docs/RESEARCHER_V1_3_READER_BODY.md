# Researcher V1.3 Reader Body — 승인 대기

## 범위
이 문서는 제안이며 production 지침이 아니다. AUTOMATION_PROMPT.md, 예약작업, main archive, LATEST, Notion, Web 및 DB를 변경하지 않는다.
기준 main: 2d6c33bf62486573a8083c2151dd0b546a344814.
V1.2 Web 확인 기준: 4ac9bfcc72954b1ea38d9a0cbce7ea6f561edfc3.

## 저장 계약
Daily schema_version은 1.0을 유지한다. news[].reader를 optional additive 객체로 추가한다.
reader가 없으면 유효한 legacy packet이다. 있으면 version=1.3과 headline, dek, body, why_it_matters, outlook, action을 완전하게 작성한다.
action은 실행할 일이 없으면 null. 빈 문자열이나 의무적인 권고를 넣지 않는다.
body는 빈 줄 두 개로 문단을 구분한 일반 한국어 텍스트다. HTML·분석 라벨·자동 조립용 조각을 넣지 않는다.
reader 내부에만 additionalProperties=false를 적용한다. 기존 root/news 필드의 계약은 그대로다.
기존 title, one_line_summary, summary, impact, why_it_matters, outlook, sources, 검증·근거·provenance를 삭제·덮어쓰지 않는다.
Reader의 작성 버전과 Daily 데이터의 버전은 별개다. 새로운 필드가 원문이나 검증 결과를 대체하지 않는다.

## 작성 순서
1. 기존 근거에서 확인된 주장, 보도된 주장, 해석, 미확인을 먼저 나눈다.
2. 독자가 알아야 할 한 가지 변화를 정한다. 출처 제목을 그대로 번역하거나 과장하지 않는다.
3. body를 하나의 기사로 새로 쓴다. FACT/INTERPRETATION/SIGNAL/SPECULATION 순서 복붙을 금지한다.
4. 짧은 사건 3~4문단, 중요한 사건 4~7문단, 문단당 2~4문장을 기준으로 한다. 근거가 부족하면 분량을 채우려고 사실을 만들지 않는다.
5. 첫 문단은 사건, 이후 문단은 달라진 점·맥락·독자 관련성·현재 한계를 담당한다.
6. headline은 핵심 변화, dek는 1~2문장으로 사건과 달라지는 점을 설명한다. 본문 문장이나 숫자 목록을 복사하지 않는다.
7. why_it_matters에는 본문 뒤 남길 의미 한 가지, outlook에는 다음에 볼 구체적인 문서·변수·일정만 둔다.
8. action은 즉시 할 수 있고 독자와 직접 관련 있는 경우에만 쓴다. 발표만으로 모델 변경·계약 해지·투자를 권하지 않는다.
9. 한 문장에 핵심 하나. 주어와 행동이 보이게 쓰고 긴 수식어·명사 나열·번역투를 줄인다.
10. '운영 사건', '구조적 변화', '통제 가능성으로 이동' 같은 추상 결론은 실제로 무엇이 달라지는지로 풀어 쓴다.
11. 차분한 존댓말을 기본으로 한다. ~합니다/~입니다/~수 있습니다와 필요한 ~해요를 자연스럽게 섞되 종결형을 기계적으로 교대하지 않는다.
12. 감탄사·이모지·유행어·광고 문구·지나친 반말을 넣지 않는다.

## 중복 편집 게이트
각 문장에 담당 역할을 배정하고, 같은 주장에 추가 맥락이 없으면 삭제하거나 한 필드로 옮긴다.
- headline/dek/첫 문단: 같은 사건을 지칭하는 최소 연결과 고유명사·날짜·숫자는 허용한다. 같은 사실의 재진술만으로 문장이나 문단을 채우지 않는다.
- body/why: 사실 재요약 금지. why는 한 가지 의미만.
- body/outlook: 현재 한계와 다음 확인 변수를 구분한다. 본문 말미와 outlook에 같은 확인 목록을 두 번 쓰지 않는다.
- body/action: 본문에서 이미 한 권고를 action에서 반복하지 않는다.
- summary/body: 근거 수준의 겹침은 정상이다. 내부 분석은 그대로 두고 문장 복제·단순 조립 및 같은 독자 화면에 두 레이어를 동시 표시하는 것을 차단한다.
완전 일치 검사는 보조 수단이다. 어휘가 달라도 의미가 같으면 편집자가 검토한다. 자동 검사 결과를 '의미 중복 0'의 증명으로 쓰지 않는다.

## 읽기 게이트
30초: headline+dek+첫 문단을 읽고 비개발자가 사건·변화·관심 이유를 말할 수 있는지 확인한다.
낭독: 한국어로 소리 내어 읽어 발표자료처럼 들리는 구절, 긴 문장, 조사·명사 연쇄를 수정한다.
자동 실행에서 실제 독자나 음성 검사를 하지 못했다면 편집자 대리 점검으로 기록한다. 실제 테스트 통과라고 보고하지 않는다.
사실·수치·귀속·부정·조건·불확실성이 원래 근거와 달라지지 않았는지도 확인한다.

## Morning Paper와 화면 계약 (개발 후 적용)
Today Top Event는 reader.headline+reader.dek만 사용한다.
상세는 reader.headline → reader.dek → reader.body → reader.why_it_matters → reader.outlook → action(있는 경우) → Sources 순서다.
유효한 reader가 있을 때 OriginalContent/AnalysisCards/legacy one_line_summary를 기본 독자 본문에 추가하지 않는다.
내부 분석은 명시적인 별도 분석 보기로 보존한다. Web은 Reader 본문을 다시 요약·생성·조립하지 않는다.
reader가 없거나 유효하지 않은 legacy event는 기존 경로로 안전하게 돌아간다. 부분 reader와 legacy 필드를 섞은 글을 만들지 않는다.
Morning Paper Insight에도 같은 문체를 적용하되 cross_event_signal_v1, evidence_event_keys, top_event_keys는 유지한다.
Dry Run에서는 Insight 변경을 비교 문서에만 두고 원래 packet의 분석값은 유지했다.

## 승인 후 예약작업 반영 순서
1. 사용자 문체 승인 및 샘플 피드백 반영.
2. 개발 측 Reader 저장/DTO/렌더링·fallback·archive 날짜 선택 테스트.
3. 스키마와 Researcher 지침 병합 승인. 현 AUTOMATION_PROMPT.md에 본 지침을 연결하고 예약 프롬프트도 같은 계약을 따르게 수정.
4. 날짜별 신규 결과에만 Reader 작성을 필수화하는 생성 게이트 추가. legacy schema의 reader optional은 유지.
5. JSON↔Markdown 검증은 같은 event_key에 연결된 reader.headline로 비교. title은 내부 분석 검증에서 별도 보존.
6. 렌더러의 Reader 우선 경로를 확인한 후 Git/Notion 게시 활성화. latest.json의 4필드는 그대로.
7. rollback은 Reader 표시/생성을 끄고 legacy 경로 복귀. archive 일괄 제거·번역·migration 금지.
현재 단계에서 어떤 예약작업도 수정하지 않았다.
