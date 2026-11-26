AI Daily Intelligence · 2026-11-26 KST

[전체 보고서](https://github.com/Alliesy/ai-daily-intelligence/blob/main/reports/2026/2026-11-26.md) · [정본 JSON](https://github.com/Alliesy/ai-daily-intelligence/blob/main/data/daily/2026/2026-11-26.json)

뉴스 3건 · 사업 아이디어 0건 · 구축 후보 0건

<callout icon="💡" color="blue_bg">
MCP는 작업 절차를, Claude Artifacts는 작은 앱을 쉽게 배포한다. 두 경로 모두 배포 속도와 별개로 출처와 쓰기 권한을 점검해야 한다.
</callout>

## 오늘의 핵심 뉴스

### 1. Claude Code 2.1.332, MCP 서버 스킬 베타 지원

Claude Code 2.1.332의 변경기록에 MCP 서버가 배포하는 스킬이 추가됐다. 스킬에 포함된 인라인 셸 명령을 거부할 수 있는 별도 훅도 추가됐다.

팀 공통 절차를 배포하는 수고가 줄 수 있지만, 어떤 서버가 어떤 절차를 공급하는지 검토할 필요가 있다. [원문](https://code.claude.com/docs/en/changelog)

### 2. Claude Artifacts, Mac·Windows 앱 설치 베타

11월 24일 발표에 이어 25일 후속 보도에서 설치 조건을 확인했다. 적격 Artifact는 독립 창으로 열 수 있지만 Claude 계정과 온라인 연결이 필요하다. 권한은 선택할 수 있으며 원본 수정이 설치본에 반영된다.

개인용 반복 업무 도구의 배포 부담은 낮아지지만, 독립·오프라인 앱을 대체하지는 않는다. [원문](https://claude.com/resources/articles/install-as-app)

### 3. Sakana AI, 30B Namazu Small 발표

Sakana AI가 NVIDIA Nemotron 3 Nano의 사전학습 모델을 바탕으로 추가 학습한 30B 모델을 발표했다. 검색과 장문 문서 처리를 강조하며 온프레미스 제공 조건은 추후 안내한다고 밝혔다.

규모보다 실제 문서 작업의 인용 정확도와 총비용으로 모델을 비교할 이유가 커졌다. [원문](https://sakana.ai/namazu-small/)

## Business Radar

오늘은 강한 사업 기회 신호 없음: 한국 소규모팀의 반복 수요와 지불 의향은 미확인.

## AI Tool Radar

- [Claude Code 2.1.332](https://code.claude.com/docs/en/changelog) · ★★★★ — MCP 서버에서 배포한 스킬을 불러올 수 있다. 테스트 저장소에서 신뢰하는 서버만 연결해 스킬 출처와 쓰기 승인 범위를 확인한다.
- [Claude Install as app](https://claude.com/resources/articles/install-as-app) · ★★★★ — 재사용하던 Artifact를 별도 앱 창에서 실행할 수 있다. 가짜 데이터로 만든 읽기 전용 체크리스트부터 시험한다.

## Community Pulse

- [Reddit · 스킬과 도구 역할 논의](https://www.reddit.com/r/mcp/comments/1y4utyx/anthropic_just_announced_skills_over_mcp_i_built/) — MCP 서버가 호출 도구와 재사용 가능한 작업 절차를 함께 배포할 때 둘을 어떻게 구분할지 논의했다.
- [Reddit · 데스크톱 앱 권한 점검](https://www.reddit.com/r/ClaudeAI/comments/1y4ybgy/claude_can_now_install_artifacts_as_mac_and/) — 한 사용자는 커넥터를 쓰는 앱에서 실제 변경 전에 미리보기를 보여주자고 제안했다.
- [Reddit · 공유 범위 질문](https://www.reddit.com/r/ClaudeCode/comments/1y4o0wx/install_claude_artifacts_as_desktop_apps_on_mac/) — 설치형 Artifact를 Claude를 쓰지 않는 사람에게 배포해도 실행할 수 있는지 질문이 나왔다.

## AI Skill of the Day

**스킬 배포 전 권한 점검** — 외부 서버의 스킬을 팀에 배포하기 전

가짜 데이터가 들어 있는 테스트 저장소에서 읽기 전용 업무를 수행하고 어떤 서버·도구를 호출했는지 기록한다.

> 스킬의 출처, 버전, 필요한 읽기·쓰기 권한을 표로 정리해. 확인되지 않은 권한은 미확인으로 표시하고 외부 전송이나 쓰기는 실행하지 마.

## Worth Reading

- Paper · [J-tau: 일본어 도구형 에이전트 평가](https://arxiv.org/abs/2610.19638) — 번역만으로는 해결되지 않는 주소·통화 등 현지화 평가 문제를 보여준다.
- GitHub · [Claude Code v2.1.332](https://github.com/anthropics/claude-code/releases/tag/v2.1.332) — 이번 변경과 알려진 제한을 버전 단위로 확인할 수 있다.
- YouTube · [Everything new in Claude this month](https://www.youtube.com/watch?v=EuOg5f_Egns) — 공식 영상으로 최근 Claude 기능의 배경을 살펴볼 수 있다. 이번 데스크톱 베타와는 별개다.
- Blog · [Turn artifacts into Mac and Windows apps](https://claude.com/resources/articles/install-as-app) — 설치형 도구의 업데이트, 계정 의존성과 권한을 함께 설명한다.

## Today's Insight

AI로 도구를 만드는 시간이 줄어들수록, 팀이 그 도구의 출처와 권한 변경을 확인하는 절차가 더 중요해진다.

## 확인 범위

- INSUFFICIENT_STRONG_NEWS: 검증 기준을 만족한 3건만 선별했습니다.
- Claude 앱은 11월 24일 최초 발표, 25일 후속 보도입니다. Namazu의 발표 시각은 원문에 없어 확인 가능한 보도 시각을 사용했습니다.
- Namazu 온프레미스 제공 조건·성능 독립 재현 및 Claude 베타의 한국 계정별 가용성은 미확인입니다.
- Notion Latest는 본문 전체 교체 승인이 없어 미갱신입니다.
- 커뮤니티 신호는 Reddit 사례로 제한됩니다. 다른 채널의 대표 반응은 확인되지 않았습니다.

## 추적 질문

[지역 특화 추론](https://sakana.ai/namazu-small/): 12월 온프레미스 조건과 일본어 문서 실측이 공개되는가?

