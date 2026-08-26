# AI Daily Intelligence · Researcher V1.2

> 상태: **Dry Run 완료 · Production 반영 승인 대기**  
> 기준일: 2026-08-26 (Asia/Seoul)  
> 작업 브랜치: `agent/researcher-v1.2-dry-run`  
> 안전 경계: 예약 작업, `AUTOMATION_PROMPT.md`, daily schema, 기존 archive, Web UI와 Opportunity Finder를 변경하지 않았다.

## 1. 목표

Researcher V1.2의 목표는 뉴스를 더 많이 보여주는 것이 아니다. 직전 24시간의 신규 발표와 최근 7일의 중요 후속 변화를 폭넓게 모으고, 여러 출처로 사실과 맥락을 확인한 뒤, 한국의 비개발자 직장인이 30초 안에 이해할 수 있는 소수의 Event만 보여주는 것이다.

핵심 문장은 다음과 같다.

> 전문적으로 조사한다. 여러 출처로 교차 확인한다. 한국 독자에게 쉽게 설명한다. 많이 모았기 때문에 적게 보여준다.

기본 독자는 **AI에는 관심이 있지만 AI 개발 전문가는 아닌 한국의 일반 직장인**이다. 정확성을 낮추지 않되, 모델명·벤치마크·규제 용어를 이미 안다고 가정하지 않는다.

## 2. 현재 기준선과 가장 큰 문제

작업 전 `main`의 `AUTOMATION_PROMPT.md`, `schema/daily.schema.json`, 최근 7일(2026-08-20~26)의 Daily JSON과 보고서, `CURRENT_ARCHITECTURE.md`, `V1_ARCHITECTURE.md`, `CHANGELOG.md`, `DECISIONS.md`, `IMPLEMENTATION_STATUS.md`를 확인했다. 별도 prompt 디렉터리는 없으며 현재 AI Researcher, Opportunity Finder와 Git/Notion Publisher 규칙은 `AUTOMATION_PROMPT.md`에 함께 들어 있다.

현재 방식의 가장 큰 문제는 **조사 단계의 중요도와 Morning Paper의 독자 중요도를 충분히 분리하지 못한 것**이다. 최근 결과는 공식 자료와 Reuters 등 복수 출처를 상당히 잘 확보했지만, 다음 문제가 반복됐다.

- Daily JSON의 3~5개 Event가 사실상 모두 Top News처럼 렌더링된다.
- 기술·자본시장 뉴스가 구체적인 사용자 변화 없이 높은 순위에 오른다.
- 제목에 제품명, 금액, 전문용어가 먼저 나와 변화가 바로 보이지 않는다.
- `왜 중요한가`가 소형 AI 팀이나 투자자를 기본 독자로 삼는 경우가 많다.
- Insight가 여러 뉴스를 한 문단에 이어 붙인 결론이 되기 쉽다.
- 한국어 기사를 적극적으로 찾아 용어와 국내 맥락을 점검하는 단계가 명시적이지 않다.
- `morning_paper` optional contract가 이미 존재하지만 2026-08-20~26 패킷은 모두 이를 채우지 않았다.

V1.2는 저장용 Event와 노출용 Morning Paper를 분리하고, 최종 선정 직전에 일반 사용자 Gate와 편집 품질 Gate를 추가한다.

## 3. 수집 방식

### 3.1 수집량과 노출량 분리

한 실행에서 먼저 여러 분야의 후보 Event를 넓게 수집한다. 목표 수치는 강제 할당이 아니지만, 정상적인 뉴스 흐름에서는 10건 이상의 후보를 검토할 수 있어야 한다. 이후 중복 Event를 합치고 검증 수준과 독자 관련성을 평가해 Today에는 최대 3건만 노출한다.

```text
Broad collection
  → Event normalization
  → Source lineage / claim verification
  → 기존 5요소 평가
  → General User Gate
  → diversity review
  → Korean rewrite / quality review
  → Morning Paper 0~3건
```

강한 뉴스가 2건이면 2건만 낸다. 후보가 많다는 이유로 약한 Event를 올리지 않는다.

### 3.2 수집 범위

- 시간 범위: KST 실행 시각 직전 24시간 신규 발표 + 최근 7일의 중요 후속 변화
- 분야: 모델, 소비자 제품·기능, Agent, 개발도구, Open Source, 연구, Big Tech 전략, 기업 변화, 규제·정책, 보안·안전, 일·생활 변화, 한국 관련 뉴스, 실제 활용 사례
- 재사용 제한: 전날 이미 충분히 다룬 Event는 중요한 후속 사실이 생긴 경우에만 다시 후보로 올린다.
- Macro 숫자: 사용량·투자·다운로드·시장규모만 늘어난 Event는 실제 제품·비용·행동·경쟁 구조 변화와 연결되지 않으면 우선순위를 낮춘다.

