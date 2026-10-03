# AI Daily Intelligence · 2026-10-04

- 상태: **complete**
- 생성 시각: 2026-10-04 07:03 KST
- 데이터: `data/daily/2026/2026-10-04.json`
- 구축 후보: **없음**

## Morning Paper

### AI가 커질수록, 경계는 더 구체적인 곳에 생깁니다

Apple은 에이전트의 Mac 데이터 접근을 더 분명히 통제하려 하고, 캘리포니아는 법률 업무의 검증 책임을 사람에게 남겼습니다. 일본의 데이터센터는 발전소 곁으로 가고, 반도체 투자는 메모리 연결을 빛으로 바꾸려 합니다.

## Top 뉴스

### 1. Mac의 전체 디스크 권한, AI 에이전트가 마음대로 넘지 못하게 됩니다

Apple이 AI 에이전트의 광범위한 데이터 접근에 더 분명한 사용자 확인을 요구하겠다고 밝혔습니다. Mac에서 대신 일하는 앱은 앞으로 권한을 얻는 방식부터 바꿔야 할 수 있습니다.

Mac의 ‘전체 디스크 접근’은 파일뿐 아니라 메일, 메시지, 브라우징 기록처럼 민감한 정보까지 열어줄 수 있습니다. Apple은 10월 2일 이 권한을 AI 에이전트가 사용할 때 사용자가 훨씬 명확하게 승인하도록 새 통제를 마련하겠다고 밝혔습니다.

지금까지는 사용자가 앱에 넓은 권한을 한 번 주면 그 뒤의 여러 작업이 같은 허용 범위 안에서 이뤄질 수 있었습니다. 하지만 에이전트는 사용자를 대신해 오래 움직이고 예상하지 못한 도구까지 호출할 수 있습니다. 그래서 ‘이 앱을 믿는다’는 한 번의 동의만으로는 부족하다는 판단이 나온 것입니다.

발표 시점은 Meta의 개인 에이전트 Muse가 Mac 데이터에 접근하는 방식을 둘러싼 불만이 나온 뒤입니다. Meta는 접근이 사용자의 선택에 따라 이뤄진다고 설명했습니다. 다만 옵트인이라는 사실과 사용자가 실제 접근 범위를 이해한다는 것은 같은 문제가 아닙니다.

아직 새 통제가 어느 macOS 버전에 들어가는지, 기존 앱이 무엇을 바꿔야 하는지는 공개되지 않았습니다. Mac용 에이전트를 개발하거나 업무에 도입했다면 기능보다 권한 요청 화면과 작업 기록이 먼저 점검 대상이 됩니다.

**하나만 기억한다면:** 에이전트가 대신 하는 일이 많아질수록, 한 번의 넓은 허용보다 작업마다 이해할 수 있는 승인이 중요해집니다.

**앞으로 볼 건:** 적용 macOS 버전과 시행일, 개발자 API, 기업용 MDM에서 예외와 승인 기록을 어떻게 다루는지입니다.

**지금 확인할 것:** Mac의 시스템 설정에서 전체 디스크 접근 권한을 가진 앱을 확인하고, 더 이상 쓰지 않는 자동화·에이전트 앱의 권한을 끄세요.

