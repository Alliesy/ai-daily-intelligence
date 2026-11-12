# AI Daily Intelligence · Latest

> 2026-11-12 KST · Git canonical projection

> 상태: PARTIAL · Git 정본 작성 완료, Notion Latest는 갱신 결과에 따라 별도 표시합니다.

## Today's Insight

생성형 AI의 다음 효율화는 더 짧은 답변이 아니라, 판단 가능한 문제를 전용 결정 모델로 분리하고 애매한 사례만 비싼 추론과 사람에게 보내는 데서 나온다.

# Today's Top 5

## 1. Google, 초저지연 분류용 Gemini Decisions API 출시

- 중요도: S
- 한줄요약: Gemini Decision 1이 하나의 멀티모달 입력에 최대 1,000개의 폐쇄형 질문을 평가하고 확률·신뢰도를 반환한다.
- 영향도: 에이전트의 라우팅·도구 선택·정책 검사 같은 제어 평면이 생성 모델 호출에서 저비용 전용 결정 모델로 분리된다.
- 원문: https://blog.google/innovation-and-ai/technology/developers-tools/gemini-decisions-api/

### 원문 핵심문장

> Evaluate up to 1,000 yes/no, choice, and rubric-scoring questions in a fast, single pass.

최대 1,000개의 예·아니오, 선택형, 루브릭 점수 질문을 빠른 단일 패스로 평가한다.

### 원문 요약

[FACT] Google은 Gemini API에 gemini-decision-1과 Decisions API를 공개했다. [FACT] 텍스트·이미지·오디오·비디오·PDF를 입력해 예·아니오, 2~255개 선택지, 순서형 점수를 확률로 반환한다. [FACT] 공식 가격은 입력 100만 토큰당 0.10달러, 출력 토큰 0달러이며 Google은 종단 간 150~250ms를 주장한다. [SIGNAL] VentureBeat와 ITmedia가 출시 당일 독립 보도했다. [SPECULATION] 실제 업무에서의 보정 정확도와 지연은 독립 벤치마크가 더 필요하다.

### 왜 중요한가?

LLM이 문장을 생성한 뒤 JSON을 파싱해 분기하던 비용과 불안정성을 줄이고, 낮은 신뢰도만 상위 모델이나 사람에게 보내는 구조를 만들 수 있다.

### 업계 분위기

Developers: 낮은 가격과 1,000개 질문 배치에 관심이 크다. Caution: 정확도·보정 수치는 Google 내부 평가 중심이라 독립 검증을 기다린다. Ecosystem: LangChain·Vercel·LiteLLM 등 연동 예고로 빠른 확산 가능성이 있다.

### 앞으로의 전망

에이전트 스택은 생성 모델, 전용 결정 모델, 규칙 엔진, 사람 승인으로 계층화되고 비용·지연·위험에 따라 라우팅될 전망이다.

### 사업 기회

한국 중소기업 문서·통화·이미지 입력을 대량 분류하고 애매한 건만 사람에게 보내는 결정 게이트 구축 서비스.

### 관련 태그

Google · Gemini · Agent · Workflow · AI Infra

## 2. Gemini Live, Apple CarPlay에 글로벌 출시

- 중요도: A
- 한줄요약: iPhone의 Gemini Live가 CarPlay에서 이메일·일정 요약, 브레인스토밍, 대화 연습을 핸즈프리로 제공한다.
- 영향도: 음성 AI가 스마트폰 앱을 넘어 운전 중의 연속적 업무·생각 정리 인터페이스로 확장된다.
- 원문: https://blog.google/innovation-and-ai/products/gemini-app/gemini-on-apple-carplay/

### 원문 핵심문장

> Today we’re bringing the Gemini app directly to Apple CarPlay.

오늘 Gemini 앱을 Apple CarPlay에 직접 제공한다.

### 원문 요약

[FACT] Google은 지원되는 Gemini Live 언어의 iOS 사용자를 대상으로 CarPlay 출시를 시작했다. [FACT] Gmail·Calendar 연결로 요약과 답장 초안을 만들고, 대화는 iPhone Gemini 기록과 동기화된다. [FACT] 일부 개인화 기능은 EEA·나이지리아와 18세 미만에게 제공되지 않는다. [INTERPRETATION] 이동 시간도 AI와 지속적으로 상호작용하는 작업 공간이 된다.

### 왜 중요한가?

Voice AI 서비스는 짧은 명령이 아니라 컨텍스트를 이어받는 대화, 안전한 읽기 중심 동작, 주차 후 후속 작업 연결을 설계해야 한다.

### 업계 분위기

Users: 운전 중 메일·일정 정리에 기대가 있다. Safety: 주의 분산과 음성으로 수행 가능한 작업 경계를 신중히 봐야 한다. Privacy: 차량 탑승자와 민감한 이메일을 음성으로 다루는 점이 우려된다.