## 4. Source 우선순위와 검증

### 4.1 조사 순서

1. **공식·Primary Source**: 실제 발표 내용, 날짜, 대상 사용자, 가격, 지역, 기능, 제한과 성능 수치의 기준으로 쓴다.
2. **해외 독립 보도**: 경쟁 맥락, 고객 반응, 논란, 공식 발표가 생략한 조건과 한계를 확인한다.
3. **한국어 기사**: 국내 가용성·가격·영향과 자연스러운 한국어 표현을 점검한다. 공식 자료를 대체하지 않는다.
4. **기타 근거**: 논문, GitHub, YouTube, X, Community는 주장 성격에 따라 보조하거나 반응을 확인한다.

### 4.2 Claim 단위 검증

Event 전체에 한 번 `verified` 표시를 붙이지 않는다. 핵심 주장을 다음처럼 나누어 확인한다.

- 발표 사실과 날짜
- 실제 사용 가능 상태: 발표 / 초대 / preview / GA / 종료
- 대상 요금제와 지역
- 가격 및 기간
- 성능 수치와 시험 조건
- 회사·정부·소송 당사자의 주장
- 독립적으로 확인된 사실
- 아직 확인되지 않은 해석

공식 발표의 자체 벤치마크는 “공식 수치”로는 확인할 수 있지만 “독립 재현”으로 보지 않는다. 소송·혐의는 제기 또는 기소 사실과 최종 판단을 분리한다.

### 4.3 독립 근거와 Source lineage

URL 개수가 아니라 **원출처가 다른 evidence group**을 센다.

```text
공식 발표 1건
Reuters 원보도 1건
Reuters를 번역·재작성한 국내 기사 3건
→ 독립 근거군 2개, 한국어 기사 활용 3개
```

국내 기사가 보도자료나 Reuters를 재인용했다면 해당 계보를 메모하고 독립 근거 수에는 더하지 않는다. 한국 기사 수는 “한국 관점·용어 검토에 실제 사용한 기사 수”로 별도 표시한다.

### 4.4 Source가 부족한 Event

- 새 기능의 가격·가용성처럼 공식 문서가 가장 권위 있는 사실은 공식 1건만으로 후보가 될 수 있다. 다만 독립 사용 검증 부재를 명시한다.
- 익명 소식통 기반 거래·투자·정책 보도는 공식 확인이 없으면 제목과 본문에서 `검토`, `보도`, `혐의`, `가능성`을 유지한다.
- 한국 기사를 찾지 못했다고 중요한 해외 Event를 제외하지 않는다. `한국 기사 활용 0`을 투명하게 남긴다.

## 5. 한국 기사 활용 규칙

한국어 기사는 다음에만 적극 사용한다.

- 국내 출시·지역·요금제 확인
- 국내 기업·직장인에게 달라지는 점 확인
- 한국 독자가 실제 쓰는 제품·기술 용어 확인
- 해외 원문에서 놓치기 쉬운 국내 규제·시장 맥락 확인

국내 기사의 문장 구조를 복사하거나 영어 기사의 번역본으로 쓰지 않는다. 공식 자료와 해외 보도를 모두 이해한 뒤 Event를 처음부터 한국어로 다시 설명한다. 기사 전문이나 긴 번역문을 저장하지 않으며, 일반 언론은 상세 요약과 재구성만 제공한다.

## 6. Event 통합 규칙

- 하나의 발표, 제품 업데이트, 규제 조치, 거래 또는 소송을 하나의 Event로 묶는다.
- 공식 블로그, Reuters, 국내 기사, GitHub, 영상과 커뮤니티 글을 별도 뉴스로 만들지 않는다.
- 정규화 URL과 `event_key`로 같은 사건을 합친다.
- 후속 변화가 실제 상태를 바꿨을 때만 새 occurrence로 기록한다. 예: preview→GA, 제안→확정, 보도→공식 발표.
- 같은 회사의 같은 날 발표라도 사용 대상과 변화가 다르면 별도 Event로 둘 수 있다. 단, Morning Paper에서 반복감이 생기면 하나만 선택한다.

## 7. Top 뉴스 선정 기준

기존 가중치인 신뢰도 30, 영향도 25, 활용도 20, 최신성 15, 커뮤니티 관심 10을 유지한다. 그 뒤 아래 Gate를 통과해야 Today 후보가 된다.

