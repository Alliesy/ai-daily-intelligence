# 2026-08-31 브리핑

[전체 보고서](https://github.com/Alliesy/ai-daily-intelligence/blob/main/reports/2026/2026-08-31.md) · [원본 JSON](https://github.com/Alliesy/ai-daily-intelligence/blob/main/data/daily/2026/2026-08-31.json)

## 오늘의 인사이트

### AI, 기능보다 운영

오늘 여러 사건을 함께 보면 AI 경쟁의 단위가 새 기능에서 운영 체계로 이동했습니다. Codex 모델은 오늘 교체되고, Persistent mode는 더 오래 일하는 에이전트를 예고하며, Granite는 추론 예산과 배포 위치를 열었습니다. HBM 공급망과 초당 영상 가격까지 더하면 앞으로의 차이는 모델 점수보다 수명주기·권한·비용·공급망을 얼마나 안정적으로 관리하는지에서 납니다.

## Top News

1. [Codex의 GPT-5.4·5.4 mini가 오늘 은퇴한다](https://developers.openai.com/codex/models) — ChatGPT로 로그인한 Codex에서 GPT-5.4와 GPT-5.4 mini가 2026년 8월 31일 종료돼 저장 설정·사용자 에이전트·예약 작업의 모델 이름을 바꿔야 합니다.
2. [OpenAI, 멈출 때까지 일하는 Codex ‘Persistent mode’를 시험한다](https://www.wired.com/story/openai-is-developing-a-persistent-ai-agent/) — OpenAI가 Codex가 사용자가 중단할 때까지 작업을 이어가고 후속 과업을 제안할 수 있는 Persistent mode를 시험 중이라고 확인했지만 즉시 출시 계획은 없습니다.
3. [IBM, 추론 강도를 조절하는 오픈 모델 Granite 4.2를 공개했다](https://research.ibm.com/blog/introducing-granite-4-2) — IBM이 3B·8B·30B 규모의 Apache 2.0 모델에 추론 on·low·off, 도구 호출과 장기 문맥을 넣어 로컬·기업 에이전트 선택지를 넓혔습니다.

## More Signals

- [SK hynix, 미국 첫 HBM 첨단 패키징 공장 착공에 들어갔다](https://news.skhynix.com/en/groundbreaking-ceremony-in-indiana/) — SK hynix가 인디애나에 40억달러 이상을 투자해 HBM 첨단 패키징·연구 거점을 짓고 2029년 하반기 양산을 목표로 잡았습니다.
- [Alibaba Cloud, 문서도 30초 영상으로 바꾸는 Wan3.0을 정식 출시했다](https://www.alibabacloud.com/blog/wan3-0-at-general-availability-capabilities-benchmarks-pricing-and-the-workflows-it-changes_603505) — Wan3.0이 텍스트·이미지뿐 아니라 PDF·스프레드시트·슬라이드·웹페이지를 최대 30초 영상으로 만들고 해상도별 초당 단가를 공개했습니다.

## 사업 아이디어

0개. 기존 검증 아이디어와 겹치거나 문제 근거·현실성 Gate가 부족해 새 아이디어를 만들지 않았습니다.

## 오늘의 스킬

**장기 에이전트 중단 조건 쓰기** — 배포·결제·외부 메시지는 항상 ask, 읽기·초안은 allow로 두고 30분·10달러·3회 실패 중 하나에 도달하면 자동 중단하도록 적습니다.

## Worth Reading

- **Paper:** [SteerBench-Work: A Benchmark for Agent Steering at Action Boundaries](https://arxiv.org/abs/2608.12654) — 106개 업무 시나리오에서 장기 에이전트가 실행할지 멈출지 판단하는 정확도와 과잉 차단 문제를 확인할 수 있습니다.
- **GitHub:** [ibm-granite/granite-4.2-language-models](https://github.com/ibm-granite/granite-4.2-language-models) — 모델 크기, 추론 모드, 도구 호출과 양자화별 사용법을 공개 코드와 예제로 확인할 수 있습니다.
- **YouTube:** [Granite 4.2 (3B vs 8B): IBM's New Reasoning Models, Tested Locally](https://www.youtube.com/watch?v=sUjlKcsR3pk) — 3B와 8B를 로컬에서 설치·시험하는 과정을 보며 실제 하드웨어와 응답 차이를 빠르게 파악할 수 있습니다.
- **Blog:** [Granite 4.2 LLMs: How They're Built](https://huggingface.co/blog/ibm-granite/granite-4-2) — 15T 토큰 학습, 512K 문맥, 추론 모드와 agentic RL 구성을 기술적으로 확인할 수 있습니다.

## 검증 메모

- Persistent mode는 OpenAI가 시험 중이라고 확인한 연구 단계이며 출시 일정·기능·권한 경계는 확정되지 않았습니다.
- Codex의 GPT-5.4 계열 은퇴는 ChatGPT 로그인 세션에만 적용되며 OpenAI API와 API 키 인증 Codex는 영향받지 않습니다.
- Granite 4.2의 한국어·장기 에이전트 성능과 512K 문맥의 실제 품질은 독립 검증이 충분하지 않습니다.
- SK hynix 인디애나 공장은 2029년 양산 계획으로 공정 일정·지원 조건·수요 전망이 바뀔 수 있습니다.
- Wan3.0의 문서 기반 영상 품질·상업 이용 조건·한국어 정확도는 독립 비교가 부족합니다.

## 구축 후보

없음. 자동 구현·설계·배포를 실행하지 않았습니다.