출처: [Apple Developer](https://developer.apple.com/news/?id=p6zjojqw) · [Reuters](https://www.reuters.com/business/retail-consumer/apple-says-it-will-flag-ai-requests-mac-data-after-metas-muse-draws-complaints-2026-10-02/) · [The Verge](https://www.theverge.com/tech/1004295/apple-limit-mac-disk-access-ai-agents)

### 2. 캘리포니아, 변호사의 AI 검증 책임을 법으로 못 박았습니다

변호사는 AI가 만든 법원 서면과 인용을 직접 확인해야 하고, 중재인은 판단을 AI에 맡길 수 없습니다. AI를 써도 최종 책임은 사람에게 남는다는 원칙이 법률이 됐습니다.

캘리포니아 주지사가 9월 30일 SB 574에 서명했습니다. 이 법은 변호사가 AI로 작성한 법원 제출물과 인용을 직접 확인하고, 잘못된 내용을 발견하면 고치도록 요구합니다. 고객의 기밀 정보를 AI 도구에 넣을 때 지켜야 할 책임도 분명히 했습니다.

법은 AI 사용 자체를 금지하지 않습니다. 대신 변호사가 핵심 법률 업무를 통째로 넘기거나 ‘AI가 작성했다’는 이유로 오류 책임을 피하지 못하게 합니다. 중재인 역시 사건 판단을 AI에 맡길 수 없습니다.

이 변화는 법률 AI의 경쟁 기준도 바꿉니다. 문서를 빨리 만드는 기능만으로는 부족하고, 어떤 자료를 근거로 삼았는지와 누가 최종 확인했는지를 남길 수 있어야 합니다. 법률 조직에는 검토 절차가 제품 선택만큼 중요해집니다.

구체적인 시행일과 징계 기준, 다른 주가 같은 규칙을 따를지는 더 확인해야 합니다. 한국에 바로 적용되는 법은 아니지만, 해외 고객이나 캘리포니아 사건을 다루는 조직에는 영향을 줄 수 있습니다.

**하나만 기억한다면:** 고위험 전문 업무에서는 AI의 성능보다 사람이 검증했다는 사실을 증명하는 절차가 먼저 요구됩니다.

**앞으로 볼 건:** 시행일과 징계 기준, 법원 규칙과의 연결, 다른 미국 주의 유사 입법입니다.

출처: [California Governor](https://www.gov.ca.gov/2026/09/30/californias-nation-leading-ai-framework-just-got-stronger-governor-newsom-signs-more-first-in-the-nation-worker-protections-and-more/) · [Reuters](https://www.reuters.com/legal/government/california-sets-guardrails-lawyers-ai-use-2026-10-01/) · [California Courts](https://newsroom.courts.ca.gov/news/use-ai-new-rules-and-maybe-law-are-horizon-california-lawyers)

### 3. 일본 AI 데이터센터가 발전소 옆으로 갑니다

JERA와 Dell, RHAELM이 지바 발전소 부지에 최대 400MW 규모의 AI 데이터센터를 추진합니다. 서버보다 먼저 전력 연결을 확보하려는 움직임입니다.

일본 최대 발전회사 중 하나인 JERA가 Dell Technologies, 인프라 개발사 RHAELM과 AI 데이터센터를 추진합니다. 첫 부지는 지바의 JERA 발전소이며, 계획상 용량은 최대 400MW입니다. 단계별 투자액은 150억달러를 넘을 수 있습니다.

일반적인 데이터센터는 전력망에 연결되는 데 오랜 시간이 걸릴 수 있습니다. 이번 구상은 발전소 부지에서 전력, 냉각, 컴퓨팅을 함께 설계해 그 대기 시간을 줄이려 합니다. 공식 발표는 2028년경 운영 시작을, Reuters는 2029년 완전 가동 목표를 전했습니다.

이 방식이 자리 잡으면 AI 인프라의 위치를 정하는 기준도 달라집니다. 네트워크와 부동산만 보는 대신 안정적인 전력 공급과 냉각, 장기 계약을 먼저 묶어야 합니다. 일본이 자국 안에서 대규모 AI 연산 능력을 확보하려는 흐름과도 맞닿아 있습니다.

다만 아직 양해각서 단계입니다. 최종 투자 결정과 고객, 실제 착공, 어떤 전력을 얼마나 쓸지는 공개되지 않았습니다.

**하나만 기억한다면:** 대규모 AI의 다음 병목은 칩 구매보다 전력을 언제, 어디서, 얼마나 안정적으로 확보하느냐에 있습니다.

**앞으로 볼 건:** 최종 투자 결정과 착공 허가, 앵커 고객, 전력원과 냉각 방식, 단계별 실제 집행액입니다.

출처: [JERA](https://www.jera.co.jp/en/news/information/20261001_2535) · [Reuters](https://www.reuters.com/business/energy/jera-teams-up-with-dell-rhaelm-ai-infrastructure-development-japan-2026-10-01/)

### 4. AI 메모리 병목, 칩 사이를 빛으로 잇는 경쟁이 커집니다

Volantis가 GPU와 메모리를 광학 방식으로 연결하는 기술에 8,800만달러를 유치했습니다. 계산 능력보다 데이터를 옮기는 속도가 느린 문제를 겨냥합니다.

AI 가속기는 계산이 빨라도 필요한 데이터를 제때 받지 못하면 기다려야 합니다. Volantis는 GPU와 메모리 칩 사이를 전기 신호 대신 빛으로 연결해 이 병목을 줄이려 합니다. 회사는 이를 위해 8,800만달러의 시리즈A 투자를 받았습니다.

현재 GPU 주변에는 연결 방식과 전력 때문에 붙일 수 있는 메모리 수가 제한됩니다. Reuters에 따르면 Volantis는 VCSEL이라는 소형 레이저를 이용해 한 GPU가 훨씬 많은 메모리 칩과 통신하도록 설계하고 있습니다. 목표대로라면 더 큰 모델을 메모리에 올리고 데이터 이동에 드는 시간을 줄일 수 있습니다.

광학 연결은 이미 데이터센터 간 네트워크에서 쓰이지만, 이를 서버 내부의 메모리 연결까지 끌어들이는 일은 쉽지 않습니다. 칩 패키징과 수율, 발열, 비용을 함께 맞춰야 하기 때문입니다. Volantis는 내년 칩을 목표로 하고 있습니다.

회사가 제시한 초대형 모델과 높은 처리 속도는 아직 전망입니다. 실제 제품과 독립 벤치마크가 나오기 전까지는 가능성과 검증된 성능을 구분해서 봐야 합니다.

**하나만 기억한다면:** AI 하드웨어 경쟁은 GPU 연산량만이 아니라 메모리에서 데이터를 얼마나 빨리 가져오느냐로 넓어지고 있습니다.

**앞으로 볼 건:** 실칩 공개와 독립 벤치마크, 패키징 수율, 전력과 지연, 실제 고객 검증입니다.

출처: [Volantis](https://volantissemi.ai/news-insights/our-88m-series-a-demolishing-the-memory-wall-with-photonics-post) · [Reuters](https://www.reuters.com/business/volantis-raises-88-million-tech-connect-ai-memory-chips-2026-10-01/)

## 사업 아이디어

새 아이디어는 선정하지 않았습니다. Mac 권한 점검은 기존 에이전트 격리·승인 통제와 겹치고 플랫폼 자체 기능으로 대체될 위험이 있습니다. 법률 검증은 기밀·책임 게이트가 남고, 데이터센터와 광학 메모리는 1~3인 팀의 자본·장비 범위를 벗어납니다.

## 오늘의 스킬

### 에이전트 권한 경계 점검

AI 에이전트가 로컬 파일·메일·브라우저·업무 SaaS에 접근하도록 허용하기 전에 사용합니다. 필요한 데이터와 금지할 데이터, 작업별 승인 시점, 로그와 중단 조건을 한 장에 적고 최소 권한으로 시험합니다.

## Worth Reading

- **Paper:** [How Agents Ask for Permission](https://arxiv.org/abs/2607.13718)
- **GitHub:** [Meta-Agent Challenge](https://github.com/ant-research/meta-agent-challenge)
- **YouTube:** [Rails World 2026 Opening Keynote - DHH](https://www.youtube.com/watch?v=vDjW_dRyKXY) — 메타데이터만 확인했으며 전체 영상은 검토하지 않았습니다.
- **Blog:** [Making Your Data Ready for Agentic AI](https://martinfowler.com/articles/making-data-ready-for-agentic-ai.html)

## 오늘의 인사이트

AI가 현실의 일에 들어올수록 경쟁의 경계는 모델 점수보다 권한, 사람의 책임, 전력과 메모리처럼 구체적인 곳에 생깁니다.

## 누락·미확인

- Apple 통제의 적용 버전·시행일·API와 MDM 정책
- 캘리포니아 법의 시행일·집행 기준·역외 적용
- JERA 프로젝트의 최종 투자 결정·고객·집행액·전력원
- Volantis의 실칩·독립 성능·수율·고객
- YouTube 항목 전체 영상 내용

## 게시 전 검증

- 뉴스 4개, 사업 아이디어 0개
- 동일 event_key 없음, 뉴스 간 정규화 URL 중복 없음
- Worth Reading: Paper·GitHub·YouTube·Blog 정확히 1개씩
- 구축 후보 없음; 승인 게이트 대상 없음
- `latest.json`: 네 필드 포인터 구조