### 7.1 General User Gate

각 항목은 `pass`, `fail`, `unknown`으로 평가한다.

1. **변화가 명확한가?** 이전과 비교해 실제로 달라진 점을 한 문장으로 말할 수 있다.
2. **나와 관련 있는가?** 업무, 생활, 비용, 생산성 또는 사용하는 AI 서비스에 구체적인 영향 경로가 있다.
3. **실제 변화인가?** 전망이나 숫자만이 아니라 제품·기능·행동·산업 구조가 달라졌다.
4. **설명할 가치가 있는가?** “그래서 왜 중요한데?”에 추상어 없이 답할 수 있다.

네 항목 중 `fail`이 있으면 Today에서 제외한다. `unknown`이 있으면 추가 조사하거나 상세 페이지 후보로만 보존한다.

### 7.2 Macro 숫자 감점

투자금, 다운로드, 사용자 수, 시장규모는 원인이 아니라 증거다. 다음 연결이 확인될 때만 활용도와 발행 우선순위를 높인다.

- 사용 가격이나 비용 구조가 달라짐
- 실제 사용 경로가 새로 열림
- 업무 방식이나 제품 동작이 달라짐
- 경쟁·규제 구조가 달라짐

### 7.3 다양성 검토

강한 후보 안에서 가능하면 다음 균형을 본다.

- 지금 바로 체감할 변화
- 앞으로 크게 바뀔 변화
- 알아두면 좋은 기술 변화

다양성은 품질을 이기지 않는다. 같은 유형의 강한 뉴스만 있는 날은 그대로 내고, 다른 칸을 채우려고 약한 Event를 올리지 않는다.

## 8. 한국어 작성 규칙

### 8.1 제목

- 원문 제목을 직역하지 않는다.
- 회사·제품 이름보다 “무엇이 달라졌는지”가 바로 보이게 한다.
- 가능하면 한 호흡, 28자 안팎으로 쓴다.
- 금액과 모델명은 이해에 꼭 필요할 때만 넣는다.
- 과장, 단정, 말줄임표식 클릭베이트를 쓰지 않는다.

### 8.2 본문

- 문장은 짧게 쓰고 한 문장에 핵심 하나만 둔다.
- 첫 3문장 안에 `무슨 일`, `달라진 점`, `왜 알아야 하는지`를 넣는다.
- 전문용어는 처음 한 번만 짧게 푼다. 예: “추론, 즉 학습된 AI가 실제 답을 만드는 과정”.
- `왜 알아야 해?`는 사용자 행동이나 비용 변화로 끝낸다.
- `지금 해보기`는 실제로 지금 실행할 수 있는 행동만 쓴다. 원문 읽기, 검색하기, 과도한 개발 과제는 Action으로 만들지 않는다.

### 8.3 Event 유형별 구조

- 제품·기능: 무엇이 나왔는지 → 기존과 다른 점 → 대상·가격·한국 가용성 → 실제 편익
- 업계 변화: 무슨 일 → 배경 → 나에게 미칠 영향 → 다음 확인점
- 연구·기술: 쉽게 말하면 → 달라진 점 → 용도 → 아직 한계
- 규제·정책: 바뀌는 내용 → 적용 대상 → 시점 → 한국 영향
- 기업 전략: 선택 내용 → 이유 → 시장 의미 → 다음 확인점

## 9. Insight 규칙

Insight는 Top News 1번의 재요약이 아니다. 서로 다른 Event 최소 2건에서 같은 방향이 반복될 때만 만든다.

평가 요소는 다음과 같다.

- 반복 Event 수
- 서로 독립된 evidence group 수
- 공식 Source가 있는 Event 수
- Event 중요도
- 신호의 새로움
- 사용자에게 미칠 실제 영향

제목은 `AI가 답변에서 업무로`, `AI 비용, 가격표만 보면 안 된다`처럼 짧은 키워드형으로 쓴다. 본문 2~4문장에서 반복 변화, 중요성, 다음 확인점을 설명한다. 강한 공통 Signal이 없으면 `오늘의 인사이트 없음`으로 두며 억지로 만들지 않는다.

인사이트 근거는 다음 세 숫자를 함께 표시한다.

- 근거 Event 수
- 독립 Source/evidence group 수
- 공식 Source/evidence group 수

## 10. 품질 Self Review

발행 전 모든 Top Event에 아래 검사를 적용한다.

### 10.1 30초 이해 테스트

제목과 첫 3문장만 읽고 비개발자 직장인이 다음을 말할 수 있어야 한다.

