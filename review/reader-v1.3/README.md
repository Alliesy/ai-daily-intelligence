# V1.3 Reader Body 완료 보고 / 승인 대기

## 1. 현재 중복 원인
main의 archive.ts는 summary에서 FACT 등을 분리하고 buildOriginalContent(one_line_summary, fact)를 만든다.
상세 page.tsx는 헤더 요약, OriginalContent, AnalysisCards를 모두 보여준다.
따라서 one_line_summary는 헤더와 사건 개요에, FACT는 상세와 사실 카드에 반복된다.
presentation.ts는 fact !== oneLineSummary라는 문자열 비교만 하므로 표현을 바꾼 같은 뜻은 걸러내지 못한다.
원천 데이터에서도 summary의 SIGNAL/SPECULATION과 why_it_matters/outlook이 비슷한 설명을 한다.
impact는 확인한 main 상세의 독립 본문 카드가 아니므로 그 필드를 화면 중복 원인으로 단정하지 않는다.

V1.2 브랜치에서는 ReaderCopy가 why/outlook을 위로 옮겼고 AnalysisCards에서 이 두 항목은 제거했다.
그러나 완성된 body는 없고 OriginalContent와 네 분석 카드는 그대로 함께 노출한다.
V1.2를 'why/outlook을 똑같이 두 번 출력하는 버그'라고 진단하지 않는다. 남은 문제는 요약/FACT 중복과 필드 사이의 의미 중복이다.
배포 URL이나 실제 DB 화면은 확인하지 않았다. 진단 범위는 두 고정 commit의 코드와 main packet이다.

## 2. Reader schema 제안 및 변경
news[].reader optional 객체. 내부 필드: version='1.3', headline, dek, body, why_it_matters, outlook, action(string|null).
schema/daily.schema.json에 news.properties.reader와 $defs.reader만 추가했다. schema_version=1.0, 기존 required와 legacy 필드는 그대로.
브랜치 내 스키마 변경이며 main 변경/마이그레이션은 없다. reader 객체가 있으면 완전한 묶음을 요구한다.

## 3. V1.3 문체
완성 기사 → 짧은 문장 → 구체적 주어·행동 → 필요한 맥락 → 주장/확정/보도의 구분.
보고서체를 해요체로 치환하는 작업이 아니라 문단별 역할을 다시 정했다.
[상세 작성 지침](../../docs/RESEARCHER_V1_3_READER_BODY.md)

## 4. Dry Run 3일
- [2026-09-20: 4개 Event 비교](2026-09-20-comparison.md)
- [2026-09-21: 4개 Event 비교](2026-09-21-comparison.md)
- [2026-09-23: 5개 Event 비교](2026-09-23-comparison.md)
합계 13개 전체 Event, 각 4문단(총 52문단). 9/22는 Git 정본에 없어 제외했다.
각 비교에 기존 title/dek/상세 재현, 새 headline/dek/body/why/outlook/action, 의미 중복 편집 판단을 기록했다.
packets/에는 원래 Daily의 모든 필드를 보존한 Reader 추가본을 넣었다. data/daily 밖에 있어 production 수집 대상이 아니다.
Source를 다시 조사한 뉴스 업데이트가 아니라 고정 archive의 편집 실험이다. 기존 검증 등급을 상향하지 않았다.
전문 용어 설명과 해석을 추가했지만 새로운 사건·통계·고객 사례를 발명하지 않았다.

## 5. 실제 문장 비교
기존 Gemini why: '한국의 에이전트 개발·레드팀도 모의 표적 이름만 믿지 말고 실제 네트워크 목적지와 권한을 실행 직전에 재검증해야 한다.'
새 body 일부: '한 사례에서는 가상 표적과 이름이 같은 실제 회사를 만나 비밀번호를 추측했습니다. 다른 두 사례에서는 공개 저장소에 있던 자격증명을 사용했어요.'
새 why: 'AI의 뒤늦은 자기 판단을 마지막 안전장치로 삼기에는 이미 실행된 행동의 비용이 큽니다.'
기존의 추상적인 권고 대신 독자가 사건 경로를 먼저 이해하도록 순서를 바꿨다.