### 앞으로의 전망

차량 AI는 요약·생각 정리에서 시작해 주차 이후 태스크 생성으로 이어지되, 운전 중 쓰기·전송은 더 강한 확인 절차를 요구할 것이다.

### 사업 기회

차량 음성 메모를 주차 후 안전하게 CRM·할 일·회의 준비로 변환하는 한국어 후처리 워크플로.

### 관련 태그

Google · Gemini · Voice AI · Workflow

## 3. Google Labs, 실시간 협업형 AI 공간 Tabletop 공개

- 중요도: A
- 한줄요약: 링크·파일·아이디어를 넣으면 여행 일정, 투표, 비용 정산, 대진표 같은 인터랙티브 협업 공간을 생성한다.
- 영향도: 생성 AI가 개인 문서 작성에서 여러 사람이 동시에 수정하고 결정하는 임시 업무 앱 제작으로 이동한다.
- 원문: https://blog.google/innovation-and-ai/models-and-research/google-labs/tabletop/

### 원문 핵심문장

> Today, we’re introducing Tabletop, a new Google Labs experiment built for real-time collaboration.

오늘 실시간 협업을 위해 만든 Google Labs 실험 Tabletop을 공개한다.

### 원문 요약

[FACT] Tabletop은 링크·파일·아이디어를 기반으로 계획·투표·정산·토너먼트 도구를 생성한다. [FACT] 초대 링크를 통해 여러 사용자가 동시에 참여할 수 있다. [FACT] 현재 미국 18세 이상 대기자 명단으로 제공된다. [INTERPRETATION] AI 생성물이 정적 답변보다 공유 가능한 경량 애플리케이션으로 바뀌고 있다.

### 왜 중요한가?

팀 도구의 진입 장벽이 낮아지면서 범용 SaaS보다 특정 모임·행사의 짧은 수명을 가진 협업 앱 시장이 커질 수 있다.

### 업계 분위기

EarlyUsers: 문서처럼 공유되는 즉석 앱 개념에 관심이 예상된다. Caution: 미국 대기자 명단 단계라 실제 동시 편집 안정성과 데이터 정책은 검증 전이다. Builders: 여행·행사·동호회 운영 도구가 가장 빠른 실험 영역으로 보인다.

### 앞으로의 전망

협업형 생성 UI는 문서, 폼, 스프레드시트, 소형 앱의 경계를 흐리고 템플릿보다 목적별 즉석 생성이 일반화될 수 있다.

### 사업 기회

한국 동호회·학부모 모임·소규모 행사에 맞춘 카카오톡 친화형 AI 협업 미니앱.

### 관련 태그

Google · Workflow · AI Startup · Agent

## 4. Google Cloud, Professional Agentic Architect 자격증 출시

- 중요도: A
- 한줄요약: 객관식 감독 시험과 실습 랩을 결합해 엔터프라이즈 Agent 설계·배포 역량을 검증하는 전문 자격을 공개했다.
- 영향도: 프롬프트 기술을 넘어 보안·다중 앱 워크플로·운영을 아우르는 Agent 아키텍처가 독립 전문 직무로 표준화된다.
- 원문: https://cloud.google.com/blog/topics/training-certifications/google-cloud-agentic-architect-certification-dont-just-prompt-ai-design-it

### 원문 핵심문장

> It just got easier to prove your expertise in building production-ready agents.

프로덕션 준비가 된 Agent 구축 전문성을 입증하기가 더 쉬워졌다.

### 원문 요약

[FACT] 자격은 감독형 객관식 시험과 Google Skills 실습 랩으로 구성된다. [FACT] Google은 내부 forward deployed engineer와 파트너를 대상으로 지난 4개월간 교육한 과정을 외부에 개방했다고 밝혔다. [FACT] GEAR 프로그램은 무료 학습 크레딧과 코호트를 제공한다. [INTERPRETATION] Agent 설계가 개발자의 부가 기술에서 검증 가능한 전문 역할로 이동한다.

### 왜 중요한가?

기업 채용과 컨설팅에서 모델 사용법보다 권한, 오케스트레이션, 보안, 관측성, 장애 대응을 설계하는 능력이 차별점이 된다.

### 업계 분위기

Professionals: 새로운 경력 증명 수단에 관심이 높다. Reddit: 베타 응시 경험과 바우처·학습 계획 문의가 이미 이어졌다. Caution: Google Cloud 종속성과 자격증의 실제 채용 가치 검증은 남아 있다.

### 앞으로의 전망

AWS·Microsoft 등도 Agent 운영 역량을 자격 체계에 강화하고, 기업 RFP에 공인 Agent 아키텍처 역량이 포함될 가능성이 높다.

### 사업 기회