- 무슨 일이 생겼나?
- 이전과 무엇이 달라졌나?
- 왜 나와 관련 있나?

### 10.2 번역투 검사

- 주어와 수식어가 길게 이어지는 영어 어순인가?
- 한국 사람이 실제 대화나 기사에서 쓰지 않을 표현인가?
- `~을 위한`, `~에 있어`, `~로 하여금`, 명사 나열을 줄일 수 있는가?

### 10.3 과장 검사

- 회사 주장과 독립 확인을 구분했는가?
- 가능성을 사실처럼 썼는가?
- 소송·혐의·제안·preview를 확정 사실처럼 썼는가?

### 10.4 Action 검사

- 사용자가 지금 실제로 할 수 있는가?
- 비용, 계정, 지역, 요금제 조건을 적었는가?
- 단지 원문을 읽으라는 말은 아닌가?

### 10.5 편집 체크리스트

- [ ] 후보 수와 최종 노출 수를 분리했다.
- [ ] Event와 Source를 중복 계산하지 않았다.
- [ ] 공식 → 해외 독립 → 한국어 기사 순으로 확인했다.
- [ ] 재인용 Source의 계보를 기록했다.
- [ ] General User Gate를 통과했다.
- [ ] Macro 숫자를 실제 변화와 연결하지 못하면 내렸다.
- [ ] 제목과 첫 3문장이 30초 이해 테스트를 통과했다.
- [ ] Insight가 최소 2개 Event의 공통 Signal이다.
- [ ] `지금 해보기`가 실제 행동일 때만 있다.
- [ ] FACT와 해석, 미확인 한계를 구분했다.

## 11. V1.2 Dry Run 설계

최근 7일 중 뉴스 성격이 다른 세 날짜를 골랐다.

- 2026-08-22: API 가격, 오픈모델 생태계, 자본시장과 우주 인프라
- 2026-08-25: 영상 제품, 저작권, 국방·수출 정책
- 2026-08-26: 업무형 Agent, 관리자 기능, 자체 칩, IPO

기존 archive는 수정하지 않았다. 후보 수는 해당 실행 창과 최근 7일 후속 변화에서 Event로 정규화해 실제 검토한 수다. 품질 점수는 사용자 조사 결과가 아니라 동일한 5점 편집 rubric으로 수행한 **Self Review**다.

## 12. Dry Run 요약 비교

| 날짜 | 후보 Event | 기존 노출 | V1.2 노출 | 공식 Source group | 독립 Source group | 한국 기사 활용 | 핵심 변화 |
|---|---:|---:|---:|---:|---:|---:|---|
| 08-22 | 13 | 4 | 2 | 2 | 2 | 3 | 투자·다운로드 숫자보다 당장 달라지는 비용과 실행 선택지 중심 |
| 08-25 | 15 | 4 | 2 | 2 | 2 | 0 | 국방·수출 사건은 상세 보존, 콘텐츠 제작과 권리 문제만 Today 노출 |
| 08-26 | 13 | 4 | 3 | 3 | 4 | 1 | IPO를 내리고 업무형 Agent·관리·향후 응답비용 변화로 재구성 |

Source group은 URL 수가 아니라 원출처 계보를 합친 수다. 한국 기사 활용 수는 독립 근거 수에 포함하지 않았다. 08-25에는 신뢰할 만한 한국어 기사를 찾지 못해 0으로 기록했다.

### 편집 Self Review 평균

| 항목 | 기존 | V1.2 | 판단 기준 |
|---|---:|---:|---|
| 제목 난이도(쉬울수록 높음) | 2.8 | 4.7 | 제목만으로 변화 설명 가능 여부 |
| 번역투 없음 | 3.4 | 4.7 | 자연스러운 한국어 어순과 짧은 문장 |
| 30초 이해도 | 3.1 | 4.7 | 제목+3문장으로 일·변화·이유 설명 |
| 사용자 관련성 | 3.2 | 4.5 | 업무·생활·비용·서비스 영향의 구체성 |
| Insight 품질 | 3.5 | 4.5 | 복수 Event 공통 Signal과 다음 확인점 |

기존 기사는 사실 밀도와 근거 추적성은 높았다. V1.2의 개선은 사실을 줄인 것이 아니라 Today에서 읽어야 할 순서를 바꾸고 전문 세부를 상세 페이지로 내려보낸 데서 나온다.

## 13. Dry Run 1 — 2026-08-22

### 후보군

