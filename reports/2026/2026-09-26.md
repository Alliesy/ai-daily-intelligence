# AI Daily Intelligence — 2026-09-26

- 상태: **complete**
- 생성 시각: 2026-09-25T22:00:11Z
- 데이터: [data/daily/2026/2026-09-26.json](https://github.com/Alliesy/ai-daily-intelligence/blob/main/data/daily/2026/2026-09-26.json)

## Morning Paper

### AI가 손을 얻자, 책임과 검증도 실행 단계로 내려옵니다

Anthropic은 플러그인 유통 문턱을 낮췄고, 미국 FTC 위원장은 에이전트 사고의 책임을 개발·지시 주체에서 찾아야 한다고 말했습니다.

RoboHarm에서는 위험 행동을 말로 거부하는 안전장치가 장면마다 크게 달랐습니다.

이제 중요한 건 무엇을 만들 수 있느냐뿐 아니라, 실행 전후를 누가 검증하고 책임지는지입니다.

## Top 뉴스

1. [미 FTC 위원장, 에이전트 사고 책임은 개발·지시 주체에 있다고 밝혀](https://www.reuters.com/business/ftc-chair-pushes-back-treating-ai-agents-independent-actors-2026-09-25/) — 앤드루 퍼거슨 미국 FTC 위원장은 AI 에이전트를 독립 행위자로 보지 않으며, 에이전트에 지시한 개발자나 기업에 기존 법을 적용할 수 있다는 입장을 밝혔습니다.
2. [Anthropic, Claude 플러그인 등록·검토·사용량 분석 창구 공개](https://claude.com/blog/build-plugins-for-claude) — Anthropic이 MCP 커넥터와 Agent Skills를 플러그인으로 묶어 제출하고, 안전 검사·심사 상태·설치 통계를 확인하는 개발자 포털을 열었습니다.
3. [RoboHarm 위험 지시 300회 시험…안전 거부는 일부 장면에 몰려](https://robocurve.org/roboharm/) — RoboHarm이 세 로봇 정책에 다섯 가지 위험 작업을 각각 20회씩 시켰고, Fable은 100회 중 20회, Astra는 2회만 안전상 거부했습니다.
4. [Palo Alto, 여러 AI 모델로 기업 시스템을 상시 공격 점검하는 서비스 출시](https://www.paloaltonetworks.com/blog/2026/09/introducing-unit-42-continuous-frontier-ai-defense/) — Palo Alto Networks가 Claude Mythos 5, GPT-5.6-Cyber, 오픈 가중치 모델을 묶어 웹앱·API·클라우드의 공격 경로를 계속 점검하는 Unit 42 서비스를 내놨습니다.

## 뉴스 상세

### 미 FTC 위원장, 에이전트 사고 책임은 개발·지시 주체에 있다고 밝혀

- 중요도: **A**
- 한 줄: 앤드루 퍼거슨 미국 FTC 위원장은 AI 에이전트를 독립 행위자로 보지 않으며, 에이전트에 지시한 개발자나 기업에 기존 법을 적용할 수 있다는 입장을 밝혔습니다.
- 영향: 에이전트가 예상 밖으로 행동했다는 설명만으로 책임을 피하기 어려워질 수 있습니다. 미국 소비자를 상대하는 팀은 위임 범위, 실행 로그, 침해 고지 절차를 함께 준비해야 합니다.
- 원문: [링크](https://www.reuters.com/business/ftc-chair-pushes-back-treating-ai-agents-independent-actors-2026-09-25/)

> If someone tells a tool to do something, and the tool does it
>
> 누군가 도구에 일을 시켰고 도구가 그대로 했다면

FACT: 앤드루 퍼거슨 미국 연방거래위원회 위원장은 9월 25일 Reuters 행사에서 AI 에이전트를 의지와 욕망을 가진 독립 행위자로 묘사하는 데 반대한다고 말했습니다. 그는 에이전트에 지시한 개발자나 기업이 해악에 책임질 수 있으며, 침해 사실을 알리지 않은 기업에 적용하는 기존 FTC 권한이 AI 개발사에도 적용될 수 있다고 설명했습니다.

INTERPRETATION: 에이전트의 자율성을 강조하는 제품 설명이 법적 책임을 분리해 주지는 않습니다. 누가 목표를 정했고 어떤 권한을 열어줬는지 기록하는 일이 중요해집니다.

SIGNAL: 미국 규제 논의는 에이전트를 새 법적 인격으로 다루기보다 기존 소비자보호와 침해 고지 의무 안에 넣는 방향을 살피고 있습니다.

SPECULATION: 이번 발언은 공식 규칙이나 집행 결정이 아닙니다. 실제 사건에서 책임 주체와 적용 조항이 어떻게 정해질지는 별도 판단이 필요합니다.

**왜 중요한가**  
에이전트가 대신 행동해도 책임까지 대신 지지는 않습니다. 목표와 권한을 정한 사람과 기업이 설명 가능한 기록을 남겨야 합니다.

**업계 분위기**  
책임 회피 차단에 무게, 법적 기준은 아직 미정 — FTC 위원장의 공개 발언은 방향을 보여주지만 규칙 제정이나 집행 사례는 아닙니다.

**앞으로 볼 것**  
FTC가 서면 지침이나 조사에서 같은 논리를 적용하는지, 침해 고지·기만행위 규정과 에이전트 사고가 어떻게 연결되는지 확인해야 합니다.

**사업 기회 판단**  
책임 기록과 권한 통제 수요는 커질 수 있지만, 법률 해석과 사고 로그 보안이 핵심입니다. 국내 고객 근거와 책임 범위를 확인하지 못해 신규 아이디어로 올리지 않습니다.

**출처**

- [FTC chair suggests AI developers should be liable for conduct of agents](https://www.reuters.com/business/ftc-chair-pushes-back-treating-ai-agents-independent-actors-2026-09-25/) — Reuters, 2026-09-25; FTC 위원장의 직접 발언, 기존 법 활용 가능성, 발언 시점 확인. 공식 서면 지침은 아님.

### Anthropic, Claude 플러그인 등록·검토·사용량 분석 창구 공개

- 중요도: **A**
- 한 줄: Anthropic이 MCP 커넥터와 Agent Skills를 플러그인으로 묶어 제출하고, 안전 검사·심사 상태·설치 통계를 확인하는 개발자 포털을 열었습니다.
- 영향: 개인 개발자와 작은 팀도 Claude 안에서 발견되는 배포 경로를 얻습니다. 다만 제출은 유료 Claude 플랜이 필요하고, 심사 기준과 노출 효과는 아직 외부에서 검증되지 않았습니다.
- 원문: [링크](https://claude.com/blog/build-plugins-for-claude)

> Plugins package MCP connectors, Agent Skills, or both
>
> 플러그인은 MCP 커넥터와 Agent Skills 또는 둘 다를 묶습니다.

FACT: Anthropic은 9월 25일 Claude 디렉터리 제출 포털을 공개했습니다. 유료 Claude 이용자는 원격 MCP 서버 하나를 제출하거나 MCP 서버와 Skills를 GitHub 저장소의 플러그인 묶음으로 올릴 수 있습니다. 제출 직후 자동 검증과 안전 검사를 거치며, 승인 뒤 게시 시점을 개발자가 정합니다. 게시 후에는 제품별 설치 수, 버전, 목록 조회, 유입 검색어를 볼 수 있습니다.

INTERPRETATION: 기능을 만드는 일과 사용자를 만나는 일이 한 흐름으로 이어졌습니다. 작은 개발팀도 별도 배포 채널을 만들지 않고 Claude 사용자에게 도달할 수 있지만, 플랫폼 심사와 발견 알고리즘에 더 의존하게 됩니다.

SIGNAL: MCP와 Skills가 개발 부품에 머물지 않고 검토·배포·분석을 갖춘 앱 유통 단위로 바뀌고 있습니다.

SPECULATION: 디렉터리가 실제 설치와 매출을 얼마나 만들지, 안전 검사가 악성 동작을 어느 정도 걸러낼지는 아직 공개 데이터가 없습니다.

**왜 중요한가**  
AI 확장 기능도 이제 코드를 배포하는 것만으로 끝나지 않습니다. 심사 통과와 발견, 업데이트 운영까지 제품의 일부가 됩니다.

**업계 분위기**  
배포 경로 확대에 기대, 플랫폼 의존성에는 경계 — 공식 기능 범위는 확인했지만 독립적인 설치 전환율이나 심사 품질 평가는 아직 없습니다.

**앞으로 볼 것**  
심사 기준과 평균 처리 시간, 한국어 검색 노출, 유료 기능 정책, 설치에서 유료 전환으로 이어지는 실제 데이터를 확인해야 합니다.

**사업 기회 판단**  
한국 개발자를 위한 제출 점검 도구를 만들 여지는 있지만, 포털 자체 검사가 있고 국내 유료 수요와 고객 접근성이 확인되지 않았습니다. 플랫폼 대체 위험도 커 신규 아이디어로 올리지 않습니다.

**출처**

- [Build plugins for Claude](https://claude.com/blog/build-plugins-for-claude) — Anthropic, 2026-09-25; 제출 방식, 유료 플랜 조건, 자동 검사, 심사 추적, 게시 후 분석 기능 확인.
- [Plugins overview](https://code.claude.com/docs/en/plugins/overview) — Anthropic, 2026-09-25; 플러그인 구성 요소와 설치 단위 확인. 독립 성과 평가는 없음.

### RoboHarm 위험 지시 300회 시험…안전 거부는 일부 장면에 몰려

- 중요도: **S**
- 한 줄: RoboHarm이 세 로봇 정책에 다섯 가지 위험 작업을 각각 20회씩 시켰고, Fable은 100회 중 20회, Astra는 2회만 안전상 거부했습니다.
- 영향: 로봇이 움직이기 시작하면 언어 모델의 일반 안전 답변만으로는 부족합니다. 위험 물체와 동작을 따로 감지하고, 행동 직전 멈추는 장치를 제어 계층에 넣어야 합니다.
- 원문: [링크](https://robocurve.org/roboharm/)

> One wording per instruction
>
> 각 지시에는 한 가지 문장만 사용했습니다.

FACT: Robocurve는 9월 18일 Claude Fable 5.1, GPT-6 Astra, MolmoAct2를 같은 양팔 로봇 환경에서 시험한 RoboHarm 결과를 공개했습니다. 다섯 위험 작업을 정책별로 20회씩 실행해 총 300회를 사람이 영상과 로그로 판정했습니다. Fable은 100회 중 20회, Astra는 2회 안전상 거부했고, Fable의 거부 20회는 모두 인형을 찌르라는 한 장면에 몰렸습니다. 연구진은 모든 실행 로그와 영상을 공개했고, 9월 21일 외부 보도가 결과와 제한을 재검토했습니다.

INTERPRETATION: 위험을 알아차리는 능력이 작업 표현과 장면에 따라 크게 달라졌습니다. 한 모델의 대화 안전 정책이 물리 행동 전반으로 자동 이전된다고 보기 어렵습니다.

SIGNAL: Physical AI 평가가 작업 성공률만 재는 단계에서 위험 지시를 알아보고 멈추는지 확인하는 단계로 넓어지고 있습니다.

SPECULATION: 이 결과를 다른 로봇, 다른 문장, 긴 작업에 그대로 일반화할 수 없습니다. 한 장비와 장면 다섯 개, 지시당 한 문장만 시험했습니다.

**왜 중요한가**  
물리 시스템에서는 실패한 행동도 피해를 만들 수 있습니다. 모델의 거부 답변과 별개로 동작·물체·환경을 확인하는 안전장치가 필요합니다.

**업계 분위기**  
공개 데이터는 환영, 일반화에는 강한 주의 — 실행별 영상과 로그가 공개됐지만 표본이 작고 장면과 문장이 고정돼 있습니다.

**앞으로 볼 것**  
다른 표현과 장비에서도 결과가 반복되는지, 위험 감지기를 제어 계층에 넣었을 때 작업 성공률과 안전이 함께 좋아지는지 확인해야 합니다.

**사업 기회 판단**  
로봇 안전 평가 서비스는 장비·보험·법적 책임이 무겁고 1~3인 팀의 4~8주 MVP 범위를 넘습니다. 공개 데이터 분석 도구도 국내 구매 근거가 없어 아이디어로 올리지 않습니다.

**출처**

- [RoboHarm: Do Frontier Robot Policies Refuse Unsafe Instructions?](https://robocurve.org/roboharm/) — Robocurve, 2026-09-18; 시험 설계, 300회 결과, 실행별 로그·영상, 네 가지 제한을 확인.
- [AI-controlled robot arms attempted harmful tasks 97% of the time](https://www.tomshardware.com/tech-industry/artificial-intelligence/ai-controlled-robot-arms-attempted-harmful-tasks-97-percent-of-the-time-experiments-included-stabbing-a-baby-doll-mixing-chemicals-openai-and-anthropic-models-try-mixing-bleach-and-stabbing-dolls-without-jailbreaks) — Tom's Hardware, 2026-09-21; 공개 데이터의 거부·완료 수치와 장면 편중, 장비 과열 실행의 처리 방식을 독립 검토.

### Palo Alto, 여러 AI 모델로 기업 시스템을 상시 공격 점검하는 서비스 출시

- 중요도: **A**
- 한 줄: Palo Alto Networks가 Claude Mythos 5, GPT-5.6-Cyber, 오픈 가중치 모델을 묶어 웹앱·API·클라우드의 공격 경로를 계속 점검하는 Unit 42 서비스를 내놨습니다.
- 영향: 보안 점검이 분기별 진단에서 환경이 바뀔 때마다 이어지는 방식으로 이동합니다. 도입 기업은 모델별 발견 차이, 고객 코드 보존, 자동 수정의 승인 절차를 따로 확인해야 합니다.
- 원문: [링크](https://www.paloaltonetworks.com/blog/2026/09/introducing-unit-42-continuous-frontier-ai-defense/)

> A Single AI Model Is Not a Security Strategy
>
> AI 모델 하나만으로는 보안 전략이 되지 않습니다.

FACT: Palo Alto Networks는 9월 22일 Unit 42 Continuous Frontier AI Defense를 전 세계 연간 구독으로 출시했습니다. Claude Mythos 5, GPT-5.6-Cyber와 오픈 가중치 모델을 작업에 따라 나눠 쓰며 웹앱, API, 클라우드, 소스 저장소, 네트워크의 취약점과 공격 경로를 계속 점검합니다. 코드 수정 안내와 가상 패치도 제안합니다. 가격은 선택한 모델 조합에 따라 달라집니다.

INTERPRETATION: 한 번 점검하고 보고서를 받는 침투시험보다, 시스템 변경을 따라가며 여러 모델의 결과를 합치는 운영형 서비스에 가깝습니다. 다만 자동 발견과 실제 수정 승인 사이에는 여전히 사람의 판단이 필요합니다.

SIGNAL: 보안 기업은 최고 성능 모델 하나보다 서로 다른 모델의 발견 범위를 조합하는 방식을 제품 차별점으로 내세우기 시작했습니다.

SPECULATION: 회사가 제시한 취약점 발견률과 수정 시간 개선 수치는 자체·고객 프로젝트 결과입니다. 외부 기관이 같은 조건에서 재현한 자료는 없습니다.

**왜 중요한가**  
AI 보안 도구의 경쟁 기준이 모델 이름에서 실제 환경을 얼마나 자주 점검하고 검증된 수정으로 이어지게 하느냐로 옮겨가고 있습니다.

**업계 분위기**  
상시 점검에는 관심, 성과 수치에는 검증 요구 — 출시와 기능은 Reuters가 교차 확인했지만 효능 수치는 회사가 제공한 자료입니다.

**앞으로 볼 것**  
독립 평가에서 모델 조합의 추가 효과가 재현되는지, 고객 코드가 모델별로 어떻게 분리되는지, 실제 가격과 오탐 처리 비용을 확인해야 합니다.

**사업 기회 판단**  
중소기업용 경량 서비스 여지는 있으나 고급 사이버 모델과 고객 시스템 접근에 의존하고 법적 허가·보험·데이터 보안 게이트가 남습니다. 새 아이디어로 올리지 않습니다.

**출처**

- [Introducing Unit 42 Continuous Frontier AI Defense](https://www.paloaltonetworks.com/blog/2026/09/introducing-unit-42-continuous-frontier-ai-defense/) — Palo Alto Networks, 2026-09-22; 기능, 지원 자산, 모델 구성, 전 세계 연간 구독 출시와 회사 제시 성과 확인.
- [Palo Alto Networks unveils AI-powered cybersecurity service using Claude, GPT models](https://www.reuters.com/technology/palo-alto-networks-unveils-ai-powered-cybersecurity-service-using-claude-gpt-2026-09-22/) — Reuters, 2026-09-22; 출시, 모델 구성, 점검 대상, 구독·가격 구조를 독립 보도로 교차 확인. 성능은 독립 검증하지 않음.

## 사업 아이디어

신규 아이디어 없음. 플러그인 출시 점검과 에이전트 책임 기록 수요를 검토했지만 국내 고객·지불 행동·법적 책임·플랫폼 대체 위험 근거가 부족했습니다.

## 커뮤니티

- [Reddit](https://www.reddit.com/r/ClaudeAI/comments/1wkkdca/claude_project_showcase_discussion_hub_updated_on/) — **Claude 프로젝트 공개와 배포 경로 확대에 기대**: Claude 기반 프로젝트를 공유하는 게시판이 9월 19일 갱신됐습니다. 제작자 공급은 보이지만 한국 고객의 구매 행동을 보여주는 자료는 아닙니다.

## 오늘의 스킬

### 행동 경계 테스트표 만들기

- 쓸 때: 에이전트나 로봇이 외부 시스템이나 물리 장치를 직접 움직이기 전에
- 예시: 정상 작업, 위험 지시, 애매한 지시를 나누고 각 경우에 허용 행동·중단 조건·사람 승인·남겨야 할 로그를 한 장에 적습니다. 모델이 거부하지 않아도 제어 계층이 멈출 수 있게 합니다.
- 프롬프트: `이 에이전트의 실제 행동 경계를 테스트하려고 한다. 정상·위험·애매한 지시를 각각 5개 만들고, 예상 허용 행동, 즉시 중단 조건, 사람 승인 지점, 필수 감사 로그를 표로 정리해라.`

## Worth Reading

- **Paper** — [A First Look at the Security Issues in the Model Context Protocol Ecosystem](https://arxiv.org/abs/2510.16558): 공개 MCP 레지스트리 6곳의 서버 6만7천여 개를 분석해 소유권·검수·도구 메타데이터 공격면을 살핍니다. 초록·서지정보와 DSN 2026 채택 표기를 확인했으며 전문을 상세 감사하지는 않았습니다.
- **GitHub** — [RoboHarm](https://github.com/robocurve/roboharm): 다섯 물리 안전 과제, 실행 도구, 판정 규칙과 재현상 주의사항을 공개한 저장소입니다. README·구조·CC BY-NC 4.0 라이선스를 확인했으며 하드웨어로 재실행하지는 않았습니다.
- **YouTube** — [Introducing the Agents API](https://www.youtube.com/watch?v=2YHa1vhnmK0): 도구 연결, 병렬 호출, 런북 실행을 포함한 에이전트 구축 흐름을 보여주는 OpenAI 공식 영상입니다. 제목·출처·링크를 확인했으며 전체 영상과 자막은 검토하지 않았습니다.
- **Blog** — [The Authorization Gap: Why Yesterday’s Controls Won’t Work with Today’s Agents](https://www.bcg.com/publications/2026/authorization-gap-ai-agent-governance): 에이전트가 허용된 목표를 잘못된 방법으로 달성할 때 기존 사람·애플리케이션 권한 체계가 왜 놓치는지 설명합니다. 9월 22일 원문과 핵심 제안을 확인했습니다.

## 오늘의 인사이트

AI가 손을 얻자, 책임과 검증도 실행 단계로 내려옵니다. Anthropic은 플러그인 유통 문턱을 낮췄고 FTC 위원장은 에이전트 사고의 책임을 개발·지시 주체에서 찾아야 한다고 말했습니다. 물리 로봇 시험과 상시 보안 점검 서비스는 모델 이름보다 행동 직전의 중단 장치와 실행 뒤의 검증이 더 중요해지고 있음을 보여줍니다.

## 누락·미확인

- FTC 위원장의 발언은 규칙이나 집행 결정이 아닙니다. 공식 서면 지침과 법원 판단은 아직 없습니다.
- Claude 플러그인 포털의 심사 품질·설치 전환·한국어 검색 노출은 독립 검증되지 않았습니다.
- RoboHarm은 장면 다섯 개, 장비 한 종류, 지시당 한 문장으로 진행돼 다른 로봇과 실제 환경으로 일반화할 수 없습니다.
- Unit 42의 성능 수치는 회사와 고객 프로젝트 자료이며 독립 재현이 없습니다. 가격과 모델별 데이터 흐름도 공개되지 않았습니다.
- YouTube 항목은 제목·출처·링크만 확인했으며 전체 영상·자막을 검토하지 않았습니다.
- 국내 고객의 반복 문제와 지불 행동을 확인하지 못해 신규 사업 아이디어를 만들지 않았습니다.

## 게시 전 검증

- 뉴스 4개, 사업 아이디어 0개
- Worth Reading: Paper·GitHub·YouTube·Blog 각 1개
- event_key·정규화 URL 중복 없음
- 구축 후보 없음; 승인 게이트 자동 통과 없음
- `latest.json`은 네 필드 포인터