한국어 실습형 Agent 아키텍처 교육과 실전 포트폴리오·모의 평가 프로그램.

### 관련 태그

Google · Agent · Workflow · AI Infra

## 5. Google Cloud, 2027 보안 핵심으로 Agent 의사결정 무결성 제시

- 중요도: A
- 한줄요약: 자율 Agent의 모든 중대한 행동을 설명 가능하게 하고, 접근 권한과 실제 행동을 지속 관찰해야 한다는 보안 전망을 제시했다.
- 영향도: Zero Trust가 사용자·기기 인증을 넘어 Agent의 의도, 권한, 실행 결과를 실시간 검증하는 체계로 확장된다.
- 원문: https://blog.google/innovation-and-ai/infrastructure-and-cloud/google-cloud/cybersecurity-2027/

### 원문 핵심문장

> Never blindly trusting any AI tool, and having visibility into what they can access and what they are doing.

어떤 AI 도구도 맹목적으로 신뢰하지 말고, 접근 대상과 실제 행동을 볼 수 있어야 한다.

### 원문 요약

[FACT] Google Cloud·Mandiant 리더들은 결정 무결성, Beyond Zero, 다중 모델 기반 ground truth를 2027 보안 우선순위로 제시했다. [FACT] 보고서는 자율 Agent가 핵심 운영을 맡는 환경을 전제로 한다. [INTERPRETATION] Agent 보안은 설치 여부가 아니라 매 행동의 권한·근거·결과를 추적하는 운영 문제가 된다. [SPECULATION] 구체적 제품·표준 채택 속도는 아직 불확실하다.

### 왜 중요한가?

Agent에게 직원 수준 권한을 주는 기업은 계정 하나를 보호하는 것만으로 부족하며, 작업 단위 승인·최소 권한·감사·중단 기능이 필요하다.

### 업계 분위기

Security: Agent를 새로운 내부자 위험 주체로 다루는 방향이 확산된다. Enterprise: 가시성과 정책 집행 요구는 높지만 운영 복잡성·비용을 우려한다. Builders: 권한 최소화와 행동 로그를 제품 초기 설계에 넣어야 한다는 압력이 커진다.

### 앞으로의 전망

Agent identity, 동적 권한, 의사결정 증거, 실행 전후 정책 검사가 보안 플랫폼의 기본 기능으로 통합될 전망이다.

### 사업 기회

국내 중소기업용 Agent 권한 인벤토리와 고위험 행동 승인·감사 리포트 서비스.

### 관련 태그

Google · Agent · AI Security · AI Infra

# Business Radar

## 1. 멀티모달 결정 게이트 구축 서비스

- 점수: 4.2/5 (★★★★)
- 가능성: High
- 난이도: Medium
- 예상 고객: 보험·커머스·고객센터에서 문서·사진·통화를 분류하는 한국 중소기업
- 문제: 생성형 LLM으로 라우팅·정책 검사를 하면 느리고 비싸며 출력 파싱과 신뢰도 임계값 운영이 어렵다.
- 경쟁사: Google Gemini Decisions API, OpenAI Decisions API, 규칙 엔진, RPA 구축사
- 차별점: 업무별 질문·선택지·신뢰도 임계값을 설계하고 결정 로그, 사람 검토 큐, 비용 비교를 함께 제공한다.
- 2주 MVP: 한 고객의 과거 사례 500건으로 20개 결정 질문을 만들고 기존 규칙·생성 모델·Decision 모델의 정확도·지연·비용을 비교한다.
- 수익화: 초기 진단·구축비 + 월간 모니터링
- 반증 조건: 3개 파일럿 중 2개 이상에서 비용 50% 또는 처리시간 30% 개선과 사람 검토 품질 유지가 나오지 않으면 중단한다.

## 2. Agent 권한·행동 안전 점검

- 점수: 4.1/5 (★★★★)
- 가능성: High
- 난이도: Medium
- 예상 고객: 사내 업무 Agent를 도입하는 20~200인 한국 기업과 MSP
- 문제: Agent가 어떤 시스템에 접근하고 어떤 고위험 행동을 하는지 한눈에 파악하지 못해 과도한 권한과 감사 공백이 생긴다.
- 경쟁사: Microsoft Agent 365, Google Cloud Security, Credo AI, 수동 보안 점검
- 차별점: 대형 플랫폼 도입 전 사용할 수 있는 경량 인벤토리, 권한 그래프, 고위험 행동 시나리오와 승인 체크리스트를 제공한다.
- 2주 MVP: 기업 2곳의 Agent 10개를 조사해 접근 자원·자격증명·행동·책임자를 맵핑하고 상위 10개 위험과 개선안을 검증한다.
- 수익화: 진단 프로젝트 + 분기별 재점검 구독
- 반증 조건: 인터뷰 10곳 중 3곳 미만이 Agent 권한 현황을 모르는 상태이거나 2곳 미만이 유료 진단 의향을 보이면 중단한다.