GPT-5.6 Sol 가격 인하, Gemma 10억 다운로드·Awesome 저장소, AI 하이퍼스케일러 채권, Starcloud 조달, Anthropic Computer Use·Skills API GA, OpenAI Private Safety Processing, Stripe–OpenRouter 인수, CFTC 컴퓨트 파생상품 의견수렴, Micron 메모리 연구소, 브라질 AI 슈퍼컴퓨팅, Anthropic 보존정책 보도, NVIDIA 중국 LPU 보도 부인, Google–Marvell 칩 협력 등 13개 Event를 검토했다.

### 기존과 달라진 선정

- **유지:** GPT-5.6 Sol 가격 인하 — 비용 변화가 즉시 확인 가능하다.
- **재작성해 유지:** Gemma — 10억 다운로드 숫자보다 공식 실행 자료가 한곳에 모였다는 변화가 중요하다.
- **Today 제외:** 하이퍼스케일러 채권 — 투자자에게는 중요하지만 기본 독자의 오늘 업무 변화는 약하다.
- **Today 제외:** Starcloud 조달 — 실제 발사·유료 운영 전이라 숫자와 구상 비중이 크다.

### 사용자용 샘플

#### 오늘의 인사이트 — **AI 비용, 가격표만 보면 안 된다**

AI를 쓰는 비용은 API 단가뿐 아니라 어디서 실행하느냐에 따라 달라지고 있다. OpenAI는 최고급 모델 요금을 한시적으로 내렸고, Google은 Gemma를 내 컴퓨터나 서버에서 시험할 공식 자료를 한곳에 모았다. 앞으로는 할인 종료일과 내 장비에서 실제로 돌아가는지를 함께 봐야 한다.

**인사이트 근거:** Event 2개 · 독립 Source group 2개 · 공식 Source group 2개

#### 1. **OpenAI 최고급 API, 출력 비용 33% 인하**

OpenAI가 GPT-5.6 Sol API의 입력 가격을 20%, 출력 가격을 33% 내렸다. ChatGPT Plus 구독료가 내려간 것은 아니고, 개발자가 API로 쓸 때 적용된다. 할인은 최소 2026년 11월 21일까지라 이후 가격은 아직 정해지지 않았다.

**왜 알아야 해?**  
AI로 긴 보고서나 여러 단계 작업을 만드는 서비스는 같은 사용량으로 비용이 줄어든다. 다만 한시 할인이라 지금 가격만 보고 장기 요금을 낮추면 11월 이후 마진이 다시 줄 수 있다.

**지금 해보기**  
API를 쓰고 있다면 지난달 입력·출력 토큰을 따로 확인해 새 가격과 기존 가격을 둘 다 계산한다. ChatGPT만 구독해 쓰는 사람은 바뀌는 것이 없다.

