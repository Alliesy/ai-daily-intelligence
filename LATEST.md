[전체 보고서](https://github.com/Alliesy/ai-daily-intelligence/blob/main/reports/2026/2026-10-17.md) · [날짜별 데이터](https://github.com/Alliesy/ai-daily-intelligence/blob/main/data/daily/2026/2026-10-17.json)

# AI Daily Intelligence · 2026-10-17

뉴스 3개 · 사업 아이디어 0개 · 구축 후보 없음

오늘 새로 확인한 국내 시험 소식 1건과, 최근 7일 안에 이용 대상이 확대된 중요한 후속 변화 2건을 골랐습니다. 발표일은 각 기사에 구분했습니다.

## 오늘의 인사이트

AI 학습에 쓰지 않는 문서도 서버에는 남을 수 있습니다

Deep Review는 업로드 문서를 모델 학습에 사용하지 않는다고 밝혔지만, 다시 보여주기 위해 1년 보관합니다. 학습 제외와 파일 삭제는 같은 조건이 아닙니다. 민감한 자료를 맡길 때는 학습 정책뿐 아니라 보관 기간과 삭제 방법도 따로 확인해야 합니다.

## 주요 뉴스

### 1. 구글 문서 검토 AI, 이제 누구나 주 2회 무료로 씁니다

학회에 논문을 내는 사람에게만 제공하던 시험이 일반 이용자에게 열렸습니다. 긴 초안이나 발표 자료에서 설명이 맞물리지 않는 부분을 찾아볼 수 있습니다.

Deep Review는 글을 대신 쓰는 것보다 이미 쓴 문서를 살피는 데 초점을 둡니다. 앞에서 세운 전제와 뒤의 결론이 맞는지, 표나 수치가 설명과 어긋나는지 등을 검토합니다. 다만 지적이 나왔다고 곧바로 오류가 확정되는 것은 아닙니다.

10월 14일 공개된 버전은 PDF와 일반 텍스트를 받습니다. Google은 전 세계 이용을 안내했지만, 이번 조사에서 한국 계정으로 직접 실행하거나 한국어 품질을 시험하지는 않았습니다. 무료 한도보다 많이 쓰려면 Gemini API 키를 연결하는 경로가 있으므로 별도 이용 비용을 먼저 확인해야 합니다.

업로드 전에 알아둘 조건도 있습니다. Google은 문서를 모델 학습에 쓰지 않지만, 사용자가 다시 볼 수 있도록 1년 동안 저장한다고 명시했습니다. 회사 비공개 자료나 타인의 개인정보가 든 파일은 이 정책만 보고 올리지 말고, 외부 서비스에 제출해도 되는 자료인지 먼저 판단해야 합니다.

앞으로 볼 건: 다중 파일 지원 일정과 한국어 문서에서 잘못 지적하거나 놓치는 비율은 추가 확인이 필요합니다.

지금 확인할 것: 공개해도 되는 짧은 초안으로 먼저 시험하고, 지적받은 대목 하나를 원문과 대조해 보세요.

더 궁금하다면:

- [Analyzing technical documents with Deep Review](https://research.google/blog/analyzing-technical-documents-with-deep-review/) — Google Research, 2026-10-14
- [Google unveils Deep Review tool to verify paper errors with 89.7 percent detection rate](https://www.digitaltoday.co.kr/en/view/115087/google-unveils-deep-review-tool-to-verify-paper-errors-with-89-7-percent-detection-rate) — DigitalToday, 2026-10-15

### 2. Figma에서 그린 화면을 눌러보며 고칠 수 있게 됩니다

Code layers의 비공개 시험이 공개 베타로 바뀌었습니다. 시안과 작동하는 시제품을 같은 캔버스에 놓고 비교하려는 개인 디자이너에게 유용한 변화입니다.

예를 들어 로그인 화면을 그린 뒤, 버튼을 누르면 무엇이 보이는지 같은 파일 안에서 시험할 수 있습니다. 기존 프레임을 코드 레이어로 바꾸거나 간단한 설명으로 시작하는 방식입니다. 완성된 앱의 보안이나 안정성까지 검증해 주는 기능은 아닙니다.

배포는 10월 15일부터 순차적으로 시작됐습니다. 공식 안내상 모든 플랜이 대상이지만 계정마다 나타나는 시점은 다르고, 파일 편집 권한도 필요합니다. 개발 도구에서 MCP로 프로젝트를 가져와 생성하는 경로에는 Full seat가 필요하다는 별도 조건이 있습니다.

무료 혜택은 더 좁게 읽어야 합니다. 유료 플랜에서 코드 레이어 안의 코드 생성·편집은 11월 4일까지 크레딧을 쓰지 않지만, 같은 요청에 섞인 다른 AI 작업은 차감될 수 있습니다. 그 이후에는 코드 레이어 작업도 크레딧을 사용하므로 계속 쓸 때의 비용을 따로 살펴야 합니다.

앞으로 볼 건: 한국 계정에 기능이 표시되는 시점과, 자주 하는 작업 한 번에 실제로 드는 크레딧을 확인할 필요가 있습니다.

지금 확인할 것: 이미 Figma를 쓴다면 Design 툴바에 Code 아이콘이 있는지 확인하고, 원본을 복제한 시안에서 시험하세요.

더 궁금하다면:

- [Here’s everything from Config India 2026](https://www.figma.com/release-notes/) — Figma, 2026-10-15
- [Code layers in Figma Design](https://help.figma.com/hc/en-us/articles/44193259600535-Code-layers-in-Figma-Design) — Figma Help, 2026-10-17 조회; 게시일 미표시
- [Build by design: New workflows for new ways of building](https://www.figma.com/blog/build-by-design/) — Figma, 2026-10-15
- [Figma announces new features to define how agents work on its platform](https://techcrunch.com/2026/10/14/figma-announces-new-features-to-define-how-agents-work-on-its-platform/) — TechCrunch, 2026-10-14T21:30:00-07:00

### 3. ‘모두의 AI’ 시험 시작, 일반 이용자는 아직 기다려야 합니다

전 국민 무료 AI를 목표로 하는 세 컨소시엄이 10월 16일 비공개 점검에 들어갔다고 보도됐습니다. 이번 소식은 새 무료 앱을 지금 내려받을 수 있다는 뜻이 아닙니다.

초기 대상은 사업 참여 기업과 공공기관 관계자 등으로 제한됩니다. 뉴스웨이는 이 과정에서 사용 경험과 서비스 안정성을 확인한다고 설명했습니다. 일반 공개는 12월을 목표로 하지만 정확한 개방일이 정해졌다고 볼 근거는 아직 없습니다.

이미 쓰는 AI 앱과 무엇이 다를지도 시험을 거쳐야 합니다. SKT는 전화·문자 접근을, 카카오는 카카오톡을, KT는 검색과 기존 서비스 연결을 앞세우고 있습니다. 예약이나 신청까지 이어주는 기능은 개발 방향이지, 현재 모든 이용자가 할 수 있는 일로 확인된 것은 아닙니다.

구독료 없이 AI를 써보고 싶은 사람에게는 알아둘 만한 진행 상황입니다. 다만 ‘무료’라는 목표만으로 사용 횟수나 모든 부가 기능까지 무제한이라고 판단할 수는 없습니다. 당일 정부 점검 원문과 일반 이용자용 약관은 이번 조사에서 확보하지 못했습니다.

앞으로 볼 건: 공개 신청 창구가 열리는 날짜, 무료로 제공하는 기능의 범위, 대화·개인정보를 어디까지 활용하는지 확인해야 합니다.

더 궁금하다면:

- [SKT·KT·카카오 '모두의 AI' 베타 돌입···전화·검색·카톡으로 승부수](https://newsway.co.kr/news/view?ud=2026101515080970946) — 뉴스웨이, 2026-10-16T07:09:00+09:00
- [전 국민 무료 '모두의 AI' 베타테스트 시작…12월 정식 출시](https://www.hankookilbo.com/news/article/A2026101610520003904) — 한국일보, 2026-10-16 · 검색 색인 일부만 확인
- [SKT, 전 국민 AI 비서 만든다](https://news.sktelecom.com/230042) — SK텔레콤, 2026-08-28

## 오늘의 활용법

문서 업로드 전 세 가지 조건 구분하기

학습 이용 여부, 서버 보관 기간, 삭제 방법은 서로 다른 질문입니다. 하나의 답으로 나머지까지 안전하다고 단정하지 않고, 알 수 없는 항목은 미확인으로 남깁니다.

요청 예시: “이 서비스의 공식 데이터 정책에서 ① 모델 학습 이용 여부 ② 파일 보관 기간 ③ 직접 삭제 방법을 각각 원문 링크와 함께 찾아 주세요. 찾지 못한 항목은 추측하지 말고 미확인으로 표시해 주세요.”

## Worth Reading

### Paper · [Towards Automating Scientific Review with Google’s Paper Assistant Tool](https://arxiv.org/html/2606.28277v1)

2026-06-26 공개된 PAT 연구입니다. AI의 검토 의견과 사람의 최종 판단을 나눠야 하는 이유를 이해하는 참고 자료입니다. 논문을 읽거나 쓰는 학생에게 적합하며, 오늘 공개된 연구나 한국어 성능 평가가 아닙니다.

### GitHub · [OCRmyPDF](https://github.com/ocrmypdf/OCRmyPDF)

스캔 PDF에 검색·복사 가능한 글자 층을 추가하는 공개 도구입니다. 공부 자료를 정리하거나 문서에서 텍스트를 뽑을 때 참고할 수 있습니다. 명령줄 설치가 필요하며 언어별 OCR 팩을 사용합니다. 새 출시 소식이 아니고, 설치·실행과 한글 인식 품질은 시험하지 않았습니다.

### YouTube · [Code layers in Figma Sites](https://www.youtube.com/watch?v=dbXAShyCPok)

Figma 공식 채널의 2025-06-25 입문 영상입니다. Sites에서 코드 레이어를 만드는 기본 개념을 소개합니다. 오늘의 Design 공개 베타와 다른 제품·시점의 자료이므로 현재 요금·제공 조건의 근거로 사용하지 않았습니다. 제목·채널·날짜·설명만 확인했고 전체 영상은 보지 않았습니다.

### Blog · [Design together with code layers on the canvas](https://www.figma.com/blog/design-together-with-code-layers/)

2026-10-15 Figma 공식 설명입니다. 기존 시안이나 작은 코드 프로젝트에서 시작해 여러 안을 나란히 비교하는 작업 방식을 살펴볼 수 있습니다. 공급자가 쓴 소개이므로 실제 생산성이나 코드 품질을 독립적으로 입증하지는 않습니다.

## 사업 아이디어 검토

신규 아이디어와 구축 후보는 없습니다. 기존 화면과 변환 결과가 달라 재작업하는 불편과 우회 방법을 확인했습니다. 그러나 과거 사용자 보고 하나로 국내 반복 수요·지불 의사를 확인할 수 없고 Figma 자체 기능의 대체 위험도 커 사업 아이디어로 승격하지 않았습니다.

[공개 사용자 사례](https://forum.figma.com/share-your-feedback-26/design-file-agent-doesn-t-recreate-exactly-what-s-in-html-file-55371)는 2026-06-28의 과거 자료이며, 오늘의 장애나 기능 오류로 보도하지 않았습니다.

## 확인하지 못한 부분

- Deep Review의 한국 계정 실행·한국어 품질·직접 삭제 절차·API 비용을 확인하지 못했습니다. 독립 보도 두 건은 확보하지 못했습니다.
- Figma의 한국 계정별 배포와 생성 코드의 품질·보안을 직접 시험하지 않았습니다. 독립 취재는 TechCrunch 한 건이며 무료 혜택은 일부 작업에 한정됩니다.
- 모두의 AI의 10월 16일 정부 공식 원문과 정식 개방일·무료 범위·개인정보 약관은 미확인입니다. 한국일보는 검색 색인의 일부 내용만 확인했습니다.
- YouTube는 제목·공식 채널·날짜·설명만 확인했습니다. Paper 전문 평가, 도구 실행, 영상 전체 시청은 수행하지 않았습니다.

뉴스의 개인 관련성·직접 사용 변화 2건·사건 및 출처 URL 중복·Reader와 분석의 분리·Worth Reading 네 유형·후보 승인 조건·네 필드 최신 포인터를 게시 전 검증합니다. 도구 실행과 영상 전체 시청을 완료한 것으로 표시하지 않습니다.