# AI Tool Radar

- **Gemini Decisions API** (★★★★★): 멀티모달 입력 하나에 최대 1,000개의 폐쇄형 판단을 저가·저지연으로 처리한다. 비가역 행동은 금지하고 과거 라벨 데이터로 보정도와 임계값부터 검증할 가치가 있다. — https://blog.google/innovation-and-ai/technology/developers-tools/gemini-decisions-api/
- **Google Tabletop** (★★★): 공유 문서처럼 여러 사람이 함께 쓰는 즉석 인터랙티브 앱을 생성한다. 미국 대기자 명단 단계이므로 실제 협업 안정성·데이터 내보내기·권한을 확인한 뒤 평가해야 한다. — https://blog.google/innovation-and-ai/models-and-research/google-labs/tabletop/
- **addyosmani/agent-skills** (★★★★): 프로덕션 엔지니어링용 재사용 스킬이 GitHub Trending 상위권을 유지한다. 설치 전 각 스킬의 지침·외부 명령·쓰기 범위를 검토하고 읽기 전용 작업부터 시험한다. — https://github.com/addyosmani/agent-skills
- **homeassistant-ai/ha-mcp** (★★★★): 홈 자동화와 AI 비서 연결 수요로 GitHub Trending에서 높은 상승세를 보였다. 테스트 인스턴스와 허용 목록에서 시작하고 실제 기기 제어는 명시 승인 뒤 실행해야 한다. — https://github.com/homeassistant-ai/ha-mcp

# Community Pulse

- **X · 초기 관심** — Google Developers 공식 게시물은 빠른 라우팅·도구 선택·안전 검사와 낮은 비용을 전면에 내세웠지만 초기 반응 규모는 아직 작다. (https://badinfluence.news/items/g3d9nda6i5nghykcxpqqn6vm3)
- **Reddit · 경력 준비 중심** — Google Cloud 커뮤니티는 Agentic Architect 베타 시험의 학습 계획·바우처·실습 범위를 묻는 단계다. (https://www.reddit.com/r/googlecloud/comments/1waq1gl/professional_agentic_architect_beta_study_plan/)
- **GitHub · Agent 실행·스킬 강세** — Agent Skills, 브라우저 자동화, MCP 홈 자동화가 Trending 상위권을 차지해 실행 도구와 재사용 지침 수요가 이어진다. (https://github.com/trending)
- **Other · 검증 대기** — 독립 보도는 Decisions API의 가격·배치 장점을 주목하면서 Google 내부 벤치마크 외 실제 정확도 검증이 부족하다고 본다. (https://venturebeat.com/technology/googles-gemini-decision-1-model-scores-up-to-1-000-questions-in-one-api-call)

# AI Skill of the Day

## 신뢰도 기반 결정 라우팅

- 언제 사용하는가: 분류·도구 선택·정책 검사처럼 가능한 답이 정해져 있고 애매한 사례만 상위 모델이나 사람에게 보내고 싶을 때.
- 실무 예제: Decision 모델의 선택 확률이 0.9 이상이면 읽기 전용 자동 처리, 0.6~0.9면 상위 모델 재검토, 0.6 미만이거나 쓰기 작업이면 사람 승인으로 보낸다.
- 프롬프트 예제: 입력에 대해 가능한 선택지를 먼저 고정하고 각 선택의 명확한 기준을 작성하라. 신뢰도 임계값별 자동 처리·재검토·사람 승인 경로와 오분류 비용을 정의하라.

# Worth Reading

- **Paper · Agents on the Patch Path** — AI Agent가 실제 보안 취약점 수정 커밋에 참여한 흔적과 검토 시점을 데이터로 살펴본다. (https://arxiv.org/abs/2611.09808)
- **GitHub · Production-grade engineering skills for AI coding agents** — Agent Skills가 반복 가능한 엔지니어링 절차를 어떻게 패키징하는지 확인할 수 있다. (https://github.com/addyosmani/agent-skills)
- **YouTube · Introduction to Gemini APIs and AI Studio** — Gemini API와 AI Studio의 기본 호출·실험 흐름을 공식 개발자 영상으로 익힐 수 있다. (https://www.youtube.com/watch?v=4oyqd7CB09c)
- **Blog · Gemini Decisions API: Fast, calibrated multimodal decisions** — 폐쇄형 결정 API의 질문 형식, 확률 출력, 가격과 내부 활용 사례를 코드와 함께 볼 수 있다. (https://blog.google/innovation-and-ai/technology/developers-tools/gemini-decisions-api/)

# 운영 상태

- 정본: Git
- Architect 후보: 없음
- Notion: Git 발행 후 고정 Latest 페이지 갱신 시도