관련 자료: [OpenAI 모델·가격](https://developers.openai.com/api/docs/models/gpt-5.6-sol), [Reuters](https://www.reuters.com/technology/openai-cuts-developer-pricing-frontier-gpt-56-sol-model-by-more-than-20-2026-08-21/), [한국어 설명 예시](https://tenbrief.com/2026/08/23/gpt-56-sol-api-%EA%B0%80%EA%B2%A9-%EC%9D%B8%ED%95%98/)

#### 2. **구글 Gemma, 로컬 실행 자료를 한곳에 모았다**

Google은 오픈웨이트 모델 Gemma의 공식 예제와 실행·튜닝 자료를 모은 `Awesome Gemma` 저장소를 공개했다. 오픈웨이트는 모델 파일을 내려받아 내 장비에서 실행할 수 있다는 뜻이다. Google이 함께 발표한 10억 다운로드는 누적 횟수라 실제 사용자 10억 명을 뜻하지 않는다.

**왜 알아야 해?**  
회사 문서를 외부 API로 보내기 어렵거나 사용량이 많은 팀은 로컬 AI를 시험할 출발점이 생겼다. 다운로드 숫자보다 내 노트북·서버에서 원하는 한국어 작업이 정확히 되는지가 더 중요하다.

**지금 해보기**  
개발 환경이 있는 팀만 `Awesome Gemma`에서 공식 로컬 실행 예제 하나를 골라 공개 문서 20건으로 분류·요약 품질을 시험한다. 설치가 낯선 일반 사용자는 억지로 체험하지 않아도 된다.

관련 자료: [Google 공식 발표](https://blog.google/innovation-and-ai/technology/developers-tools/gemma-one-billion-downloads/), [Awesome Gemma](https://github.com/google-gemma/awesome-gemma), [TNW 보도](https://thenextweb.com/news/google-gemma-one-billion-downloads-gemmaverse-variants), [한국어 기사](https://startuprecipe.co.kr/archives/tech/5830502)

## 14. Dry Run 2 — 2026-08-25

### 후보군

Wan3.0 정식 출시, 영국–우크라이나 AI 방위 협력, 대만 AI 서버 수출 기소, wikiHow 소송, Alibaba 신주 배치, Hugging Face 매각 검토 보도, FreeToken 논문, 한국 미래대응기금, Vertex AI Claude 3 Haiku 종료, Thomson Reuters 자체 모델, NVIDIA 서버 가격 보도, Cerebras CS-4, OpenAI 지역 처리, Unsloth Desktop beta, Velaura 조달 등 15개 Event를 검토했다.

### 기존과 달라진 선정

- **유지·쉽게 재작성:** Wan3.0 — 문서에서 바로 30초 영상으로 바뀌는 실제 제품 변화가 있다.
- **유지·법적 상태 강조:** wikiHow 소송 — 콘텐츠를 업무에 쓰는 일반 독자와 직접 연결된다.
- **Today 제외:** 영국–우크라이나 방위 협력 — 중요하지만 국내 일반 직장인의 직접 영향과 실행 가능성이 낮다.
- **Today 제외:** 대만 수출 기소 — 공급망 담당자 상세 뉴스로 보존하되 전체 독자 Top에는 과도하게 전문적이다.

### 사용자용 샘플

#### 오늘의 인사이트 — **AI로 만들수록, 권리 확인도 중요**

문서 한 장을 영상으로 바꾸는 기능은 빨라지고 있지만, 그 결과물과 학습 자료의 권리 문제도 함께 커지고 있다. Alibaba는 문서 입력형 영상 AI를 내놨고, wikiHow는 자사 글을 학습과 답변에 썼다며 OpenAI를 고소했다. AI 제작을 시작할 때부터 사용한 이미지·문서의 출처와 최종 결과물 검수 기록을 남겨야 한다.

**인사이트 근거:** Event 2개 · 독립 Source group 2개 · 공식 Source group 2개

#### 1. **문서만 넣으면 30초 영상…Alibaba Wan3.0 출시**

Alibaba가 문서, 표, 발표자료와 웹페이지를 넣어 최대 30초 영상을 만드는 Wan3.0을 정식 출시했다. 1080p까지 지원하며 API 가격은 중국 리전 기준 초당 1.2위안이다. 최신 기능은 API로 쓸 수 있지만, 내려받아 직접 돌리는 Wan3.0 모델 파일은 확인되지 않았다.

**왜 알아야 해?**  
상품 설명서나 발표자료로 짧은 홍보 영상을 만드는 시간이 줄 수 있다. 하지만 한국 계정·지역에서의 이용 가능 여부, 한글 품질, 실패한 영상까지 포함한 실제 비용은 따로 확인해야 한다.

**지금 해보기**  
이용 가능한 계정이 있다면 공개해도 되는 1쪽짜리 상품 설명서로 10초 720p 영상 한 개만 만든다. 인물·음악·브랜드 이미지의 사용 권리를 확인하고, 한 번에 성공하지 않았을 때의 총비용을 기록한다.

관련 자료: [Alibaba Cloud 문서](https://help.aliyun.com/zh/model-studio/wan3-0-video-prime), [Reuters](https://www.reuters.com/business/retail-consumer/alibaba-launches-wan30-ai-video-model-after-10-billion-share-sale-2026-08-24/)

#### 2. **wikiHow, “ChatGPT가 글을 베꼈다”며 OpenAI 제소**

생활 안내 사이트 wikiHow가 OpenAI를 미국 연방법원에 고소했다. 1만1천개가 넘는 글을 허락 없이 학습에 썼고, ChatGPT가 비슷한 안내문을 만들어 자사 시장을 대체한다고 주장한다. 이는 wikiHow의 주장 단계이며 법원이 저작권 침해를 인정한 것은 아니다.

**왜 알아야 해?**  
회사 블로그, 매뉴얼, 교육자료를 AI 학습이나 검색 증강에 넣는 팀도 같은 질문을 받게 된다. 공개 웹페이지라는 이유만으로 상업적 재사용 권리가 생기는 것은 아니므로 자료 출처와 이용 조건을 기록해야 한다.

관련 자료: [미 연방법원 사건 기록 색인](https://www.pacermonitor.com/public/case/66393904/wikiHow%2C_Inc_v_OpenAI%2C_Inc_et_al), [Reuters](https://www.reuters.com/legal/legalindustry/wikihow-sues-openai-copyright-infringement-over-ai-training-2026-08-24/)

## 15. Dry Run 3 — 2026-08-26

### 후보군

OpenAI Jalapeño 벤치마크, Gemini Enterprise for Legal, Gemini Enterprise for Financial Services, OpenAI Admin plugin, Enflame IPO, Thomson Reuters 자체 모델, 물리 데이터용 Accelerated Understanding 모델, Wan3.0, wikiHow 소송, 대만 수출 기소, 영국–우크라이나 방위 협력, Alibaba 신주 배치, Hugging Face 매각 검토 등 13개 Event를 검토했다.

### 기존과 달라진 선정

- **1순위로 이동:** Google의 법률·금융용 Gemini — 전문 업무에 맞춘 Agent가 실제 제품으로 나왔다.
- **유지·일반화:** OpenAI Admin plugin — 대화로 조회에서 승인된 변경까지 하는 흐름을 설명한다.
- **유지·쉽게 재작성:** Jalapeño — 벤치마크 숫자보다 향후 응답 속도·비용 가능성을 중심에 둔다.
- **Today 제외:** Enflame IPO — 투자금과 청약 일정은 기본 독자의 AI 사용 변화가 아니다.

### 사용자용 샘플

#### 오늘의 인사이트 — **AI가 답변에서 업무 운영으로**

기업용 AI가 질문에 답하는 도구를 넘어 실제 업무 절차를 맡기 시작했다. Google은 법률·금융 업무에 맞춘 Agent를 내놨고, OpenAI는 계정과 지출 한도를 대화로 관리하는 기능을 공개했다. 앞으로는 답변 정확도뿐 아니라 기존 권한을 지키고, 누가 무엇을 바꿨는지 기록하는 기능이 도입 기준이 된다.

**인사이트 근거:** Event 3개 · 독립 Source group 4개 · 공식 Source group 3개

#### 1. **Google, 법률·금융 업무용 Gemini 공개**

Google Cloud가 계약 검토, 규제 확인, 문서 분석 같은 전문 업무에 맞춘 Gemini Enterprise를 preview로 공개했다. AI Agent는 사용자의 지시를 받아 여러 단계를 수행하는 AI다. 기존 문서 시스템의 접근 권한을 이어받고, 답변 근거를 원문으로 다시 확인할 수 있게 설계했다.

**왜 알아야 해?**  
기업용 AI 경쟁이 “누가 더 똑똑한가”에서 “회사 자료와 권한 안에서 실제 일을 끝낼 수 있는가”로 옮겨가고 있다. 한국 가격과 출시 시점은 아직 확인되지 않았으므로 당장 구매 가능한 제품처럼 보아서는 안 된다.

관련 자료: [Google 법률용 공식 발표](https://cloud.google.com/blog/products/ai-machine-learning/introducing-gemini-enterprise-for-legal/), [Google 제품 설명](https://cloud.google.com/ai/legal), [Reuters](https://www.reuters.com/business/google-expands-gemini-ai-platform-law-firms-lawyers-2026-08-25/)

#### 2. **ChatGPT, 계정·지출 관리도 대화로 처리**

OpenAI가 ChatGPT Work와 Codex 관리자용 플러그인을 공개했다. 관리자는 사용량을 묻고, 구성원을 추가·삭제하거나 지출 요청을 승인할 수 있다. 플러그인이 새 권한을 주는 것은 아니며, 기존 관리자 권한 안에서만 작동한다.

**왜 알아야 해?**  
직원 입·퇴사와 AI 비용 관리처럼 반복되는 운영 업무도 대화형 AI로 옮겨가기 시작했다. 편해지는 만큼 자동 변경보다 승인자, 변경 전후 상태와 되돌리는 방법이 기록돼야 한다.

**지금 해보기**  
지원되는 ChatGPT 업무용 워크스페이스의 관리자만 설치할 수 있다. 먼저 읽기 전용 사용량 조회로 시험하고, 구성원 삭제나 한도 변경은 별도 승인 절차를 유지한다.

관련 자료: [OpenAI 공식 발표](https://openai.com/index/introducing-admin-plugin/), [플러그인 도움말](https://help.openai.com/en/articles/20001256-plugins-in-chatgpt-and-codex)

#### 3. **OpenAI 자체 칩, 답변 속도 경쟁에 투입**

OpenAI가 자체 추론 칩 Jalapeño의 첫 성능 시험을 공개했다. 추론은 학습을 끝낸 AI가 실제 답을 만드는 과정이다. OpenAI 시험에서는 비교 시스템보다 전력당 처리량과 응답 지연이 좋아졌지만, 초기 물량은 2026년 말에도 제한적이고 독립 재현은 아직 부족하다.

**왜 알아야 해?**  
이 칩이 실제 ChatGPT와 API에 널리 쓰이면 응답 속도, 혼잡 시간의 안정성과 장기 서비스 비용이 달라질 수 있다. 지금 당장 ChatGPT 요금이나 속도가 바뀐 것은 아니다.

관련 자료: [OpenAI 공식 결과](https://openai.com/index/jalapeno-first-results/), [The Verge](https://www.theverge.com/ai-artificial-intelligence/984290/openai-jalapeno-ai-chip-benchmarks), [TechCrunch](https://techcrunch.com/2026/08/25/openais-jalapeno-chip-is-built-for-fast-inference-at-scale-benchmarks-show/)

## 16. 발견된 schema 변경 필요 여부

### 결론

**이번 승인 전 단계에는 schema 변경이 필요하지 않다.** 현재 `schema_version: 1.0`에는 optional `morning_paper`, Source taxonomy, evidence group이 이미 있어 V1.2 Morning Paper를 점진적으로 기록할 수 있다. 기존 archive도 그대로 읽을 수 있다.

다만 Production 반영 전 다음 호환성 문제를 해결해야 한다.

1. 루트 `news`는 `minItems: 3`이라 “강한 뉴스가 2개면 2개만 발행”과 충돌한다.
2. 저장 후보 Event 수를 Daily JSON에 모두 넣으면 현재 `news.maxItems: 5`와 충돌한다.
3. General User Gate, 한국 기사 활용과 Source lineage를 구조적으로 기록할 전용 필드가 없다.
4. 기사 유형별 `왜 알아야 해`, `지금 해보기`, 한국 가용성·가격·출시 상태를 일관되게 저장할 presentation 필드가 없다.

### 권장 호환 전략

- 단기: `news`는 기존 검증·archive 호환 범위 3~5개로 유지하고, Today 노출은 `morning_paper.top_event_keys` 0~3개로 분리한다. 강한 뉴스가 2개인 날도 저장 Event는 3개 이상일 수 있지만 Today는 2개만 표시한다.
- 중기: `schema_version`을 깨지 않고 optional `research_summary`, `reader_gate`, `localization`, `presentation` 객체를 추가하는 방안을 별도 승인받는다.
- 장기: 저장 후보 전체를 정본에 보존해야 한다면 `candidate_events` 또는 별도 research ledger 계약을 설계한다. 이는 schema와 importer 영향 검토 후 진행한다.

## 17. Production 반영에 필요한 변경

사용자 승인 후 다음을 하나의 별도 구현 단계로 진행한다.

1. `AUTOMATION_PROMPT.md`의 Researcher·Intelligence Editor 부분을 V1.2 수집, 한국 기사, General User Gate, 한국어 작성·Self Review 규칙으로 교체한다.
2. Opportunity Finder와 Publisher 중단선은 유지하고 Today Opportunity 0~1 규칙만 재확인한다.
3. `morning_paper`를 매일 실제로 채우고 `top_event_keys` 최대 3개만 Today에 렌더링한다.
4. `scripts/render_daily.py`에 짧은 Insight, 인사이트 근거, Today 최대 3개, 유형별 설명과 조건부 Action projection을 추가한다.
5. `scripts/validate_daily.py`와 테스트에 Morning Paper key 존재·참조, 30초 이해 필수 필드, evidence count 계산, Today 최대 3개를 추가한다.
6. 한국 기사와 재인용 계보는 Source taxonomy/evidence group 규칙으로 검증하고, 결측은 추정하지 않는다.
7. 최소 3일 shadow run 후 기존 07:00 작업 전환 여부를 다시 승인받는다.

## 18. 이번 단계의 변경 범위

- 생성: `docs/RESEARCHER_V1_2.md`
- 갱신: `docs/DECISIONS.md`에 승인 대기 결정을 추가
- 변경하지 않음: 예약 작업, `AUTOMATION_PROMPT.md`, `schema/daily.schema.json`, `data/daily/**`, `reports/**`, `latest.json`, Web UI, Opportunity Finder 구현, Supabase/Notion/배포 환경

## 19. 승인 Gate

이 문서는 Dry Run 결과다. Production 자동화 prompt, Git 정본 생성 흐름과 07:00 예약 작업에는 아직 적용하지 않는다. 사용자가 V1.2 방향과 샘플 품질을 승인한 뒤에만 17절의 변경을 구현한다.