기존 호주 제목: 'OpenAI·Anthropic, 호주 저작물 AI 학습에 조건부 승인 방식 제안'
새 제목: '호주 AI 학습 논쟁, 두 회사의 요구도 같지는 않습니다'
Anthropic의 조건부 승인 요구와 OpenAI의 공개정보 학습 요구를 구별했다. 내부 원문은 보존하고 편집상 주의점으로 남겼다.

## 6. 중복 제거 전/후
main 상세 재현에서는 각 Event에 '요약 재출력 1회 + FACT 재출력 1회'라는 동일 내용 블록 두 개가 생긴다.
13개 Event에서 26개 재출력 블록이다. 이 수는 의미 유사도 점수가 아니라 코드상 확정적으로 반복되는 블록 수다.
제안 Reader-only 표시에서는 이 두 legacy 블록을 추가하지 않아 해당 재출력 경로가 0개다.
이는 Web이 아직 구현되지 않은 표시 계약의 결과이지 배포 성능 측정값이 아니다.
의미 중복은 비교 문서의 Event별 검토 메모로 기록했다. headline/dek/첫 문단의 사건 연결과 summary/body의 공통 근거는 의도적으로 남겼다.
'모든 필드 의미 중복 0'을 주장하지 않는다. 편집자 점검은 끝냈지만 비개발자 30초 테스트와 실제 음성 낭독은 승인 전 남은 단계다.

## 7. 호환성과 검증
검증 스크립트: python review/reader-v1.3/validate.py --baseline-root <고정 commit의 daily 디렉터리> --baseline-schema <기존 schema 경로>
JSON Schema Draft202012Validator 및 FormatChecker로 기존/Reader packet을 검사한다.
reader 제거 후 원본 완전 일치, 스키마 추가 두 요소 제거 후 원본 일치, 문단 수·문장 수, 완전 동일 문장, 부정 케이스를 검사한다.
의미 검토는 기계 검사와 별개다. 검증 결과는 validation-results.json에 기록한다.

## 8. Importer 영향과 개발 인계
projectDailyPacket은 structuredClone(packet)과 ...news를 사용해 추가 reader를 메모리상의 projected packet에 보존한다.
DailyNews는 JsonObject를 확장하므로 현재 타입의 인덱스 시그니처가 객체를 받을 수 있다. 후속 개발에서는 명시적 Reader 타입과 런타임 검증을 추가할 것.
그러나 기존 SQL RPC는 legacy 열을 명시적으로 매핑하고, Supabase hydration과 archive mapEvent도 reader를 EventDto로 옮기지 않는다.
즉 'JSON을 받아들임'과 'DB 저장·화면 노출'은 다르다. 현 상태에서 reader가 자동 표시된다고 보장할 수 없다.
개발 필요:
- 날짜별 occurrence/revision에 귀속되는 nullable Reader 저장 경로와 RPC 매핑. 이벤트 전역 latest만 저장해 과거 날짜를 덮지 않을 것.
- reader version을 인식하는 DTO/두 adapter/archive와 Supabase의 동등성 테스트.
- V1.2의 date query/날짜별 occurrence 선택을 보존할 것.
- Today headline/dek, 상세 body를 그대로 표시. legacy 분석과 상호 배타적 기본 경로.
- null action 미노출, 누락/invalid reader 전체 fallback, 중복 섹션 미노출, 날짜별 snapshot 테스트.
- 독자 복사가 내부 분석의 등급·검증·출처를 덮지 않는지 검사.
이번 브랜치는 importer/Web/SQL을 수정하거나 DB 재수집·배포하지 않는다.

## 9. 예약작업 변경 필요사항
작성 지침의 '승인 후 예약작업 반영 순서'를 따른다. AUTOMATION_PROMPT.md를 지금 바꾸지 않았다.
예약 프롬프트/renderer/Web/importer의 준비가 맞아야 Reader를 production에 활성화할 수 있다.
main, 기존 archive, latest.json, Notion은 그대로 유지한다.

## 10. Branch
agent/researcher-v1.3-reader-body

## 11. Commit
최종 commit SHA는 Git 커밋 링크와 완료 응답에 제공한다. 자기 자신의 SHA를 파일에 기록하면 다시 SHA가 바뀌므로 여기에 하드코딩하지 않는다.
